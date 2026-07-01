import { BookOpenText, CheckCircle2, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

const savedAnswers = [
  {
    question: "Tell me about a time you handled ambiguous ownership.",
    answer: "I clarified the decision owner, split the work into reversible steps, and kept stakeholders close with a written operating rhythm.",
    tag: "Behavioral"
  },
  {
    question: "Why this product role?",
    answer: "My strongest pattern is turning messy customer signals into focused product bets, then keeping execution honest with clear tradeoffs.",
    tag: "Motivation"
  },
  {
    question: "Describe a project where you influenced without authority.",
    answer: "I used prototypes and customer evidence to make the decision concrete, which helped engineering and sales align around one plan.",
    tag: "Leadership"
  }
];

export default function BankPage() {
  return (
    <AppShell>
      <div className="grid gap-8">
        <section className="flex flex-col gap-5 border-b border-[var(--border-default)] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Answer Bank
            </div>
            <h1 className="mt-3 font-display text-[length:var(--text-3xl)] leading-tight">
              Saved answers
              <em className="block font-normal text-[var(--text-secondary)]">
                worth rehearsing
              </em>
            </h1>
            <p className="mt-4 max-w-readable text-[var(--text-secondary)]">
              Keep the questions, polished drafts, and interview stories you want to reuse across applications.
            </p>
          </div>
          <Button asChild variant="secondary">
            <a href="/setup?mode=focused">
              New drill
              <BookOpenText aria-hidden="true" size={16} />
            </a>
          </Button>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="grid gap-3">
            {savedAnswers.map((item) => (
              <Panel
                key={item.question}
                className="grid gap-3 border border-[var(--border-default)] bg-[rgba(255,255,255,0.38)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="max-w-readable text-base font-semibold leading-heading text-[var(--text-primary)]">
                    {item.question}
                  </h2>
                  <Badge variant="neutral">{item.tag}</Badge>
                </div>
                <p className="text-sm leading-body text-[var(--text-secondary)]">{item.answer}</p>
              </Panel>
            ))}
          </div>

          <Panel className="h-fit border border-[var(--border-default)] bg-[rgba(255,255,255,0.38)]">
            <div className="flex size-10 items-center justify-center rounded-md bg-[var(--bg-surface-muted)] text-[var(--text-primary)]">
              <Search aria-hidden="true" size={18} />
            </div>
            <h2 className="mt-5 font-display text-xl leading-heading">Library signal</h2>
            <p className="mt-2 text-sm leading-body text-[var(--text-secondary)]">
              Three strong drafts are ready. Save one answer after every session so preparation compounds.
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
              <CheckCircle2 aria-hidden="true" size={16} />
              12 saved items in demo data
            </div>
          </Panel>
        </section>
      </div>
    </AppShell>
  );
}
