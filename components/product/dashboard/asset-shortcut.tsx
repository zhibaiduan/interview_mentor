import type { LucideIcon } from "lucide-react";
import { FileText } from "lucide-react";
import { ListRow } from "@/components/ui/list-row";

type AssetShortcutProps = {
  title: string;
  description: string;
  href: string;
  icon?: LucideIcon;
  meta?: string;
};

export function AssetShortcut({
  title,
  description,
  href,
  icon: Icon = FileText,
  meta
}: AssetShortcutProps) {
  return (
    <a href={href}>
      <ListRow className="grid grid-cols-[auto_1fr_auto] items-start gap-3 border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.24)]">
        <span className="mt-1 rounded-sm bg-[var(--bg-info)] p-2 text-[var(--text-info)]">
          <Icon aria-hidden="true" size={16} />
        </span>
        <span>
          <span className="block text-sm font-medium">{title}</span>
          <span className="mt-1 block text-sm text-[var(--text-secondary)]">
            {description}
          </span>
        </span>
        {meta ? (
          <span className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            {meta}
          </span>
        ) : null}
      </ListRow>
    </a>
  );
}
