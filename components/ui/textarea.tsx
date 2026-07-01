import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[160px] w-full resize-y rounded-md bg-[var(--bg-surface)] px-3 py-3 text-sm leading-[var(--leading-body)] text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--border-subtle)] transition-shadow duration-base placeholder:text-[var(--text-muted)] focus-visible:shadow-[inset_0_0_0_1px_var(--border-success),var(--focus-ring)] disabled:opacity-[var(--state-disabled-opacity)]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
