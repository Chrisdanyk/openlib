// Mock data for development - will be replaced with real API calls later

export const mockBooks = [
  {
    id: "1",
    title: "1984",
    description: "A dystopian social science fiction novel",
    isbn: "0451524934",
    publishedYear: 1949,
    coverImage: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop",
    authors: [{ id: "1", name: "George Orwell" }],
    categories: [{ id: "1", name: "Fiction" }],
    totalCopies: 5,
    availableCopies: 2,
    createdAt: new Date("2023-01-01"),
  },
  {
    id: "2",
    title: "Pride and Prejudice",
    description: "A romantic novel of manners",
    isbn: "0141439513",
    publishedYear: 1813,
    coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop",
    authors: [{ id: "2", name: "Jane Austen" }],
    categories: [{ id: "2", name: "Romance" }],
    totalCopies: 4,
    availableCopies: 3,
    createdAt: new Date("2023-02-15"),
  },
  {
    id: "3",
    title: "The Great Gatsby",
    description: "A novel about the American dream",
    isbn: "0743273567",
    publishedYear: 1925,
    coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop",
    authors: [{ id: "3", name: "F. Scott Fitzgerald" }],
    categories: [{ id: "1", name: "Fiction" }],
    totalCopies: 3,
    availableCopies: 1,
    createdAt: new Date("2023-03-10"),
  },
];

export const mockAuthors = [
  { id: "1", name: "George Orwell", bio: "English novelist and essayist" },
  { id: "2", name: "Jane Austen", bio: "English novelist known for her six major novels" },
  { id: "3", name: "F. Scott Fitzgerald", bio: "American novelist and short story writer" },
  { id: "4", name: "Harper Lee", bio: "American novelist known for To Kill a Mockingbird" },
  { id: "5", name: "J.K. Rowling", bio: "British author, best known for Harry Potter" },
];

export const mockCategories = [
  { id: "1", name: "Fiction", description: "Literary fiction and novels" },
  { id: "2", name: "Romance", description: "Romantic fiction" },
  { id: "3", name: "Fantasy", description: "Fantasy literature" },
  { id: "4", name: "Science Fiction", description: "Science fiction novels" },
  { id: "5", name: "Mystery", description: "Mystery and thriller novels" },
];

export const mockLoans = [
  {
    id: "1",
    bookCopy: { book: { title: "1984" }, code: "COPY-001" },
    user: { name: "John Doe", email: "john@example.com" },
    borrowedAt: new Date("2024-01-15"),
    dueAt: new Date("2024-02-15"),
    returnedAt: null,
  },
  {
    id: "2",
    bookCopy: { book: { title: "Pride and Prejudice" }, code: "COPY-002" },
    user: { name: "Jane Smith", email: "jane@example.com" },
    borrowedAt: new Date("2024-01-20"),
    dueAt: new Date("2024-02-20"),
    returnedAt: null,
  },
];

export const mockReservations = [
  {
    id: "1",
    book: { title: "The Great Gatsby" },
    user: { name: "Bob Johnson", email: "bob@example.com" },
    reservedAt: new Date("2024-01-25"),
    status: "PENDING",
  },
];

export const mockUsers = [
  { id: "1", name: "John Doe", email: "john@example.com", role: "MEMBER" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", role: "MEMBER" },
  { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "LIBRARIAN" },
];

export const mockCopies = [
  { id: "1", code: "COPY-001", book: { title: "1984" }, status: "AVAILABLE" },
  { id: "2", code: "COPY-002", book: { title: "1984" }, status: "BORROWED" },
  { id: "3", code: "COPY-003", book: { title: "Pride and Prejudice" }, status: "AVAILABLE" },
];

