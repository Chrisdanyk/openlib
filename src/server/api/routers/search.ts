import { TRPCError } from "@trpc/server";
import { CopyStatus } from "generated/prisma";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import {
  cursorPaginationSchema,
  paginateWithCursor,
  type CursorPaginationInput,
} from "~/server/utils/pagination";

export const searchRouter = createTRPCRouter({
  // Advanced search across books, authors, and categories
  global: publicProcedure
    .input(
      z
        .object({
          query: z.string().min(1),
          filters: z
            .object({
              availableOnly: z.boolean().optional(),
              categoryIds: z.array(z.string()).optional(),
              authorIds: z.array(z.string()).optional(),
              publishedYearMin: z.number().int().optional(),
              publishedYearMax: z.number().int().optional(),
            })
            .optional(),
          sortBy: z
            .enum([
              "relevance",
              "title",
              "author",
              "year",
              "created",
            ])
            .default("relevance"),
          sortOrder: z.enum(["asc", "desc"]).default("desc"),
        })
        .merge(cursorPaginationSchema),
    )
    .query(async ({ ctx, input }) => {
      const { query, filters, sortBy, sortOrder, ...paginationInput } = input;

      // Build where clause
      const where: any = {
        OR: [
          { title: { contains: query } },
          { isbn: { contains: query } },
          { isbn13: { contains: query } },
          { description: { contains: query } },
          {
            authors: {
              some: {
                author: {
                  name: { contains: query },
                },
              },
            },
          },
          {
            categories: {
              some: {
                category: {
                  name: { contains: query },
                },
              },
            },
          },
        ],
      };

      // Apply filters
      if (filters?.availableOnly) {
        where.copies = {
          some: {
            status: CopyStatus.AVAILABLE,
          },
        };
      }

      if (filters?.categoryIds && filters.categoryIds.length > 0) {
        where.categories = {
          some: {
            categoryId: { in: filters.categoryIds },
          },
        };
      }

      if (filters?.authorIds && filters.authorIds.length > 0) {
        where.authors = {
          some: {
            authorId: { in: filters.authorIds },
          },
        };
      }

      if (filters?.publishedYearMin || filters?.publishedYearMax) {
        where.publishedYear = {};
        if (filters.publishedYearMin) {
          where.publishedYear.gte = filters.publishedYearMin;
        }
        if (filters.publishedYearMax) {
          where.publishedYear.lte = filters.publishedYearMax;
        }
      }

      // Build orderBy
      let orderBy: any = { createdAt: "desc" };
      switch (sortBy) {
        case "title":
          orderBy = { title: sortOrder };
          break;
        case "year":
          orderBy = { publishedYear: sortOrder };
          break;
        case "created":
          orderBy = { createdAt: sortOrder };
          break;
        case "relevance":
        default:
          // For relevance, we'll sort by title as a fallback
          orderBy = { title: "asc" };
          break;
      }

      return paginateWithCursor(
        async ({ take, cursor, orderBy: cursorOrderBy }) => {
          return await ctx.db.book.findMany({
            take,
            cursor: cursor ? { id: cursor.id } : undefined,
            orderBy: cursorOrderBy ?? orderBy,
            where,
            include: {
              authors: {
                include: {
                  author: true,
                },
              },
              categories: {
                include: {
                  category: true,
                },
              },
              copies: {
                where: {
                  status: CopyStatus.AVAILABLE,
                },
              },
              _count: {
                select: {
                  copies: true,
                },
              },
            },
          });
        },
        paginationInput,
        { id: "asc" },
      );
    }),

  // Search books with advanced filters
  books: publicProcedure
    .input(
      z
        .object({
          query: z.string().min(1).optional(),
          filters: z
            .object({
              availableOnly: z.boolean().optional(),
              categoryIds: z.array(z.string()).optional(),
              authorIds: z.array(z.string()).optional(),
              hasAvailableCopies: z.boolean().optional(),
            })
            .optional(),
        })
        .merge(cursorPaginationSchema),
    )
    .query(async ({ ctx, input }) => {
      const { query, filters, ...paginationInput } = input;

      const where: any = {};

      if (query) {
        where.OR = [
          { title: { contains: query } },
          { isbn: { contains: query } },
          { isbn13: { contains: query } },
          { description: { contains: query } },
          {
            authors: {
              some: {
                author: {
                  name: { contains: query },
                },
              },
            },
          },
        ];
      }

      if (filters?.availableOnly) {
        where.copies = {
          some: {
            status: CopyStatus.AVAILABLE,
          },
        };
      }

      if (filters?.hasAvailableCopies) {
        where.copies = {
          some: {
            status: CopyStatus.AVAILABLE,
          },
        };
      }

      if (filters?.categoryIds && filters.categoryIds.length > 0) {
        where.categories = {
          some: {
            categoryId: { in: filters.categoryIds },
          },
        };
      }

      if (filters?.authorIds && filters.authorIds.length > 0) {
        where.authors = {
          some: {
            authorId: { in: filters.authorIds },
          },
        };
      }

      return paginateWithCursor(
        async ({ take, cursor, orderBy }) => {
          return await ctx.db.book.findMany({
            take,
            cursor: cursor ? { id: cursor.id } : undefined,
            orderBy: orderBy ?? { title: "asc" },
            where,
            include: {
              authors: {
                include: {
                  author: true,
                },
              },
              categories: {
                include: {
                  category: true,
                },
              },
              copies: {
                where: {
                  status: CopyStatus.AVAILABLE,
                },
              },
            },
          });
        },
        paginationInput,
        { id: "asc" },
      );
    }),

  // Search authors
  authors: publicProcedure
    .input(
      z
        .object({
          query: z.string().min(1).optional(),
        })
        .merge(cursorPaginationSchema),
    )
    .query(async ({ ctx, input }) => {
      const { query, ...paginationInput } = input;

      const where: any = {};
      if (query) {
        where.OR = [
          { name: { contains: query } },
          { bio: { contains: query } },
        ];
      }

      return paginateWithCursor(
        async ({ take, cursor, orderBy }) => {
          return await ctx.db.author.findMany({
            take,
            cursor: cursor ? { id: cursor.id } : undefined,
            orderBy: orderBy ?? { name: "asc" },
            where,
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

  // Get search suggestions/autocomplete
  suggestions: publicProcedure
    .input(z.object({ query: z.string().min(1), limit: z.number().int().min(1).max(10).default(5) }))
    .query(async ({ ctx, input }) => {
      const { query, limit } = input;

      const [books, authors, categories] = await Promise.all([
        ctx.db.book.findMany({
          where: {
            OR: [
              { title: { contains: query } },
              { isbn: { contains: query } },
            ],
          },
          take: limit,
          select: {
            id: true,
            title: true,
          },
        }),
        ctx.db.author.findMany({
          where: {
            name: { contains: query },
          },
          take: limit,
          select: {
            id: true,
            name: true,
          },
        }),
        ctx.db.category.findMany({
          where: {
            name: { contains: query },
          },
          take: limit,
          select: {
            id: true,
            name: true,
          },
        }),
      ]);

      return {
        books,
        authors,
        categories,
      };
    }),
});

