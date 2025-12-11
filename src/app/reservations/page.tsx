"use client";

import { useState } from "react";
import { PageHeader } from "~/components/shared/PageHeader";
import { DataTable, Column } from "~/components/shared/DataTable";
import { StatusBadge } from "~/components/shared/StatusBadge";
import { AppLayout } from "~/components/layout/AppLayout";
import { mockReservations } from "~/lib/mock-data";
import { format } from "date-fns";

type Reservation = typeof mockReservations[0];

export default function ReservationsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const filteredReservations = mockReservations.filter((reservation) =>
    search
      ? reservation.book.title.toLowerCase().includes(search.toLowerCase()) ||
        reservation.user.name.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const paginatedReservations = filteredReservations.slice((page - 1) * limit, page * limit);
  const total = filteredReservations.length;
  const pageCount = Math.ceil(total / limit);

  const columns: Column<Reservation>[] = [
    {
      key: "book",
      header: "Book",
      cell: (reservation) => (
        <p className="font-medium">{reservation.book.title}</p>
      ),
    },
    {
      key: "user",
      header: "User",
      cell: (reservation) => (
        <div>
          <p className="font-medium">{reservation.user.name}</p>
          <p className="text-xs text-muted-foreground">{reservation.user.email}</p>
        </div>
      ),
    },
    {
      key: "reservedAt",
      header: "Reserved",
      sortable: true,
      cell: (reservation) => (
        <span className="text-sm">
          {format(new Date(reservation.reservedAt), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (reservation) => <StatusBadge status={reservation.status} />,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Reservations"
          description="Manage book reservations"
        />

        <DataTable
          columns={columns}
          data={paginatedReservations}
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
          searchPlaceholder="Search by book or user..."
          emptyMessage="No reservations found."
        />
      </div>
    </AppLayout>
  );
}
