import type { LucideIcon } from "lucide-react";
import { ArrowRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

type ModeEntryProps = {
  kicker: string;
  title: string;
  description: string;
  href: string;
  badge?: string;
  locked?: boolean;
  icon?: LucideIcon;
  actionLabel?: string;
};

export function ModeEntry({
  kicker,
  title,
  description,
  href,
  badge,
  locked = false,
  icon: Icon,
  actionLabel
}: ModeEntryProps) {
  return (
    <Panel
      className={cn(
        "group grid min-h-[190px] gap-5 border border-[var(--border-default)] bg-[rgba(255,255,255,0.38)] transition-all duration-base ease-standard hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]",
        locked && "opacity-[var(--state-locked-opacity)] hover:translate-y-0"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-2">
          <div className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            {kicker}
          </div>
          <h2 className="font-display text-xl leading-heading">{title}</h2>
          <p className="max-w-readable text-sm leading-body text-[var(--text-secondary)]">
            {description}
          </p>
          {badge ? <Badge variant={locked ? "developing" : "neutral"}>{badge}</Badge> : null}
        </div>
        {Icon ? (
          <span className="rounded-md bg-[var(--bg-surface-muted)] p-2 text-[var(--text-secondary)] shadow-[inset_0_0_0_1px_var(--border-subtle)]">
            <Icon aria-hidden="true" size={18} />
          </span>
        ) : null}
      </div>
      <div>
        <Button asChild variant={locked ? "secondary" : "primary"} size="sm">
          <a href={locked ? "#" : href}>
            {locked ? (
              <>
                Coming later
                <Lock aria-hidden="true" size={14} />
              </>
            ) : (
              <>
                {actionLabel ?? "Start"}
                <ArrowRight aria-hidden="true" size={15} />
              </>
            )}
          </a>
        </Button>
      </div>
    </Panel>
  );
}
