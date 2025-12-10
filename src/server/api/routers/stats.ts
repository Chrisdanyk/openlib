import { TRPCError } from "@trpc/server";
import { CopyStatus, ReservationStatus } from "generated/prisma";
import { z } from "zod";

import {
  createTRPCRouter,
  librarianProcedure,
} from "~/server/api/trpc";

export const statsRouter = createTRPCRouter({
  // Get overall library statistics
  getOverview: librarianProcedure.query(async ({ ctx }) => {
    const [
      totalBooks,
      totalCopies,
      availableCopies,
      borrowedCopies,
      totalAuthors,
      totalUsers,
      totalLoans,
      activeLoans,
      overdueLoans,
      totalReservations,
      pendingReservations,
      totalFines,
      unpaidFines,
    ] = await Promise.all([
      ctx.db.book.count(),
      ctx.db.bookCopy.count(),
      ctx.db.bookCopy.count({
        where: { status: CopyStatus.AVAILABLE },
      }),
      ctx.db.bookCopy.count({
        where: { status: CopyStatus.BORROWED },
      }),
      ctx.db.author.count(),
      ctx.db.user.count(),
      ctx.db.loan.count(),
      ctx.db.loan.count({
        where: { returnedAt: null },
      }),
      ctx.db.loan.count({
        where: {
          returnedAt: null,
          dueAt: { lt: new Date() },
        },
      }),
      ctx.db.reservation.count(),
      ctx.db.reservation.count({
        where: { status: ReservationStatus.PENDING },
      }),
      ctx.db.fine.count(),
      ctx.db.fine.count({
        where: { paid: false },
      }),
    ]);

    // Calculate fine amounts
    const [totalFineAmount, unpaidFineAmount] = await Promise.all([
      ctx.db.fine.aggregate({
        _sum: {
          amount: true,
        },
      }),
      ctx.db.fine.aggregate({
        where: { paid: false },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      books: {
        total: totalBooks,
        copies: {
          total: totalCopies,
          available: availableCopies,
          borrowed: borrowedCopies,
        },
      },
      authors: {
        total: totalAuthors,
      },
      users: {
        total: totalUsers,
      },
      loans: {
        total: totalLoans,
        active: activeLoans,
        overdue: overdueLoans,
      },
      reservations: {
        total: totalReservations,
        pending: pendingReservations,
      },
      fines: {
        total: totalFines,
        unpaid: unpaidFines,
        totalAmount: totalFineAmount._sum.amount ?? 0,
        unpaidAmount: unpaidFineAmount._sum.amount ?? 0,
      },
    };
  }),

  // Get popular books (most borrowed)
  getPopularBooks: librarianProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(50).default(10),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;

      // Get books with their copies
      const books = await ctx.db.book.findMany({
        include: {
          authors: {
            include: {
              author: true,
            },
          },
          copies: true,
        },
        take: limit * 2, // Get more to filter later
      });

      // Get actual loan counts per book
      const booksWithLoanCounts = await Promise.all(
        books.map(async (book) => {
          const loanCount = await ctx.db.loan.count({
            where: {
              bookCopy: {
                bookId: book.id,
              },
            },
          });

          return {
            ...book,
            loanCount,
          };
        }),
      );

      // Sort by loan count and take top N
      return booksWithLoanCounts
        .sort((a, b) => b.loanCount - a.loanCount)
        .slice(0, limit);
    }),

  // Get recent activity
  getRecentActivity: librarianProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(50).default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;

      const [recentLoans, recentReturns, recentReservations] =
        await Promise.all([
          ctx.db.loan.findMany({
            orderBy: { borrowedAt: "desc" },
            take: limit,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              bookCopy: {
                include: {
                  book: {
                    include: {
                      authors: {
                        include: {
                          author: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
          ctx.db.loan.findMany({
            where: {
              returnedAt: { not: null },
            },
            orderBy: { returnedAt: "desc" },
            take: limit,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              bookCopy: {
                include: {
                  book: {
                    include: {
                      authors: {
                        include: {
                          author: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
          ctx.db.reservation.findMany({
            orderBy: { reservedAt: "desc" },
            take: limit,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              book: {
                include: {
                  authors: {
                    include: {
                      author: true,
                    },
                  },
                },
              },
            },
          }),
        ]);

      return {
        loans: recentLoans,
        returns: recentReturns,
        reservations: recentReservations,
      };
    }),

  // Get overdue report
  getOverdueReport: librarianProcedure.query(async ({ ctx }) => {
    const now = new Date();

    const overdueLoans = await ctx.db.loan.findMany({
      where: {
        returnedAt: null,
        dueAt: { lt: now },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bookCopy: {
          include: {
            book: {
              include: {
                authors: {
                  include: {
                    author: true,
                  },
                },
              },
            },
          },
        },
        fine: true,
      },
      orderBy: {
        dueAt: "asc",
      },
    });

    // Calculate days overdue for each loan
    const overdueWithDays = overdueLoans.map((loan) => {
      const daysOverdue = Math.ceil(
        (now.getTime() - loan.dueAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        ...loan,
        daysOverdue,
      };
    });

    return {
      count: overdueLoans.length,
      loans: overdueWithDays,
    };
  }),

  // Get category distribution
  getCategoryDistribution: librarianProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.category.findMany({
      include: {
        _count: {
          select: {
            books: true,
          },
        },
      },
      orderBy: {
        books: {
          _count: "desc",
        },
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      bookCount: category._count.books,
    }));
  }),

  // Get loan trends (loans per month for last 12 months)
  getLoanTrends: librarianProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const loans = await ctx.db.loan.findMany({
      where: {
        borrowedAt: {
          gte: twelveMonthsAgo,
        },
      },
      select: {
        borrowedAt: true,
      },
    });

    // Group by month
    const monthlyData: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyData[monthKey] = 0;
    }

    loans.forEach((loan) => {
      const date = new Date(loan.borrowedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey]++;
      }
    });

    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      count,
    }));
  }),
});

