"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, BookOpen } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { BookCard } from "~/components/shared/BookCard";
import { PublicLayout } from "~/components/layout/PublicLayout";
import { mockAuthors, mockBooks } from "~/lib/mock-data";
import { api } from "~/trpc/react";

export default function PublicAuthorDetailsPage() {
  const params = useParams();
  const authorId = params.id as string;

  // Try API first, fallback to mock data
  const { data: authorData } = api.author.getById.useQuery(
    { id: authorId },
    { retry: false }
  );

  const author = authorData || mockAuthors.find((a) => a.id === authorId);

  // Get books by this author
  const authorBooks = mockBooks.filter((book) =>
    book.authors.some((a) => a.id === authorId)
  );

  if (!author) {
    return (
      <PublicLayout>
        <div className="container px-4 md:px-6 py-12 text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Author not found</h2>
          <Button asChild>
            <Link href="/authors">Back to Authors</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container px-4 md:px-6 py-12">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/authors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Authors
          </Link>
        </Button>

        {/* Author Info */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-16 h-16 text-primary" />
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold">{author.name}</h1>
                {author.bio && (
                  <p className="text-muted-foreground mt-4 max-w-2xl">
                    {author.bio}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-4">
                  {authorBooks.length} book{authorBooks.length !== 1 ? "s" : ""} in our collection
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Author's Books */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Books by {author.name}</h2>
          {authorBooks.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {authorBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={{
                    id: book.id,
                    title: book.title,
                    coverImage: book.coverImage || null,
                    authors: book.authors.map((a) => ({ id: a.id, name: a.name })),
                    publishedYear: book.publishedYear || null,
                    availableCopies: book.availableCopies,
                    totalCopies: book.totalCopies,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No books found for this author.</p>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}

