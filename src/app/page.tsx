"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BookOpen, Users, Clock, Search, Zap, CheckCircle, ArrowRight, LogIn } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent } from "~/components/ui/card";
import { BookCard } from "~/components/shared/BookCard";
import { AuthorCard } from "~/components/shared/AuthorCard";
import { PublicLayout } from "~/components/layout/PublicLayout";
import { api } from "~/trpc/react";
import { mockBooks, mockAuthors } from "~/lib/mock-data";

const features = [
  {
    icon: BookOpen,
    title: "Borrow Books",
    description: "Access thousands of books with instant borrowing",
  },
  {
    icon: Clock,
    title: "Track Your Loans",
    description: "Never miss a due date with smart reminders",
  },
  {
    icon: Users,
    title: "Search Authors",
    description: "Discover new authors and their complete works",
  },
  {
    icon: Search,
    title: "Smart Search",
    description: "Find books by title, author, or ISBN instantly",
  },
  {
    icon: Zap,
    title: "Instant Availability",
    description: "See real-time availability for every book",
  },
  {
    icon: CheckCircle,
    title: "Easy Reservations",
    description: "Reserve books and get notified when available",
  },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [booksPage, setBooksPage] = useState(1);
  const [authorsPage, setAuthorsPage] = useState(1);
  const limit = 4;

  // Featured books - using mock data for now
  const { data: booksData, isLoading: booksLoading } = api.book.getAll.useQuery(
    { limit, cursor: undefined },
    { retry: false }
  );
  
  // Featured authors - using mock data for now
  const { data: authorsData, isLoading: authorsLoading } = api.author.getAll.useQuery(
    { limit, cursor: undefined },
    { retry: false }
  );

  // Search
  const { data: searchBooksData, isLoading: searchBooksLoading } = api.search.books.useQuery(
    { query: searchQuery, limit: 6 },
    { enabled: searchQuery.length >= 1, retry: false }
  );

  const { data: searchAuthorsData, isLoading: searchAuthorsLoading } = api.search.authors.useQuery(
    { query: searchQuery, limit: 6 },
    { enabled: searchQuery.length >= 1, retry: false }
  );

  // Use mock data if API returns empty or fails
  const featuredBooks = booksData?.items && booksData.items.length > 0 
    ? booksData.items.map((book: any) => ({
        id: book.id,
        title: book.title,
        coverImage: book.coverImage,
        authors: book.authors?.map((ba: any) => ({ id: ba.author?.id || ba.id, name: ba.author?.name || ba.name })) || [],
        publishedYear: book.publishedYear,
        availableCopies: book.copies?.length || 0,
        totalCopies: book._count?.copies || book.copies?.length || 0,
      }))
    : mockBooks.slice(0, limit).map((book) => ({
        id: book.id,
        title: book.title,
        coverImage: book.coverImage || null,
        authors: book.authors.map((a) => ({ id: a.id, name: a.name })),
        publishedYear: book.publishedYear,
        availableCopies: book.availableCopies,
        totalCopies: book.totalCopies,
      }));
  
  const featuredAuthors = authorsData?.items && authorsData.items.length > 0
    ? authorsData.items.map((author: any) => ({
        id: author.id,
        name: author.name,
        bio: author.bio || null,
        bookCount: author._count?.books || 0,
      }))
    : mockAuthors.slice(0, limit).map((author) => ({
        id: author.id,
        name: author.name,
        bio: author.bio || null,
        bookCount: 0,
      }));
  // Use mock data for search results if API fails or returns empty
  const bookResults = searchBooksData?.items && searchBooksData.items.length > 0
    ? searchBooksData.items.map((book: any) => ({
        id: book.id,
        title: book.title,
        coverImage: book.coverImage || null,
        authors: book.authors?.map((ba: any) => ({
          id: ba.author?.id || ba.id,
          name: ba.author?.name || ba.name,
        })) || [],
        publishedYear: book.publishedYear || null,
        availableCopies: book.copies?.filter((c: any) => c.status === "AVAILABLE")?.length || 0,
        totalCopies: book._count?.copies || book.copies?.length || 0,
      }))
    : searchQuery.length >= 1
    ? mockBooks.filter((book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.authors.some((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (book.isbn && book.isbn.includes(searchQuery))
      ).map((book) => ({
        id: book.id,
        title: book.title,
        coverImage: book.coverImage || null,
        authors: book.authors.map((a) => ({ id: a.id, name: a.name })),
        publishedYear: book.publishedYear || null,
        availableCopies: book.availableCopies,
        totalCopies: book.totalCopies,
      }))
    : [];

  const authorResults = searchAuthorsData?.items && searchAuthorsData.items.length > 0
    ? searchAuthorsData.items.map((author: any) => ({
        id: author.id,
        name: author.name,
        bio: author.bio || null,
        bookCount: author._count?.books || 0,
      }))
    : searchQuery.length >= 1
    ? mockAuthors.filter((author) =>
        author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (author.bio && author.bio.toLowerCase().includes(searchQuery.toLowerCase()))
      ).map((author) => ({
        id: author.id,
        name: author.name,
        bio: author.bio || null,
        bookCount: 0,
      }))
    : [];

  const searchLoading = searchBooksLoading || searchAuthorsLoading;

  // Calculate pagination (simplified for now)
  const booksTotalPages = booksData?.nextCursor ? 2 : 1;
  const authorsTotalPages = authorsData?.nextCursor ? 2 : 1;

  return (
    <PublicLayout>
      <div className="flex flex-col">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 md:py-32">
          <div className="container px-4 md:px-6 relative">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Welcome to{" "}
                <span className="text-primary">Open Library</span>
          </h1>
              <p className="text-xl text-muted-foreground">
                Discover books. Explore authors. Borrow instantly.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/books">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Browse Books
                  </Link>
                </Button>
                {session ? (
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                ) : (
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/login">
                      <LogIn className="w-5 h-5 mr-2" />
                      Sign In
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Search Preview Section */}
        <section className="py-16 bg-card border-y border-border">
          <div className="container px-4 md:px-6">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold">Quick Search</h2>
              <p className="text-muted-foreground">
                Start typing to search books and authors
              </p>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by title, author, or ISBN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg"
                />
              </div>
            </div>

            {/* Search Results */}
            {searchQuery.length >= 1 && (
              <div className="mt-8">
                {(bookResults.length > 0 || authorResults.length > 0) ? (
                  <div className="space-y-8">
                    {bookResults.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Books</h3>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {bookResults.map((book) => (
                            <BookCard
                              key={book.id}
                              book={book}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {authorResults.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Authors</h3>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {authorResults.map((author) => (
                            <AuthorCard 
                              key={author.id} 
                              author={{
                                id: author.id,
                                name: author.name,
                                bio: author.bio,
                              }} 
                              bookCount={author.bookCount} 
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No results found for "{searchQuery}"
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">
                Everything You Need
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A complete library management experience designed for readers
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Books */}
        <section className="py-20 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold">Featured Books</h2>
                <p className="text-muted-foreground mt-1">
                  Popular titles from our collection
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/books">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
              </Button>
            </div>
            {booksLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {featuredBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                    />
                  ))}
                </div>
                {booksTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBooksPage((p) => Math.max(1, p - 1))}
                      disabled={booksPage <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
                      Page {booksPage} of {booksTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBooksPage((p) => Math.min(booksTotalPages, p + 1))}
                      disabled={booksPage >= booksTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Featured Authors */}
        <section className="py-20">
          <div className="container px-4 md:px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold">Featured Authors</h2>
                <p className="text-muted-foreground mt-1">
                  Discover talented writers and their works
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/authors">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
              </Button>
            </div>
            {authorsLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {featuredAuthors.map((author) => (
                    <AuthorCard 
                      key={author.id} 
                      author={{
                        id: author.id,
                        name: author.name,
                        bio: author.bio,
                      }} 
                      bookCount={author.bookCount} 
                    />
                  ))}
                </div>
                {authorsTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAuthorsPage((p) => Math.max(1, p - 1))}
                      disabled={authorsPage <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
                      Page {authorsPage} of {authorsTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAuthorsPage((p) => Math.min(authorsTotalPages, p + 1))}
                      disabled={authorsPage >= authorsTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary to-primary/80">
          <div className="container px-4 md:px-6 text-center">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
                Ready to Start Reading?
              </h2>
              <p className="text-lg text-primary-foreground/80">
                Join thousands of readers and get access to our entire collection.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/register">Create Free Account</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                  <Link href="/books">Browse First</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        </div>
    </PublicLayout>
  );
}
