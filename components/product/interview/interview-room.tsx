"use client"

import { useMemo, useRef, useState } from "react"
import { Loader2, Mic, PhoneOff, Send, X } from "lucide-react"
import { useRouter } from "next/navigation"
import type { InterviewerProfile, SessionExchange, SubmitAnswerResponse } from "@/lib/product/session-contracts"

type Question = {
  chain_index: number
  main_question: string
  question_intent: string | null
  exchanges: SessionExchange[]
}

export function InterviewRoom({
  sessionId,
  interviewer,
  questions
}: {
  sessionId: string
  interviewer: InterviewerProfile
  questions: Question[]
}) {
  const router = useRouter()
  const [answer, setAnswer] = useState("")
  const [questionState, setQuestionState] = useState(questions)
  const [currentIndex, setCurrentIndex] = useState(resolveCurrentIndex(questions))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const messageCounter = useRef(0)
  const currentQuestion = questionState[currentIndex] ?? questionState[0]
  const questionText = currentQuestion?.main_question ?? "Your first question is still being prepared."
  const exchanges = currentQuestion?.exchanges ?? []
  const canSend = answer.trim().length > 0 && !isSubmitting && !!currentQuestion
  const progress = useMemo(() => questionState.length > 0 ? `Q${currentIndex + 1} of ${questionState.length}` : "Q1 of 3", [currentIndex, questionState.length])

  async function submitAnswer() {
    if (!canSend || !currentQuestion) return

    setIsSubmitting(true)
    setError("")
    const clientMessageId = `${sessionId}-${currentQuestion.chain_index}-${Date.now()}-${messageCounter.current++}`
    const answerText = answer.trim()

    try {
      const response = await fetch("/api/session/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          session_id: sessionId,
          chain_index: currentQuestion.chain_index,
          answer_text: answerText,
          client_message_id: clientMessageId
        })
      })
      const payload = await response.json() as SubmitAnswerResponse | { error?: string }

      if (!response.ok) {
        throw new Error("error" in payload ? payload.error : "Could not submit answer.")
      }

      const result = payload as SubmitAnswerResponse
      setQuestionState((items) => items.map((item) => item.chain_index === result.chain_index ? { ...item, exchanges: result.exchanges } : item))
      setAnswer("")

      if (result.next_action === "next_question" && result.next_chain_index !== null) {
        setCurrentIndex(result.next_chain_index)
      }

      if (result.next_action === "end") {
        router.push(`/session/${sessionId}/wrap`)
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit answer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function endSession() {
    setIsSubmitting(true)
    setError("")

    try {
      await fetch("/api/session/end", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ session_id: sessionId })
      })
    } finally {
      router.push(`/session/${sessionId}/wrap`)
    }
  }

  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-[var(--interview-bg)] text-[var(--interview-text)]">
      <header className="flex items-center gap-3 px-5 py-4 sm:px-7">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--interview-border)] bg-[var(--interview-raised)]">
          <span className="font-display text-sm text-[var(--interview-text-secondary)]">{interviewer.avatar}</span>
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--interview-bg)] bg-[var(--interview-sage)]" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">{interviewer.name}</p>
          <p className="text-xs text-[var(--interview-text-secondary)]">
            {interviewer.role}{interviewer.company ? ` · ${interviewer.company}` : ""}
          </p>
        </div>
        <p className="ml-auto mr-4 font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em] text-[var(--interview-text-muted)]">
          {progress}
        </p>
        <button
          type="button"
          className="rounded-md p-2 text-[var(--interview-text-muted)] transition-colors hover:text-[var(--interview-text)]"
          onClick={endSession}
          aria-label="End interview"
        >
          <X size={16} />
        </button>
      </header>

      <section className="flex min-h-0 flex-1 flex-col justify-between px-5 pb-8 pt-10 sm:px-7">
        <div className="mx-auto flex w-full max-w-[620px] flex-col gap-4">
          <InterviewBubble avatar={interviewer.avatar} role="interviewer" text={questionText} />

          {exchanges.map((exchange) => (
            <InterviewBubble
              key={exchange.id}
              avatar={interviewer.avatar}
              role={exchange.role}
              text={exchange.content}
              isFollowup={exchange.is_followup}
            />
          ))}

          {isSubmitting ? (
            <div className="flex items-center gap-3 pl-10 text-sm text-[var(--interview-text-muted)]">
              <Loader2 className="animate-spin" size={15} />
              {interviewer.name} is thinking...
            </div>
          ) : null}
        </div>

        <div className="mx-auto mt-12 w-full max-w-[620px]">
          <div className="mb-5 grid justify-items-center gap-3">
            <button
              type="button"
              className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--interview-sage)] bg-[var(--interview-sage)] text-[var(--interview-text)]"
              aria-label="Voice recording placeholder"
            >
              <Mic size={26} />
            </button>
            <p className="text-xs font-semibold text-[var(--interview-sage)]">Voice recording arrives in the STT slice</p>
            <p className="font-mono text-[10px] text-[var(--interview-text-muted)]">Use text for this production checkpoint</p>
          </div>

          <div className="rounded-xl border border-[var(--interview-border)] bg-[var(--interview-surface)] p-3">
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              rows={3}
              placeholder="Type your answer..."
              className="h-28 w-full resize-none border-0 bg-transparent px-2 py-2 text-sm leading-body text-[var(--interview-text)] outline-none placeholder:text-[var(--interview-text-muted)]"
            />
            <div className="flex items-center justify-between border-t border-[var(--interview-border)] pt-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--interview-border)] px-4 py-2 text-xs text-[var(--interview-text-muted)]"
                onClick={endSession}
              >
                <PhoneOff size={14} />
                End call
              </button>
              <button
                type="button"
                disabled={!canSend}
                onClick={submitAnswer}
                className="inline-flex items-center gap-2 rounded-md bg-[var(--interview-sage)] px-5 py-2 text-sm font-semibold text-[var(--interview-text)] disabled:bg-[var(--interview-raised)] disabled:text-[var(--interview-text-muted)]"
              >
                {isSubmitting ? "Sending..." : "Send"}
                {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
              </button>
            </div>
          </div>
          {error ? (
            <p className="mt-3 rounded-md border border-[var(--interview-danger)] bg-[var(--interview-danger-bg)] px-3 py-2 text-sm text-[var(--interview-danger)]">
              {error}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  )
}

function InterviewBubble({
  avatar,
  role,
  text,
  isFollowup
}: {
  avatar: string
  role: "interviewer" | "candidate"
  text: string
  isFollowup?: boolean
}) {
  const isCandidate = role === "candidate"

  return (
    <div className={isCandidate ? "flex justify-end" : "flex items-end gap-3"}>
      {!isCandidate ? (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--interview-border)] bg-[var(--interview-raised)]">
          <span className="text-[10px] text-[var(--interview-text-secondary)]">{avatar}</span>
        </div>
      ) : null}
      <div className={isCandidate ? "max-w-[78%]" : "max-w-[82%]"}>
        {isFollowup && !isCandidate ? (
          <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--interview-sage)]">
            Follow-up
          </div>
        ) : null}
        <div className={isCandidate
          ? "rounded-[14px_4px_14px_14px] border border-[var(--interview-border)] bg-[var(--interview-raised)] px-5 py-4"
          : "rounded-[4px_14px_14px_14px] border border-[var(--interview-border)] bg-[var(--interview-surface)] px-5 py-4"}
        >
          <p className={isCandidate ? "text-sm leading-body text-[var(--interview-text-secondary)]" : "text-base font-semibold leading-body text-[var(--interview-text)]"}>
            {text}
          </p>
        </div>
      </div>
    </div>
  )
}

function resolveCurrentIndex(questions: Question[]) {
  const firstUnanswered = questions.find((question) => question.exchanges.length === 0)
  return firstUnanswered?.chain_index ?? 0
}
