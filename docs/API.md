# Library Management System API Documentation

## Overview

This is a comprehensive REST-like API built with tRPC for managing a library system. All endpoints are type-safe and use cursor-based pagination.

## Base URL

All API calls are made through tRPC endpoints. The API is accessible at `/api/trpc`.

## Authentication

Most endpoints require authentication. Users have three roles:
- **MEMBER**: Regular library member
- **LIBRARIAN**: Can manage books, loans, and reservations
- **ADMIN**: Full access, can manage users and roles

## Pagination

Most list endpoints support cursor-based pagination:

```typescript
{
  limit?: number;        // Default: 20, Max: 100
  cursor?: string;       // Cursor for next page
  direction?: "forward" | "backward";  // Default: "forward"
}
```

Response format:
```typescript
{
  items: T[];
  nextCursor: string | null;
  previousCursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

## Error Handling

All errors follow a consistent format:

```typescript
{
  code: "NOT_FOUND" | "CONFLICT" | "BAD_REQUEST" | "FORBIDDEN" | "UNAUTHORIZED";
  message: string;
}
```

## Routers

### 1. Book Router (`book`)

#### `getAll`
Get all books with pagination.

**Access**: Public  
**Input**: `cursorPaginationSchema` (optional)

#### `getById`
Get a specific book by ID.

**Access**: Public  
**Input**: `{ id: string }`

#### `search`
Search books by title, ISBN, or author.

**Access**: Public  
**Input**: `{ query: string, ...cursorPaginationSchema }`

#### `create`
Create a new book.

**Access**: Librarian  
**Input**: 
```typescript
{
  title: string;
  description?: string;
  isbn?: string;
  isbn13?: string;
  publishedYear?: number;
  publisher?: string;
  language?: string;
  pageCount?: number;
  coverImage?: string;
  authorIds: string[];      // Required, min 1
  categoryIds?: string[];
}
```

#### `update`
Update a book.

**Access**: Librarian  
**Input**: Same as `create` with `id: string` added

#### `delete`
Delete a book.

**Access**: Librarian  
**Input**: `{ id: string }`

---

### 2. Author Router (`author`)

#### `getAll`
Get all authors with pagination.

**Access**: Public

#### `getById`
Get a specific author by ID.

**Access**: Public  
**Input**: `{ id: string }`

#### `search`
Search authors by name.

**Access**: Public  
**Input**: `{ query: string, ...cursorPaginationSchema }`

#### `create`
Create a new author.

**Access**: Librarian  
**Input**: 
```typescript
{
  name: string;
  bio?: string;
}
```

#### `update`
Update an author.

**Access**: Librarian  
**Input**: `{ id: string, name?: string, bio?: string }`

#### `delete`
Delete an author.

**Access**: Librarian  
**Input**: `{ id: string }`

---

### 3. BookCopy Router (`bookCopy`)

#### `getAll`
Get all book copies with pagination.

**Access**: Public

#### `getById`
Get a specific copy by ID.

**Access**: Public  
**Input**: `{ id: string }`

#### `getByBookId`
Get all copies of a specific book.

**Access**: Public  
**Input**: `{ bookId: string, ...cursorPaginationSchema }`

#### `getByStatus`
Get copies filtered by status.

**Access**: Public  
**Input**: `{ status: "AVAILABLE" | "BORROWED" | "LOST" | "DAMAGED" | "MAINTENANCE", ...cursorPaginationSchema }`

#### `create`
Create a new book copy.

**Access**: Librarian  
**Input**: 
```typescript
{
  code: string;           // Unique identifier
  bookId: string;
  status?: CopyStatus;    // Default: AVAILABLE
  location?: string;
  notes?: string;
}
```

#### `update`
Update a book copy.

**Access**: Librarian  
**Input**: `{ id: string, code?: string, status?: CopyStatus, location?: string, notes?: string }`

#### `delete`
Delete a book copy (only if not currently borrowed).

**Access**: Librarian  
**Input**: `{ id: string }`

#### `bulkCreate`
Create multiple copies at once.

**Access**: Librarian  
**Input**: 
```typescript
{
  bookId: string;
  count: number;          // 1-100
  codePrefix?: string;
  location?: string;
}
```

---

### 4. Loan Router (`loan`)

#### `getAll`
Get all loans (librarian view).

**Access**: Librarian

#### `getActive`
Get active (not returned) loans.

**Access**: Public  
**Input**: `{ userId?: string, ...cursorPaginationSchema }`

#### `getOverdue`
Get overdue loans.

**Access**: Librarian

#### `getMyLoans`
Get current user's loans.

**Access**: Protected  
**Input**: `{ includeReturned?: boolean, ...cursorPaginationSchema }`

#### `getById`
Get a specific loan by ID.

**Access**: Public  
**Input**: `{ id: string }`

#### `borrow`
Borrow a book.

**Access**: Protected  
**Input**: 
```typescript
{
  bookCopyId: string;
  loanDurationDays?: number;  // Default: 14, Max: 90
  userId?: string;            // Librarian can borrow for others
}
```

**Validation**:
- Copy must be available
- User must not exceed max active loans (5)
- Copy status automatically updated to BORROWED

#### `return`
Return a borrowed book.

**Access**: Librarian  
**Input**: `{ loanId: string }`

**Effects**:
- Sets `returnedAt` timestamp
- Updates copy status to AVAILABLE

#### `renew`
Renew a loan.

**Access**: Protected  
**Input**: `{ loanId: string }`

**Validation**:
- Loan must not be returned
- Must not exceed max renewals (2)
- Extends due date by renewal period (14 days)

---

### 5. Reservation Router (`reservation`)

#### `getAll`
Get all reservations.

**Access**: Librarian

#### `getPending`
Get pending reservations (queue).

**Access**: Librarian

#### `getMyReservations`
Get current user's reservations.

**Access**: Protected  
**Input**: `{ status?: ReservationStatus, ...cursorPaginationSchema }`

#### `getByBookId`
Get reservations for a specific book.

**Access**: Public  
**Input**: `{ bookId: string, ...cursorPaginationSchema }`

#### `getById`
Get a specific reservation.

**Access**: Public  
**Input**: `{ id: string }`

#### `create`
Place a reservation (hold).

**Access**: Protected  
**Input**: `{ bookId: string }`

**Validation**:
- Book must not have available copies
- User must not already have pending reservation for this book
- User must not exceed max pending reservations (5)
- Auto-expires after 7 days

#### `cancel`
Cancel a reservation.

**Access**: Protected  
**Input**: `{ id: string }`

#### `fulfill`
Fulfill a reservation when copy becomes available.

**Access**: Librarian  
**Input**: `{ id: string, bookCopyId: string }`

#### `expireOld`
Mark expired reservations (can be run as cron job).

**Access**: Librarian

---

### 6. Fine Router (`fine`)

#### `getAll`
Get all fines.

**Access**: Librarian

#### `getUnpaid`
Get unpaid fines.

**Access**: Public  
**Input**: `{ userId?: string, ...cursorPaginationSchema }`

#### `getMyFines`
Get current user's fines.

**Access**: Protected  
**Input**: `{ paid?: boolean, ...cursorPaginationSchema }`

#### `getById`
Get a specific fine.

**Access**: Public  
**Input**: `{ id: string }`

#### `create`
Create a fine for an overdue loan.

**Access**: Librarian  
**Input**: 
```typescript
{
  loanId: string;
  amount?: number;  // Auto-calculated if not provided
}
```

**Fine Calculation**:
- $0.50 per day overdue
- Maximum fine: $50.00
- Grace period: 0 days

#### `pay`
Mark a fine as paid.

**Access**: Protected  
**Input**: `{ id: string }`

#### `createForOverdue`
Auto-create fines for all overdue loans (cron job).

**Access**: Librarian

#### `update`
Update fine amount (before payment).

**Access**: Librarian  
**Input**: `{ id: string, amount: number }`

---

### 7. Category Router (`category`)

#### `getAll`
Get all categories.

**Access**: Public

#### `getById`
Get a specific category.

**Access**: Public  
**Input**: `{ id: string }`

#### `search`
Search categories.

**Access**: Public  
**Input**: `{ query: string, ...cursorPaginationSchema }`

#### `create`
Create a category.

**Access**: Librarian  
**Input**: 
```typescript
{
  name: string;        // Max 100 chars, unique
  description?: string; // Max 500 chars
}
```

#### `update`
Update a category.

**Access**: Librarian  
**Input**: `{ id: string, name?: string, description?: string }`

#### `delete`
Delete a category (only if no books assigned).

**Access**: Librarian  
**Input**: `{ id: string }`

#### `getBooks`
Get books in a category.

**Access**: Public  
**Input**: `{ categoryId: string, ...cursorPaginationSchema }`

---

### 8. User Router (`user`)

#### `getAll`
Get all users.

**Access**: Librarian

#### `getById`
Get a specific user.

**Access**: Public (librarian or own profile)

#### `getMe`
Get current user's profile.

**Access**: Protected

#### `getActivity`
Get user's activity (loans, reservations, fines).

**Access**: Protected  
**Input**: `{ userId?: string }` (librarian can view any user)

#### `updateRole`
Update user role.

**Access**: Admin  
**Input**: `{ userId: string, role: "MEMBER" | "LIBRARIAN" | "ADMIN" }`

#### `search`
Search users.

**Access**: Librarian  
**Input**: `{ query: string, ...cursorPaginationSchema }`

#### `getStats`
Get user statistics.

**Access**: Protected  
**Input**: `{ userId?: string }` (librarian can view any user)

---

### 9. Search Router (`search`)

#### `global`
Advanced global search across books, authors, and categories.

**Access**: Public  
**Input**: 
```typescript
{
  query: string;
  filters?: {
    availableOnly?: boolean;
    categoryIds?: string[];
    authorIds?: string[];
    publishedYearMin?: number;
    publishedYearMax?: number;
  };
  sortBy?: "relevance" | "title" | "author" | "year" | "created";
  sortOrder?: "asc" | "desc";
  ...cursorPaginationSchema
}
```

#### `books`
Search books with filters.

**Access**: Public  
**Input**: 
```typescript
{
  query?: string;
  filters?: {
    availableOnly?: boolean;
    categoryIds?: string[];
    authorIds?: string[];
    hasAvailableCopies?: boolean;
  };
  ...cursorPaginationSchema
}
```

#### `authors`
Search authors.

**Access**: Public  
**Input**: `{ query?: string, ...cursorPaginationSchema }`

#### `suggestions`
Get search suggestions/autocomplete.

**Access**: Public  
**Input**: `{ query: string, limit?: number }` (max 10)

---

### 10. Stats Router (`stats`)

#### `getOverview`
Get overall library statistics.

**Access**: Librarian

**Returns**:
```typescript
{
  books: { total, copies: { total, available, borrowed } };
  authors: { total };
  users: { total };
  loans: { total, active, overdue };
  reservations: { total, pending };
  fines: { total, unpaid, totalAmount, unpaidAmount };
}
```

#### `getPopularBooks`
Get most popular books (most borrowed).

**Access**: Librarian  
**Input**: `{ limit?: number }` (default: 10, max: 50)

#### `getRecentActivity`
Get recent library activity.

**Access**: Librarian  
**Input**: `{ limit?: number }` (default: 20, max: 50)

#### `getOverdueReport`
Get detailed overdue report.

**Access**: Librarian

#### `getCategoryDistribution`
Get book distribution by category.

**Access**: Librarian

#### `getLoanTrends`
Get loan trends for last 12 months.

**Access**: Librarian

---

## Configuration Constants

### Loan Configuration
- Default loan duration: 14 days
- Max renewals: 2
- Renewal duration: 14 days
- Max active loans per user: 5

### Fine Configuration
- Fine per day: $0.50
- Maximum fine: $50.00
- Grace period: 0 days

### Reservation Configuration
- Expiration days: 7
- Max pending reservations: 5

### Pagination Configuration
- Default limit: 20
- Maximum limit: 100
- Minimum limit: 1

---

## Example Usage

### Borrow a Book
```typescript
await trpc.loan.borrow.mutate({
  bookCopyId: "copy-123",
  loanDurationDays: 14
});
```

### Search Books
```typescript
await trpc.search.global.query({
  query: "Harry Potter",
  filters: {
    availableOnly: true,
    categoryIds: ["fantasy-id"]
  },
  sortBy: "title",
  limit: 20
});
```

### Get User Statistics
```typescript
await trpc.user.getStats.query({
  userId: "user-123" // Optional, defaults to current user
});
```

---

## Notes

- All timestamps are in ISO 8601 format
- All IDs are CUID strings
- Status enums are case-sensitive
- ISBN validation supports both ISBN-10 and ISBN-13 formats
- Copy codes must be unique and uppercase alphanumeric

