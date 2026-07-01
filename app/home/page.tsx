import { BookOpenText, BriefcaseBusiness, FileUser, Mic, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { AssetShortcut } from "@/components/product/dashboard/asset-shortcut";
import { CreditBalance } from "@/components/product/dashboard/credit-balance";
import { ModeEntry } from "@/components/product/dashboard/mode-entry";
import { PracticeActivityList } from "@/components/product/dashboard/practice-activity-list";

export default function HomePage() {
  return (
    <AppShell>
      <div className="grid gap-10">
        <section className="grid gap-8 border-b border-[var(--border-default)] pb-10 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
          <div className="grid gap-4">
            <div className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Good to see you, Miumiu
            </div>
            <div>
              <h1 className="font-display text-[length:var(--text-3xl)] leading-tight">
                6 sessions
                <em className="block font-normal text-[var(--text-secondary)]">
                  completed
                </em>
              </h1>
              <p className="mt-4 max-w-readable text-[var(--text-secondary)]">
                Your behavioral responses are improving. One more focused drill today would make a real difference:
                your examples are getting sharper, but the ownership thread still needs practice.
              </p>
            </div>
          </div>

          <Panel className="grid gap-5 border border-[var(--border-default)] bg-[rgba(255,255,255,0.38)] text-center">
            <div>
              <div className="font-display text-[56px] leading-none">74</div>
              <div className="mt-2 font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                avg. score
              </div>
            </div>
            <Button asChild>
              <a href="/setup?mode=focused">
                New interview
                <Mic aria-hidden="true" size={16} />
              </a>
            </Button>
          </Panel>
        </section>

        <section className="grid gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Practice modes
            </h2>
            <Badge variant="neutral">10 credits available</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <ModeEntry
              kicker="Focused drill"
              title="Targeted practice"
              description="Three tailored questions for behavioral, case scenario, or resume deep dive practice."
              href="/setup?mode=focused"
              badge="3 credits"
              icon={Sparkles}
              actionLabel="Start drill"
            />
            <ModeEntry
              kicker="Full simulation"
              title="Complete mock interview"
              description="Multi-round adaptive questioning for a realistic longer interview flow."
              href="/setup?mode=full"
              badge="MVP later"
              locked
              icon={BriefcaseBusiness}
            />
            <ModeEntry
              kicker="Review"
              title="Answer Bank"
              description="Browse saved questions, polished answers, and examples you want to reuse."
              href="/bank"
              badge="12 saved"
              icon={BookOpenText}
              actionLabel="Review"
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <PracticeActivityList />
          <div className="grid gap-6">
            <CreditBalance credits={10} />
            <Panel className="grid gap-4 border border-[var(--border-default)] bg-[rgba(255,255,255,0.38)]">
              <div>
                <h2 className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Practice materials
                </h2>
                <p className="mt-2 text-sm leading-body text-[var(--text-secondary)]">
                  Reuse your profile and saved answers when you switch target roles or add new projects.
                </p>
              </div>
              <div className="grid gap-2">
                <AssetShortcut
                  title="Resume material"
                  description="Keep the source material that shapes every session."
                  href="/setup?panel=resumes"
                  icon={FileUser}
                  meta="Profile"
                />
                <AssetShortcut
                  title="Answer Bank"
                  description="Saved questions and polished answers from practice."
                  href="/bank"
                  icon={BookOpenText}
                  meta="12"
                />
              </div>
            </Panel>
          </div>
        </section>

        <section className="grid gap-4 rounded-md border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.24)] p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div>
            <h2 className="font-display text-xl leading-heading">Profile signal</h2>
            <p className="mt-2 max-w-readable text-sm leading-body text-[var(--text-secondary)]">
              Your resume is pre-filled in every new session. Update it when you switch roles, add projects,
              or change your positioning.
            </p>
          </div>
          <Button asChild variant="secondary">
            <a href="/setup?panel=resumes">Edit resume</a>
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
