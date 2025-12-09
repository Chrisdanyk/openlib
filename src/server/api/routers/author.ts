import { TRPCError } from "@trpc/server";
import { CopyStatus } from "generated/prisma";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  librarianProcedure,
} from "~/server/api/trpc";

export const authorRouter = createTRPCRouter({

  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.author.findMany({
      orderBy: { name: "asc" },
      include: {
        books: {
          include: {
            book: true,
          },
        },
      },
    });
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
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.author.findMany({
        where: {
          name: { 
            contains: input.query, 
            mode: "insensitive",
          },
        },
        orderBy: { name: "asc" },
        take: 20,
      });
    }),

  create: librarianProcedure
    .input(
      z.object({ 
        name: z.string().min(1),
        bio: z.string().optional() 
      }),)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.author.create({
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
        return ctx.db.author.update({
          where: {id},
          data,
        });
      }),

    delete: librarianProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return ctx.db.author.delete({
          where: { id: input.id },
        });
      }),
});
