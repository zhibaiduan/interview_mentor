"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { InterviewerProfile } from "@/lib/product/session-contracts"

const prepSteps = [
  "Reading your resume",
  "Analyzing the target role",
  "Mapping your experience to the role",
  "Selecting focus areas from your background",
  "Writing your personalized questions"
]

export function InterviewPrep({
  sessionId,
  interviewer
}: {
  sessionId: string
  interviewer: InterviewerProfile
}) {
  const router = useRouter()
  const [active, setActive] = useState(0)
  const [done, setDone] = useState<number[]>([])

  useEffect(() => {
    const timers = prepSteps.flatMap((_, index) => [
      window.setTimeout(() => setActive(index), index * 720),
      window.setTimeout(() => setDone((current) => Array.from(new Set([...current, index]))), index * 720 + 460)
    ])
    const routeTimer = window.setTimeout(() => router.push(`/session/${sessionId}/call`), prepSteps.length * 720 + 720)

    return () => {
      timers.forEach(window.clearTimeout)
      window.clearTimeout(routeTimer)
    }
  }, [router, sessionId])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--interview-bg)] bg-[image:var(--interview-glow)] px-6 py-12 text-[var(--interview-text)]">
      <section className="w-full max-w-[440px]">
        <div className="mb-10">
          <p className="mb-3 font-mono text-[length:var(--text-label)] uppercase tracking-[0.14em] text-[var(--interview-sage)]">
            Preparing your session
          </p>
          <h1 className="font-display text-2xl italic leading-heading text-[var(--interview-text)]">
            Building your personalized interview.
          </h1>
        </div>

        <div>
          {prepSteps.map((step, index) => {
            const isDone = done.includes(index)
            const isActive = active === index && !isDone
            const isPending = active < index

            return (
              <div
                key={step}
                className={cn(
                  "flex items-center gap-4 border-b border-[var(--interview-border)] py-3 transition-opacity last:border-b-0",
                  isPending ? "opacity-30" : "opacity-100"
                )}
              >
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    isDone
                      ? "border-[var(--interview-sage)] bg-[var(--interview-sage)] text-[var(--interview-text)]"
                      : "border-[var(--interview-border)] bg-[var(--interview-surface)] text-[var(--interview-text-secondary)]"
                  )}
                >
                  {isDone ? <CheckCircle2 size={13} /> : isActive ? <Loader2 className="animate-spin" size={12} /> : null}
                </div>
                <span
                  className={cn(
                    "text-sm",
                    isDone ? "text-[var(--interview-text-secondary)]" : isActive ? "text-[var(--interview-text)]" : "text-[var(--interview-text-muted)]"
                  )}
                >
                  {step}
                </span>
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-sm leading-body text-[var(--interview-text-muted)]">
          {interviewer.name} is reviewing your background before the call.
        </p>
      </section>
    </main>
  )
}
