"use client";

import { useState } from "react";
import { PageHeader } from "~/components/shared/PageHeader";
import { DataTable, Column } from "~/components/shared/DataTable";
import { StatusBadge } from "~/components/shared/StatusBadge";
import { AppLayout } from "~/components/layout/AppLayout";
import { mockUsers } from "~/lib/mock-data";

type User = typeof mockUsers[0];

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const filteredUsers = mockUsers.filter((user) =>
    search
      ? user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const paginatedUsers = filteredUsers.slice((page - 1) * limit, page * limit);
  const total = filteredUsers.length;
  const pageCount = Math.ceil(total / limit);

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (user) => (
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (user) => (
        <span className="text-sm">{user.email}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (user) => <StatusBadge status={user.role} />,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Users"
          description="Manage library users"
        />

        <DataTable
          columns={columns}
          data={paginatedUsers}
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
          searchPlaceholder="Search by name or email..."
          emptyMessage="No users found."
        />
      </div>
    </AppLayout>
  );
}
