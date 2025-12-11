"use client";

import { PageHeader } from "~/components/shared/PageHeader";
import { AppLayout } from "~/components/layout/AppLayout";

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Manage library settings"
        />
        <div className="text-center py-16 text-muted-foreground">
          Settings page - Coming soon
        </div>
      </div>
    </AppLayout>
  );
}

