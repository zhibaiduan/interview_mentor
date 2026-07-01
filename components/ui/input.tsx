import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--border-subtle)] transition-shadow duration-base placeholder:text-[var(--text-muted)] focus-visible:shadow-[inset_0_0_0_1px_var(--border-success),var(--focus-ring)] disabled:opacity-[var(--state-disabled-opacity)]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
