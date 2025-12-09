import { TRPCError } from "@trpc/server";
import { CopyStatus } from "generated/prisma";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  librarianProcedure,
} from "~/server/api/trpc";
import {
	cursorPaginationSchema,
	paginateWithCursor,
	type CursorPaginationInput,
} from "~/server/utils/pagination";

export const authorRouter = createTRPCRouter({

  getAll: publicProcedure
    .input(cursorPaginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const paginationInput: CursorPaginationInput = input ?? {};

      return paginateWithCursor(
        async ({ take, cursor, orderBy }) => {
          return await ctx.db.author.findMany({
            take,
            cursor: cursor ? { id: cursor.id } : undefined,
            orderBy: orderBy ?? { name: "asc" },
            include: {
              books: {
                include: {
                  book: true,
                },
              },
            },
          });
        },
        paginationInput,
        { id: "asc" },
      );
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const author = await ctx.db.author.findUnique({
        where: { id: input.id },
        include: {
          books: {
            include: {
              book: {
                include: {
                  copies: {
                    where: {
                      status: CopyStatus.AVAILABLE,
                    },
                  }
                }
              },
            },
          },
        },
      });

      if (!author) throw new TRPCError({
        code: "NOT_FOUND",
        message: "Author not found",
      });
      return author;
    }),

  search: publicProcedure
    .input(
      z.object({ query: z.string().min(1) }).merge(cursorPaginationSchema),
    )
    .query(async ({ ctx, input }) => {
      const { query, ...paginationInput } = input;

      return paginateWithCursor(
        async ({ take, cursor, orderBy }) => {
          return await ctx.db.author.findMany({
            take,
            cursor: cursor ? { id: cursor.id } : undefined,
            orderBy: orderBy ?? { name: "asc" },
            where: {
              name: {
                contains: query,
              },
            },
          });
        },
        paginationInput,
        { id: "asc" },
      );
    }),

  create: librarianProcedure
    .input(
      z.object({ 
        name: z.string().min(1),
        bio: z.string().optional() 
      }),)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.author.create({
        data: { 
          name: input.name, 
          bio: input.bio,
        },
      });
    }),


    update: librarianProcedure
      .input(
        z.object({ 
          id: z.string(),
          name: z.string().min(1),
          bio: z.string().optional() 
        }))
      .mutation(async ({ ctx, input }) => {
        const {id, ...data} = input;
        return await ctx.db.author.update({
          where: {id},
          data,
        });
      }),

    delete: librarianProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return await ctx.db.author.delete({
          where: { id: input.id },
        });
      }),
});
