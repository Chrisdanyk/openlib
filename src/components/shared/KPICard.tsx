import { ReactNode } from "react";
import { cn } from "~/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: "default" | "primary" | "secondary" | "warning" | "success";
  className?: string;
}

const variantStyles = {
  default: "text-foreground",
  primary: "text-primary",
  secondary: "text-secondary",
  warning: "text-warning",
  success: "text-success",
};

const iconBgStyles = {
  default: "bg-muted",
  primary: "bg-primary/10",
  secondary: "bg-secondary/10",
  warning: "bg-warning/10",
  success: "bg-success/10",
};

export function KPICard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: KPICardProps) {
  return (
    <div className={cn("kpi-card animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn("text-3xl font-bold tracking-tight", variantStyles[variant])}>
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-xs font-medium",
                trend.positive ? "text-success" : "text-destructive"
              )}
            >
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl",
            iconBgStyles[variant]
          )}
        >
          <Icon className={cn("w-6 h-6", variantStyles[variant])} />
        </div>
      </div>
    </div>
  );
}
