"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "~/components/shared/PageHeader";
import { Button } from "~/components/ui/button";
import { AppLayout } from "~/components/layout/AppLayout";
import { mockBooks } from "~/lib/mock-data";

export default function EditBookPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;

  const book = mockBooks.find((b) => b.id === bookId);

  if (!book) {
    return (
      <AppLayout>
        <div className="text-center py-16">
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
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/books/${bookId}`}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <PageHeader title={`Edit: ${book.title}`} />
        </div>

        <div className="text-center py-16 text-muted-foreground">
          Edit book form - Coming soon (will be implemented with API integration)
        </div>
      </div>
    </AppLayout>
  );
}

