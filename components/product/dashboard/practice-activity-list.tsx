import { Badge } from "@/components/ui/badge";
import { ListRow } from "@/components/ui/list-row";
import { Panel } from "@/components/ui/panel";

const activities = [
  {
    role: "Product Manager — Klarna",
    detail: "Focused drill · 3 questions · Jun 18",
    score: 78,
    status: "strong"
  },
  {
    role: "Solution Consultant — Celonis",
    detail: "Full simulation · 2 rounds · May 20",
    score: 74,
    status: "developing"
  },
  {
    role: "Customer Success Manager — Miro",
    detail: "Behavioral drill · 3 questions · May 12",
    score: 69,
    status: "developing"
  }
] as const;

export function PracticeActivityList() {
  return (
    <Panel className="grid gap-4 border border-[var(--border-default)] bg-[rgba(255,255,255,0.38)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Recent sessions
        </h2>
        <a className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]" href="/bank">
          View all
        </a>
      </div>
      <div className="grid gap-1">
        {activities.map((activity) => (
          <ListRow
            key={activity.role}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.24)] px-4 py-4 sm:grid-cols-[110px_minmax(0,1fr)_auto]"
          >
            <div className="hidden font-display text-2xl leading-none text-[var(--text-primary)] sm:block">
              {activity.score}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-medium">{activity.role}</h3>
              <p className="mt-1 text-xs font-mono text-[var(--text-muted)]">
                {activity.detail}
              </p>
            </div>
            <Badge variant={activity.status}>{activity.status}</Badge>
          </ListRow>
        ))}
      </div>
    </Panel>
  );
}
