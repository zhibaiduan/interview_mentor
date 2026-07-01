import type { ReactNode } from "react";
import { AppShell } from "./app-shell";

type ReportShellProps = {
  children: ReactNode;
};

export function ReportShell({ children }: ReportShellProps) {
  return (
    <AppShell>
      <div className="mx-auto max-w-report bg-[var(--bg-surface-muted)] px-6 py-8 shadow-panel sm:px-8">
        {children}
      </div>
    </AppShell>
  );
}
