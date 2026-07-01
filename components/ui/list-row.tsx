import * as React from "react";
import { cn } from "@/lib/utils";

export interface ListRowProps extends React.HTMLAttributes<HTMLDivElement> {}

function ListRow({ className, ...props }: ListRowProps) {
  return (
    <div
      className={cn(
        "grid gap-2 rounded-md px-4 py-3 transition-colors duration-base ease-standard hover:bg-[var(--state-hover-bg)]",
        className
      )}
      {...props}
    />
  );
}

export { ListRow };
