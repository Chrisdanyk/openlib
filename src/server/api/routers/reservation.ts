import { TRPCError } from "@trpc/server";
import { CopyStatus, ReservationStatus } from "generated/prisma";
import { z } from "zod";

import {
  createTRPCRouter,
  librarianProcedure,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  offsetPaginationSchema,
  paginateWithOffset,
  type OffsetPaginationInput,
} from "~/server/utils/pagination";
import {
  RESERVATION_CONFIG,
  calculateReservationExpiry,
  isReservationExpired,
} from "~/server/utils/reservation-config";

export const reservationRouter = createTRPCRouter({
  // Get all reservations (librarian only)
  getAll: librarianProcedure
    .input(offsetPaginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const paginationInput: OffsetPaginationInput = input ?? {};

      return paginateWithOffset(
        async ({ take, skip }) => {
          return await ctx.db.reservation.findMany({
            take,
            skip,
            orderBy: { reservedAt: "desc" },
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
                  copies: {
                    where: {
                      status: CopyStatus.AVAILABLE,
                    },
                  },
                },
              },
            },
          });
        },
        async () => {
          return await ctx.db.reservation.count();
        },
        paginationInput,
      );
    }),

  // Get pending reservations (librarian only - to see what needs fulfillment)
  getPending: librarianProcedure
    .input(offsetPaginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const paginationInput: OffsetPaginationInput = input ?? {};

      const where = {
        status: ReservationStatus.PENDING,
      };

      return paginateWithOffset(
        async ({ take, skip }) => {
          return await ctx.db.reservation.findMany({
            take,
            skip,
            orderBy: { reservedAt: "asc" }, // Oldest first
            where,
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
                  copies: {
                    where: {
                      status: CopyStatus.AVAILABLE,
                    },
                  },
                },
              },
            },
          });
        },
        async () => {
          return await ctx.db.reservation.count({ where });
        },
        paginationInput,
      );
    }),

  // Get user's reservations
  getMyReservations: protectedProcedure
    .input(
      z
        .object({
          status: z.nativeEnum(ReservationStatus).optional(),
        })
        .merge(offsetPaginationSchema),
    )
    .query(async ({ ctx, input }) => {
      const { status, ...paginationInput } = input;

      const where = {
        userId: ctx.session.user.id,
        ...(status ? { status } : {}),
      };

      return paginateWithOffset(
        async ({ take, skip }) => {
          return await ctx.db.reservation.findMany({
            take,
            skip,
            orderBy: { reservedAt: "desc" },
            where,
            include: {
              book: {
                include: {
                  authors: {
                    include: {
                      author: true,
                    },
                  },
                  copies: {
                    where: {
                      status: CopyStatus.AVAILABLE,
                    },
                  },
                },
              },
            },
          });
        },
        async () => {
          return await ctx.db.reservation.count({ where });
        },
        paginationInput,
      );
    }),

  // Get reservations for a specific book
  getByBookId: publicProcedure
    .input(
      z.object({ bookId: z.string() }).merge(offsetPaginationSchema),
    )
    .query(async ({ ctx, input }) => {
      const { bookId, ...paginationInput } = input;

      const where = {
        bookId,
        status: ReservationStatus.PENDING,
      };

      return paginateWithOffset(
        async ({ take, skip }) => {
          return await ctx.db.reservation.findMany({
            take,
            skip,
            orderBy: { reservedAt: "asc" },
            where,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });
        },
        async () => {
          return await ctx.db.reservation.count({ where });
        },
        paginationInput,
      );
    }),

  // Get reservation by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const reservation = await ctx.db.reservation.findUnique({
        where: { id: input.id },
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
              copies: {
                where: {
                  status: CopyStatus.AVAILABLE,
                },
              },
            },
          },
        },
      });

      if (!reservation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found",
        });
      }

      // Check if expired
      const expired = isReservationExpired(reservation.expiresAt);

      return {
        ...reservation,
        expired,
      };
    }),

  // Create reservation (place a hold)
  create: protectedProcedure
    .input(z.object({ bookId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if book exists
      const book = await ctx.db.book.findUnique({
        where: { id: input.bookId },
        include: {
          copies: {
            where: {
              status: CopyStatus.AVAILABLE,
            },
          },
          reservations: {
            where: {
              status: ReservationStatus.PENDING,
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!book) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Book not found",
        });
      }

      // Check if user already has a pending reservation for this book
      if (book.reservations.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have a pending reservation for this book",
        });
      }

      // Check if there are available copies (if yes, no need to reserve)
      if (book.copies.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This book has available copies. Please borrow directly.",
        });
      }

      // Check user's pending reservation count
      const pendingReservations = await ctx.db.reservation.count({
        where: {
          userId: ctx.session.user.id,
          status: ReservationStatus.PENDING,
        },
      });

      if (pendingReservations >= RESERVATION_CONFIG.MAX_PENDING_RESERVATIONS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Maximum number of pending reservations (${RESERVATION_CONFIG.MAX_PENDING_RESERVATIONS}) reached`,
        });
      }

      // Create reservation
      const expiresAt = calculateReservationExpiry();

      return await ctx.db.reservation.create({
        data: {
          userId: ctx.session.user.id,
          bookId: input.bookId,
          expiresAt,
        },
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
      });
    }),

  // Cancel reservation
  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const reservation = await ctx.db.reservation.findUnique({
        where: { id: input.id },
      });

      if (!reservation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found",
        });
      }

      // Check if user owns the reservation (or is librarian)
      const isLibrarian =
        ctx.session.user.role === "LIBRARIAN" ||
        ctx.session.user.role === "ADMIN";
      if (reservation.userId !== ctx.session.user.id && !isLibrarian) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only cancel your own reservations",
        });
      }

      if (reservation.status !== ReservationStatus.PENDING) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending reservations can be cancelled",
        });
      }

      return await ctx.db.reservation.update({
        where: { id: input.id },
        data: {
          status: ReservationStatus.CANCELLED,
        },
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
      });
    }),

  // Fulfill reservation (librarian only - when a copy becomes available)
  fulfill: librarianProcedure
    .input(z.object({ id: z.string(), bookCopyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const reservation = await ctx.db.reservation.findUnique({
        where: { id: input.id },
        include: {
          book: {
            include: {
              copies: true,
            },
          },
        },
      });

      if (!reservation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found",
        });
      }

      if (reservation.status !== ReservationStatus.PENDING) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending reservations can be fulfilled",
        });
      }

      // Verify the copy belongs to the book and is available
      const copy = await ctx.db.bookCopy.findUnique({
        where: { id: input.bookCopyId },
      });

      if (!copy) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Book copy not found",
        });
      }

      if (copy.bookId !== reservation.bookId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Book copy does not match the reserved book",
        });
      }

      if (copy.status !== CopyStatus.AVAILABLE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Book copy is not available",
        });
      }

      // Update reservation status
      return await ctx.db.reservation.update({
        where: { id: input.id },
        data: {
          status: ReservationStatus.FULFILLED,
          fulfilledAt: new Date(),
          notifiedAt: new Date(), // Mark as notified
        },
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
      });
    }),

  // Mark expired reservations (librarian only - can be run as a cron job)
  expireOld: librarianProcedure.mutation(async ({ ctx }) => {
    const now = new Date();

    const result = await ctx.db.reservation.updateMany({
      where: {
        status: ReservationStatus.PENDING,
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: ReservationStatus.EXPIRED,
      },
    });

    return {
      expiredCount: result.count,
    };
  }),
});

