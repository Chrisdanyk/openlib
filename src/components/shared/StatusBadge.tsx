import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

type StatusType = "AVAILABLE" | "BORROWED" | "LOST" | "DAMAGED" | "MAINTENANCE" | "PENDING" | "FULFILLED" | "CANCELLED" | "EXPIRED" | "MEMBER" | "LIBRARIAN" | "ADMIN" | "ACTIVE" | "OVERDUE" | "RETURNED";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  // Copy Status
  AVAILABLE: { label: "Available", className: "bg-success/10 text-success border-success/20" },
  BORROWED: { label: "Borrowed", className: "bg-primary/10 text-primary border-primary/20" },
  LOST: { label: "Lost", className: "bg-destructive/10 text-destructive border-destructive/20" },
  DAMAGED: { label: "Damaged", className: "bg-warning/10 text-warning border-warning/20" },
  MAINTENANCE: { label: "Maintenance", className: "bg-muted text-muted-foreground border-muted-foreground/20" },
  
  // Reservation Status
  PENDING: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  FULFILLED: { label: "Fulfilled", className: "bg-success/10 text-success border-success/20" },
  CANCELLED: { label: "Cancelled", className: "bg-muted text-muted-foreground border-muted-foreground/20" },
  EXPIRED: { label: "Expired", className: "bg-destructive/10 text-destructive border-destructive/20" },
  
  // User Roles
  MEMBER: { label: "Member", className: "bg-secondary/10 text-secondary border-secondary/20" },
  LIBRARIAN: { label: "Librarian", className: "bg-primary/10 text-primary border-primary/20" },
  ADMIN: { label: "Admin", className: "bg-chart-5/10 text-chart-5 border-chart-5/20" },
  
  // Loan Status
  ACTIVE: { label: "Active", className: "bg-success/10 text-success border-success/20" },
  OVERDUE: { label: "Overdue", className: "bg-destructive/10 text-destructive border-destructive/20" },
  RETURNED: { label: "Returned", className: "bg-muted text-muted-foreground border-muted-foreground/20" },
};

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] || { label: status, className: "" };
  
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium capitalize",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}

