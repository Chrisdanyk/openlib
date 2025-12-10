import { TRPCError } from "@trpc/server";
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
import { FINE_CONFIG, calculateFine, getDaysOverdue } from "~/server/utils/loan-config";

export const fineRouter = createTRPCRouter({
  // Get all fines (librarian only)
  getAll: librarianProcedure
    .input(cursorPaginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const paginationInput: CursorPaginationInput = input ?? {};

      return paginateWithCursor(
        async ({ take, cursor, orderBy }) => {
          return ctx.db.fine.findMany({
            take,
            cursor: cursor ? { id: cursor.id } : undefined,
            orderBy: orderBy ?? { createdAt: "desc" },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
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
          });
        },
        paginationInput,
        { id: "desc" },
      );
    }),

  // Get unpaid fines
  getUnpaid: publicProcedure
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

      // If no userId provided and user is logged in, use their ID
      const targetUserId = userId ?? currentUserId;

      return paginateWithCursor(
        async ({ take, cursor, orderBy }) => {
          return ctx.db.fine.findMany({
            take,
            cursor: cursor ? { id: cursor.id } : undefined,
            orderBy: orderBy ?? { createdAt: "desc" },
            where: {
              paid: false,
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
          });
        },
        paginationInput,
        { id: "desc" },
      );
    }),

  // Get user's fines
  getMyFines: protectedProcedure
    .input(
      z
        .object({
          paid: z.boolean().optional(),
        })
        .merge(cursorPaginationSchema),
    )
    .query(async ({ ctx, input }) => {
      const { paid, ...paginationInput } = input;

      return paginateWithCursor(
        async ({ take, cursor, orderBy }) => {
          return ctx.db.fine.findMany({
            take,
            cursor: cursor ? { id: cursor.id } : undefined,
            orderBy: orderBy ?? { createdAt: "desc" },
            where: {
              userId: ctx.session.user.id,
              ...(paid !== undefined ? { paid } : {}),
            },
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
          });
        },
        paginationInput,
        { id: "desc" },
      );
    }),

  // Get fine by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const fine = await ctx.db.fine.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
      });

      if (!fine) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Fine not found",
        });
      }

      return fine;
    }),

  // Create fine for overdue loan (librarian only - or can be automated)
  create: librarianProcedure
    .input(
      z.object({
        loanId: z.string(),
        amount: z.number().positive().optional(), // Optional: can auto-calculate
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if fine already exists for this loan
      const existingFine = await ctx.db.fine.findUnique({
        where: { loanId: input.loanId },
      });

      if (existingFine) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A fine already exists for this loan",
        });
      }

      // Get loan details
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
          message: "Cannot create fine for a returned loan",
        });
      }

      // Calculate fine amount
      const daysOverdue = getDaysOverdue(loan.dueAt);
      const fineAmount =
        input.amount ?? calculateFine(daysOverdue);

      if (fineAmount <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Loan is not overdue or within grace period",
        });
      }

      return ctx.db.fine.create({
        data: {
          userId: loan.userId,
          loanId: input.loanId,
          amount: fineAmount,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
      });
    }),

  // Pay fine
  pay: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const fine = await ctx.db.fine.findUnique({
        where: { id: input.id },
      });

      if (!fine) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Fine not found",
        });
      }

      // Check if user owns the fine (or is librarian)
      const isLibrarian =
        ctx.session.user.role === "LIBRARIAN" ||
        ctx.session.user.role === "ADMIN";
      if (fine.userId !== ctx.session.user.id && !isLibrarian) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only pay your own fines",
        });
      }

      if (fine.paid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This fine has already been paid",
        });
      }

      return ctx.db.fine.update({
        where: { id: input.id },
        data: {
          paid: true,
          paidAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
      });
    }),

  // Auto-create fines for overdue loans (librarian only - can be run as cron job)
  createForOverdue: librarianProcedure.mutation(async ({ ctx }) => {
    const now = new Date();

    // Find all overdue loans without fines
    const overdueLoans = await ctx.db.loan.findMany({
      where: {
        returnedAt: null,
        dueAt: {
          lt: now,
        },
        fine: null, // No fine exists yet
      },
      include: {
        fine: true,
      },
    });

    const finesCreated = [];

    for (const loan of overdueLoans) {
      const daysOverdue = getDaysOverdue(loan.dueAt);
      const fineAmount = calculateFine(daysOverdue);

      if (fineAmount > 0) {
        const fine = await ctx.db.fine.create({
          data: {
            userId: loan.userId,
            loanId: loan.id,
            amount: fineAmount,
          },
        });
        finesCreated.push(fine);
      }
    }

    return {
      createdCount: finesCreated.length,
      fines: finesCreated,
    };
  }),

  // Update fine amount (librarian only)
  update: librarianProcedure
    .input(
      z.object({
        id: z.string(),
        amount: z.number().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const fine = await ctx.db.fine.findUnique({
        where: { id: input.id },
      });

      if (!fine) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Fine not found",
        });
      }

      if (fine.paid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot update a paid fine",
        });
      }

      return ctx.db.fine.update({
        where: { id: input.id },
        data: {
          amount: input.amount,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
      });
    }),
});

