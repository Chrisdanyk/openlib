"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "~/components/shared/PageHeader";
import { Button } from "~/components/ui/button";
import { AppLayout } from "~/components/layout/AppLayout";
import { mockAuthors } from "~/lib/mock-data";

export default function EditAuthorPage() {
  const params = useParams();
  const authorId = params.id as string;

  const author = mockAuthors.find((a) => a.id === authorId);

  if (!author) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-2">Author not found</h2>
          <Button asChild>
            <Link href="/admin/authors">Back to Authors</Link>
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
            <Link href="/admin/authors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <PageHeader title={`Edit: ${author.name}`} />
        </div>

        <div className="text-center py-16 text-muted-foreground">
          Edit author form - Coming soon (will be implemented with API integration)
        </div>
      </div>
    </AppLayout>
  );
}

