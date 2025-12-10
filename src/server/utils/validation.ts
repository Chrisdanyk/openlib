import { z } from "zod";

/**
 * Reusable validation schemas for common inputs
 */

// ID validation
export const idSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

// Pagination schemas (already in pagination.ts, but keeping for consistency)
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20).optional(),
  cursor: z.string().optional(),
});

// Book validation schemas
export const bookTitleSchema = z
  .string()
  .min(1, "Title is required")
  .max(500, "Title must be less than 500 characters");

export const bookDescriptionSchema = z
  .string()
  .max(2000, "Description must be less than 2000 characters")
  .optional();

export const isbnSchema = z
  .string()
  .regex(/^[0-9X-]+$/, "ISBN must contain only numbers, X, and hyphens")
  .optional();

export const isbn13Schema = z
  .string()
  .regex(/^[0-9]{13}$/, "ISBN-13 must be exactly 13 digits")
  .optional();

export const publishedYearSchema = z
  .number()
  .int()
  .min(1000, "Published year must be after 1000")
  .max(2100, "Published year must be before 2100")
  .optional();

export const pageCountSchema = z
  .number()
  .int()
  .positive("Page count must be positive")
  .max(100000, "Page count seems unrealistic")
  .optional();

export const urlSchema = z
  .string()
  .url("Must be a valid URL")
  .optional();

// Author validation schemas
export const authorNameSchema = z
  .string()
  .min(1, "Author name is required")
  .max(200, "Author name must be less than 200 characters");

export const authorBioSchema = z
  .string()
  .max(2000, "Bio must be less than 2000 characters")
  .optional();

// Category validation schemas
export const categoryNameSchema = z
  .string()
  .min(1, "Category name is required")
  .max(100, "Category name must be less than 100 characters");

export const categoryDescriptionSchema = z
  .string()
  .max(500, "Description must be less than 500 characters")
  .optional();

// BookCopy validation schemas
export const copyCodeSchema = z
  .string()
  .min(1, "Copy code is required")
  .max(50, "Copy code must be less than 50 characters")
  .regex(/^[A-Z0-9-_]+$/, "Copy code can only contain uppercase letters, numbers, hyphens, and underscores");

export const locationSchema = z
  .string()
  .max(200, "Location must be less than 200 characters")
  .optional();

export const notesSchema = z
  .string()
  .max(1000, "Notes must be less than 1000 characters")
  .optional();

// Loan validation schemas
export const loanDurationSchema = z
  .number()
  .int()
  .min(1, "Loan duration must be at least 1 day")
  .max(90, "Loan duration cannot exceed 90 days")
  .optional();

// Search validation schemas
export const searchQuerySchema = z
  .string()
  .min(1, "Search query is required")
  .max(200, "Search query must be less than 200 characters");

// Email validation
export const emailSchema = z
  .string()
  .email("Must be a valid email address")
  .max(255, "Email must be less than 255 characters");

// Name validation
export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(200, "Name must be less than 200 characters")
  .optional();

// Combined schemas for common operations
export const createBookSchema = z.object({
  title: bookTitleSchema,
  description: bookDescriptionSchema,
  isbn: isbnSchema,
  isbn13: isbn13Schema,
  publishedYear: publishedYearSchema,
  publisher: z.string().max(200).optional(),
  language: z.string().max(50).default("en").optional(),
  pageCount: pageCountSchema,
  coverImage: urlSchema,
  authorIds: z.array(z.string().min(1)).min(1, "At least one author is required"),
  categoryIds: z.array(z.string().min(1)).optional(),
});

export const updateBookSchema = createBookSchema.partial().extend({
  id: z.string().min(1),
});

export const createAuthorSchema = z.object({
  name: authorNameSchema,
  bio: authorBioSchema,
});

export const updateAuthorSchema = createAuthorSchema.partial().extend({
  id: z.string().min(1),
});

export const createCategorySchema = z.object({
  name: categoryNameSchema,
  description: categoryDescriptionSchema,
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().min(1),
});

export const createBookCopySchema = z.object({
  code: copyCodeSchema,
  bookId: z.string().min(1, "Book ID is required"),
  status: z.enum(["AVAILABLE", "BORROWED", "LOST", "DAMAGED", "MAINTENANCE"]).default("AVAILABLE").optional(),
  location: locationSchema,
  notes: notesSchema,
});

export const updateBookCopySchema = createBookCopySchema.partial().extend({
  id: z.string().min(1),
});

/**
 * Validate and sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  return query.trim().slice(0, 200);
}

/**
 * Validate ISBN format
 */
export function validateISBN(isbn: string): boolean {
  // Remove hyphens
  const cleaned = isbn.replace(/-/g, "");
  
  // Check if it's ISBN-10 (10 digits) or ISBN-13 (13 digits)
  if (cleaned.length === 10) {
    return /^[0-9]{9}[0-9X]$/.test(cleaned);
  }
  if (cleaned.length === 13) {
    return /^[0-9]{13}$/.test(cleaned);
  }
  
  return false;
}
