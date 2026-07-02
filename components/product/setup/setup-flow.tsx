"use client"

import { useEffect, useMemo, useRef, useState, type RefObject } from "react"
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Trash2,
  X
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  buildSessionConfig,
  isSupportedResumeFile,
  parseResumeSignals,
  validateResumeText,
  validateTargetRole,
  type FollowUpIntensity,
  type ResumeSignals,
  type RoleMode,
  type SetupFocusType,
  type SetupLevel
} from "@/lib/product/setup-validation"
import { cn } from "@/lib/utils"

type ResumeAsset = {
  id: string
  title: string
  meta: string
  source: "library" | "uploaded"
  content: string
}

type SetupStep = "resume" | "role" | "settings"
type ParsePhase = "idle" | "uploading" | "extracting"
type FocusType = {
  id: SetupFocusType
  label: string
  description: string
  interviewer: string
  locked?: boolean
}

const defaultResumes: ResumeAsset[] = [
  {
    id: "last-used",
    title: "Product / AI resume",
    meta: "Last used Jun 20",
    source: "library",
    content: `PROFILE SUMMARY
Product-minded builder focused on AI workflow products, interview preparation, and user-centered product decisions.

WORK EXPERIENCE
Product and growth work
- Led discovery interviews with students and early-career candidates to identify interview preparation gaps.
- Designed an AI interview practice workflow that turns resumes and target roles into structured mock interview questions.
- Worked across product strategy, UX writing, frontend implementation, and evaluation criteria.

SELECTED PROJECTS
OfferUp interview practice product
- Built a focused setup flow for resume-based interview preparation.
- Improved the onboarding experience by showing users which resume signals are detected before the session starts.
- Used qualitative feedback to refine the product direction and reduce setup confusion.

EDUCATION
Semester project, AI product design and frontend implementation.

SKILLS
Product discovery, AI product strategy, user research, React, TypeScript, structured feedback design.

RESULTS
- Reduced user confusion during setup by making material analysis visible and progressive.
- Created a repeatable 3-question interview flow for focused practice.`
  },
  {
    id: "ux-research",
    title: "UX research resume",
    meta: "Design role version",
    source: "library",
    content: `PROFILE SUMMARY
UX researcher and product designer with experience turning ambiguous user problems into focused product decisions.

WORK EXPERIENCE
Research and design work
- Conducted user interviews, synthesized findings, and translated insights into product requirements.
- Collaborated with engineering and product teams to prioritize usability issues.
- Created prototypes and tested flows with users to improve clarity and completion.

SELECTED PROJECTS
Career preparation tool
- Designed a setup experience that helps users understand how their materials are interpreted.
- Created progressive feedback moments to reduce uncertainty and build trust.

EDUCATION
Product design and research training.

SKILLS
User interviews, usability testing, Figma, product thinking, stakeholder communication, workshop facilitation.

RESULTS
- Helped teams identify the highest-friction steps in onboarding.
- Improved task completion by clarifying user choices and next actions.`
  }
]

const savedJds = [
  {
    id: "personio",
    label: "PM Werkstudent · Personio",
    updated: "Jun 28",
    content:
      "We are looking for a Product Manager working student to support discovery, analytics, stakeholder alignment, roadmap decisions, and clear communication with engineering and design teams."
  },
  {
    id: "figma",
    label: "Associate PM · Figma",
    updated: "Jun 15",
    content:
      "Join the product team to work on collaboration workflows, user research synthesis, data-informed prioritization, and cross-functional delivery for creative teams."
  }
]

const genericRoles = [
  "Product Manager",
  "Frontend Engineer",
  "Backend Engineer",
  "Data Analyst",
  "UX Designer",
  "Operations"
]

const focusTypes: FocusType[] = [
  {
    id: "resume",
    label: "Resume Deep Dive",
    interviewer: "Hiring Manager",
    description:
      "Questions drawn from your projects, ownership, and impact. Expect the interviewer to probe what you actually did versus what the team did."
  },
  {
    id: "behavioral",
    label: "Behavioral (STAR)",
    interviewer: "HR",
    description:
      "Past-behavior questions on conflict, leadership, failure, and collaboration. Structure your answer around situation, task, action, and result."
  },
  {
    id: "motivation",
    label: "Motivation & Fit",
    interviewer: "HR",
    description:
      "Why this role, this company, and this location. Generic answers are weak here; specificity matters."
  },
  {
    id: "culture",
    label: "Culture & Collaboration",
    interviewer: "HR + HM",
    description: "Team dynamics, disagreement, and cross-functional work.",
    locked: true
  },
  {
    id: "situational",
    label: "Situational / Case",
    interviewer: "Hiring Manager",
    description: "Scenario-based reasoning and prioritization under realistic constraints.",
    locked: true
  }
]

const levels = [
  { id: "junior" as const, label: "Junior", years: "0-2 yrs" },
  { id: "mid" as const, label: "Mid", years: "2-5 yrs" },
  { id: "senior" as const, label: "Senior", years: "5+ yrs" }
]

const parseSteps = [
  "Reading document structure",
  "Finding roles and companies",
  "Identifying projects and skills",
  "Filtering private-looking fields",
  "Ready"
]

export function SetupFlow() {
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [resumes, setResumes] = useState(defaultResumes)
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [resumePickerOpen, setResumePickerOpen] = useState(searchParams.get("panel") === "resumes")
  const [jdPickerOpen, setJdPickerOpen] = useState(searchParams.get("panel") === "jd-history")
  const [parsePhase, setParsePhase] = useState<ParsePhase>("idle")
  const [parseStep, setParseStep] = useState(parseSteps.length - 1)
  const [step, setStep] = useState<SetupStep>("resume")
  const [resumeConfirmed, setResumeConfirmed] = useState(false)
  const [roleMode, setRoleMode] = useState<RoleMode>("jd")
  const [jdText, setJdText] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [quickRole, setQuickRole] = useState("")
  const [focusType, setFocusType] = useState<SetupFocusType>("resume")
  const [level, setLevel] = useState<SetupLevel>("junior")
  const [notice, setNotice] = useState("")

  const selectedResume = resumes.find((resume) => resume.id === selectedResumeId)
  const resumeSignals = useMemo(() => selectedResume ? parseResumeSignals(selectedResume.content) : null, [selectedResume])
  const resumeValidation = useMemo(() => selectedResume ? validateResumeText(selectedResume.content) : null, [selectedResume])
  const selectedFocus = focusTypes.find((focus) => focus.id === focusType) ?? focusTypes[0]
  const selectedLevel = levels.find((item) => item.id === level) ?? levels[0]
  const isParsing = parsePhase !== "idle"
  const roleValidation = validateTargetRole(roleMode, jdText, quickRole)
  const roleValid = roleValidation.valid
  const roleConfirmed = resumeConfirmed && roleValid
  const canStart = resumeConfirmed && roleValid

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(""), 3000)
    return () => window.clearTimeout(timer)
  }, [notice])

  async function handleUpload(file: File | undefined) {
    if (!file) return

    setResumePickerOpen(false)
    setNotice("")

    if (!isSupportedResumeFile(file.name, file.type)) {
      setParsePhase("idle")
      setParseStep(parseSteps.length - 1)
      setResumeConfirmed(false)
      setStep("resume")
      setNotice("Unsupported file type. Upload PDF, .txt, or .md.")
      return
    }

    setParsePhase("uploading")
    setParseStep(0)
    setResumeConfirmed(false)
    setStep("resume")

    let content = ""
    try {
      content = await readResumeFile(file)
    } catch {
      setParsePhase("idle")
      setParseStep(parseSteps.length - 1)
      setNotice("Resume upload failed. Try another PDF, plain text, or Markdown file.")
      return
    }

    const uploadedResume: ResumeAsset = {
      id: `uploaded-${Date.now()}`,
      title: file.name.replace(/\.[^.]+$/, "") || "Uploaded resume",
      meta: /\.pdf$/i.test(file.name) || file.type === "application/pdf" ? "PDF parsed just now" : "Uploaded just now",
      source: "uploaded",
      content
    }

    window.setTimeout(() => {
      setParsePhase("extracting")
      let current = 0
      const interval = window.setInterval(() => {
        current += 1
        setParseStep(current)
        if (current >= parseSteps.length - 1) {
          window.clearInterval(interval)
          window.setTimeout(() => {
            setResumes((existing) => [uploadedResume, ...existing])
            setSelectedResumeId(uploadedResume.id)
            setParsePhase("idle")
            setParseStep(parseSteps.length - 1)
            setNotice("Resume uploaded. Review the extracted signals before confirming.")
          }, 360)
        }
      }, 360)
    }, 420)
  }

  function chooseResume(resumeId: string) {
    setSelectedResumeId(resumeId)
    setResumePickerOpen(false)
    setResumeConfirmed(false)
    setStep("resume")
    setParsePhase("extracting")
    setParseStep(0)

    let current = 0
    const interval = window.setInterval(() => {
      current += 1
      setParseStep(current)
      if (current >= parseSteps.length - 1) {
        window.clearInterval(interval)
        setParsePhase("idle")
        setNotice("Resume selected. Confirm the extracted interview signals to continue.")
      }
    }, 280)
  }

  function deleteUploadedResume() {
    if (!selectedResume || selectedResume.source !== "uploaded") return
    setResumes((existing) => existing.filter((resume) => resume.id !== selectedResume.id))
    setSelectedResumeId(null)
    setResumeConfirmed(false)
    setStep("resume")
    setNotice("Uploaded resume removed. Add a resume to continue.")
  }

  function confirmResume() {
    if (isParsing) return
    if (!selectedResume || !resumeValidation) {
      setResumeConfirmed(false)
      setNotice("Add a resume before continuing.")
      return
    }
    if (!resumeValidation.valid) {
      setResumeConfirmed(false)
      setNotice(resumeValidation.errors[0] ?? "Review your resume before continuing.")
      return
    }
    setResumeConfirmed(true)
    setStep("role")
  }

  function startInterview() {
    if (!canStart || !selectedResume) return
    const sessionConfig = buildSessionConfig({
      resumeText: selectedResume.content,
      roleMode,
      jdText,
      companyName,
      quickRole,
      focusType,
      level,
      intensity: "medium"
    })
    setNotice(`Setup ready. Config validated for ${sessionConfig.main_question_count} focused questions.`)
  }

  return (
    <div className="-mx-5 -my-8 min-h-[calc(100vh-2rem)] pb-36 sm:-mx-8 md:-mx-10 md:-my-10">
      <div className="mx-auto w-full max-w-[640px] px-6 pb-12 pt-12 sm:px-8 md:pt-16">
        <header className="mb-10">
          <h1 className="font-display text-2xl italic leading-heading text-[var(--text-primary)]">
            Set up your session.
          </h1>
        </header>

        <div className="grid gap-0">
          <SetupSectionHeader
            number={1}
            title="Resume"
            active={step === "resume"}
            complete={resumeConfirmed}
            onChange={() => {
              setResumeConfirmed(false)
              setStep("resume")
            }}
          />
          <div className="pl-0 sm:pl-10">
            {resumeConfirmed && selectedResume ? (
              <ConfirmedSummary icon={FileText} title={selectedResume.title} label="Ready" />
            ) : (
              <ResumeStep
                selectedResume={selectedResume}
                resumeSignals={resumeSignals}
                resumeValidation={resumeValidation}
                isParsing={isParsing}
                parsePhase={parsePhase}
                parseStep={parseStep}
                fileInputRef={fileInputRef}
                onUpload={handleUpload}
                onOpenPicker={() => setResumePickerOpen(true)}
                onDelete={deleteUploadedResume}
                onConfirm={confirmResume}
              />
            )}
          </div>

          <StepConnector muted={step === "resume"} />

          <SetupSectionHeader
            number={2}
            title="Target role"
            active={step === "role"}
            complete={roleConfirmed}
            disabled={!resumeConfirmed}
            onChange={() => {
              setStep("role")
            }}
          />
          <div className={cn("pl-0 transition-opacity duration-slow sm:pl-10", resumeConfirmed ? "opacity-100" : "pointer-events-none opacity-35")}>
            {step !== "resume" ? (
              <TargetRoleStep
                roleMode={roleMode}
                jdText={jdText}
                companyName={companyName}
                quickRole={quickRole}
                roleValid={roleValid}
                onRoleModeChange={(mode) => {
                  setRoleMode(mode)
                  setJdText("")
                  setQuickRole("")
                }}
                onJdTextChange={setJdText}
                onCompanyNameChange={setCompanyName}
                onQuickRoleChange={setQuickRole}
                onOpenJdPicker={() => setJdPickerOpen(true)}
              />
            ) : null}
          </div>

          <StepConnector muted={step !== "settings"} />

          <SetupSectionHeader
            number={3}
            title="Session settings"
            active={step === "settings"}
            disabled={!roleValid}
            onChange={() => setStep("settings")}
          />
          <div className={cn("pl-0 transition-opacity duration-slow sm:pl-10", roleValid ? "opacity-100" : "pointer-events-none opacity-35")}>
            {roleValid ? (
              <SessionSettingsStep
                focusType={focusType}
                level={level}
                onFocusTypeChange={setFocusType}
                onLevelChange={setLevel}
              />
            ) : null}
          </div>

          {notice ? (
            <p className="mt-8 rounded-md bg-[var(--bg-info)] px-3 py-2 text-sm text-[var(--text-info)] shadow-[inset_0_0_0_1px_var(--border-info)]">
              {notice}
            </p>
          ) : null}

        </div>
      </div>

      <SetupSummaryBar
        canStart={canStart}
        focus={selectedFocus.label}
        level={selectedLevel.label}
        duration="~12-18 min"
        disabledReason={!resumeConfirmed ? "Confirm your resume first" : !roleValid ? "Add a target role to continue" : ""}
        onStart={startInterview}
      />

      <ResumePickerModal
        open={resumePickerOpen}
        resumes={resumes}
        selectedResumeId={selectedResumeId}
        onClose={() => setResumePickerOpen(false)}
        onSelect={chooseResume}
        onUpload={() => fileInputRef.current?.click()}
      />

      <JdPickerModal
        open={jdPickerOpen}
        onClose={() => setJdPickerOpen(false)}
        onSelect={(content) => {
          setRoleMode("jd")
          setJdText(content)
          setStep("role")
          setJdPickerOpen(false)
        }}
      />
    </div>
  )
}

function SetupSectionHeader({
  number,
  title,
  active,
  complete,
  disabled,
  onChange
}: {
  number: number
  title: string
  active: boolean
  complete?: boolean
  disabled?: boolean
  onChange?: () => void
}) {
  return (
    <div className={cn("mb-4 flex items-center gap-3", disabled ? "opacity-45" : "")}>
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-pill font-mono text-[10px] font-bold",
          complete
            ? "bg-[var(--accent-save)] text-[var(--text-inverse)]"
            : active
              ? "bg-[var(--accent-action)] text-[var(--text-inverse)]"
              : "bg-[var(--color-line-soft)] text-[var(--text-muted)]"
        )}
      >
        {complete ? <CheckCircle2 aria-hidden="true" size={14} /> : number}
      </span>
      <h2 className={cn("font-display text-lg font-medium leading-heading", disabled ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]")}>
        {title}
      </h2>
      {complete && onChange ? (
        <button
          type="button"
          className="ml-auto text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          onClick={onChange}
        >
          Change
        </button>
      ) : null}
    </div>
  )
}

function StepConnector({ muted }: { muted?: boolean }) {
  return (
    <div className="hidden h-10 pl-[11px] sm:flex">
      <span className={cn("w-px", muted ? "bg-[var(--border-subtle)]" : "bg-[var(--border-default)]")} />
    </div>
  )
}

function ConfirmedSummary({
  icon: Icon,
  title,
  label
}: {
  icon: typeof FileText
  title: string
  label: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-[var(--border-success)] bg-[var(--bg-success)] px-4 py-3">
      <Icon aria-hidden="true" size={16} className="text-[var(--text-success)]" />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--text-primary)]">{title}</span>
      <Badge variant="strong">{label}</Badge>
    </div>
  )
}

function ResumeStep({
  selectedResume,
  resumeSignals,
  resumeValidation,
  isParsing,
  parsePhase,
  parseStep,
  fileInputRef,
  onUpload,
  onOpenPicker,
  onDelete,
  onConfirm
}: {
  selectedResume?: ResumeAsset
  resumeSignals: ResumeSignals | null
  resumeValidation: ReturnType<typeof validateResumeText> | null
  isParsing: boolean
  parsePhase: ParsePhase
  parseStep: number
  fileInputRef: RefObject<HTMLInputElement>
  onUpload: (file: File | undefined) => void
  onOpenPicker: () => void
  onDelete: () => void
  onConfirm: () => void
}) {
  const hasResume = Boolean(selectedResume && resumeSignals && resumeValidation)

  return (
    <div className="grid gap-3">
      <div className={cn(
        "flex items-center justify-between gap-4 rounded-md border px-4 py-4",
        isParsing ? "border-[var(--border-info)] bg-[var(--bg-info)]" : hasResume ? "border-[var(--border-default)] bg-[var(--bg-surface)]" : "border-dashed border-[var(--border-default)] bg-[var(--bg-page-soft)]"
      )}>
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-md",
            isParsing ? "bg-[var(--bg-surface)] text-[var(--text-info)]" : hasResume ? "bg-[var(--bg-success)] text-[var(--text-success)]" : "bg-[var(--bg-surface)] text-[var(--text-secondary)]"
          )}>
            {isParsing ? <Loader2 aria-hidden="true" className="animate-spin" size={17} /> : <FileText aria-hidden="true" size={17} />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
              {isParsing ? "Processing resume" : selectedResume?.title ?? "No resume selected"}
            </span>
            <span className="mt-1 block font-mono text-[10px] text-[var(--text-muted)]">
              {isParsing ? parseSteps[parseStep] : selectedResume?.meta ?? "PDF, .txt, or .md"}
            </span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onOpenPicker} disabled={isParsing}>
            {hasResume ? "Change" : "Add resume"}
          </Button>
          {selectedResume?.source === "uploaded" ? (
            <Button type="button" variant="danger" size="sm" onClick={onDelete} disabled={isParsing}>
              <Trash2 aria-hidden="true" size={15} />
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      <input
        ref={fileInputRef}
        className="sr-only"
        type="file"
        accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
        onChange={(event) => {
          onUpload(event.target.files?.[0])
          event.currentTarget.value = ""
        }}
      />
      {hasResume ? (
        <p className="text-xs leading-body text-[var(--text-muted)]">
          Contact details are removed before the AI preview.
        </p>
      ) : null}
      {resumeValidation && resumeValidation.errors.length > 0 ? (
        <p className="rounded-md bg-[var(--bg-danger)] px-3 py-2 text-xs leading-body text-[var(--text-danger)]">
          {resumeValidation.errors[0]}
        </p>
      ) : null}

      {isParsing ? (
        <ParsingSteps phase={parsePhase} parseStep={parseStep} />
      ) : resumeSignals ? (
        <ResumeSignalCard resumeSignals={resumeSignals} />
      ) : null}

      <Button type="button" className="w-fit px-6" disabled={isParsing || !resumeValidation?.valid} onClick={onConfirm}>
        Confirm resume
        <ChevronRight aria-hidden="true" size={15} />
      </Button>
    </div>
  )
}

function ParsingSteps({
  phase,
  parseStep
}: {
  phase: ParsePhase
  parseStep: number
}) {
  return (
    <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Loader2 aria-hidden="true" className="animate-spin text-[var(--text-primary)]" size={15} />
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          {phase === "uploading" ? "Uploading resume" : "Extracting interview signals"}
        </span>
      </div>
      <div className="grid gap-2">
        {parseSteps.slice(0, parseStep + 1).map((step, index) => {
          const done = index < parseStep
          const active = index === parseStep
          return (
            <div
              key={step}
              className={cn("flex items-center gap-2 text-sm transition-opacity", done ? "opacity-55" : "opacity-100")}
            >
              {done ? (
                <CheckCircle2 aria-hidden="true" size={14} className="text-[var(--text-success)]" />
              ) : active ? (
                <Loader2 aria-hidden="true" className="animate-spin text-[var(--text-primary)]" size={14} />
              ) : null}
              <span className={active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}>{step}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ResumeSignalCard({
  resumeSignals
}: {
  resumeSignals: ResumeSignals
}) {
  const previewLines = formatResumePreviewLines(resumeSignals.sanitizedText)

  return (
    <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      <div className="mb-4 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
        AI resume material - private fields removed
      </div>
      <div className="max-h-[420px] overflow-y-auto rounded-md border border-[var(--border-subtle)] bg-[var(--bg-page-soft)] px-4 py-3">
        <div className="space-y-2 text-sm leading-body text-[var(--text-secondary)]">
          {previewLines.map((line, index) => (
            line.type === "heading" ? (
              <p
                key={`${line.text}-${index}`}
                className={cn(index === 0 ? "pt-0" : "pt-3", "font-semibold text-[var(--text-primary)]")}
              >
                {line.text}
              </p>
            ) : (
              <p key={`${line.text}-${index}`} className="whitespace-pre-wrap">
                {line.text}
              </p>
            )
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-page-soft)] p-4 sm:grid-cols-[auto_1fr]">
        <ShieldCheck aria-hidden="true" className="mt-0.5 text-[var(--text-success)]" size={16} />
        <div>
          <p className="text-sm font-medium leading-body text-[var(--text-secondary)]">
            Private-looking fields are excluded from this interview preview.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {resumeSignals.stripped.map((field) => (
              <span
                key={field}
                className="rounded-[var(--radius-xs)] border border-[var(--border-subtle)] bg-[var(--color-paper-deep)] px-2 py-1 text-xs text-[var(--text-muted)]"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function formatResumePreviewLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      text: isResumeSectionHeading(line) ? toSectionTitle(line) : line,
      type: isResumeSectionHeading(line) ? "heading" as const : "body" as const
    }))
}

function isResumeSectionHeading(line: string) {
  return /^(profile summary|summary|professional summary|work experience|professional experience|experience|employment|work history|selected projects|projects|project experience|education|skills|technical skills|core skills|results|certifications|languages)$/i.test(line)
}

function toSectionTitle(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim().toLowerCase()
  if (normalized === "profile summary" || normalized === "professional summary") return "Summary"
  if (normalized === "work experience" || normalized === "experience" || normalized === "employment" || normalized === "work history") {
    return "Professional Experience"
  }

  return normalized
    .split(" ")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ")
}

function TargetRoleStep({
  roleMode,
  jdText,
  companyName,
  quickRole,
  roleValid,
  onRoleModeChange,
  onJdTextChange,
  onCompanyNameChange,
  onQuickRoleChange,
  onOpenJdPicker
}: {
  roleMode: RoleMode
  jdText: string
  companyName: string
  quickRole: string
  roleValid: boolean
  onRoleModeChange: (mode: RoleMode) => void
  onJdTextChange: (value: string) => void
  onCompanyNameChange: (value: string) => void
  onQuickRoleChange: (value: string) => void
  onOpenJdPicker: () => void
}) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-secondary)]">
          {roleMode === "quick"
            ? "Select a role. OfferUp will use a general benchmark."
            : "Paste the JD for more precise, personalized questions."}
        </p>
        <button
          type="button"
          className="shrink-0 text-sm font-semibold text-[var(--text-success)]"
          onClick={() => onRoleModeChange(roleMode === "quick" ? "jd" : "quick")}
        >
          {roleMode === "quick" ? "Paste JD" : "No JD"} <span aria-hidden="true">→</span>
        </button>
      </div>

      {roleMode === "quick" ? (
        <div className="flex flex-wrap gap-2">
          {genericRoles.map((role) => {
            const selected = quickRole === role
            return (
              <button
                key={role}
                type="button"
                className={cn(
                  "rounded-pill border px-4 py-2 text-sm font-medium transition-colors",
                  selected
                    ? "border-[var(--accent-action)] bg-[var(--accent-action)] text-[var(--text-inverse)]"
                    : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--state-hover-bg)] hover:text-[var(--text-primary)]"
                )}
                onClick={() => onQuickRoleChange(role)}
              >
                {role}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">Job description</span>
            <button
              type="button"
              className="text-sm font-semibold text-[var(--text-success)]"
              onClick={onOpenJdPicker}
            >
              Previous <span aria-hidden="true">→</span>
            </button>
          </div>
          <Textarea
            value={jdText}
            rows={5}
            maxLength={3000}
            className="min-h-[150px] resize-none bg-[var(--bg-surface)]"
            placeholder="Paste job description from LinkedIn, Stepstone, or company site..."
            onChange={(event) => onJdTextChange(event.target.value.slice(0, 3000))}
          />
          {jdText.trim().length >= 50 ? (
            <input
              value={companyName}
              className="h-10 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm outline-none transition-[border-color,box-shadow] focus:border-[var(--border-success)] focus:shadow-[var(--focus-ring)]"
              placeholder="Company name (optional - used in interview intro)"
              onChange={(event) => onCompanyNameChange(event.target.value)}
            />
          ) : null}
          <div className="text-right font-mono text-[10px] text-[var(--text-muted)]">{jdText.length} / 3,000</div>
        </div>
      )}

      {!roleValid ? (
        <p className="text-xs leading-body text-[var(--text-muted)]">
          {roleMode === "quick" ? "Choose a role to continue." : "Paste at least 50 characters from the job description."}
        </p>
      ) : null}
    </div>
  )
}

function SessionSettingsStep({
  focusType,
  level,
  onFocusTypeChange,
  onLevelChange
}: {
  focusType: SetupFocusType
  level: SetupLevel
  onFocusTypeChange: (value: SetupFocusType) => void
  onLevelChange: (value: SetupLevel) => void
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border-2 border-[var(--border-success)] bg-[var(--bg-success)] p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold text-[var(--text-primary)]">Focused Practice</span>
            <span className="font-mono text-[10px] text-[var(--text-success)]">~12-18 min</span>
          </div>
          <p className="mt-2 font-mono text-[10px] leading-body text-[var(--text-success)]">
            3 main questions · AI follow-ups based on your answers
          </p>
        </div>
        <div className="relative rounded-md border-2 border-[var(--border-subtle)] p-4 opacity-[var(--state-locked-opacity)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-sm font-semibold text-[var(--text-muted)]">Full Interview Sim</span>
              <p className="mt-2 font-mono text-[10px] text-[var(--text-muted)]">Coming soon</p>
            </div>
            <Lock aria-hidden="true" size={13} className="text-[var(--text-muted)]" />
          </div>
        </div>
      </div>

      <div className="rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
        <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Question focus
        </div>
        <div className="grid gap-1">
          {focusTypes.map((focus) => {
            const selected = focusType === focus.id && !focus.locked
            return (
              <div key={focus.id} className={cn(focus.locked ? "opacity-40" : "")}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between gap-4 rounded-md px-3 py-2.5 text-left transition-colors",
                    selected ? "bg-[var(--accent-action)] text-[var(--text-inverse)]" : "hover:bg-[var(--state-hover-bg)]"
                  )}
                  disabled={focus.locked}
                  onClick={() => onFocusTypeChange(focus.id)}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="truncate text-sm font-semibold">{focus.label}</span>
                    {!focus.locked ? (
                      <span className={cn("font-mono text-[10px]", selected ? "text-[rgba(240,233,222,0.58)]" : "text-[var(--text-muted)]")}>
                        {focus.interviewer}
                      </span>
                    ) : null}
                  </span>
                  {focus.locked ? <Lock aria-hidden="true" size={13} /> : selected ? <CheckCircle2 aria-hidden="true" size={15} /> : null}
                </button>
                {selected ? (
                  <p className="px-3 pb-3 pt-1 text-sm leading-body text-[var(--text-secondary)]">
                    {focus.description}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
        <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Experience level
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {levels.map((item) => {
            const selected = level === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "rounded-md border px-3 py-3 text-center transition-colors",
                  selected
                    ? "border-[var(--accent-action)] bg-[var(--accent-action)] text-[var(--text-inverse)]"
                    : "border-[var(--border-default)] hover:bg-[var(--state-hover-bg)]"
                )}
                onClick={() => onLevelChange(item.id)}
              >
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className={cn("mt-1 block font-mono text-[10px]", selected ? "text-[rgba(240,233,222,0.58)]" : "text-[var(--text-muted)]")}>
                  {item.years}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SetupSummaryBar({
  canStart,
  focus,
  level,
  duration,
  disabledReason,
  onStart
}: {
  canStart: boolean
  focus: string
  level: string
  duration: string
  disabledReason: string
  onStart: () => void
}) {
  const items = [
    { label: "Mode", value: "Focused Practice" },
    { label: "Focus", value: focus },
    { label: "Level", value: level },
    { label: "Time", value: duration }
  ]

  return (
    <div className="fixed bottom-2 left-[calc(44px+1rem)] right-2 z-20 rounded-b-[var(--layout-shell-radius)] border-t border-[var(--border-default)] bg-[var(--bg-page-soft)] px-5 py-4 shadow-[0_-10px_24px_rgba(41,36,31,0.05)] sm:px-8 md:bottom-3 md:left-[calc(208px+1.5rem)] md:right-3">
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:flex sm:items-center sm:gap-8">
          {items.map((item) => (
            <div key={item.label}>
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--text-muted)]">{item.label}</div>
              <div className={cn("mt-1 text-sm font-semibold", canStart ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <Button type="button" className="h-12 px-7" disabled={!canStart} onClick={onStart}>
            <Sparkles aria-hidden="true" size={16} />
            Start interview
          </Button>
          {!canStart ? (
            <span className="text-xs text-[var(--text-secondary)]">{disabledReason}</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ResumePickerModal({
  open,
  resumes,
  selectedResumeId,
  onClose,
  onSelect,
  onUpload
}: {
  open: boolean
  resumes: ResumeAsset[]
  selectedResumeId: string | null
  onClose: () => void
  onSelect: (resumeId: string) => void
  onUpload: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(41,36,31,0.28)] p-4 backdrop-blur-[3px]" onClick={onClose}>
      <div
        className="w-full max-w-[420px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-page-soft)] p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg leading-heading">Choose resume</h2>
            <p className="mt-1 text-sm leading-body text-[var(--text-secondary)]">
              Previously saved resumes for this setup.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close resume picker">
            <X aria-hidden="true" size={15} />
          </Button>
        </div>

        <div className="grid gap-2">
          {resumes.map((resume) => {
            const selected = selectedResumeId === resume.id
            return (
              <button
                key={resume.id}
                type="button"
                className={cn(
                  "flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-left transition-colors",
                  selected ? "border-[var(--border-success)] bg-[var(--bg-success)]" : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--state-hover-bg)]"
                )}
                onClick={() => onSelect(resume.id)}
              >
                <span>
                  <span className="block text-sm font-semibold text-[var(--text-primary)]">{resume.title}</span>
                  <span className="mt-1 block font-mono text-[10px] text-[var(--text-muted)]">{resume.meta}</span>
                </span>
                {selected ? <Badge variant="strong">Active</Badge> : null}
              </button>
            )
          })}
        </div>

        <Button type="button" variant="secondary" className="mt-4 w-full border border-dashed border-[var(--border-default)]" onClick={onUpload}>
          Upload PDF, .txt, or .md resume
        </Button>
      </div>
    </div>
  )
}

function JdPickerModal({
  open,
  onClose,
  onSelect
}: {
  open: boolean
  onClose: () => void
  onSelect: (content: string) => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(41,36,31,0.28)] p-4 backdrop-blur-[3px]" onClick={onClose}>
      <div
        className="w-full max-w-[420px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-page-soft)] p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-lg leading-heading">Previous JDs</h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close JD picker">
            <X aria-hidden="true" size={15} />
          </Button>
        </div>
        <div className="grid gap-2">
          {savedJds.map((jd) => (
            <button
              key={jd.id}
              type="button"
              className="flex items-center justify-between gap-4 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3 text-left transition-colors hover:bg-[var(--state-hover-bg)]"
              onClick={() => onSelect(jd.content)}
            >
              <span className="text-sm font-semibold text-[var(--text-primary)]">{jd.label}</span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">{jd.updated}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

async function readResumeFile(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/setup/parse-resume", {
    method: "POST",
    body: formData
  })
  const payload = await response.json() as { text?: string; error?: string }

  if (!response.ok || !payload.text) {
    throw new Error(payload.error ?? "Resume upload failed.")
  }

  return payload.text
}
