"use client";

import { useState } from "react";
import { PageHeader } from "~/components/shared/PageHeader";
import { type Column, DataTable } from "~/components/shared/DataTable";
import { AppLayout } from "~/components/layout/AppLayout";
import { Button } from "~/components/ui/button";
import { Plus, User, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

import { api } from "~/trpc/react";

type Author = {
  id: string;
  name: string;
  bio: string | null;
  books?: Array<{ book: { id: string; title: string } }>;
};

export default function AdminAuthorsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const { data: searchData, isLoading: searchLoading } = api.author.search.useQuery(
    { query: search, page, limit },
    { enabled: search.length > 0, retry: false }
  );

  const { data: authorsData, isLoading, error } = api.author.getAll.useQuery(
    { page, limit },
    { enabled: search.length === 0, retry: false }
  );

  const data = (search.length > 0 ? searchData : authorsData) ?? null;
  const isLoadingData = search.length > 0 ? searchLoading : isLoading;

  const authors = data?.results ?? [];
  const total = data?.items ?? 0;
  const pageCount = data?.pages ?? 1;

  const columns: Column<Author>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (author) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{author.name}</p>
            {author.bio && (
              <p className="text-xs text-muted-foreground line-clamp-1">{author.bio}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "bio",
      header: "Bio",
      cell: (author) => (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {author.bio ?? "-"}
        </p>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-32",
      cell: (author) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/authors/${author.id}/edit`}>
              <Edit className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Authors"
          description="Manage authors in your library"
          actions={
            <Button asChild>
              <Link href="/admin/authors/add">
                <Plus className="w-4 h-4 mr-2" />
                Add Author
              </Link>
            </Button>
          }
        />

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            <p className="font-medium">Error loading authors</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        )}

        <DataTable
          loading={isLoadingData}
          data={authors}
          columns={columns}
          total={total}
          page={page}
          pageCount={pageCount}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          onSearch={setSearch}
          searchPlaceholder="Search authors..."
        />
      </div>
    </AppLayout>
  );
}
