import * as React from "react";
import { cn } from "@/lib/utils";

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {}

function Panel({ className, ...props }: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-md bg-[var(--bg-surface-muted)] p-[var(--layout-panel-padding)] shadow-panel",
        className
      )}
      {...props}
    />
  );
}

export { Panel };
