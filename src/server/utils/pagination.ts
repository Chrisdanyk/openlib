import { z } from "zod";

/**
 * Pagination configuration with defaults
 */
export const PAGINATION_CONFIG = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

/**
 * Cursor-based pagination input schema
 * Supports bidirectional pagination (previous/next)
 */
export const cursorPaginationSchema = z.object({
  limit: z
    .number()
    .min(PAGINATION_CONFIG.MIN_LIMIT)
    .max(PAGINATION_CONFIG.MAX_LIMIT)
    .default(PAGINATION_CONFIG.DEFAULT_LIMIT)
    .optional(),
  cursor: z.string().optional(),
  direction: z.enum(["forward", "backward"]).default("forward").optional(),
});

export type CursorPaginationInput = z.infer<typeof cursorPaginationSchema>;

/**
 * Offset-based pagination input schema
 * Simpler, good for smaller datasets
 */
export const offsetPaginationSchema = z.object({
  limit: z
    .number()
    .min(PAGINATION_CONFIG.MIN_LIMIT)
    .max(PAGINATION_CONFIG.MAX_LIMIT)
    .default(PAGINATION_CONFIG.DEFAULT_LIMIT)
    .optional(),
  page: z.number().int().min(1).default(1).optional(),
});

export type OffsetPaginationInput = z.infer<typeof offsetPaginationSchema>;

/**
 * Cursor-based pagination result with previous/next support
 */
export type CursorPaginationResult<T> = {
  items: T[];
  nextCursor: string | null;
  previousCursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

/**
 * Offset-based pagination result
 */
export type OffsetPaginationResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

/**
 * Helper function for cursor-based pagination with bidirectional support
 * Use this with Prisma's findMany with cursor
 * 
 * Note: For previous page detection, we check if a cursor was provided.
 * The previousCursor is set to the first item's ID, which can be used
 * to navigate back (though this requires storing the cursor history on the client).
 */
export async function paginateWithCursor<T extends { id: string }>(
  queryFn: (args: {
    take: number;
    cursor?: { id: string };
    orderBy?: Record<string, "asc" | "desc">;
  }) => Promise<T[]>,
  input: CursorPaginationInput,
  orderBy: { id: "asc" | "desc" } = { id: "desc" },
): Promise<CursorPaginationResult<T>> {
  const limit = input.limit ?? PAGINATION_CONFIG.DEFAULT_LIMIT;
  const cursor = input.cursor ? { id: input.cursor } : undefined;

  // Fetch limit + 1 to check for next page
  const take = limit + 1;

  const items = await queryFn({
    take,
    cursor,
    orderBy,
  });

  let hasNextPage = false;
  let hasPreviousPage = false;
  let nextCursor: string | null = null;
  let previousCursor: string | null = null;

  // Check if there's a next page
  if (items.length > limit) {
    const nextItem = items.pop(); // Remove the extra item
    nextCursor = nextItem?.id ?? null;
    hasNextPage = true;
  }

  // If we have a cursor, there's a previous page
  // The previousCursor is the first item's ID (for reference, though client should track cursor history)
  if (cursor && items.length > 0) {
    hasPreviousPage = true;
    previousCursor = items[0]?.id ?? null;
  }

  // If no cursor and we have items, check if there are items before the first one
  // by doing a reverse query
  if (!cursor && items.length > 0) {
    const firstItem = items[0];
    const reverseOrderBy = { id: orderBy.id === "asc" ? "desc" : "asc" } as const;
    
    // Check if there are items before the first item
    const itemsBefore = await queryFn({
      take: 1,
      cursor: { id: firstItem.id },
      orderBy: reverseOrderBy,
    });
    
    if (itemsBefore.length > 0) {
      hasPreviousPage = true;
      // We can't easily determine the previous cursor without storing history
      // So we'll set it to null and let the client handle it
      previousCursor = null;
    }
  }

  return {
    items,
    nextCursor,
    previousCursor,
    hasNextPage,
    hasPreviousPage,
  };
}

/**
 * Helper function for offset-based pagination
 * Use this with Prisma's findMany with skip/take
 */
export async function paginateWithOffset<T>(
  queryFn: (args: {
    take: number;
    skip: number;
  }) => Promise<T[]>,
  countFn: () => Promise<number>,
  input: OffsetPaginationInput,
): Promise<OffsetPaginationResult<T>> {
  const limit = input.limit ?? PAGINATION_CONFIG.DEFAULT_LIMIT;
  const page = input.page ?? 1;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    queryFn({ take: limit, skip }),
    countFn(),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
}

