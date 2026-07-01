import * as React from "react";
import { cn } from "@/lib/utils";

export interface ReportBlockProps extends React.HTMLAttributes<HTMLElement> {}

function ReportBlock({ className, ...props }: ReportBlockProps) {
  return (
    <section
      className={cn(
        "grid gap-4 rounded-md bg-[var(--bg-surface)] p-5 shadow-[inset_0_0_0_1px_var(--border-subtle)]",
        className
      )}
      {...props}
    />
  );
}

export { ReportBlock };
