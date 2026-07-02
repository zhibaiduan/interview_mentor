import {
  validateResumeText,
  validateTargetRole,
  type FollowUpIntensity,
  type SessionConfig,
  type SetupLevel
} from "./setup-validation"

export type InterviewerAgent = "hr" | "hiring_manager" | "combined"
export type SessionFocusType =
  | "resume_deep_dive"
  | "behavioral"
  | "motivation_fit"
  | "culture_collaboration"
  | "situational"

export type CreateSessionRequest = {
  setup_request_id: string
  resume_title?: string
  session_config: SessionConfig
}

export type CreateSessionResponse = {
  session_id: string
  credit_balance: number | null
  interviewer: InterviewerProfile
}

export type GenerateQuestionsRequest = {
  session_id: string
}

export type QuestionSeed = {
  chain_index: number
  main_question: string
  question_intent: string
  resume_reference: string
}

export type GenerateQuestionsResponse = {
  session_id: string
  questions: QuestionSeed[]
}

export type SessionExchange = {
  id: string
  role: "interviewer" | "candidate"
  content: string
  is_followup: boolean
  client_message_id?: string
  created_at: string
}

export type SubmitAnswerRequest = {
  session_id: string
  chain_index: number
  answer_text: string
  client_message_id: string
}

export type SubmitAnswerResponse = {
  session_id: string
  chain_index: number
  exchanges: SessionExchange[]
  next_action: "follow_up" | "next_question" | "end"
  next_chain_index: number | null
  followup_question: string | null
}

export type EndSessionRequest = {
  session_id: string
}

export type EndSessionResponse = {
  session_id: string
  status: "completed"
  feedback_status: string
}

export type GenerateFeedbackRequest = {
  session_id: string
}

export type FeedbackStatusResponse = {
  session_id: string
  feedback_status: "pending" | "generating" | "summary_ready" | "ready" | "failed"
  feedback_error: string | null
}

export type DimensionScore = {
  label: string
  score: number
  evidence: string
}

export type InterviewerOverallFeedback = {
  summary: string
  recommendation: "Yes" | "Maybe" | "No"
  recommendation_reason: string
  strength_label: string
  strength_evidence: string
  weakness_label: string
  weakness_evidence: string
  risk_note: string | null
}

export type MentorOverallFeedback = {
  genuine_strength: string
  primary_gap: string
  priority_action: string
  next_practice: string
  dimension_scores: DimensionScore[]
}

export type QuestionInterviewerFeedback = {
  you_signaled: string
  interviewer_heard: string
  missing_signals: string
  language_note: string | null
  weak_signal_tags: string[]
}

export type QuestionMentorFeedback = {
  gap_diagnosis: string
  how_to_fix: string
  language_tip: string | null
}

export type FeedbackQuestionResult = {
  chain_index: number
  question_text: string
  question_intent: string | null
  score: number
  interviewer_feedback: QuestionInterviewerFeedback
  mentor_feedback: QuestionMentorFeedback
}

export type SessionFeedbackResult = {
  session_id: string
  focus_label: string
  interviewer: InterviewerProfile
  completed_at: string | null
  overall_score: number
  interviewer_overall: InterviewerOverallFeedback
  mentor_overall: MentorOverallFeedback
  questions: FeedbackQuestionResult[]
}

export type GenerateFeedbackResponse = {
  session_id: string
  feedback_status: "ready"
  overall_score: number
}

export type FitMap = {
  candidate_strengths: string[]
  job_requirements: string[]
  match_points: string[]
  gap_points: string[]
  resume_highlights: string[]
}

export type InterviewerProfile = {
  name: string
  role: string
  company: string | null
  avatar: string
  focus: string
  duration: string
}

export function validateCreateSessionRequest(value: unknown): {
  ok: true
  data: CreateSessionRequest
} | {
  ok: false
  error: string
} {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "Invalid request body." }
  }

  const body = value as Partial<CreateSessionRequest>
  const setupRequestId = typeof body.setup_request_id === "string" ? body.setup_request_id.trim() : ""
  const config = body.session_config

  if (!setupRequestId || setupRequestId.length > 120) {
    return { ok: false, error: "Missing setup request id." }
  }

  if (!config || typeof config !== "object") {
    return { ok: false, error: "Missing session config." }
  }

  const resumeValidation = validateResumeText(config.resume_text ?? "")
  if (!resumeValidation.valid) {
    return { ok: false, error: resumeValidation.errors[0] ?? "Resume text is invalid." }
  }

  const roleMode = config.target_role?.type === "generic_role" ? "quick" : "jd"
  const roleValidation = validateTargetRole(
    roleMode,
    config.target_role?.jd_text ?? "",
    config.target_role?.generic_role_name ?? ""
  )
  if (!roleValidation.valid) {
    return { ok: false, error: roleValidation.message }
  }

  if (config.mode !== "focused") {
    return { ok: false, error: "Only focused sessions are available." }
  }

  if (!isSessionFocusType(config.focus_type)) {
    return { ok: false, error: "Unsupported focus type." }
  }

  if (!isSetupLevel(config.level)) {
    return { ok: false, error: "Unsupported experience level." }
  }

  if (!isFollowUpIntensity(config.follow_up_intensity)) {
    return { ok: false, error: "Unsupported follow-up intensity." }
  }

  return {
    ok: true,
    data: {
      setup_request_id: setupRequestId,
      resume_title: typeof body.resume_title === "string" ? body.resume_title.trim().slice(0, 80) : undefined,
      session_config: config
    }
  }
}

export function validateSubmitAnswerRequest(value: unknown): {
  ok: true
  data: SubmitAnswerRequest
} | {
  ok: false
  error: string
} {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "Invalid request body." }
  }

  const body = value as Partial<SubmitAnswerRequest>
  const sessionId = typeof body.session_id === "string" ? body.session_id.trim() : ""
  const answerText = typeof body.answer_text === "string" ? body.answer_text.trim() : ""
  const clientMessageId = typeof body.client_message_id === "string" ? body.client_message_id.trim() : ""

  if (!sessionId) return { ok: false, error: "Missing session id." }
  if (typeof body.chain_index !== "number" || body.chain_index < 0 || body.chain_index > 2) {
    return { ok: false, error: "Invalid question index." }
  }
  if (answerText.length < 2) return { ok: false, error: "Answer is too short." }
  if (answerText.length > 12000) return { ok: false, error: "Answer is too long." }
  if (!clientMessageId || clientMessageId.length > 120) return { ok: false, error: "Missing client message id." }

  return {
    ok: true,
    data: {
      session_id: sessionId,
      chain_index: body.chain_index,
      answer_text: answerText,
      client_message_id: clientMessageId
    }
  }
}

export function validateEndSessionRequest(value: unknown): {
  ok: true
  data: EndSessionRequest
} | {
  ok: false
  error: string
} {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "Invalid request body." }
  }

  const sessionId = typeof (value as Partial<EndSessionRequest>).session_id === "string"
    ? (value as Partial<EndSessionRequest>).session_id!.trim()
    : ""

  if (!sessionId) return { ok: false, error: "Missing session id." }

  return { ok: true, data: { session_id: sessionId } }
}

export function validateGenerateFeedbackRequest(value: unknown): {
  ok: true
  data: GenerateFeedbackRequest
} | {
  ok: false
  error: string
} {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "Invalid request body." }
  }

  const sessionId = typeof (value as Partial<GenerateFeedbackRequest>).session_id === "string"
    ? (value as Partial<GenerateFeedbackRequest>).session_id!.trim()
    : ""

  if (!sessionId) return { ok: false, error: "Missing session id." }

  return { ok: true, data: { session_id: sessionId } }
}

export function isSessionFocusType(value: string): value is SessionFocusType {
  return ["resume_deep_dive", "behavioral", "motivation_fit", "culture_collaboration", "situational"].includes(value)
}

function isSetupLevel(value: string): value is SetupLevel {
  return ["junior", "mid", "senior"].includes(value)
}

function isFollowUpIntensity(value: string): value is FollowUpIntensity {
  return ["off", "low", "medium", "high"].includes(value)
}

export function interviewerAgentForFocus(focusType: SessionFocusType): InterviewerAgent {
  if (focusType === "behavioral" || focusType === "motivation_fit") return "hr"
  if (focusType === "culture_collaboration") return "combined"
  return "hiring_manager"
}

export function labelForFocus(focusType: SessionFocusType) {
  const labels: Record<SessionFocusType, string> = {
    resume_deep_dive: "Resume Deep Dive",
    behavioral: "Behavioral",
    motivation_fit: "Motivation & Fit",
    culture_collaboration: "Culture & Collaboration",
    situational: "Situational"
  }

  return labels[focusType]
}

export function interviewerForSession({
  focusType,
  companyName,
  genericRole
}: {
  focusType: SessionFocusType
  companyName: string | null
  genericRole: string | null
}): InterviewerProfile {
  const agent = interviewerAgentForFocus(focusType)
  const role = agent === "hr"
    ? "HR Manager"
    : agent === "combined"
      ? "Interviewer"
      : roleTitleFromTarget(genericRole)

  return {
    name: agent === "hr" ? "Sarah" : agent === "combined" ? "Alex" : "Marcus",
    role,
    company: companyName,
    avatar: agent === "hr" ? "S" : agent === "combined" ? "A" : "M",
    focus: labelForFocus(focusType),
    duration: "~15 min"
  }
}

function roleTitleFromTarget(genericRole: string | null) {
  if (!genericRole) return "Hiring Manager"
  if (/product|pm/i.test(genericRole)) return "Senior Product Manager"
  if (/design|ux|research/i.test(genericRole)) return "Design Manager"
  if (/data|analyst|analytics/i.test(genericRole)) return "Analytics Manager"
  if (/engineer|frontend|backend|developer/i.test(genericRole)) return "Engineering Manager"
  return "Hiring Manager"
}

export function responseError(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}
