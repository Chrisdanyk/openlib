"use client";

import { useState } from "react";
import { PageHeader } from "~/components/shared/PageHeader";
import { DataTable, Column } from "~/components/shared/DataTable";
import { AppLayout } from "~/components/layout/AppLayout";
import { Button } from "~/components/ui/button";
import { Plus, Tag } from "lucide-react";
import Link from "next/link";
import { mockCategories } from "~/lib/mock-data";

type Category = typeof mockCategories[0];

export default function AdminCategoriesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const filteredCategories = mockCategories.filter((category) =>
    search
      ? category.name.toLowerCase().includes(search.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(search.toLowerCase()))
      : true
  );

  const paginatedCategories = filteredCategories.slice((page - 1) * limit, page * limit);
  const total = filteredCategories.length;
  const pageCount = Math.ceil(total / limit);

  const columns: Column<Category>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (category) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Tag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{category.name}</p>
            {category.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">{category.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (category) => (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {category.description || "-"}
        </p>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Categories"
          description="Manage book categories"
          actions={
            <Button asChild>
              <Link href="/admin/categories/add">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Link>
            </Button>
          }
        />

        <DataTable
          data={paginatedCategories}
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
          searchPlaceholder="Search categories..."
        />
      </div>
    </AppLayout>
  );
}
