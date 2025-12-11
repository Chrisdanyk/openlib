import { TRPCError } from "@trpc/server";
import { CopyStatus } from "generated/prisma";
import { z } from "zod";

import {
  createTRPCRouter,
  librarianProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  offsetPaginationSchema,
  paginateWithOffset,
  type OffsetPaginationInput,
} from "~/server/utils/pagination";

export const bookCopyRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(offsetPaginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const paginationInput: OffsetPaginationInput = input ?? {};

      return paginateWithOffset(
        async ({ take, skip }) => {
          return await ctx.db.bookCopy.findMany({
            take,
            skip,
            orderBy: { createdAt: "desc" },
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
          });
        },
        async () => {
          return await ctx.db.bookCopy.count();
        },
        paginationInput,
      );
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const copy = await ctx.db.bookCopy.findUnique({
        where: { id: input.id },
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
          loans: {
            where: {
              returnedAt: null,
            },
            include: {
              user: true,
            },
            orderBy: {
              borrowedAt: "desc",
            },
            take: 1,
          },
        },
      });

      if (!copy) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Book copy not found",
        });
      }

      return copy;
    }),

  getByBookId: publicProcedure
    .input(
      z.object({ bookId: z.string() }).merge(offsetPaginationSchema),
    )
    .query(async ({ ctx, input }) => {
      const { bookId, ...paginationInput } = input;

      const where = { bookId };

      return paginateWithOffset(
        async ({ take, skip }) => {
          return await ctx.db.bookCopy.findMany({
            take,
            skip,
            orderBy: { code: "asc" },
            where,
            include: {
              loans: {
                where: {
                  returnedAt: null,
                },
                take: 1,
              },
            },
          });
        },
        async () => {
          return await ctx.db.bookCopy.count({ where });
        },
        paginationInput,
      );
    }),

  getByStatus: publicProcedure
    .input(
      z
        .object({
          status: z.nativeEnum(CopyStatus),
        })
        .merge(offsetPaginationSchema),
    )
    .query(async ({ ctx, input }) => {
      const { status, ...paginationInput } = input;

      const where = { status };

      return paginateWithOffset(
        async ({ take, skip }) => {
          return await ctx.db.bookCopy.findMany({
            take,
            skip,
            orderBy: { createdAt: "desc" },
            where,
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
          });
        },
        async () => {
          return await ctx.db.bookCopy.count({ where });
        },
        paginationInput,
      );
    }),

  create: librarianProcedure
    .input(
      z.object({
        code: z.string().min(1),
        bookId: z.string(),
        status: z.nativeEnum(CopyStatus).default(CopyStatus.AVAILABLE),
        location: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingCopy = await ctx.db.bookCopy.findUnique({
        where: { code: input.code },
      });

      if (existingCopy) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A copy with this code already exists",
        });
      }

      const book = await ctx.db.book.findUnique({
        where: { id: input.bookId },
      });

      if (!book) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Book not found",
        });
      }

      return await ctx.db.bookCopy.create({
        data: {
          code: input.code,
          bookId: input.bookId,
          status: input.status,
          location: input.location,
          notes: input.notes,
        },
        include: {
          book: true,
        },
      });
    }),

  update: librarianProcedure
    .input(
      z.object({
        id: z.string(),
        code: z.string().min(1).optional(),
        status: z.nativeEnum(CopyStatus).optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      if (data.code) {
        const existingCopy = await ctx.db.bookCopy.findFirst({
          where: {
            code: data.code,
            id: { not: id },
          },
        });

        if (existingCopy) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A copy with this code already exists",
          });
        }
      }

      return await ctx.db.bookCopy.update({
        where: { id },
        data,
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
      });
    }),

  delete: librarianProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const activeLoan = await ctx.db.loan.findFirst({
        where: {
          bookCopyId: input.id,
          returnedAt: null,
        },
      });

      if (activeLoan) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete a copy that is currently borrowed",
        });
      }

      return await ctx.db.bookCopy.delete({
        where: { id: input.id },
      });
    }),

  bulkCreate: librarianProcedure
    .input(
      z.object({
        bookId: z.string(),
        count: z.number().int().min(1).max(100),
        codePrefix: z.string().optional(),
        location: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const book = await ctx.db.book.findUnique({
        where: { id: input.bookId },
      });

      if (!book) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Book not found",
        });
      }

      const copies = Array.from({ length: input.count }, (_, i) => {
        const code = input.codePrefix
          ? `${input.codePrefix}-${String(i + 1).padStart(3, "0")}`
          : `${book.title.substring(0, 4).toUpperCase()}-${String(i + 1).padStart(3, "0")}`;

        return {
          code,
          bookId: input.bookId,
          status: CopyStatus.AVAILABLE,
          location: input.location,
        };
      });

      const existingCodes = await ctx.db.bookCopy.findMany({
        where: {
          code: { in: copies.map((c) => c.code) },
        },
      });

      if (existingCodes.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Some codes already exist: ${existingCodes.map((c) => c.code).join(", ")}`,
        });
      }

      return await ctx.db.bookCopy.createMany({
        data: copies,
      });
    }),
});
