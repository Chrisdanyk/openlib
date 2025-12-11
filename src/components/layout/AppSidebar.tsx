"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Copy,
  BookMarked,
  Calendar,
  Users,
  Settings,
  Library,
  ChevronLeft,
  ChevronRight,
  Home,
  User,
  Tag,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "~/components/ui/tooltip";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/books", icon: BookOpen, label: "Books" },
  { to: "/admin/authors", icon: User, label: "Authors" },
  { to: "/admin/categories", icon: Tag, label: "Categories" },
  { to: "/copies", icon: Copy, label: "Copies" },
  { to: "/loans", icon: BookMarked, label: "Loans" },
  { to: "/reservations", icon: Calendar, label: "Reservations" },
  { to: "/users", icon: Users, label: "Users" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "sticky top-0 flex flex-col h-screen bg-card border-r border-border transition-all duration-300 shrink-0",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <Library className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-lg tracking-tight">Open</h1>
                <p className="text-xs text-muted-foreground -mt-0.5">Library</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {/* Home Link */}
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href="/"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <Home className="w-5 h-5 flex-shrink-0" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Public Site
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              <span>Public Site</span>
            </Link>
          )}

          <div className="h-px bg-border my-2" />

          {navItems.map((item) => {
            const isActive = pathname === item.to || pathname?.startsWith(`${item.to}/`);
            const NavItem = (
              <Link
                key={item.to}
                href={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  "hover:bg-muted",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.to} delayDuration={0}>
                  <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return NavItem;
          })}
        </nav>

        {/* Collapse Button */}
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            size="icon"
            className="w-full text-muted-foreground"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

