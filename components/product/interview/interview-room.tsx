"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Keyboard, Loader2, Mic, PhoneOff, Send, X } from "lucide-react"
import { useRouter } from "next/navigation"
import type { InterviewerProfile, SessionExchange, SubmitAnswerResponse } from "@/lib/product/session-contracts"
import { cn } from "@/lib/utils"

type Question = {
  chain_index: number
  main_question: string
  question_intent: string | null
  exchanges: SessionExchange[]
}

type VoicePhase = "idle" | "starting" | "recording" | "transcribing"
type InputMode = "voice" | "text"
type SpeechStatus = "idle" | "loading" | "playing" | "unavailable" | "error"

type BrowserSpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionEventLike = {
  resultIndex: number
  results: ArrayLike<{
    isFinal: boolean
    0: { transcript: string }
  }>
}

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserSpeechRecognition
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition
  }
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
  const [inputMode, setInputMode] = useState<InputMode>("voice")
  const [voicePhase, setVoicePhase] = useState<VoicePhase>("idle")
  const [, setSpeechStatus] = useState<SpeechStatus>("idle")
  const [liveTranscript, setLiveTranscript] = useState("")
  const [lastTranscript, setLastTranscript] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const messageCounter = useRef(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const shouldSubmitRecordingRef = useRef(false)
  const stopAfterStartRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const speechAudioUrlRef = useRef<string | null>(null)
  const speechRequestIdRef = useRef(0)
  const liveTranscriptRef = useRef("")
  const committedLiveTranscriptRef = useRef("")
  const finalLiveTranscriptRef = useRef("")
  const shouldRunRecognitionRef = useRef(false)
  const liveTranscriptTimerRef = useRef<number | null>(null)
  const liveRecognitionStartTimerRef = useRef<number | null>(null)
  const activeConversationRef = useRef<HTMLDivElement | null>(null)
  const currentQuestion = questionState[currentIndex] ?? questionState[0]
  const questionText = currentQuestion?.main_question ?? "Your first question is still being prepared."
  const exchanges = useMemo(() => currentQuestion?.exchanges ?? [], [currentQuestion])
  const canSendText = answer.trim().length > 0 && !isSubmitting && voicePhase === "idle" && !!currentQuestion
  const progress = useMemo(() => questionState.length > 0 ? `Q${currentIndex + 1} of ${questionState.length}` : "Q1 of 3", [currentIndex, questionState.length])
  const latestInterviewerText = useMemo(() => {
    const latestFollowUp = [...exchanges].reverse().find((exchange) => exchange.role === "interviewer")
    return latestFollowUp?.content ?? questionText
  }, [exchanges, questionText])
  const latestSpeechKey = `${currentQuestion?.chain_index ?? 0}:${latestInterviewerText}`
  const pendingCandidateTranscript = lastTranscript || liveTranscript
  const pendingCandidateSaved = pendingCandidateTranscript
    ? exchanges.some((exchange) => sameTranscript(exchange.content, pendingCandidateTranscript))
    : false

  useEffect(() => {
    if (!latestInterviewerText || isSubmitting || voicePhase !== "idle") return
    void playInterviewerSpeech(latestInterviewerText)
    return () => {
      stopInterviewerSpeech()
    }
    // The speech effect should run once per interviewer utterance, not every time
    // recording/submission helpers are recreated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestSpeechKey])

  useEffect(() => {
    return () => {
      stopInterviewerSpeech()
      stopLiveRecognition()
      stopMediaStream()
    }
    // Cleanup only runs when the interview room unmounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (inputMode !== "voice" || event.code !== "Space" || event.repeat || isTypingTarget(event.target)) return
      event.preventDefault()
      toggleRecording()
    }

    function handleCancel(event: KeyboardEvent) {
      if (event.key !== "Escape" || voicePhase !== "recording") return
      event.preventDefault()
      cancelRecording()
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keydown", handleCancel)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keydown", handleCancel)
    }
    // Keyboard listeners read current mode/status; recording helpers are stable
    // enough for this controlled event scope and should not rebind on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMode, isSubmitting, voicePhase])

  useEffect(() => {
    if (!activeConversationRef.current) return

    const frame = window.requestAnimationFrame(() => {
      activeConversationRef.current?.scrollIntoView({
        block: "center",
        behavior: "smooth"
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [currentIndex, exchanges.length, liveTranscript, lastTranscript, isSubmitting])

  async function playInterviewerSpeech(text: string) {
    const requestId = speechRequestIdRef.current + 1
    speechRequestIdRef.current = requestId
    setSpeechStatus("loading")

    try {
      const response = await fetch("/api/session/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      })

      const contentType = response.headers.get("Content-Type") ?? ""
      if (!response.ok) {
        throw new Error("Could not play interviewer voice.")
      }

      if (contentType.includes("application/json")) {
        setSpeechStatus("unavailable")
        return
      }

      const audioBlob = await response.blob()
      if (speechRequestIdRef.current !== requestId || voicePhase !== "idle") return
      const audioUrl = URL.createObjectURL(audioBlob)
      stopInterviewerSpeech()
      speechAudioUrlRef.current = audioUrl
      audioRef.current = new Audio(audioUrl)
      audioRef.current.onended = () => {
        revokeSpeechAudioUrl()
        setSpeechStatus("idle")
      }
      audioRef.current.onerror = () => {
        revokeSpeechAudioUrl()
        setSpeechStatus("error")
      }
      setSpeechStatus("playing")
      await audioRef.current.play()
    } catch {
      setSpeechStatus("error")
    }
  }

  async function startRecording() {
    if (voicePhase !== "idle" || isSubmitting || !currentQuestion) return
    setError("")
    setLiveTranscript("")
    setLastTranscript("")
    liveTranscriptRef.current = ""
    committedLiveTranscriptRef.current = ""
    finalLiveTranscriptRef.current = ""
    shouldRunRecognitionRef.current = true
    stopInterviewerSpeech()
    shouldSubmitRecordingRef.current = true
    stopAfterStartRef.current = false
    setVoicePhase("starting")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: voiceAudioConstraints() })
      mediaStreamRef.current = stream
      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream, preferredRecorderOptions())
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      recorder.onstop = () => {
        stopLiveRecognition()
        stopMediaStream()
        const recording = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" })
        audioChunksRef.current = []

        if (shouldSubmitRecordingRef.current && recording.size > 0) {
          void transcribeAndSubmit(recording)
        } else {
          setVoicePhase("idle")
        }
      }

      recorder.start()
      setVoicePhase("recording")
      liveRecognitionStartTimerRef.current = window.setTimeout(startLiveRecognition, 180)
      if (stopAfterStartRef.current) {
        recorder.stop()
        setVoicePhase("transcribing")
      }
    } catch {
      setError("Microphone permission is required. Switch to text if you prefer typing.")
      setInputMode("text")
      setVoicePhase("idle")
      stopMediaStream()
    }
  }

  function stopRecording() {
    if (voicePhase === "starting") {
      stopAfterStartRef.current = true
      shouldRunRecognitionRef.current = false
      return
    }
    if (voicePhase !== "recording") return
    shouldSubmitRecordingRef.current = true
    shouldRunRecognitionRef.current = false
    mediaRecorderRef.current?.stop()
    setVoicePhase("transcribing")
  }

  function cancelRecording() {
    shouldSubmitRecordingRef.current = false
    shouldRunRecognitionRef.current = false
    stopAfterStartRef.current = false
    mediaRecorderRef.current?.stop()
    stopLiveRecognition()
    stopMediaStream()
    setLiveTranscript("")
    setVoicePhase("idle")
  }

  function toggleRecording() {
    if (voicePhase === "idle") {
      void startRecording()
      return
    }

    if (voicePhase === "starting" || voicePhase === "recording") {
      stopRecording()
    }
  }

  async function transcribeAndSubmit(recording: Blob) {
    setVoicePhase("transcribing")

    try {
      const formData = new FormData()
      formData.append("audio", recording, recordingFileName(recording.type))
      formData.append("session_id", sessionId)
      formData.append("chain_index", String(currentQuestion?.chain_index ?? 0))
      const response = await fetch("/api/session/transcribe", {
        method: "POST",
        body: formData
      })
      const payload = await response.json() as { text?: string; error?: string }

      if (!response.ok || !payload.text) {
        throw new Error(payload.error ?? "Could not transcribe your answer.")
      }

      setLastTranscript(payload.text)
      await submitAnswerText(payload.text)
    } catch (transcribeError) {
      setError(transcribeError instanceof Error ? transcribeError.message : "Could not transcribe your answer.")
    } finally {
      setVoicePhase("idle")
    }
  }

  async function submitAnswerText(answerText: string) {
    if (!answerText.trim() || !currentQuestion) return

    setIsSubmitting(true)
    setError("")
    const clientMessageId = `${sessionId}-${currentQuestion.chain_index}-${Date.now()}-${messageCounter.current++}`

    try {
      const response = await fetch("/api/session/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          session_id: sessionId,
          chain_index: currentQuestion.chain_index,
          answer_text: answerText.trim(),
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
      setLiveTranscript("")

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

  async function submitTypedAnswer() {
    if (!canSendText) return
    await submitAnswerText(answer)
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

  function startLiveRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"
    recognition.onresult = (event) => {
      let finalTranscript = ""
      let interimTranscript = ""

      for (let index = 0; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript
        if (event.results[index].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      finalLiveTranscriptRef.current = finalTranscript.trim()
      queueLiveTranscript(joinTranscriptParts(
        committedLiveTranscriptRef.current,
        finalLiveTranscriptRef.current,
        interimTranscript.trim()
      ))
    }
    recognition.onend = () => {
      recognitionRef.current = null
      if (finalLiveTranscriptRef.current) {
        committedLiveTranscriptRef.current = joinTranscriptParts(
          committedLiveTranscriptRef.current,
          finalLiveTranscriptRef.current
        )
        finalLiveTranscriptRef.current = ""
        queueLiveTranscript(committedLiveTranscriptRef.current)
      }
      if (shouldRunRecognitionRef.current && mediaRecorderRef.current?.state === "recording") {
        liveRecognitionStartTimerRef.current = window.setTimeout(startLiveRecognition, 160)
      }
    }
    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      recognitionRef.current = null
    }
  }

  function stopLiveRecognition() {
    shouldRunRecognitionRef.current = false
    if (liveRecognitionStartTimerRef.current !== null) {
      window.clearTimeout(liveRecognitionStartTimerRef.current)
      liveRecognitionStartTimerRef.current = null
    }
    recognitionRef.current?.stop()
    recognitionRef.current = null
    if (liveTranscriptTimerRef.current !== null) {
      window.clearTimeout(liveTranscriptTimerRef.current)
      liveTranscriptTimerRef.current = null
    }
  }

  function stopMediaStream() {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
  }

  function stopInterviewerSpeech() {
    speechRequestIdRef.current += 1
    audioRef.current?.pause()
    audioRef.current = null
    revokeSpeechAudioUrl()
    setSpeechStatus((status) => status === "playing" || status === "loading" ? "idle" : status)
  }

  function revokeSpeechAudioUrl() {
    if (!speechAudioUrlRef.current) return
    URL.revokeObjectURL(speechAudioUrlRef.current)
    speechAudioUrlRef.current = null
  }

  function queueLiveTranscript(transcript: string) {
    liveTranscriptRef.current = transcript
    if (liveTranscriptTimerRef.current !== null) return

    liveTranscriptTimerRef.current = window.setTimeout(() => {
      liveTranscriptTimerRef.current = null
      setLiveTranscript((current) => current === liveTranscriptRef.current ? current : liveTranscriptRef.current)
    }, 220)
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--interview-bg)] bg-[image:var(--interview-glow)] text-[var(--interview-text)]">
      <header className="fixed left-0 right-0 top-0 z-20 flex items-center gap-4 px-5 py-4 sm:px-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--interview-border)] bg-[var(--interview-raised)]">
          <span className="font-display text-lg text-[var(--interview-text-secondary)]">{interviewer.avatar}</span>
        </div>
        <div>
          <p className="text-base font-semibold leading-tight">{interviewer.name}</p>
          <p className="text-xs text-[var(--interview-text-secondary)]">
            {interviewer.role}{interviewer.company ? ` · ${interviewer.company}` : ""}
          </p>
        </div>
        <p className="ml-auto hidden font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em] text-[var(--interview-text-muted)] sm:block">
          {progress}
        </p>
        <button
          type="button"
          className="rounded-md p-2 text-[var(--interview-text-muted)] transition-colors hover:text-[var(--interview-text)]"
          onClick={endSession}
          aria-label="End interview"
        >
          <X size={18} />
        </button>
      </header>

      <section className="flex h-screen min-h-0 flex-col px-5 pb-5 pt-20 sm:px-7">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
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

            {pendingCandidateTranscript && !pendingCandidateSaved ? (
              <InterviewBubble avatar={interviewer.avatar} role="candidate" text={pendingCandidateTranscript} isDraft />
            ) : null}

            {isSubmitting ? (
              <div className="flex items-center gap-3 pl-12 text-sm text-[var(--interview-text-muted)]">
                <Loader2 className="animate-spin" size={15} />
                {interviewer.name} is thinking...
              </div>
            ) : null}

            <div ref={activeConversationRef} aria-hidden="true" className="h-1" />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[620px] shrink-0 flex-col items-center border-t border-[var(--interview-border)] pt-4">
          {inputMode === "voice" ? (
            <VoiceConsole
              voicePhase={voicePhase}
              disabled={isSubmitting}
              onToggle={toggleRecording}
              onCancel={cancelRecording}
              onSwitchToText={() => setInputMode("text")}
              onEnd={endSession}
            />
          ) : (
            <TextConsole
              answer={answer}
              canSend={canSendText}
              isSubmitting={isSubmitting}
              onChange={setAnswer}
              onSend={submitTypedAnswer}
              onSwitchToVoice={() => setInputMode("voice")}
              onEnd={endSession}
            />
          )}

          {error ? (
            <p className="mt-4 max-w-[420px] rounded-md border border-[var(--interview-danger)] bg-[var(--interview-danger-bg)] px-3 py-2 text-center text-sm text-[var(--interview-danger)]">
              {error}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  )
}

function VoiceConsole({
  voicePhase,
  disabled,
  onToggle,
  onCancel,
  onSwitchToText,
  onEnd
}: {
  voicePhase: VoicePhase
  disabled: boolean
  onToggle: () => void
  onCancel: () => void
  onSwitchToText: () => void
  onEnd: () => void
}) {
  const isRecording = voicePhase === "recording"
  const isBusy = voicePhase === "transcribing" || disabled

  return (
    <div className="grid justify-items-center gap-3">
      <button
        type="button"
        disabled={isBusy}
        onClick={onToggle}
        className={cn(
          "relative flex h-20 w-20 items-center justify-center rounded-full border text-[var(--interview-text)] transition duration-200 active:scale-95",
          isRecording
            ? "border-[var(--interview-sage)] bg-[var(--interview-sage)] shadow-[0_0_0_18px_rgba(74,125,96,0.09)]"
            : "border-[var(--interview-border)] bg-[var(--interview-raised)] hover:border-[var(--interview-sage)]",
          isBusy && "cursor-wait opacity-70"
        )}
        aria-label={isRecording ? "Send spoken answer" : "Start speaking"}
      >
        {voicePhase === "starting" || voicePhase === "transcribing" || disabled ? (
          <Loader2 className="animate-spin" size={25} />
        ) : isRecording ? (
          <VoiceBars />
        ) : (
          <Mic size={25} />
        )}
      </button>

      <p className="text-center text-sm font-semibold text-[var(--interview-sage)]">
        {voicePhase === "recording"
          ? "Recording - press Space or the mic to send"
          : voicePhase === "starting"
            ? "Opening microphone..."
            : voicePhase === "transcribing"
              ? "Transcribing..."
              : "Press Space or the mic to speak"}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--interview-text-muted)]">
        {isRecording ? (
          <button type="button" className="hover:text-[var(--interview-danger)]" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button type="button" className="font-semibold hover:text-[var(--interview-text-secondary)]" onClick={onSwitchToText}>
          Switch to text
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--interview-border)] px-4 py-2 hover:text-[var(--interview-text)]"
          onClick={onEnd}
        >
          <PhoneOff size={14} />
          End call
        </button>
      </div>
    </div>
  )
}

function TextConsole({
  answer,
  canSend,
  isSubmitting,
  onChange,
  onSend,
  onSwitchToVoice,
  onEnd
}: {
  answer: string
  canSend: boolean
  isSubmitting: boolean
  onChange: (value: string) => void
  onSend: () => void
  onSwitchToVoice: () => void
  onEnd: () => void
}) {
  return (
    <div className="w-full rounded-lg border border-[var(--interview-border)] bg-[var(--interview-surface)] p-3">
      <textarea
        value={answer}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        placeholder="Type your answer..."
        className="h-28 w-full resize-none border-0 bg-transparent px-2 py-2 text-sm leading-body text-[var(--interview-text)] outline-none placeholder:text-[var(--interview-text-muted)]"
      />
      <div className="flex items-center justify-between border-t border-[var(--interview-border)] pt-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--interview-border)] px-4 py-2 text-xs text-[var(--interview-text-muted)]"
            onClick={onEnd}
          >
            <PhoneOff size={14} />
            End call
          </button>
          <button type="button" className="inline-flex items-center gap-2 text-xs text-[var(--interview-text-muted)] hover:text-[var(--interview-text-secondary)]" onClick={onSwitchToVoice}>
            <Keyboard size={14} />
            Voice mode
          </button>
        </div>
        <button
          type="button"
          disabled={!canSend}
          onClick={onSend}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--interview-sage)] px-5 py-2 text-sm font-semibold text-[var(--interview-text)] disabled:bg-[var(--interview-raised)] disabled:text-[var(--interview-text-muted)]"
        >
          {isSubmitting ? "Sending..." : "Send"}
          {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
        </button>
      </div>
    </div>
  )
}

function InterviewBubble({
  avatar,
  role,
  text,
  isFollowup,
  isDraft
}: {
  avatar: string
  role: "interviewer" | "candidate"
  text: string
  isFollowup?: boolean
  isDraft?: boolean
}) {
  const isCandidate = role === "candidate"

  return (
    <div className={isCandidate ? "flex justify-end" : "flex items-end gap-3"}>
      {!isCandidate ? (
        <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--interview-border)] bg-[var(--interview-raised)]">
          <span className="font-display text-xs text-[var(--interview-text-secondary)]">{avatar}</span>
        </div>
      ) : null}
      <div className={isCandidate ? "max-w-[78%]" : "max-w-[82%]"}>
        {isFollowup && !isCandidate ? (
          <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--interview-sage)]">
            Follow-up
          </div>
        ) : null}
        <div className={cn(
          "border px-6 py-4",
          isCandidate
            ? "rounded-[14px_4px_14px_14px] border-[var(--interview-border)] bg-[var(--interview-raised)]"
            : "rounded-[4px_14px_14px_14px] border-[var(--interview-border)] bg-[var(--interview-surface)]",
          isDraft && "opacity-72"
        )}
        >
          <p className={isCandidate ? "text-base font-semibold leading-body text-[var(--interview-text-secondary)]" : "text-lg font-semibold leading-body text-[var(--interview-text)]"}>
            {text}
          </p>
        </div>
      </div>
    </div>
  )
}

function VoiceBars() {
  return (
    <div className="flex h-8 items-end gap-1">
      {[14, 22, 30, 38, 28].map((height, index) => (
        <span
          key={height}
          className="w-1.5 rounded-full bg-[var(--interview-text)] opacity-90 will-change-transform"
          style={{
            height,
            transformOrigin: "bottom",
            animation: `voice-bar 720ms ${index * 80}ms ease-in-out infinite alternate`
          }}
        />
      ))}
    </div>
  )
}

function resolveCurrentIndex(questions: Question[]) {
  const firstUnanswered = questions.find((question) => question.exchanges.length === 0)
  return firstUnanswered?.chain_index ?? 0
}

function preferredRecorderOptions(): MediaRecorderOptions | undefined {
  if (typeof MediaRecorder === "undefined") return undefined
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return { mimeType: "audio/webm;codecs=opus", audioBitsPerSecond: 128000 }
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return { mimeType: "audio/webm", audioBitsPerSecond: 128000 }
  }
  if (MediaRecorder.isTypeSupported("audio/mp4")) {
    return { mimeType: "audio/mp4", audioBitsPerSecond: 128000 }
  }
  return undefined
}

function voiceAudioConstraints(): MediaTrackConstraints {
  return {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1
  }
}

function recordingFileName(mimeType: string) {
  if (mimeType.includes("mp4")) return "answer.mp4"
  if (mimeType.includes("mpeg")) return "answer.mp3"
  if (mimeType.includes("ogg")) return "answer.ogg"
  return "answer.webm"
}

function joinTranscriptParts(...parts: Array<string | null | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
}

function sameTranscript(left: string, right: string) {
  return left.trim().replace(/\s+/g, " ").toLowerCase() === right.trim().replace(/\s+/g, " ").toLowerCase()
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return tag === "input" || tag === "textarea" || target.isContentEditable
}
