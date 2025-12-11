"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, LogIn } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { StatusBadge } from "~/components/shared/StatusBadge";
import { PublicLayout } from "~/components/layout/PublicLayout";
import { useSession } from "next-auth/react";
import { mockBooks } from "~/lib/mock-data";
import { api } from "~/trpc/react";

export default function PublicBookDetailsPage() {
  const params = useParams();
  const { data: session } = useSession();
  const bookId = params.id as string;

  // Try API first, fallback to mock data
  const { data: bookData } = api.book.getById.useQuery(
    { id: bookId },
    { retry: false }
  );

  const book = bookData || mockBooks.find((b) => b.id === bookId);

  if (!book) {
    return (
      <PublicLayout>
        <div className="container px-4 md:px-6 py-12 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Book not found</h2>
          <Button asChild>
            <Link href="/books">Back to Books</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  // Normalize book data
  const normalizedBook = {
    id: book.id,
    title: book.title,
    description: book.description || null,
    isbn: book.isbn || null,
    publishedYear: book.publishedYear || null,
    coverImage: book.coverImage || null,
    authors: (book as any).authors?.map((ba: any) => ({
      id: ba.author?.id || ba.id,
      name: ba.author?.name || ba.name,
    })) || (book as any).authors || [],
    totalCopies: (book as any)._count?.copies || (book as any).totalCopies || 0,
    availableCopies: (book as any).copies?.filter((c: any) => c.status === "AVAILABLE")?.length || (book as any).availableCopies || 0,
  };

  return (
    <PublicLayout>
      <div className="container px-4 md:px-6 py-12">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/books">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Books
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Book Details */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-8">
                  {normalizedBook.coverImage ? (
                    <img
                      src={normalizedBook.coverImage}
                      alt={normalizedBook.title}
                      className="w-full md:w-48 h-64 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full md:w-48 h-64 bg-muted rounded-lg flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h1 className="text-3xl font-bold">{normalizedBook.title}</h1>
                      <p className="text-muted-foreground mt-2">
                        by {normalizedBook.authors.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                    {normalizedBook.description && (
                      <p className="text-sm text-muted-foreground">{normalizedBook.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      {normalizedBook.publishedYear && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{normalizedBook.publishedYear}</span>
                        </div>
                      )}
                      {normalizedBook.isbn && (
                        <div>
                          <span className="text-muted-foreground">ISBN: </span>
                          <span className="font-mono">{normalizedBook.isbn}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {normalizedBook.availableCopies > 0 ? (
                        <Badge className="bg-success text-success-foreground">
                          {normalizedBook.availableCopies} Available
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Unavailable</Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        ({normalizedBook.totalCopies} total copies)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {session ? (
                  <>
                    {normalizedBook.availableCopies > 0 ? (
                      <Button className="w-full">
                        Borrow Book
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full">
                        Reserve Book
                      </Button>
                    )}
                  </>
                ) : (
                  <Button asChild className="w-full">
                    <Link href="/login">
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In to Borrow
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

