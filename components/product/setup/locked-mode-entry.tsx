import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";

type LockedModeEntryProps = {
  title: string;
  description: string;
};

export function LockedModeEntry({ title, description }: LockedModeEntryProps) {
  return (
    <Panel className="grid gap-3 opacity-[var(--state-locked-opacity)]">
      <div className="flex items-center gap-2">
        <Lock aria-hidden="true" size={15} />
        <Badge variant="developing">Later</Badge>
      </div>
      <h3 className="font-display text-lg leading-heading">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)]">{description}</p>
    </Panel>
  );
}
