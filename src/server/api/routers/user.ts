import { TRPCError } from "@trpc/server";
import { UserRole } from "generated/prisma";
import { z } from "zod";

import {
  createTRPCRouter,
  adminProcedure,
  librarianProcedure,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  cursorPaginationSchema,
  paginateWithCursor,
  type CursorPaginationInput,
} from "~/server/utils/pagination";

export const userRouter = createTRPCRouter({
  // Get all users (librarian only)
  getAll: librarianProcedure
    .input(cursorPaginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const paginationInput: CursorPaginationInput = input ?? {};

      return paginateWithCursor(
        async ({ take, cursor, orderBy }) => {
          return await ctx.db.user.findMany({
            take,
            cursor: cursor ? { id: cursor.id } : undefined,
            orderBy: orderBy ?? { createdAt: "desc" },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true,
              emailVerified: true,
              createdAt: true,
              updatedAt: true,
              _count: {
                select: {
                  loans: true,
                  reservations: true,
                  fines: true,
                },
              },
            },
          });
        },
        paginationInput,
        { id: "desc" },
      );
    }),

  // Get user by ID (librarian or own profile)
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const isLibrarian =
        ctx.session?.user?.role === "LIBRARIAN" ||
        ctx.session?.user?.role === "ADMIN";
      const isOwnProfile = ctx.session?.user?.id === input.id;

      // Only librarians or the user themselves can view detailed profile
      if (!isLibrarian && !isOwnProfile) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own profile",
        });
      }

      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              loans: true,
              reservations: true,
              fines: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
    }),

  // Get current user profile
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            loans: true,
            reservations: true,
            fines: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),

  // Get user's activity (loans, reservations, fines)
  getActivity: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(), // Librarian can view any user's activity
      }),
    )
    .query(async ({ ctx, input }) => {
      const targetUserId = input.userId ?? ctx.session.user.id;
      const isLibrarian =
        ctx.session.user.role === "LIBRARIAN" ||
        ctx.session.user.role === "ADMIN";

      // Only librarians can view other users' activity
      if (targetUserId !== ctx.session.user.id && !isLibrarian) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own activity",
        });
      }

      const [loans, reservations, fines] = await Promise.all([
        ctx.db.loan.findMany({
          where: { userId: targetUserId },
          orderBy: { borrowedAt: "desc" },
          take: 10,
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
        }),
        ctx.db.reservation.findMany({
          where: { userId: targetUserId },
          orderBy: { reservedAt: "desc" },
          take: 10,
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
        }),
        ctx.db.fine.findMany({
          where: { userId: targetUserId },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            loan: {
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
            },
          },
        }),
      ]);

      return {
        loans,
        reservations,
        fines,
      };
    }),

  // Update user role (admin only)
  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.nativeEnum(UserRole),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent changing own role
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot change your own role",
        });
      }

      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return await ctx.db.user.update({
        where: { id: input.userId },
        data: {
          role: input.role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          updatedAt: true,
        },
      });
    }),

  // Search users (librarian only)
  search: librarianProcedure
    .input(
      z.object({ query: z.string().min(1) }).merge(cursorPaginationSchema),
    )
    .query(async ({ ctx, input }) => {
      const { query, ...paginationInput } = input;

      return paginateWithCursor(
        async ({ take, cursor, orderBy }) => {
          return await ctx.db.user.findMany({
            take,
            cursor: cursor ? { id: cursor.id } : undefined,
            orderBy: orderBy ?? { name: "asc" },
            where: {
              OR: [
                { name: { contains: query } },
                { email: { contains: query } },
              ],
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true,
              createdAt: true,
              _count: {
                select: {
                  loans: true,
                  reservations: true,
                  fines: true,
                },
              },
            },
          });
        },
        paginationInput,
        { id: "asc" },
      );
    }),

  // Get user statistics
  getStats: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const targetUserId = input.userId ?? ctx.session.user.id;
      const isLibrarian =
        ctx.session.user.role === "LIBRARIAN" ||
        ctx.session.user.role === "ADMIN";

      // Only librarians can view other users' stats
      if (targetUserId !== ctx.session.user.id && !isLibrarian) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own statistics",
        });
      }

      const [
        totalLoans,
        activeLoans,
        returnedLoans,
        totalReservations,
        pendingReservations,
        totalFines,
        unpaidFines,
        paidFines,
      ] = await Promise.all([
        ctx.db.loan.count({
          where: { userId: targetUserId },
        }),
        ctx.db.loan.count({
          where: {
            userId: targetUserId,
            returnedAt: null,
          },
        }),
        ctx.db.loan.count({
          where: {
            userId: targetUserId,
            returnedAt: { not: null },
          },
        }),
        ctx.db.reservation.count({
          where: { userId: targetUserId },
        }),
        ctx.db.reservation.count({
          where: {
            userId: targetUserId,
            status: "PENDING",
          },
        }),
        ctx.db.fine.count({
          where: { userId: targetUserId },
        }),
        ctx.db.fine.count({
          where: {
            userId: targetUserId,
            paid: false,
          },
        }),
        ctx.db.fine.count({
          where: {
            userId: targetUserId,
            paid: true,
          },
        }),
      ]);

      // Calculate total fine amounts
      const [unpaidAmount, paidAmount] = await Promise.all([
        ctx.db.fine.aggregate({
          where: {
            userId: targetUserId,
            paid: false,
          },
          _sum: {
            amount: true,
          },
        }),
        ctx.db.fine.aggregate({
          where: {
            userId: targetUserId,
            paid: true,
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      return {
        loans: {
          total: totalLoans,
          active: activeLoans,
          returned: returnedLoans,
        },
        reservations: {
          total: totalReservations,
          pending: pendingReservations,
        },
        fines: {
          total: totalFines,
          unpaid: unpaidFines,
          paid: paidFines,
          unpaidAmount: unpaidAmount._sum.amount ?? 0,
          paidAmount: paidAmount._sum.amount ?? 0,
        },
      };
    }),
});

