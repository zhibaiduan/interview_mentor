import Link from "next/link"
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react"
import { ReportShell } from "@/components/layout/report-shell"
import { ReportBlock } from "@/components/ui/report-block"
import type { SessionFeedbackResult } from "@/lib/product/session-contracts"

export function FeedbackReport({ feedback }: { feedback: SessionFeedbackResult }) {
  const completedAt = feedback.completed_at
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(feedback.completed_at))
    : "Recent session"

  return (
    <ReportShell>
      <article className="grid gap-8">
        <header className="grid gap-5 border-b border-[var(--border-subtle)] pb-7">
          <Link
            href="/home"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-[var(--text-secondary)]"
          >
            <ArrowLeft size={16} />
            Back home
          </Link>
          <div className="grid gap-3">
            <p className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {feedback.focus_label} · {feedback.interviewer.role} · {completedAt}
            </p>
            <h1 className="max-w-[760px] font-display text-[length:var(--text-2xl)] leading-heading text-[var(--text-primary)]">
              {feedback.interviewer_overall.summary}
            </h1>
            <p className="text-sm leading-body text-[var(--text-secondary)]">
              Final read from {feedback.interviewer.name}: {feedback.interviewer_overall.recommendation}. {feedback.interviewer_overall.recommendation_reason}
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <ReportBlock>
            <p className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.14em] text-[var(--text-success)]">
              Strongest Signal
            </p>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {feedback.interviewer_overall.strength_label}
            </h2>
            <p className="text-sm leading-body text-[var(--text-secondary)]">
              {feedback.interviewer_overall.strength_evidence}
            </p>
          </ReportBlock>

          <ReportBlock>
            <p className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.14em] text-[var(--text-warning)]">
              Main Gap
            </p>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {feedback.interviewer_overall.weakness_label}
            </h2>
            <p className="text-sm leading-body text-[var(--text-secondary)]">
              {feedback.interviewer_overall.weakness_evidence}
            </p>
          </ReportBlock>
        </section>

        <ReportBlock>
          <div className="grid gap-4">
            <p className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.14em] text-[var(--text-info)]">
              Mentor View
            </p>
            <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
              <div className="grid gap-3">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">What to keep</h2>
                <p className="text-sm leading-body text-[var(--text-secondary)]">
                  {feedback.mentor_overall.genuine_strength}
                </p>
              </div>
              <div className="grid gap-3">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">What to change next</h2>
                <p className="text-sm leading-body text-[var(--text-secondary)]">
                  {feedback.mentor_overall.primary_gap}
                </p>
                <p className="text-sm font-medium leading-body text-[var(--text-primary)]">
                  {feedback.mentor_overall.priority_action}
                </p>
              </div>
            </div>
            <div className="grid gap-3 border-t border-[var(--border-subtle)] pt-4">
              {feedback.mentor_overall.dimension_scores.map((dimension) => (
                <div key={dimension.label} className="grid gap-2 md:grid-cols-[180px_1fr] md:items-center">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{dimension.label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{dimension.evidence}</p>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--state-skeleton-bg)]">
                    <div
                      className="h-2 rounded-full bg-[var(--accent-save)]"
                      style={{ width: `${Math.max(20, dimension.score * 20)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ReportBlock>

        <section className="grid gap-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Questions
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Per-question feedback</h2>
            </div>
            <p className="text-sm text-[var(--text-muted)]">Overall score {feedback.overall_score}/5</p>
          </div>

          {feedback.questions.map((question) => (
            <ReportBlock key={question.chain_index} className="gap-5">
              <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-4 md:flex-row md:items-start md:justify-between">
                <div className="grid gap-2">
                  <p className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Q{question.chain_index + 1}
                  </p>
                  <h3 className="max-w-[720px] text-lg font-semibold leading-heading text-[var(--text-primary)]">
                    {question.question_text}
                  </h3>
                  {question.question_intent ? (
                    <p className="text-sm text-[var(--text-secondary)]">
                      Tests: {question.question_intent}
                    </p>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-[var(--text-secondary)]">{question.score}/5</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FeedbackSignal title="Answer signal" body={question.interviewer_feedback.you_signaled} />
                <FeedbackSignal title="Interviewer heard" body={question.interviewer_feedback.interviewer_heard} emphasized />
                <FeedbackSignal title="Next version" body={question.mentor_feedback.how_to_fix} />
              </div>

              <div className="grid gap-3 border-t border-[var(--border-subtle)] pt-4 text-sm leading-body text-[var(--text-secondary)]">
                <p><span className="font-semibold text-[var(--text-primary)]">Missing signal:</span> {question.interviewer_feedback.missing_signals}</p>
                <p><span className="font-semibold text-[var(--text-primary)]">Mentor diagnosis:</span> {question.mentor_feedback.gap_diagnosis}</p>
                {question.mentor_feedback.language_tip ? (
                  <p><span className="font-semibold text-[var(--text-primary)]">Language tip:</span> {question.mentor_feedback.language_tip}</p>
                ) : null}
              </div>
            </ReportBlock>
          ))}
        </section>

        <footer className="flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-6 sm:flex-row">
          <Link
            href="/setup"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--accent-action)] px-5 py-3 text-sm font-semibold text-[var(--text-inverse)]"
          >
            <RotateCcw size={16} />
            Start new session
          </Link>
          <Link
            href="/home"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-default)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)]"
          >
            Back to dashboard
            <ArrowRight size={16} />
          </Link>
        </footer>
      </article>
    </ReportShell>
  )
}

function FeedbackSignal({
  title,
  body,
  emphasized = false
}: {
  title: string
  body: string
  emphasized?: boolean
}) {
  return (
    <div className={emphasized ? "grid gap-2 border-l border-[var(--border-strong)] pl-4" : "grid gap-2"}>
      <p className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {title}
      </p>
      <p className="text-sm leading-body text-[var(--text-secondary)]">{body}</p>
    </div>
  )
}
