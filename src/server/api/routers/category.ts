import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  librarianProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  cursorPaginationSchema,
  paginateWithCursor,
  type CursorPaginationInput,
} from "~/server/utils/pagination";

export const categoryRouter = createTRPCRouter({
  // Get all categories (public)
  getAll: publicProcedure
    .input(cursorPaginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const paginationInput: CursorPaginationInput = input ?? {};

      return paginateWithCursor(
        async ({ take, cursor, orderBy }) => {
          return await ctx.db.category.findMany({
            take,
            cursor: cursor ? { id: cursor.id } : undefined,
            orderBy: orderBy ?? { name: "asc" },
            include: {
              _count: {
                select: {
                  books: true,
                },
              },
            },
          });
        },
        paginationInput,
        { id: "asc" },
      );
    }),

  // Get category by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.db.category.findUnique({
        where: { id: input.id },
        include: {
          books: {
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
                      status: "AVAILABLE",
                    },
                  },
                },
              },
            },
            take: 10, // Limit books shown
          },
          _count: {
            select: {
              books: true,
            },
          },
        },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      return category;
    }),

  // Search categories
  search: publicProcedure
    .input(
      z.object({ query: z.string().min(1) }).merge(cursorPaginationSchema),
    )
    .query(async ({ ctx, input }) => {
      const { query, ...paginationInput } = input;

      return paginateWithCursor(
        async ({ take, cursor, orderBy }) => {
          return await ctx.db.category.findMany({
            take,
            cursor: cursor ? { id: cursor.id } : undefined,
            orderBy: orderBy ?? { name: "asc" },
            where: {
              OR: [
                { name: { contains: query } },
                { description: { contains: query } },
              ],
            },
            include: {
              _count: {
                select: {
                  books: true,
                },
              },
            },
          });
        },
        paginationInput,
        { id: "asc" },
      );
    }),

  // Create category (librarian only)
  create: librarianProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if category already exists
      const existing = await ctx.db.category.findUnique({
        where: { name: input.name },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A category with this name already exists",
        });
      }

      return await ctx.db.category.create({
        data: {
          name: input.name,
          description: input.description,
        },
      });
    }),

  // Update category (librarian only)
  update: librarianProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // If updating name, check for conflicts
      if (data.name) {
        const existing = await ctx.db.category.findFirst({
          where: {
            name: data.name,
            id: { not: id },
          },
        });

        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A category with this name already exists",
          });
        }
      }

      return await ctx.db.category.update({
        where: { id },
        data,
      });
    }),

  // Delete category (librarian only)
  delete: librarianProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if category has books
      const category = await ctx.db.category.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              books: true,
            },
          },
        },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      if (category._count.books > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete category with ${category._count.books} book(s). Please remove books from this category first.`,
        });
      }

      return await ctx.db.category.delete({
        where: { id: input.id },
      });
    }),

  // Get books by category
  getBooks: publicProcedure
    .input(
      z.object({ categoryId: z.string() }).merge(cursorPaginationSchema),
    )
    .query(async ({ ctx, input }) => {
      const { categoryId, ...paginationInput } = input;

      // Verify category exists
      const category = await ctx.db.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      return paginateWithCursor(
        async ({ take, cursor, orderBy }) => {
          return await ctx.db.book.findMany({
            take,
            cursor: cursor ? { id: cursor.id } : undefined,
            orderBy: orderBy ?? { title: "asc" },
            where: {
              categories: {
                some: {
                  categoryId,
                },
              },
            },
            include: {
              authors: {
                include: {
                  author: true,
                },
              },
              copies: {
                where: {
                  status: "AVAILABLE",
                },
              },
            },
          });
        },
        paginationInput,
        { id: "asc" },
      );
    }),
});
