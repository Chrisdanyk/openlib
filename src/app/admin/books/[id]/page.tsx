"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, User, Edit } from "lucide-react";
import { PageHeader } from "~/components/shared/PageHeader";
import { StatusBadge } from "~/components/shared/StatusBadge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { AppLayout } from "~/components/layout/AppLayout";
import { mockBooks } from "~/lib/mock-data";
import { format } from "date-fns";

export default function BookDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;

  // For now, use mock data - replace with API call later
  const book = mockBooks.find((b) => b.id === bookId);

  if (!book) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Book not found</h2>
          <Button asChild>
            <Link href="/admin/books">Back to Books</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/books">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <PageHeader
            title={book.title}
            description="Book details and information"
            actions={
              <Button asChild>
                <Link href={`/admin/books/${bookId}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Book
                </Link>
              </Button>
            }
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Book Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Book Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-6">
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-32 h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-32 h-48 bg-muted rounded-lg flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h2 className="text-2xl font-bold">{book.title}</h2>
                      <p className="text-muted-foreground mt-1">
                        by {book.authors.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                    {book.description && (
                      <p className="text-sm text-muted-foreground">{book.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {book.categories.map((cat) => (
                        <StatusBadge key={cat.id} status="AVAILABLE" className="bg-secondary/10 text-secondary border-secondary/20">
                          {cat.name}
                        </StatusBadge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {book.isbn && (
                    <div>
                      <span className="text-muted-foreground">ISBN:</span>
                      <p className="font-medium">{book.isbn}</p>
                    </div>
                  )}
                  {book.publishedYear && (
                    <div>
                      <span className="text-muted-foreground">Published Year:</span>
                      <p className="font-medium">{book.publishedYear}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Total Copies:</span>
                    <p className="font-medium">{book.totalCopies}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Available Copies:</span>
                    <p className="font-medium text-success">{book.availableCopies}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Added:</span>
                    <p className="font-medium">
                      {format(new Date(book.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Copies
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Loans
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  View Reservations
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

