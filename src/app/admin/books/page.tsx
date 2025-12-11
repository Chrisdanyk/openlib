"use client";

import { useState } from "react";
import { PageHeader } from "~/components/shared/PageHeader";
import { DataTable, Column } from "~/components/shared/DataTable";
import { StatusBadge } from "~/components/shared/StatusBadge";
import { AppLayout } from "~/components/layout/AppLayout";
import { Button } from "~/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import Link from "next/link";
import { mockBooks } from "~/lib/mock-data";
import { format } from "date-fns";

type Book = typeof mockBooks[0];

export default function AdminBooksPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const filteredBooks = mockBooks.filter((book) =>
    search ? book.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  const paginatedBooks = filteredBooks.slice((page - 1) * limit, page * limit);
  const total = filteredBooks.length;
  const pageCount = Math.ceil(total / limit);

  const columns: Column<Book>[] = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      cell: (book) => (
        <div className="flex items-center gap-3">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-10 h-14 object-cover rounded"
            />
          ) : (
            <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium">{book.title}</p>
            <p className="text-xs text-muted-foreground">
              {book.authors.map((a) => a.name).join(", ")}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "copies",
      header: "Copies",
      cell: (book) => (
        <div className="text-sm">
          <span className="text-success font-medium">{book.availableCopies}</span>
          <span className="text-muted-foreground"> / {book.totalCopies}</span>
        </div>
      ),
    },
    {
      key: "availability",
      header: "Status",
      cell: (book) => (
        <StatusBadge
          status={book.availableCopies > 0 ? "AVAILABLE" : "BORROWED"}
        />
      ),
    },
    {
      key: "createdAt",
      header: "Added",
      sortable: true,
      cell: (book) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(book.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      cell: (book) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/books/${book.id}`}>View</Link>
        </Button>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Books"
          description="Manage your library's book collection"
          actions={
            <Button asChild>
              <Link href="/admin/books/add">
                <Plus className="w-4 h-4 mr-2" />
                Add Book
              </Link>
            </Button>
          }
        />

        <DataTable
          columns={columns}
          data={paginatedBooks}
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
          searchPlaceholder="Search books by title, author, or ISBN..."
          emptyMessage="No books found. Add your first book to get started."
        />
      </div>
    </AppLayout>
  );
}
