"use client";

import { useState } from "react";
import { PageHeader } from "~/components/shared/PageHeader";
import { DataTable, Column } from "~/components/shared/DataTable";
import { StatusBadge } from "~/components/shared/StatusBadge";
import { AppLayout } from "~/components/layout/AppLayout";
import { Button } from "~/components/ui/button";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { mockLoans } from "~/lib/mock-data";
import { format, isAfter } from "date-fns";

type Loan = typeof mockLoans[0];

export default function LoansPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const filteredLoans = mockLoans.filter((loan) =>
    search
      ? loan.bookCopy.book.title.toLowerCase().includes(search.toLowerCase()) ||
        loan.user.name.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const paginatedLoans = filteredLoans.slice((page - 1) * limit, page * limit);
  const total = filteredLoans.length;
  const pageCount = Math.ceil(total / limit);

  const getLoanStatus = (loan: Loan): "ACTIVE" | "OVERDUE" | "RETURNED" => {
    if (loan.returnedAt) return "RETURNED";
    if (isAfter(new Date(), new Date(loan.dueAt))) return "OVERDUE";
    return "ACTIVE";
  };

  const columns: Column<Loan>[] = [
    {
      key: "book",
      header: "Book",
      cell: (loan) => (
        <div>
          <p className="font-medium">{loan.bookCopy.book.title}</p>
          <p className="text-xs text-muted-foreground font-mono">
            Copy: {loan.bookCopy.code}
          </p>
        </div>
      ),
    },
    {
      key: "user",
      header: "Borrower",
      cell: (loan) => (
        <div>
          <p className="font-medium">{loan.user.name}</p>
          <p className="text-xs text-muted-foreground">{loan.user.email}</p>
        </div>
      ),
    },
    {
      key: "borrowedAt",
      header: "Borrowed",
      sortable: true,
      cell: (loan) => (
        <span className="text-sm">
          {format(new Date(loan.borrowedAt), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "dueAt",
      header: "Due Date",
      sortable: true,
      cell: (loan) => {
        const isOverdue = !loan.returnedAt && isAfter(new Date(), new Date(loan.dueAt));
        return (
          <span className={`text-sm ${isOverdue ? "text-destructive font-medium" : ""}`}>
            {format(new Date(loan.dueAt), "MMM d, yyyy")}
            {isOverdue && <AlertTriangle className="inline-block w-4 h-4 ml-1" />}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (loan) => <StatusBadge status={getLoanStatus(loan)} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-32",
      cell: (loan) => (
        <div className="flex items-center gap-2">
          {!loan.returnedAt && (
            <Button variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-1" />
              Return
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Loans"
          description="Manage book loans and returns"
        />

        <DataTable
          columns={columns}
          data={paginatedLoans}
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
          searchPlaceholder="Search by book or borrower..."
          emptyMessage="No loans found."
        />
      </div>
    </AppLayout>
  );
}
