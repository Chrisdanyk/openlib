"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { AuthorCard } from "~/components/shared/AuthorCard";
import { PublicLayout } from "~/components/layout/PublicLayout";
import { api } from "~/trpc/react";

export default function AuthorsPage() {
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const limit = 12;

  // Get authors
  const { data: authorsData, isLoading } = api.search.authors.useQuery(
    {
      query: search || undefined,
      limit,
      cursor,
    },
    { enabled: true }
  );

  const filteredAuthors = authorsData?.items ?? [];
  const hasMore = !!authorsData?.nextCursor;

  return (
    <PublicLayout>
      <div className="container px-4 md:px-6 py-12">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold">Browse Authors</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover authors and explore their works
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search authors..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCursor(undefined);
              }}
              className="pl-10"
            />
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredAuthors.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAuthors.map((author) => (
                <AuthorCard
                  key={author.id}
                  author={author}
                  bookCount={author._count?.books ?? 0}
                />
              ))}
            </div>

            {/* Pagination */}
            {hasMore && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  onClick={() => setCursor(authorsData?.previousCursor?.id)}
                  disabled={!authorsData?.previousCursor}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  {filteredAuthors.length} authors
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCursor(authorsData?.nextCursor?.id)}
                  disabled={!hasMore}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              No authors found. Try a different search.
            </p>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

