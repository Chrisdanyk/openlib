import { TRPCError } from "@trpc/server";
import { CopyStatus, UserRole } from "generated/prisma";
import { z } from "zod";

import {
  createTRPCRouter,
  librarianProcedure,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  cursorPaginationSchema,
  paginateWithCursor,
  type CursorPaginationInput,
} from "~/server/utils/pagination";
import {
  LOAN_CONFIG,
  calculateDueDate,
  getDaysOverdue,
  isOverdue,
} from "~/server/utils/loan-config";

export const loanRouter = createTRPCRouter({
  getAll: librarianProcedure
    .input(cursorPaginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const paginationInput: CursorPaginationInput = input ?? {};

      return paginateWithCursor(
        async ({ take, cursor, orderBy }) => {
          return await ctx.db.loan.findMany({
            take,
            cursor: cursor ? { id: cursor.id } : undefined,
            orderBy: orderBy ?? { borrowedAt: "desc" },
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
          });
        },
        paginationInput,
        { id: "desc" },
      );
    }),

  getActive: publicProcedure
    .input(
      z
        .object({
          userId: z.string().optional(),
        })
        .merge(cursorPaginationSchema),
    )
    .query(async ({ ctx, input }) => {
      const { userId, ...paginationInput } = input;
      const currentUserId = ctx.session?.user?.id;

      const targetUserId = userId ?? currentUserId;

      return paginateWithCursor(
        async ({ take, cursor, orderBy }) => {
          return await ctx.db.loan.findMany({
            take,
            cursor: cursor ? { id: cursor.id } : undefined,
            orderBy: orderBy ?? { dueAt: "asc" },
            where: {
              returnedAt: null,
              ...(targetUserId ? { userId: targetUserId } : {}),
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
            },
          });
        },
        paginationInput,
        { id: "desc" },
      );
    }),

  getOverdue: librarianProcedure
    .input(cursorPaginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const paginationInput: CursorPaginationInput = input ?? {};
      const now = new Date();

      return paginateWithCursor(
        async ({ take, cursor, orderBy }) => {
          return await ctx.db.loan.findMany({
            take,
            cursor: cursor ? { id: cursor.id } : undefined,
            orderBy: orderBy ?? { dueAt: "asc" },
            where: {
              returnedAt: null,
              dueAt: {
                lt: now,
              },
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
            },
          });
        },
        paginationInput,
        { id: "desc" },
      );
    }),

  getMyLoans: protectedProcedure
    .input(
      z
        .object({
          includeReturned: z.boolean().default(false),
        })
        .merge(cursorPaginationSchema),
    )
    .query(async ({ ctx, input }) => {
      const { includeReturned, ...paginationInput } = input;

      return paginateWithCursor(
        async ({ take, cursor, orderBy }) => {
          return await ctx.db.loan.findMany({
            take,
            cursor: cursor ? { id: cursor.id } : undefined,
            orderBy: orderBy ?? { borrowedAt: "desc" },
            where: {
              userId: ctx.session.user.id,
              ...(includeReturned
                ? {}
                : {
                    returnedAt: null,
                  }),
            },
            include: {
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
          });
        },
        paginationInput,
        { id: "desc" },
      );
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const loan = await ctx.db.loan.findUnique({
        where: { id: input.id },
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
      });

      if (!loan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Loan not found",
        });
      }

      const overdue = isOverdue(loan.dueAt, loan.returnedAt);
      const daysOverdue = overdue ? getDaysOverdue(loan.dueAt) : 0;

      return {
        ...loan,
        overdue,
        daysOverdue,
      };
    }),

  borrow: protectedProcedure
    .input(
      z.object({
        bookCopyId: z.string(),
        loanDurationDays: z.number().int().min(1).max(90).optional(),
        userId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.session.user.id;
      const isLibrarian =
        ctx.session.user.role === UserRole.LIBRARIAN ||
        ctx.session.user.role === UserRole.ADMIN;

      if (!isLibrarian && userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only librarians can borrow books for other users",
        });
      }

      const copy = await ctx.db.bookCopy.findUnique({
        where: { id: input.bookCopyId },
        include: {
          book: true,
          loans: {
            where: {
              returnedAt: null,
            },
          },
        },
      });

      if (!copy) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Book copy not found",
        });
      }

      if (copy.status !== CopyStatus.AVAILABLE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Book copy is not available. Current status: ${copy.status}`,
        });
      }

      if (copy.loans.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This copy is already borrowed",
        });
      }

      const activeLoans = await ctx.db.loan.count({
        where: {
          userId,
          returnedAt: null,
        },
      });

      if (activeLoans >= LOAN_CONFIG.MAX_ACTIVE_LOANS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Maximum number of active loans (${LOAN_CONFIG.MAX_ACTIVE_LOANS}) reached`,
        });
      }

      const loanDuration =
        input.loanDurationDays ?? LOAN_CONFIG.DEFAULT_LOAN_DAYS;
      const dueAt = calculateDueDate(loanDuration);


      const [loan] = await Promise.all([
        ctx.db.loan.create({
          data: {
            userId,
            bookCopyId: input.bookCopyId,
            dueAt,
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
          },
        }),
        ctx.db.bookCopy.update({
          where: { id: input.bookCopyId },
          data: { status: CopyStatus.BORROWED },
        }),
      ]);

      return loan;
    }),

  return: librarianProcedure
    .input(z.object({ loanId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const loan = await ctx.db.loan.findUnique({
        where: { id: input.loanId },
        include: {
          bookCopy: true,
        },
      });

      if (!loan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Loan not found",
        });
      }

      if (loan.returnedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This book has already been returned",
        });
      }


      const [updatedLoan] = await Promise.all([
        ctx.db.loan.update({
          where: { id: input.loanId },
          data: {
            returnedAt: new Date(),
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
          },
        }),
        ctx.db.bookCopy.update({
          where: { id: loan.bookCopyId },
          data: { status: CopyStatus.AVAILABLE },
        }),
      ]);

      return updatedLoan;
    }),

  renew: protectedProcedure
    .input(z.object({ loanId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const loan = await ctx.db.loan.findUnique({
        where: { id: input.loanId },
        include: {
          bookCopy: true,
        },
      });

      if (!loan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Loan not found",
        });
      }

      if (loan.returnedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot renew a returned loan",
        });
      }

      const isLibrarian =
        ctx.session.user.role === UserRole.LIBRARIAN ||
        ctx.session.user.role === UserRole.ADMIN;
      if (loan.userId !== ctx.session.user.id && !isLibrarian) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only renew your own loans",
        });
      }

      if (loan.renewalCount >= LOAN_CONFIG.MAX_RENEWALS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Maximum number of renewals (${LOAN_CONFIG.MAX_RENEWALS}) reached`,
        });
      }

      const newDueAt = calculateDueDate(LOAN_CONFIG.RENEWAL_DAYS);
      const extendedDueAt = new Date(loan.dueAt);
      extendedDueAt.setDate(
        extendedDueAt.getDate() + LOAN_CONFIG.RENEWAL_DAYS,
      );

      return await ctx.db.loan.update({
        where: { id: input.loanId },
        data: {
          dueAt: extendedDueAt,
          renewedAt: new Date(),
          renewalCount: {
            increment: 1,
          },
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
        },
      });
    }),
});