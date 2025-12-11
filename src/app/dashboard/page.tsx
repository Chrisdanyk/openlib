"use client";

import {
  BookOpen,
  Copy,
  BookMarked,
  Calendar,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  BookOpenCheck,
  UserPlus,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "~/components/shared/PageHeader";
import { KPICard } from "~/components/shared/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { AppLayout } from "~/components/layout/AppLayout";
import { api } from "~/trpc/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatDistanceToNow } from "date-fns";

const COLORS = ["hsl(var(--success))", "hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = api.stats.getOverview.useQuery(undefined, {
    retry: false,
  });
  const { data: activityData, isLoading: activityLoading } = api.stats.getRecentActivity.useQuery(
    { limit: 20 },
    { retry: false }
  );
  const { data: loanTrends, isLoading: trendsLoading } = api.stats.getLoanTrends.useQuery(undefined, {
    retry: false,
  });
  const { data: categoryData, isLoading: categoryLoading } = api.stats.getCategoryDistribution.useQuery(
    undefined,
    { retry: false }
  );

  const loading = statsLoading || activityLoading || trendsLoading || categoryLoading;

  // Transform activity data into a flat array
  const activity = activityData && activityData.loans && activityData.returns && activityData.reservations ? [
    ...activityData.loans.map((loan) => ({
      id: loan.id,
      type: "loan" as const,
      description: `${loan.user.name} borrowed "${loan.bookCopy.book.title}"`,
      timestamp: loan.borrowedAt.toISOString(),
    })),
    ...activityData.returns.map((loan) => ({
      id: `return-${loan.id}`,
      type: "return" as const,
      description: `${loan.user.name} returned "${loan.bookCopy.book.title}"`,
      timestamp: loan.returnedAt!.toISOString(),
    })),
    ...activityData.reservations.map((res) => ({
      id: res.id,
      type: "reservation" as const,
      description: `${res.user.name} reserved "${res.book.title}"`,
      timestamp: res.reservedAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : [];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "loan":
        return BookMarked;
      case "return":
        return RotateCcw;
      case "reservation":
        return Calendar;
      case "registration":
        return UserPlus;
      default:
        return BookOpen;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "loan":
        return "text-primary bg-primary/10";
      case "return":
        return "text-success bg-success/10";
      case "reservation":
        return "text-warning bg-warning/10";
      case "registration":
        return "text-secondary bg-secondary/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <PageHeader title="Dashboard" description="Library overview and statistics" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="kpi-card animate-pulse">
                <div className="h-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Transform loan trends data for chart
  const loansData = loanTrends && loanTrends.length > 0
    ? loanTrends.map((item) => ({
        name: new Date(item.month + "-01").toLocaleDateString("en-US", { month: "short" }),
        value: item.count,
      }))
    : [
        { name: "Jan", value: 0 },
        { name: "Feb", value: 0 },
        { name: "Mar", value: 0 },
        { name: "Apr", value: 0 },
        { name: "May", value: 0 },
        { name: "Jun", value: 0 },
      ];

  // Transform category data for pie chart
  const availabilityData = categoryData && categoryData.length > 0
    ? categoryData.map((item) => ({
        name: item.name,
        value: item.bookCount,
      }))
    : [
        { name: "Fiction", value: 5 },
        { name: "Non-Fiction", value: 3 },
        { name: "Mystery", value: 2 },
      ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <PageHeader
          title="Dashboard"
          description="Welcome back! Here's an overview of your library."
        />

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Books"
            value={stats?.books.total || 0}
            description={`${stats?.books.total || 0} unique titles`}
            icon={BookOpen}
            variant="primary"
            trend={{ value: 12, positive: true }}
          />
          <KPICard
            title="Available Copies"
            value={stats?.books.copies.available || 0}
            description="Ready to borrow"
            icon={Copy}
            variant="success"
          />
          <KPICard
            title="Active Loans"
            value={stats?.loans.active || 0}
            description={`${stats?.loans.overdue || 0} overdue`}
            icon={BookMarked}
            variant="secondary"
          />
          <KPICard
            title="Pending Reservations"
            value={stats?.reservations.pending || 0}
            description="Awaiting fulfillment"
            icon={Calendar}
            variant="warning"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Loans Over Time */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">Loans Over Time</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={loansData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Availability Breakdown */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">Book Availability</CardTitle>
              <BookOpenCheck className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={availabilityData.filter((d) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {availabilityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {availabilityData.filter((d) => d.value > 0).map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Stats */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activity.slice(0, 8).map((item) => {
                  const Icon = getActivityIcon(item.type);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${getActivityColor(item.type)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Users</span>
                  <span className="font-semibold">{stats?.users.total || 0}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-3/4 rounded-full bg-secondary" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Overdue Loans</span>
                  <span className="font-semibold text-destructive">{stats?.loans.overdue || 0}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-destructive"
                    style={{ width: `${((stats?.loans.overdue || 0) / (stats?.loans.active || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fulfillment Rate</span>
                  <span className="font-semibold text-success">94%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-[94%] rounded-full bg-success" />
                </div>
              </div>

              {stats?.loans.overdue && stats.loans.overdue > 0 && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Overdue Alert</p>
                      <p className="text-xs text-destructive/80 mt-0.5">
                        {stats.loans.overdue} books are overdue and need attention
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
