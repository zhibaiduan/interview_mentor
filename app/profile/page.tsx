import { FileUser, Globe2, Pencil } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="grid gap-8">
        <section className="flex flex-col gap-5 border-b border-[var(--border-default)] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Profile
            </div>
            <h1 className="mt-3 font-display text-[length:var(--text-3xl)] leading-tight">
              Miumiu
              <em className="block font-normal text-[var(--text-secondary)]">
                interview workspace
              </em>
            </h1>
            <p className="mt-4 max-w-readable text-[var(--text-secondary)]">
              Your profile gives every practice session context: resume material, target language, and the positioning thread you want to strengthen.
            </p>
          </div>
          <Button asChild>
            <a href="/setup?panel=resumes">
              Edit profile
              <Pencil aria-hidden="true" size={16} />
            </a>
          </Button>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Panel className="border border-[var(--border-default)] bg-[rgba(255,255,255,0.38)]">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[var(--bg-surface-muted)] text-[var(--text-primary)]">
                <FileUser aria-hidden="true" size={20} />
              </div>
              <div>
                <h2 className="font-display text-xl leading-heading">Resume material</h2>
                <p className="mt-2 text-sm leading-body text-[var(--text-secondary)]">
                  Product and growth experience with customer discovery, cross-functional execution, and AI product strategy. Strongest examples involve turning ambiguous signals into structured product decisions.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="neutral">Product strategy</Badge>
              <Badge variant="neutral">Customer discovery</Badge>
              <Badge variant="neutral">Ownership stories</Badge>
            </div>
          </Panel>

          <div className="grid gap-4">
            <Panel className="border border-[var(--border-default)] bg-[rgba(255,255,255,0.38)]">
              <div className="flex items-center gap-3">
                <Globe2 aria-hidden="true" size={18} />
                <div>
                  <div className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Practice language
                  </div>
                  <div className="mt-1 font-display text-2xl leading-none">EN</div>
                </div>
              </div>
            </Panel>
            <Panel className="border border-[var(--border-default)] bg-[rgba(255,255,255,0.38)]">
              <div className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Credit balance
              </div>
              <div className="mt-3 font-display text-4xl leading-none">10</div>
              <p className="mt-2 text-sm leading-body text-[var(--text-secondary)]">
                Enough for three focused drills.
              </p>
            </Panel>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
