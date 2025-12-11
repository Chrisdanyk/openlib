"use client";

import { User, Mail, Calendar, BookMarked, Clock, Edit } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "~/components/shared/PageHeader";
import { StatusBadge } from "~/components/shared/StatusBadge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { AppLayout } from "~/components/layout/AppLayout";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { format, isAfter } from "date-fns";

export default function ProfilePage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data: userData, isLoading: userLoading } = api.user.getById.useQuery(
    { id: userId ?? "" },
    { enabled: !!userId }
  );

  const { data: loansData, isLoading: loansLoading } = api.loan.getMyLoans.useQuery(
    { includeReturned: true },
    { enabled: !!userId }
  );

  const { data: reservationsData, isLoading: reservationsLoading } = api.reservation.getMyReservations.useQuery(
    undefined,
    { enabled: !!userId }
  );

  const loans = loansData?.items ?? [];
  const reservations = reservationsData?.items ?? [];

  const loading = userLoading || loansLoading || reservationsLoading;

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getLoanStatus = (loan: { returnedAt: Date | null; dueAt: Date }) => {
    if (loan.returnedAt) return "RETURNED";
    if (isAfter(new Date(), new Date(loan.dueAt))) return "OVERDUE";
    return "ACTIVE";
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
        </div>
      </AppLayout>
    );
  }

  if (!userData || !session) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">User not found</h2>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const activeLoans = loans.filter((l) => !l.returnedAt);
  const pendingReservations = reservations.filter((r) => r.status === "PENDING");

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="My Profile"
          description="View and manage your account information"
          actions={
            <Button asChild>
              <Link href="/profile/edit">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* User Info Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src={session.user.image || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {getInitials(session.user.name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">{session.user.name || "Unnamed User"}</h2>
                <p className="text-muted-foreground">{session.user.email}</p>
                <div className="mt-2">
                  <StatusBadge status={userData.role} />
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="ml-auto font-medium">{session.user.email}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Joined:</span>
                  <span className="ml-auto font-medium">
                    {format(new Date(userData.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <BookMarked className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Active loans:</span>
                  <span className="ml-auto font-medium">{activeLoans.length}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Reservations:</span>
                  <span className="ml-auto font-medium">{pendingReservations.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loans & Reservations */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="loans" className="w-full">
              <TabsList>
                <TabsTrigger value="loans">My Loans ({loans.length})</TabsTrigger>
                <TabsTrigger value="reservations">
                  Reservations ({reservations.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="loans" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Loan History</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loans.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Book</TableHead>
                            <TableHead>Borrowed</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loans.map((loan) => {
                            const status = getLoanStatus({
                              returnedAt: loan.returnedAt,
                              dueAt: loan.dueAt,
                            });
                            return (
                              <TableRow key={loan.id}>
                                <TableCell className="font-medium">
                                  {loan.bookCopy?.book?.title || "Unknown"}
                                </TableCell>
                                <TableCell>
                                  {format(new Date(loan.borrowedAt), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell>
                                  {format(new Date(loan.dueAt), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={status} />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        No loans found
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reservations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Reservations</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {reservations.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Book</TableHead>
                            <TableHead>Reserved</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reservations.map((reservation) => (
                            <TableRow key={reservation.id}>
                              <TableCell className="font-medium">
                                {reservation.book.title}
                              </TableCell>
                              <TableCell>
                                {format(
                                  new Date(reservation.reservedAt),
                                  "MMM d, yyyy"
                                )}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={reservation.status} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        No reservations found
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

