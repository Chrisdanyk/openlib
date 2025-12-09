import { TRPCError } from '@trpc/server';
import { title } from 'process';
import { z } from 'zod';

import {
	createTRPCRouter,
	publicProcedure,
	librarianProcedure,
} from '~/server/api/trpc';

export const bookRouter = createTRPCRouter({

	getAll: publicProcedure
		.query(async ({ ctx }) => {
			return await ctx.db.author.findMany({
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
			const book = await ctx.db.book.findUnique({
				where: { id: input.id },
				include: {
					authors: {
						include: {
							author: true,
						},
					},
					copies: true,
					categories: {
						include: {
							category: true,
						},
					},
				},
			});

			if (!book) throw new TRPCError({
				code: "NOT_FOUND",
				message: "Book not found",
			});
			return book;
		}),

	search: publicProcedure
		.input(
			z.object({
				query: z.string().min(1),
				limit: z.number().min(1).max(50).default(20)
			}))
		.query(async ({ ctx, input }) => {
			return ctx.db.book.findMany({
				where: {
					OR: [
						{ title: { contains: input.query, mode: "insensitive" } },
						{ isbn: { contains: input.query, mode: "insensitive" } },
						{ isbn13: { contains: input.query, mode: "insensitive" } },
						{
							authors: {
								some: {
									author: {
										name: { contains: input.query, mode: "insensitive" },
									},
								},
							},
						},
					]
				},
				take: input.limit,
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
				orderBy: { title: "asc" },
			});
		}),

	create: librarianProcedure
		.input(
			z.object({
				title: z.string().min(1),
				description: z.string().optional(),
				isbn: z.string().optional(),
				isbn13: z.string().optional(),
				publishedYear: z.number().int().min(1000).max(2100).optional(),
				publisher: z.string().optional(),
				language: z.string().optional(),
				pageCount: z.number().int().positive().optional(),
				coverImage: z.string().url().optional(),
				authorIds: z.array(z.string()).min(1),
				categoryIds: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { authorIds, categoryIds, ...bookData } = input;

			return await ctx.db.book.create({
				data: {
					...bookData,
					authors: {
						create: authorIds.map((authorId) => ({
							author: { connect: { id: authorId } },
						})),
					},
					categories: categoryIds
						? {
							create: categoryIds.map((categoryId) => ({
								category: { connect: { id: categoryId } },
							})),
						}
						: undefined,
				},
				include: {
					authors: {
						include: {
							author: true,
						},
					},
				},
			});
		}),

	update: librarianProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().min(1).optional(),
				description: z.string().optional(),
				isbn: z.string().optional(),
				isbn13: z.string().optional(),
				publishedYear: z.number().int().min(1000).max(2100).optional(),
				publisher: z.string().optional(),
				language: z.string().optional(),
				pageCount: z.number().int().positive().optional(),
				coverImage: z.string().url().optional(),
				authorIds: z.array(z.string()).optional(),
				categoryIds: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, authorIds, categoryIds, ...bookData } = input;

			const authorUpdates = authorIds
				? {
					deleteMany: {},
					create: authorIds.map((authorId) => ({
						author: { connect: { id: authorId } },
					})),
				}
				: undefined;

			const categoryUpdates = categoryIds
				? {
					deleteMany: {},
					create: categoryIds.map((categoryId) => ({
						category: { connect: { id: categoryId } },
					})),
				}
				: undefined;

			return ctx.db.book.update({
				where: { id },
				data: {
					...bookData,
					...(authorUpdates && { authors: authorUpdates }),
					...(categoryUpdates && { categories: categoryUpdates }),
				},
				include: {
					authors: {
						include: {
							author: true,
						},
					},
				},
			});
		}),

	delete: librarianProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.book.delete({
				where: { id: input.id },
			});
		}),
});
