"use client";

import { useState } from "react";
import { PageHeader } from "~/components/shared/PageHeader";
import { DataTable, Column } from "~/components/shared/DataTable";
import { StatusBadge } from "~/components/shared/StatusBadge";
import { AppLayout } from "~/components/layout/AppLayout";
import { mockCopies } from "~/lib/mock-data";

type Copy = typeof mockCopies[0];

export default function CopiesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const filteredCopies = mockCopies.filter((copy) =>
    search
      ? copy.book.title.toLowerCase().includes(search.toLowerCase()) ||
        copy.code.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const paginatedCopies = filteredCopies.slice((page - 1) * limit, page * limit);
  const total = filteredCopies.length;
  const pageCount = Math.ceil(total / limit);

  const columns: Column<Copy>[] = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      cell: (copy) => (
        <span className="font-mono font-medium">{copy.code}</span>
      ),
    },
    {
      key: "book",
      header: "Book",
      cell: (copy) => (
        <p className="font-medium">{copy.book.title}</p>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (copy) => <StatusBadge status={copy.status} />,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Book Copies"
          description="Manage physical book copies"
        />

        <DataTable
          columns={columns}
          data={paginatedCopies}
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
          searchPlaceholder="Search by code or book title..."
          emptyMessage="No copies found."
        />
      </div>
    </AppLayout>
  );
}
