"use client"

import { useEffect, useMemo, useRef, useState, type RefObject } from "react"
import {
  ArrowRight,
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  GraduationCap,
  Home,
  Library,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wrench
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/panel"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type ResumeAsset = {
  id: string
  title: string
  meta: string
  source: "library" | "uploaded"
  content: string
}

type SignalState = "ready" | "warning" | "waiting" | "scanning"
type ParsePhase = "idle" | "uploading" | "extracting"
type SetupStage = "choose" | "review"
type ResumeModuleKey = "summary" | "work" | "skills" | "education" | "projects"
type ExtractedResumeItem = {
  title: string
  meta?: string
  points: string[]
}
type ExtractedResumeSection = {
  key: ResumeModuleKey
  label: string
  count: number
  items: ExtractedResumeItem[]
}

const defaultResumes: ResumeAsset[] = [
  {
    id: "last-used",
    title: "Product / AI resume",
    meta: "Last used",
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

const resumeKeywords = {
  summary: /(profile summary|summary|about|简介|个人总结|自我介绍)/i,
  work: /(work experience|experience|company|intern|worked|managed|led|role|工作|实习|负责|经历)/i,
  education: /(education|university|school|degree|bachelor|master|课程|教育|大学|学校|学位)/i,
  skill: /(skills|typescript|react|python|sql|figma|research|analysis|communication|技能|能力)/i,
  project: /(selected projects|project|built|launched|created|implemented|designed|developed|项目|上线|设计|开发)/i
}

const resumeModuleDefinitions = [
  {
    key: "summary",
    label: "Summary",
    scanning: "Looking for positioning summary",
    ready: "Summary found",
    missing: "No summary found",
    icon: FileText
  },
  {
    key: "work",
    label: "Working experience",
    scanning: "Checking work experience",
    ready: "Working experience found",
    missing: "Add role, team, or responsibility",
    icon: BriefcaseBusiness
  },
  {
    key: "education",
    label: "Education experience",
    scanning: "Checking education background",
    ready: "Education experience found",
    missing: "Optional, add school or degree if useful",
    icon: GraduationCap
  },
  {
    key: "skills",
    label: "Skills",
    scanning: "Checking skills and tools",
    ready: "Skills found",
    missing: "Add tools, methods, or strengths",
    icon: Wrench
  },
  {
    key: "projects",
    label: "Projects",
    scanning: "Checking project experience",
    ready: "Project experience found",
    missing: "Add one concrete project if possible",
    icon: Sparkles
  }
] as const

export function SetupFlow() {
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [resumes, setResumes] = useState(defaultResumes)
  const [selectedResumeId, setSelectedResumeId] = useState(defaultResumes[0].id)
  const [pickerOpen, setPickerOpen] = useState(searchParams.get("panel") === "resumes")
  const [parsePhase, setParsePhase] = useState<ParsePhase>("idle")
  const [scanProgress, setScanProgress] = useState<number>(resumeModuleDefinitions.length)
  const [stage, setStage] = useState<SetupStage>("choose")
  const [activeModule, setActiveModule] = useState<ResumeModuleKey>("work")
  const [expandedItem, setExpandedItem] = useState(0)
  const [notice, setNotice] = useState("")

  const selectedResume = resumes.find((resume) => resume.id === selectedResumeId) ?? resumes[0]
  const analysis = useMemo(() => analyzeResume(selectedResume.content), [selectedResume.content])
  const extractedText = useMemo(() => buildExtractedText(selectedResume.content), [selectedResume.content])
  const extractedSections = useMemo(() => extractResumeSections(selectedResume.content), [selectedResume.content])
  const isParsing = parsePhase !== "idle"
  const canContinue = analysis.wordCount >= 40 && !isParsing

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(""), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  function chooseResume(resumeId: string) {
    setSelectedResumeId(resumeId)
    setPickerOpen(false)
    setStage("choose")
    setActiveModule("work")
    setExpandedItem(0)
    setScanProgress(resumeModuleDefinitions.length)
    setNotice("Resume selected. Review the extracted information before continuing.")
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return

    setParsePhase("uploading")
    setScanProgress(0)
    const content = await readResumeFile(file)
    const uploadedResume: ResumeAsset = {
      id: `uploaded-${Date.now()}`,
      title: file.name.replace(/\.[^.]+$/, "") || "Uploaded resume",
      meta: "Uploaded just now",
      source: "uploaded",
      content
    }

    window.setTimeout(() => {
      setParsePhase("extracting")
      resumeModuleDefinitions.forEach((_, index) => {
        window.setTimeout(() => setScanProgress(index + 1), 260 * (index + 1))
      })
    }, 520)

    window.setTimeout(() => {
      setResumes((current) => [uploadedResume, ...current])
      setSelectedResumeId(uploadedResume.id)
      setParsePhase("idle")
      setStage("review")
      setActiveModule("work")
      setExpandedItem(0)
      setScanProgress(resumeModuleDefinitions.length)
      setNotice("Upload complete. OfferUp extracted the interview-relevant information below.")
    }, 2100)
  }

  function handleDeleteSelected() {
    if (selectedResume.source !== "uploaded") return

    setResumes((current) => current.filter((resume) => resume.id !== selectedResume.id))
    setSelectedResumeId(defaultResumes[0].id)
    setStage("choose")
    setActiveModule("work")
    setExpandedItem(0)
    setScanProgress(resumeModuleDefinitions.length)
    setNotice("Uploaded resume removed. Last used resume is selected again.")
  }

  function handleContinue() {
    if (!canContinue) return
    setNotice("Resume confirmed. JD setup will come next.")
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-120px)] w-full max-w-[1080px] gap-6 xl:grid-cols-[minmax(0,720px)_300px] xl:justify-center">
      <main className="grid content-start gap-7">
        {stage === "choose" ? (
          <ResumeChooseStep
            selectedResume={selectedResume}
            analysis={analysis}
            canContinue={canContinue}
            isParsing={isParsing}
            notice={notice}
            fileInputRef={fileInputRef}
            onUpload={handleUpload}
            onOpenLibrary={() => setPickerOpen(true)}
            onDelete={handleDeleteSelected}
            onReview={() => setStage("review")}
            parsePhase={parsePhase}
            scanProgress={scanProgress}
          />
        ) : (
          <ResumeReviewStep
            selectedResume={selectedResume}
            analysis={analysis}
            extractedText={extractedText}
            sections={extractedSections}
            activeModule={activeModule}
            expandedItem={expandedItem}
            notice={notice}
            onSelectModule={(key) => {
              setActiveModule(key)
              setExpandedItem(0)
            }}
            onToggleItem={(index) => setExpandedItem((current) => (current === index ? -1 : index))}
            onBack={() => setStage("choose")}
            onContinue={handleContinue}
            canContinue={canContinue}
          />
        )}
      </main>

      <ProgressRail currentStage={stage} canContinue={canContinue} />

      <ResumeLibraryDrawer
        open={pickerOpen}
        resumes={resumes}
        selectedResumeId={selectedResumeId}
        onClose={() => setPickerOpen(false)}
        onSelect={chooseResume}
      />
    </div>
  )
}

function ResumeChooseStep({
  selectedResume,
  analysis,
  canContinue,
  isParsing,
  notice,
  fileInputRef,
  onUpload,
  onOpenLibrary,
  onDelete,
  onReview,
  parsePhase,
  scanProgress
}: {
  selectedResume: ResumeAsset
  analysis: ReturnType<typeof analyzeResume>
  canContinue: boolean
  isParsing: boolean
  notice: string
  fileInputRef: RefObject<HTMLInputElement>
  onUpload: (file: File | undefined) => void
  onOpenLibrary: () => void
  onDelete: () => void
  onReview: () => void
  parsePhase: ParsePhase
  scanProgress: number
}) {
  return (
    <>
      <header className="grid gap-3">
        <h1 className="font-display text-xl leading-heading">Choose your resume</h1>
        <p className="max-w-readable text-base leading-body text-[var(--text-secondary)]">
          We will use only interview-relevant content and ignore private contact details.
        </p>
      </header>

      <section className="grid gap-5">
        <button
          type="button"
          className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md bg-[var(--bg-surface)] p-4 text-left shadow-[inset_0_0_0_1px_var(--border-strong)] transition-colors duration-base hover:bg-[var(--state-hover-bg)]"
          onClick={onOpenLibrary}
        >
          <span className="flex size-11 items-center justify-center rounded-md bg-[var(--bg-surface-muted)] text-[var(--text-secondary)] shadow-[inset_0_0_0_1px_var(--border-subtle)]">
            <FileText aria-hidden="true" size={20} />
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate text-base font-semibold text-[var(--text-primary)]">{selectedResume.title}</span>
              <Badge variant="neutral">{selectedResume.source === "uploaded" ? "Uploaded" : "Active"}</Badge>
            </span>
            <span className="mt-1 block text-sm leading-body text-[var(--text-secondary)]">
              {selectedResume.meta} · {analysis.wordCount} words
            </span>
          </span>
          <span className="flex size-7 items-center justify-center rounded-pill bg-[var(--accent-action)] text-[var(--text-inverse)]">
            <Check aria-hidden="true" size={14} />
          </span>
        </button>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <RefreshCcw aria-hidden="true" size={16} />
            Upload new resume
          </Button>
          <Button type="button" variant="secondary" onClick={onOpenLibrary}>
            <Library aria-hidden="true" size={16} />
            Choose from history
          </Button>
          {selectedResume.source === "uploaded" ? (
            <Button type="button" variant="danger" onClick={onDelete}>
              <Trash2 aria-hidden="true" size={16} />
              Delete uploaded resume
            </Button>
          ) : null}
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept=".txt,.md,.pdf,.doc,.docx"
            onChange={(event) => onUpload(event.target.files?.[0])}
          />
        </div>

        {isParsing ? (
          <ParsingState phase={parsePhase} analysis={analysis} scanProgress={scanProgress} />
        ) : (
          <div className="grid max-w-readable grid-cols-[auto_1fr] gap-3 rounded-md bg-[var(--bg-surface-muted)] p-4 text-sm leading-body text-[var(--text-secondary)] shadow-[inset_0_0_0_1px_var(--border-subtle)]">
            <ShieldCheck aria-hidden="true" className="mt-1 text-[var(--text-secondary)]" size={16} />
            <p>
              <span className="font-semibold text-[var(--text-primary)]">Privacy:</span> Names, email, phone numbers,
              addresses, and links are stripped before question generation. Only professional content is used.
            </p>
          </div>
        )}

        {notice ? (
          <p className="max-w-readable rounded-md bg-[var(--bg-info)] px-3 py-2 text-sm text-[var(--text-info)] shadow-[inset_0_0_0_1px_var(--border-info)]">
            {notice}
          </p>
        ) : null}

        <div className="flex justify-end pt-1">
          <Button type="button" disabled={!canContinue || isParsing} onClick={onReview}>
            Review extracted content
            <ArrowRight aria-hidden="true" size={16} />
          </Button>
        </div>
      </section>
    </>
  )
}

function ResumeReviewStep({
  selectedResume,
  analysis,
  extractedText,
  sections,
  activeModule,
  expandedItem,
  notice,
  onSelectModule,
  onToggleItem,
  onBack,
  onContinue,
  canContinue
}: {
  selectedResume: ResumeAsset
  analysis: ReturnType<typeof analyzeResume>
  extractedText: string
  sections: Record<ResumeModuleKey, ExtractedResumeSection>
  activeModule: ResumeModuleKey
  expandedItem: number
  notice: string
  onSelectModule: (key: ResumeModuleKey) => void
  onToggleItem: (index: number) => void
  onBack: () => void
  onContinue: () => void
  canContinue: boolean
}) {
  const activeSection = sections[activeModule]
  const moduleItems = moduleItemsFromAnalysis(analysis, resumeModuleDefinitions.length)

  return (
    <>
      <header className="grid gap-3">
        <h1 className="font-display text-xl leading-heading">Choose your resume</h1>
        <p className="max-w-readable text-base leading-body text-[var(--text-secondary)]">
          We will use only interview-relevant content and ignore private contact details.
        </p>
      </header>

      <section className="grid gap-4">
        <Panel className="grid gap-5 border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.30)]">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
            <span className="flex size-9 items-center justify-center rounded-md bg-[var(--bg-surface)] text-[var(--text-secondary)] shadow-[inset_0_0_0_1px_var(--border-subtle)]">
              <FileText aria-hidden="true" size={18} />
            </span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-semibold text-[var(--text-primary)]">{selectedResume.title}</span>
                <Badge variant="neutral">Selected resume</Badge>
              </span>
              <span className="mt-1 block text-xs leading-body text-[var(--text-secondary)]">
                {selectedResume.meta} · {analysis.wordCount} words
              </span>
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={onBack}>
              Change
            </Button>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <div className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Review extracted content
              </div>
              <h2 className="font-display text-xl leading-heading">Confirm what we extracted</h2>
              <p className="max-w-readable text-sm leading-body text-[var(--text-secondary)]">
                Check the resume signals before setting the target role.
              </p>
            </div>

            <ModuleTabs
              sections={sections}
              activeModule={activeModule}
              moduleItems={moduleItems}
              onSelectModule={onSelectModule}
            />

            <div className="rounded-md bg-[var(--bg-surface)] p-4 shadow-[inset_0_0_0_1px_var(--border-subtle)]">
              <div className="grid gap-0">
                {activeSection.items.length > 0 ? (
                  activeSection.items.map((item, index) => {
                    const expanded = expandedItem === index
                    return (
                      <button
                        key={`${activeSection.key}-${item.title}-${index}`}
                        type="button"
                        className={cn(
                          "grid w-full gap-2 border-b border-[var(--border-subtle)] py-3 text-left last:border-b-0",
                          index === 0 ? "pt-0" : ""
                        )}
                        onClick={() => onToggleItem(index)}
                      >
                        <span className="flex items-start justify-between gap-4">
                          <span>
                            <span className="block text-sm font-semibold leading-heading text-[var(--text-primary)]">
                              {item.title}
                            </span>
                            {item.meta ? (
                              <span className="mt-1 block text-xs font-medium leading-body text-[var(--text-secondary)]">
                                {item.meta}
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-0.5 text-[var(--text-secondary)]">
                            {expanded ? <ChevronUp aria-hidden="true" size={16} /> : <ChevronDown aria-hidden="true" size={16} />}
                          </span>
                        </span>
                        {expanded ? (
                          <ul className="ml-5 grid list-disc gap-1.5 pt-1 text-sm leading-body text-[var(--text-secondary)]">
                            {item.points.map((point) => (
                              <li key={point}>{point}</li>
                            ))}
                          </ul>
                        ) : null}
                      </button>
                    )
                  })
                ) : (
                  <div className="rounded-md bg-[var(--bg-warning)] p-4 text-sm leading-body text-[var(--text-warning)] shadow-[inset_0_0_0_1px_var(--border-warning)]">
                    We did not find a clear {activeSection.label.toLowerCase()} section. You can continue, but adding this detail later may improve the interview questions.
                  </div>
                )}
              </div>
            </div>
          </div>

          <details className="rounded-md bg-[var(--bg-surface-muted)] p-3 shadow-[inset_0_0_0_1px_var(--border-subtle)]">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">
              View plain extracted text
            </summary>
            <Textarea
              className="mt-3 min-h-[160px] resize-none font-mono text-xs leading-[1.58]"
              value={extractedText}
              readOnly
            />
          </details>

          {notice ? (
            <p className="rounded-md bg-[var(--bg-info)] px-3 py-2 text-sm text-[var(--text-info)] shadow-[inset_0_0_0_1px_var(--border-info)]">
              {notice}
            </p>
          ) : null}

          <footer className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
            <Button type="button" variant="ghost" onClick={onBack}>
              <ArrowLeft aria-hidden="true" size={16} />
              Back
            </Button>
            <Button type="button" disabled={!canContinue} onClick={onContinue}>
              Set target role
              <ArrowRight aria-hidden="true" size={16} />
            </Button>
          </footer>
        </Panel>
      </section>
    </>
  )
}

function ModuleTabs({
  sections,
  activeModule,
  moduleItems,
  onSelectModule
}: {
  sections: Record<ResumeModuleKey, ExtractedResumeSection>
  activeModule: ResumeModuleKey
  moduleItems: Array<{ label: string; detail: string; state: SignalState }>
  onSelectModule: (key: ResumeModuleKey) => void
}) {
  const tabs: Array<{ key: ResumeModuleKey; label: string; icon: typeof FileText }> = [
    { key: "work", label: "Experience", icon: BriefcaseBusiness },
    { key: "skills", label: "Skills", icon: Wrench },
    { key: "education", label: "Education", icon: GraduationCap },
    { key: "projects", label: "Projects", icon: Sparkles },
    { key: "summary", label: "Summary", icon: FileText }
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const active = activeModule === tab.key
        const status = moduleItems.find((item) => item.label === sections[tab.key].label)?.state
        return (
          <button
            key={tab.key}
            type="button"
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-base shadow-[inset_0_0_0_1px_var(--border-default)]",
              active
                ? "bg-[var(--accent-action)] text-[var(--text-inverse)] shadow-none"
                : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--state-hover-bg)]",
              status === "warning" && !active ? "shadow-[inset_0_0_0_1px_var(--border-warning)]" : ""
            )}
            onClick={() => onSelectModule(tab.key)}
          >
            <Icon aria-hidden="true" size={16} />
            {tab.label}
            <span className={cn(active ? "text-[var(--text-inverse)]" : "text-[var(--text-muted)]")}>
              {sections[tab.key].count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function ProgressRail({
  currentStage,
  canContinue
}: {
  currentStage: SetupStage
  canContinue: boolean
}) {
  const steps = [
    {
      id: "resume",
      title: "Resume",
      description: "Select and confirm resume",
      status: currentStage === "review" ? "complete" : "current",
      icon: FileText
    },
    {
      id: "review",
      title: "Review",
      description: "Verify extracted content",
      status: currentStage === "review" ? "current" : "upcoming",
      icon: Check
    },
    {
      id: "target",
      title: "Target Role",
      description: "Set role or paste JD",
      status: "upcoming",
      icon: BriefcaseBusiness
    },
    {
      id: "start",
      title: "Start",
      description: "Review and begin interview",
      status: "upcoming",
      icon: ArrowRight
    }
  ] as const

  return (
    <aside className="sticky top-5 grid h-fit gap-4">
      <Panel className="grid gap-5 border border-[var(--border-default)] bg-[rgba(255,255,255,0.34)]">
        <div>
          <h2 className="font-mono text-[length:var(--text-label)] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            Setup progress
          </h2>
        </div>

        <div className="grid gap-2">
          {steps.map((step) => {
            const active = step.status === "current"
            return (
              <div
                key={step.id}
                className="grid grid-cols-[auto_1fr] gap-3 rounded-md px-3 py-2"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-6 items-center justify-center rounded-pill",
                    step.status === "complete"
                      ? "bg-[var(--accent-action)] text-[var(--text-inverse)]"
                      : active
                        ? "border-2 border-[var(--accent-action)] bg-[var(--bg-surface)] text-[var(--accent-action)]"
                        : "border-2 border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)]"
                  )}
                >
                  {step.status === "complete" ? <Check aria-hidden="true" size={13} /> : active ? <span className="size-2 rounded-pill bg-[var(--accent-action)]" /> : null}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[var(--text-primary)]">{step.title}</span>
                  <span className="mt-0.5 block text-xs leading-body text-[var(--text-secondary)]">{step.description}</span>
                </span>
              </div>
            )
          })}
        </div>
      </Panel>

      <Button asChild variant="ghost" className="justify-start">
        <a href="/home">
          <Home aria-hidden="true" size={16} />
          Return home
        </a>
      </Button>
    </aside>
  )
}

function ParsingState({
  phase,
  analysis,
  scanProgress
}: {
  phase: ParsePhase
  analysis: ReturnType<typeof analyzeResume>
  scanProgress: number
}) {
  const modules = moduleItemsFromAnalysis(analysis, scanProgress)

  return (
    <section className="grid gap-5 rounded-md bg-[var(--bg-info)] p-5 shadow-[inset_0_0_0_1px_var(--border-info)]">
      <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
        <div className="flex size-12 items-center justify-center rounded-md bg-[var(--bg-surface)] text-[var(--text-info)] shadow-[inset_0_0_0_1px_var(--border-info)]">
          <Loader2 aria-hidden="true" className="animate-spin" size={22} />
        </div>
        <div>
          <Badge variant="neutral">{phase === "uploading" ? "Uploading" : "Extracting"}</Badge>
          <h2 className="mt-3 font-display text-xl leading-heading">
            {phase === "uploading" ? "Uploading your resume" : "Extracting resume modules"}
          </h2>
          <p className="mt-2 max-w-readable text-sm leading-body text-[var(--text-info)]">
            {phase === "uploading"
              ? "Saving the resume to the local library and preparing it for parsing."
              : "Checking summary, working experience, education, skills, and projects. Private details stay out of the interview context."}
          </p>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-pill bg-[var(--bg-surface-muted)]">
        <div
          className="h-full rounded-pill bg-[var(--accent-role)] transition-all duration-slow ease-standard"
          style={{ width: `${phase === "uploading" ? 24 : 24 + (scanProgress / resumeModuleDefinitions.length) * 76}%` }}
        />
      </div>
      <SignalList items={modules} compact />
    </section>
  )
}

function SignalList({
  items,
  compact = false
}: {
  items: Array<{ label: string; detail: string; state: SignalState }>
  compact?: boolean
}) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "grid grid-cols-[auto_1fr] gap-3 rounded-md bg-[var(--bg-surface-muted)] px-3 shadow-[inset_0_0_0_1px_var(--border-subtle)]",
            compact ? "py-2" : "py-2.5"
          )}
        >
          <StatusDot state={item.state} />
          <span>
            <span className="block text-sm font-medium text-[var(--text-primary)]">{item.label}</span>
            <span className="mt-0.5 block text-xs leading-body text-[var(--text-secondary)]">{item.detail}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

function StatusDot({ state }: { state: SignalState }) {
  return (
    <span
      className={cn(
        "mt-0.5 flex size-4 items-center justify-center rounded-pill border",
        state === "ready"
          ? "border-[var(--border-success)] bg-[var(--bg-success)] text-[var(--text-success)]"
          : state === "scanning"
            ? "border-[var(--border-info)] bg-[var(--bg-info)] text-[var(--text-info)]"
          : state === "warning"
            ? "border-[var(--border-warning)] bg-[var(--bg-warning)] text-[var(--text-warning)]"
            : "border-[var(--border-subtle)] text-[var(--text-muted)]"
      )}
    >
      {state === "ready" ? <Check aria-hidden="true" size={11} /> : null}
      {state === "scanning" ? <Loader2 aria-hidden="true" className="animate-spin" size={10} /> : null}
    </span>
  )
}

function ResumeLibraryDrawer({
  open,
  resumes,
  selectedResumeId,
  onClose,
  onSelect
}: {
  open: boolean
  resumes: ResumeAsset[]
  selectedResumeId: string
  onClose: () => void
  onSelect: (resumeId: string) => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-[rgba(41,36,31,0.18)] p-3 sm:p-5">
      <aside className="grid max-h-[calc(100vh-2rem)] w-full max-w-[520px] gap-4 overflow-y-auto rounded-lg bg-[var(--bg-surface)] p-5 shadow-float">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="neutral">Resume history</Badge>
            <h2 className="mt-3 font-display text-xl leading-heading">Choose from history</h2>
            <p className="mt-1 text-sm leading-body text-[var(--text-secondary)]">
              The selected resume becomes the source material for this interview setup.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close resume library">
            Close
          </Button>
        </div>

        <div className="grid gap-3">
          {resumes.map((resume) => (
            <button
              key={resume.id}
              type="button"
              className={cn(
                "grid gap-2 rounded-md border p-4 text-left transition-colors duration-base",
                selectedResumeId === resume.id
                  ? "border-[var(--border-success)] bg-[var(--bg-success)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface-muted)] hover:bg-[var(--state-hover-bg)]"
              )}
              onClick={() => onSelect(resume.id)}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{resume.title}</span>
                {selectedResumeId === resume.id ? <Check aria-hidden="true" size={15} /> : null}
              </span>
              <span className="text-xs text-[var(--text-muted)]">{resume.meta}</span>
              <span className="line-clamp-2 text-sm leading-body text-[var(--text-secondary)]">
                {summarizeContent(resume.content)}
              </span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}

function analyzeResume(text: string) {
  const trimmed = text.trim()
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : []

  return {
    wordCount: words.length,
    hasSummary: resumeKeywords.summary.test(trimmed),
    hasWork: resumeKeywords.work.test(trimmed),
    hasEducation: resumeKeywords.education.test(trimmed),
    hasSkill: resumeKeywords.skill.test(trimmed),
    hasProject: resumeKeywords.project.test(trimmed)
  }
}

function moduleItemsFromAnalysis(
  analysis: ReturnType<typeof analyzeResume>,
  scanProgress: number
) {
  const values = {
    summary: analysis.hasSummary,
    work: analysis.hasWork,
    education: analysis.hasEducation,
    skills: analysis.hasSkill,
    projects: analysis.hasProject
  }

  return resumeModuleDefinitions.map((module, index): { label: string; detail: string; state: SignalState } => {
    const finished = index < scanProgress
    const found = values[module.key]

    return {
      label: module.label,
      detail: finished ? (found ? module.ready : module.missing) : module.scanning,
      state: finished ? (found ? "ready" : "warning") : "scanning"
    }
  })
}

function buildExtractedText(content: string) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/(email|phone|tel|address|linkedin|github|portfolio|@)/i.test(line))

  return lines.join("\n")
}

function extractResumeSections(content: string): Record<ResumeModuleKey, ExtractedResumeSection> {
  const cleanText = buildExtractedText(content)
  const summaryLines = linesBetween(cleanText, ["PROFILE SUMMARY", "SUMMARY"], ["WORK EXPERIENCE", "EXPERIENCE", "SELECTED PROJECTS", "PROJECTS", "EDUCATION", "SKILLS"])
  const workLines = linesBetween(cleanText, ["WORK EXPERIENCE", "EXPERIENCE"], ["SELECTED PROJECTS", "PROJECTS", "EDUCATION", "SKILLS", "RESULTS"])
  const projectLines = linesBetween(cleanText, ["SELECTED PROJECTS", "PROJECTS"], ["EDUCATION", "SKILLS", "RESULTS"])
  const educationLines = linesBetween(cleanText, ["EDUCATION"], ["SKILLS", "RESULTS"])
  const skillLines = linesBetween(cleanText, ["SKILLS"], ["RESULTS"])

  return {
    summary: {
      key: "summary",
      label: "Summary",
      count: summaryLines.length > 0 ? 1 : 0,
      items: summaryLines.length > 0
        ? [{ title: "Positioning summary", points: summaryLines }]
        : []
    },
    work: {
      key: "work",
      label: "Working experience",
      count: groupedResumeItems(workLines, "Experience").length,
      items: groupedResumeItems(workLines, "Experience")
    },
    skills: {
      key: "skills",
      label: "Skills",
      count: splitSkills(skillLines).length,
      items: splitSkills(skillLines).map((skill) => ({ title: skill, points: ["Used as interview signal for role fit and follow-up questions."] }))
    },
    education: {
      key: "education",
      label: "Education experience",
      count: groupedResumeItems(educationLines, "Education").length,
      items: groupedResumeItems(educationLines, "Education")
    },
    projects: {
      key: "projects",
      label: "Projects",
      count: groupedResumeItems(projectLines, "Project").length,
      items: groupedResumeItems(projectLines, "Project")
    }
  }
}

function linesBetween(text: string, startHeadings: string[], endHeadings: string[]) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean)
  const startIndex = lines.findIndex((line) => startHeadings.some((heading) => line.toUpperCase() === heading))

  if (startIndex === -1) return []

  const endIndex = lines.findIndex((line, index) => (
    index > startIndex && endHeadings.some((heading) => line.toUpperCase() === heading)
  ))

  return lines.slice(startIndex + 1, endIndex === -1 ? lines.length : endIndex)
}

function groupedResumeItems(lines: string[], fallbackTitle: string): ExtractedResumeItem[] {
  const groups: ExtractedResumeItem[] = []
  let current: ExtractedResumeItem | null = null

  lines.forEach((line) => {
    if (line.startsWith("-")) {
      const point = line.replace(/^-\s*/, "").trim()
      if (!current) current = { title: fallbackTitle, points: [] }
      current.points.push(point)
      return
    }

    if (current) groups.push(current)
    current = { title: line, points: [] }
  })

  if (current) groups.push(current)

  return groups
    .map((group) => ({
      ...group,
      meta: group.points.length > 0 ? undefined : "Extracted from resume",
      points: group.points.length > 0 ? group.points : ["This section was detected and can shape interview context."]
    }))
    .filter((group) => group.title.trim().length > 0)
}

function splitSkills(lines: string[]) {
  return lines
    .join(" ")
    .split(/,|·|;/)
    .map((skill) => skill.trim())
    .filter(Boolean)
}

async function readResumeFile(file: File) {
  if (file.type.includes("text") || /\.(txt|md)$/i.test(file.name)) {
    return file.text()
  }

  return `PROFILE SUMMARY
Uploaded resume file: ${file.name}

WORK EXPERIENCE
- Add or confirm extracted work experience from this uploaded resume.
- OfferUp will use role, project, responsibility, and outcome information for interview questions.

SELECTED PROJECTS
- Uploaded material is ready for review after parsing.

EDUCATION
- Add education background, degree, school, or training if relevant.

SKILLS
- Add skills, tools, methods, and strengths from the uploaded resume.
`
}

function summarizeContent(content: string) {
  const compact = content.replace(/\s+/g, " ").trim()
  return compact.length > 150 ? `${compact.slice(0, 150)}...` : compact
}
