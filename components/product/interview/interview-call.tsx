"use client"

import { useEffect } from "react"
import { Phone, X } from "lucide-react"
import { useRouter } from "next/navigation"
import type { InterviewerProfile } from "@/lib/product/session-contracts"

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}

export function InterviewCall({
  sessionId,
  interviewer
}: {
  sessionId: string
  interviewer: InterviewerProfile
}) {
  const router = useRouter()

  useEffect(() => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    const context = new AudioContextClass()
    const gain = context.createGain()
    gain.gain.value = 0
    gain.connect(context.destination)
    let timeout: number | null = null
    let stopped = false

    const ring = () => {
      if (stopped) return
      const oscillator = context.createOscillator()
      oscillator.type = "sine"
      oscillator.frequency.value = 440
      oscillator.connect(gain)
      gain.gain.setValueAtTime(0, context.currentTime)
      gain.gain.linearRampToValueAtTime(0.035, context.currentTime + 0.04)
      gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.8)
      oscillator.start()
      oscillator.stop(context.currentTime + 0.82)
      timeout = window.setTimeout(ring, 2400)
    }

    context.resume().then(ring).catch(() => undefined)

    return () => {
      stopped = true
      if (timeout) window.clearTimeout(timeout)
      context.close().catch(() => undefined)
    }
  }, [])

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--interview-bg)] bg-[image:var(--interview-glow)] px-6 py-12 text-[var(--interview-text)]">
      <div className="absolute left-1/2 top-[42%] h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--interview-sage-dim)] opacity-25" />
      <div className="absolute left-1/2 top-[42%] h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--interview-sage-dim)] opacity-35" />
      <section className="relative z-10 flex flex-col items-center text-center">
        <div className="relative mb-8 flex h-32 w-32 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full border border-[var(--interview-sage)] opacity-20" />
          <div className="absolute inset-5 rounded-full border border-[var(--interview-sage-dim)]" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[var(--interview-border)] bg-[var(--interview-raised)]">
            <span className="font-display text-3xl text-[var(--interview-text-secondary)]">{interviewer.avatar}</span>
          </div>
        </div>

        <h1 className="font-display text-3xl font-semibold leading-heading text-[var(--interview-text)]">{interviewer.name}</h1>
        <p className="mt-2 text-sm font-semibold text-[var(--interview-text-secondary)]">
          {interviewer.role}{interviewer.company ? ` · ${interviewer.company}` : ""}
        </p>
        <p className="mt-5 font-mono text-[length:var(--text-label)] uppercase tracking-[0.14em] text-[var(--interview-sage)]">
          Incoming call...
        </p>

        <div className="mt-12 flex items-center gap-12">
          <div className="grid justify-items-center gap-3">
            <button
              type="button"
              className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--interview-danger)] bg-[var(--interview-danger-bg)] text-[var(--interview-danger)] transition-transform active:scale-95"
              onClick={() => router.push("/home")}
              aria-label="Decline interview call"
            >
              <X size={24} />
            </button>
            <span className="text-xs text-[var(--interview-text-muted)]">Decline</span>
          </div>

          <div className="grid justify-items-center gap-3">
            <button
              type="button"
              className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--interview-sage)] bg-[var(--interview-sage)] text-[var(--interview-text)] transition-transform active:scale-95"
              onClick={() => router.push(`/session/${sessionId}/interview`)}
              aria-label="Accept interview call"
            >
              <Phone size={24} />
            </button>
            <span className="text-xs text-[var(--interview-text-secondary)]">Accept</span>
          </div>
        </div>

        <p className="mt-11 font-mono text-[length:var(--text-label)] tracking-[0.08em] text-[var(--interview-text-muted)]">
          {interviewer.focus} · {interviewer.duration}
        </p>
      </section>
    </main>
  )
}
