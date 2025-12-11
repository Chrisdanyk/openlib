import { AppLayout } from "~/components/layout/AppLayout";
import { PageHeader } from "~/components/shared/PageHeader";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Skeleton } from "~/components/ui/skeleton";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export default function AuthorsLoading() {
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

        <div className="table-container">
          {/* Header with search */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="relative w-64">
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Show</span>
              <Skeleton className="h-10 w-16" />
              <span>entries</span>
            </div>
          </div>

          {/* Table with skeleton rows */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Bio</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Footer with pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <Skeleton className="h-4 w-48" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9" />
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-9" />
                ))}
              </div>
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

