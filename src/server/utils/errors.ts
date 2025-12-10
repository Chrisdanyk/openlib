import { TRPCError } from "@trpc/server";

/**
 * Custom error codes and messages for the library system
 */
export const LibraryErrors = {
  NOT_FOUND: {
    BOOK: "Book not found",
    AUTHOR: "Author not found",
    COPY: "Book copy not found",
    LOAN: "Loan not found",
    RESERVATION: "Reservation not found",
    FINE: "Fine not found",
    USER: "User not found",
    CATEGORY: "Category not found",
  },
  CONFLICT: {
    DUPLICATE_CODE: "A copy with this code already exists",
    DUPLICATE_CATEGORY: "A category with this name already exists",
    DUPLICATE_RESERVATION: "You already have a pending reservation for this book",
    EXISTING_FINE: "A fine already exists for this loan",
    COPY_BORROWED: "This copy is already borrowed",
  },
  BAD_REQUEST: {
    COPY_NOT_AVAILABLE: "Book copy is not available",
    BOOK_HAS_COPIES: "This book has available copies. Please borrow directly.",
    LOAN_RETURNED: "This book has already been returned",
    LOAN_NOT_RETURNED: "Cannot create fine for a returned loan",
    FINE_PAID: "This fine has already been paid",
    MAX_LOANS: "Maximum number of active loans reached",
    MAX_RENEWALS: "Maximum number of renewals reached",
    MAX_RESERVATIONS: "Maximum number of pending reservations reached",
    CATEGORY_HAS_BOOKS: "Cannot delete category with books",
    CANNOT_UPDATE_PAID_FINE: "Cannot update a paid fine",
    CANNOT_CHANGE_OWN_ROLE: "You cannot change your own role",
    NOT_OVERDUE: "Loan is not overdue or within grace period",
  },
  FORBIDDEN: {
    NOT_OWNER: "You can only access your own resources",
    NOT_LIBRARIAN: "Only librarians and admins can access this resource",
    NOT_ADMIN: "Only admins can access this resource",
    BORROW_FOR_OTHERS: "Only librarians can borrow books for other users",
  },
} as const;

/**
 * Helper function to create standardized NOT_FOUND errors
 */
export function createNotFoundError(
  resource: keyof typeof LibraryErrors.NOT_FOUND,
): TRPCError {
  return new TRPCError({
    code: "NOT_FOUND",
    message: LibraryErrors.NOT_FOUND[resource],
  });
}

/**
 * Helper function to create standardized CONFLICT errors
 */
export function createConflictError(
  resource: keyof typeof LibraryErrors.CONFLICT,
): TRPCError {
  return new TRPCError({
    code: "CONFLICT",
    message: LibraryErrors.CONFLICT[resource],
  });
}

/**
 * Helper function to create standardized BAD_REQUEST errors
 */
export function createBadRequestError(
  resource: keyof typeof LibraryErrors.BAD_REQUEST,
): TRPCError {
  return new TRPCError({
    code: "BAD_REQUEST",
    message: LibraryErrors.BAD_REQUEST[resource],
  });
}

/**
 * Helper function to create standardized FORBIDDEN errors
 */
export function createForbiddenError(
  resource: keyof typeof LibraryErrors.FORBIDDEN,
): TRPCError {
  return new TRPCError({
    code: "FORBIDDEN",
    message: LibraryErrors.FORBIDDEN[resource],
  });
}

/**
 * Validate that a resource exists, throw NOT_FOUND if it doesn't
 */
export async function validateResourceExists<T>(
  resource: T | null,
  errorType: keyof typeof LibraryErrors.NOT_FOUND,
): Promise<T> {
  if (!resource) {
    throw createNotFoundError(errorType);
  }
  return resource;
}
