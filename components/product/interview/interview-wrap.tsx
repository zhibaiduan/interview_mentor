"use client"

import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import type { InterviewerProfile } from "@/lib/product/session-contracts"

export function InterviewWrap({
  sessionId,
  interviewer,
  feedbackStatus
}: {
  sessionId: string
  interviewer: InterviewerProfile
  feedbackStatus: string
}) {
  const router = useRouter()
  const startedRef = useRef(false)
  const [status, setStatus] = useState(feedbackStatus)
  const [error, setError] = useState<string | null>(null)
  const ready = status === "summary_ready" || status === "ready"
  const failed = status === "failed"

  useEffect(() => {
    let cancelled = false
    let pollTimer: ReturnType<typeof setTimeout> | null = null

    async function startFeedback() {
      if (!startedRef.current && status !== "ready") {
        startedRef.current = true
        await fetch("/api/session/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId })
        }).catch(() => {
          if (!cancelled) setError("Feedback generation could not start.")
        })
      }

      async function poll() {
        const response = await fetch(`/api/session/${sessionId}/feedback-status`)
        if (!response.ok) {
          if (!cancelled) setError("Feedback status could not be loaded.")
          return
        }

        const body = await response.json() as { feedback_status: string; feedback_error: string | null }
        if (cancelled) return

        setStatus(body.feedback_status)
        setError(body.feedback_error)

        if (!["ready", "summary_ready", "failed"].includes(body.feedback_status)) {
          pollTimer = setTimeout(poll, 1800)
        }
      }

      await poll()
    }

    startFeedback()

    return () => {
      cancelled = true
      if (pollTimer) clearTimeout(pollTimer)
    }
  }, [sessionId, status])

  async function retryFeedback() {
    setError(null)
    setStatus("generating")
    startedRef.current = false
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--interview-bg)] bg-[image:var(--interview-glow)] px-6 py-12 text-[var(--interview-text)]">
      <section className="w-full max-w-[460px] text-center">
        <div className="mx-auto mb-10 flex h-32 w-32 items-center justify-center text-[var(--interview-text-secondary)]">
          <svg viewBox="0 0 120 100" className="h-28 w-32 drop-shadow">
            <path d="M15 30 L60 62 L105 30 L105 84 L15 84 Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
            <path d="M15 30 L60 8 L105 30" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
            <path d="M20 82 L48 52 M100 82 L72 52" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M50 25 H76 M47 35 H82" stroke="var(--interview-sage)" strokeWidth="3" strokeLinecap="round" opacity={ready ? "0.75" : "0.35"} />
          </svg>
        </div>

        <h1 className="font-display text-[42px] italic leading-tight text-[var(--interview-text)]">
          {ready ? "Your feedback is ready." : "That's a wrap."}
        </h1>
        <p className="mx-auto mt-5 max-w-[340px] text-sm leading-body text-[var(--interview-text-secondary)]">
          {ready
            ? `${interviewer.name} has carefully reviewed your answers and written their notes.`
            : failed
              ? "Something went wrong generating your feedback. You can retry now."
              : `${interviewer.name} has listened to everything. Putting your feedback together now.`}
        </p>

        {ready ? (
          <div className="mt-10">
            <button
              type="button"
              className="inline-flex items-center gap-3 rounded-xl bg-[var(--interview-text)] px-12 py-4 text-base font-semibold text-[var(--interview-bg)]"
              onClick={() => router.push(`/session/${sessionId}/feedback`)}
            >
              Open your feedback
              <ArrowRight size={18} />
            </button>
            <dl className="mx-auto mt-10 grid max-w-[360px] grid-cols-3 gap-4 border-t border-[var(--interview-border)] pt-6 text-center">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--interview-text-muted)]">Questions</dt>
                <dd className="mt-2 text-sm text-[var(--interview-text-secondary)]">3</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--interview-text-muted)]">Focus</dt>
                <dd className="mt-2 text-sm text-[var(--interview-text-secondary)]">{interviewer.focus}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--interview-text-muted)]">With</dt>
                <dd className="mt-2 text-sm text-[var(--interview-text-secondary)]">{interviewer.name}</dd>
              </div>
            </dl>
          </div>
        ) : failed ? (
          <div className="mt-12 grid justify-items-center gap-4">
            <p className="max-w-[320px] text-sm leading-body text-[var(--interview-danger)]">
              {error ?? "Feedback generation failed."}
            </p>
            <button
              type="button"
              className="rounded-xl border border-[var(--interview-border)] px-6 py-3 text-sm font-semibold text-[var(--interview-text)]"
              onClick={retryFeedback}
            >
              Retry feedback
            </button>
          </div>
        ) : (
          <div className="mt-12 grid justify-items-center gap-4">
            <div className="h-px w-32 animate-pulse bg-[var(--interview-sage)]" />
            <p className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.14em] text-[var(--interview-text-muted)]">
              Reviewing
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
