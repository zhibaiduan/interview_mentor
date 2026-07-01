import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-medium transition-colors duration-base ease-standard focus-visible:outline-none disabled:pointer-events-none disabled:opacity-[var(--state-disabled-opacity)]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent-action)] text-[var(--text-inverse)] hover:bg-[var(--color-ink-2)]",
        secondary:
          "bg-[var(--bg-surface-muted)] text-[var(--text-primary)] hover:bg-[var(--state-hover-bg)]",
        save:
          "bg-[var(--accent-save)] text-[var(--text-inverse)] hover:bg-[var(--color-sage-text)]",
        ghost:
          "bg-transparent px-2 text-[var(--text-secondary)] hover:bg-[var(--state-hover-bg)] hover:text-[var(--text-primary)]",
        danger:
          "bg-[var(--bg-danger)] text-[var(--text-danger)] hover:bg-[var(--color-clay-red-soft)]"
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-5 text-base"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
