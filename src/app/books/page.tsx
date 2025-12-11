"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { BookCard } from "~/components/shared/BookCard";
import { BookCardSkeleton } from "~/components/shared/BookCardSkeleton";
import { PublicLayout } from "~/components/layout/PublicLayout";
import { api } from "~/trpc/react";

export default function BooksPage() {
  const [search, setSearch] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [availableFilter, setAvailableFilter] = useState("");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const limit = 12;

  // Get authors for filter
  const { data: authorsData } = api.author.getAll.useQuery({
    limit: 100,
    cursor: undefined,
  });

  // Get books
  const { data: booksData, isLoading } = api.search.books.useQuery(
    {
      query: search || undefined,
      limit,
      cursor,
      filters: {
        availableOnly: availableFilter === "available",
        authorIds: authorFilter && authorFilter !== "all" ? [authorFilter] : undefined,
      },
    },
    { enabled: true }
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    setCursor(undefined);
  };

  const clearFilters = () => {
    setAuthorFilter("");
    setAvailableFilter("");
    setSearch("");
    setCursor(undefined);
  };

  return (
    <PublicLayout>
      <div className="container px-4 md:px-6 py-12">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold">Browse Books</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our collection of books. Find your next great read.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by title, author, or ISBN..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={authorFilter} onValueChange={setAuthorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All authors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All authors</SelectItem>
                {authorsData?.items.map((author) => (
                  <SelectItem key={author.id} value={author.id}>
                    {author.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={availableFilter} onValueChange={setAvailableFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All availability</SelectItem>
                <SelectItem value="available">Available only</SelectItem>
              </SelectContent>
            </Select>
            {(authorFilter || availableFilter || search) && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : booksData && booksData.items.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {booksData.items.map((book) => (
                <BookCard
                  key={book.id}
                  book={{
                    id: book.id,
                    title: book.title,
                    coverImage: book.coverImage,
                    authors: book.authors.map((a) => ({ id: a.author.id, name: a.author.name })),
                    publishedYear: book.publishedYear,
                    availableCopies: book.copies.length,
                    totalCopies: book._count?.copies ?? book.copies.length,
                  }}
                />
              ))}
            </div>

            {/* Pagination */}
            {(booksData.nextCursor || booksData.previousCursor) && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  onClick={() => setCursor(booksData.previousCursor?.id)}
                  disabled={!booksData.previousCursor}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  {booksData.items.length} books
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCursor(booksData.nextCursor?.id)}
                  disabled={!booksData.nextCursor}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              No books found. Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

