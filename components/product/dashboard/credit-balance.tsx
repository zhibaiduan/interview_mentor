import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";

type CreditBalanceProps = {
  credits: number;
  nextSessionCost?: number;
};

export function CreditBalance({ credits, nextSessionCost = 3 }: CreditBalanceProps) {
  return (
    <Panel className="grid gap-4 border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.34)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Practice credits
        </h2>
        <Badge variant="neutral">{credits} left</Badge>
      </div>
      <div>
        <div className="font-display text-[40px] leading-none">{credits}</div>
        <div className="mt-1 text-xs text-[var(--text-secondary)]">
          enough for {Math.floor(credits / nextSessionCost)} focused sessions
        </div>
      </div>
      <p className="text-sm leading-body text-[var(--text-secondary)]">
        A focused interview uses {nextSessionCost} credits. Polish uses 1 credit per answer.
      </p>
    </Panel>
  );
}
