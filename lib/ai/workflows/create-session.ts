import {
  interviewerAgentForFocus,
  interviewerForSession,
  type CreateSessionRequest,
  type FitMap,
  type InterviewerProfile
} from "@/lib/product/session-contracts"

export type PreparedSession = {
  fitMap: FitMap
  interviewer: InterviewerProfile
  interviewerAgent: ReturnType<typeof interviewerAgentForFocus>
  questionMeta: Record<string, unknown>
}

export function prepareSessionContext(request: CreateSessionRequest): PreparedSession {
  const config = request.session_config
  const jdText = config.target_role.jd_text
  const genericRole = config.target_role.generic_role_name
  const companyName = config.target_role.company_name
  const interviewer = interviewerForSession({
    focusType: config.focus_type,
    companyName,
    genericRole
  })
  const fitMap = buildDeterministicFitMap({
    resumeText: config.resume_text,
    jdText,
    genericRole
  })

  return {
    fitMap,
    interviewer,
    interviewerAgent: interviewerAgentForFocus(config.focus_type),
    questionMeta: {
      setup_request_id: request.setup_request_id,
      generation_source: "deterministic_user_context_v1",
      ai_status: process.env.DEEPSEEK_API_KEY ? "pending_ai_integration" : "local_no_ai_key",
      interviewer
    }
  }
}

function buildDeterministicFitMap({
  resumeText,
  jdText,
  genericRole
}: {
  resumeText: string
  jdText: string | null
  genericRole: string | null
}): FitMap {
  const resumeHighlights = extractHighlights(resumeText, 5)
  const jobRequirements = extractRequirements(jdText, genericRole)
  const candidateStrengths = extractStrengths(resumeText)
  const matchPoints = candidateStrengths
    .filter((strength) => jobRequirements.some((requirement) => sharedTerm(strength, requirement)))
    .slice(0, 4)
  const gapPoints = jobRequirements
    .filter((requirement) => !candidateStrengths.some((strength) => sharedTerm(strength, requirement)))
    .slice(0, 4)

  return {
    candidate_strengths: candidateStrengths.length > 0 ? candidateStrengths : resumeHighlights.slice(0, 3),
    job_requirements: jobRequirements,
    match_points: matchPoints.length > 0 ? matchPoints : resumeHighlights.slice(0, 2),
    gap_points: gapPoints,
    resume_highlights: resumeHighlights
  }
}

function extractHighlights(text: string, limit: number) {
  return text
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter((line) => line.length > 32)
    .filter((line) => /(led|built|designed|created|improved|launched|reduced|increased|managed|owned|worked|project|product|user|research|data|ai|workflow)/i.test(line))
    .slice(0, limit)
}

function extractRequirements(jdText: string | null, genericRole: string | null) {
  if (!jdText) {
    const role = genericRole || "the target role"
    return [
      `Clear motivation for ${role}`,
      "Specific ownership and decision-making examples",
      "Ability to communicate tradeoffs and impact"
    ]
  }

  const lines = jdText
    .split(/\n|\.|;/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter((line) => line.length > 28)
    .filter((line) => /(responsib|require|experience|ability|skill|own|lead|collaborat|communicat|product|data|design|engineer|customer|stakeholder)/i.test(line))

  return lines.slice(0, 5)
}

function extractStrengths(text: string) {
  const highlights = extractHighlights(text, 8)
  return highlights
    .map((line) => {
      if (/\d+%|\d+x|\d+\+/.test(line)) return `Quantified impact: ${line}`
      if (/led|owned|initiated|managed/i.test(line)) return `Ownership signal: ${line}`
      if (/research|interview|user|customer/i.test(line)) return `User insight signal: ${line}`
      return line
    })
    .slice(0, 5)
}

function sharedTerm(a: string, b: string) {
  const termsA = new Set(a.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 4))
  return b.toLowerCase().split(/[^a-z0-9]+/).some((term) => termsA.has(term))
}
