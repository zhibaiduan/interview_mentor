import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-pill px-2.5 py-1 font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em]",
  {
    variants: {
      variant: {
        neutral:
          "bg-[var(--bg-surface-muted)] text-[var(--text-secondary)] shadow-[inset_0_0_0_1px_var(--border-subtle)]",
        strong:
          "bg-[var(--bg-success)] text-[var(--text-success)] shadow-[inset_0_0_0_1px_var(--border-success)]",
        growing:
          "bg-[var(--bg-warning)] text-[var(--text-warning)] shadow-[inset_0_0_0_1px_var(--border-warning)]",
        developing:
          "bg-[var(--bg-warning)] text-[var(--text-warning)] shadow-[inset_0_0_0_1px_var(--border-warning)]",
        risk:
          "bg-[var(--bg-danger)] text-[var(--text-danger)] shadow-[inset_0_0_0_1px_var(--border-danger)]"
      }
    },
    defaultVariants: {
      variant: "neutral"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
