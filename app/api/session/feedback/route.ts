import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { generateFeedback } from "@/lib/ai/workflows/generate-feedback"
import { traceAiWorkflow } from "@/lib/ai/observability/langsmith"
import {
  isSessionFocusType,
  responseError,
  validateGenerateFeedbackRequest,
  type FitMap,
  type GenerateFeedbackResponse,
  type InterviewerProfile,
  type SessionExchange
} from "@/lib/product/session-contracts"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = validateGenerateFeedbackRequest(body)

  if (!parsed.ok) {
    return responseError(parsed.error)
  }

  const supabase = createServerSupabaseClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return responseError("Sign in before generating feedback.", 401)
  }

  const session = await supabase
    .from("interview_sessions")
    .select("id, user_id, focus_type, completed_at, feedback_status, fit_map, question_generation_meta")
    .eq("id", parsed.data.session_id)
    .eq("user_id", user.id)
    .single()

  if (session.error || !session.data) {
    return responseError("Interview session was not found.", 404)
  }

  if (session.data.feedback_status === "ready") {
    const existing = await supabase
      .from("session_feedback")
      .select("overall_score")
      .eq("session_id", session.data.id)
      .maybeSingle()

    return Response.json({
      session_id: session.data.id,
      feedback_status: "ready",
      overall_score: existing.data?.overall_score ?? 3
    } satisfies GenerateFeedbackResponse)
  }

  const focusType = String(session.data.focus_type)

  if (!isSessionFocusType(focusType)) {
    return responseError("Session focus type is unsupported.", 422)
  }

  const questions = await supabase
    .from("question_chains")
    .select("id, chain_index, main_question, question_intent, exchanges")
    .eq("session_id", session.data.id)
    .order("chain_index", { ascending: true })

  if (questions.error || !questions.data || questions.data.length === 0) {
    return responseError("No interview questions were found for feedback.", 422)
  }

  await supabase
    .from("interview_sessions")
    .update({
      feedback_status: "generating",
      feedback_error: null,
      feedback_started_at: new Date().toISOString(),
      feedback_retry_count: session.data.feedback_status === "failed" ? 1 : 0
    })
    .eq("id", session.data.id)
    .eq("user_id", user.id)

  try {
    const feedback = await traceAiWorkflow({
      name: "generate-feedback",
      run: async () => generateFeedback({
        session_id: session.data.id,
        focus_type: focusType,
        interviewer: readInterviewer(session.data.question_generation_meta),
        completed_at: session.data.completed_at,
        fit_map: readFitMap(session.data.fit_map),
        questions: questions.data.map((question) => ({
          chain_index: question.chain_index,
          main_question: question.main_question,
          question_intent: question.question_intent,
          exchanges: normalizeExchanges(question.exchanges)
        }))
      })
    })

    await supabase
      .from("session_feedback")
      .upsert({
        session_id: session.data.id,
        interviewer_overall: feedback.interviewer_overall,
        mentor_overall: feedback.mentor_overall,
        overall_score: feedback.overall_score
      }, { onConflict: "session_id" })

    await supabase
      .from("interview_sessions")
      .update({
        feedback_status: "summary_ready",
        overall_score: feedback.overall_score
      })
      .eq("id", session.data.id)
      .eq("user_id", user.id)

    for (const question of feedback.questions) {
      await supabase
        .from("question_chains")
        .update({
          interviewer_feedback: question.interviewer_feedback,
          mentor_feedback: question.mentor_feedback,
          score: question.score
        })
        .eq("session_id", session.data.id)
        .eq("chain_index", question.chain_index)
    }

    await updateSkillSignals({
      userId: user.id,
      sessionId: session.data.id,
      questions: feedback.questions
    })

    await supabase
      .from("interview_sessions")
      .update({ feedback_status: "ready" })
      .eq("id", session.data.id)
      .eq("user_id", user.id)

    return Response.json({
      session_id: session.data.id,
      feedback_status: "ready",
      overall_score: feedback.overall_score
    } satisfies GenerateFeedbackResponse)
  } catch {
    await supabase
      .from("interview_sessions")
      .update({
        feedback_status: "failed",
        feedback_error: "Feedback generation failed. Please retry."
      })
      .eq("id", session.data.id)
      .eq("user_id", user.id)

    return responseError("Feedback generation failed. Please retry.", 500)
  }
}

function normalizeExchanges(value: unknown): SessionExchange[] {
  if (!Array.isArray(value)) return []

  return value.filter((exchange): exchange is SessionExchange => {
    if (!exchange || typeof exchange !== "object") return false
    const candidate = exchange as Partial<SessionExchange>
    return candidate.role === "interviewer" || candidate.role === "candidate"
  })
}

function readInterviewer(meta: unknown): InterviewerProfile {
  const interviewer = (meta as { interviewer?: InterviewerProfile } | null)?.interviewer
  return interviewer ?? {
    name: "Marcus",
    role: "Hiring Manager",
    company: null,
    avatar: "M",
    focus: "Resume Deep Dive",
    duration: "~15 min"
  }
}

function readFitMap(value: unknown): FitMap {
  const fitMap = value as Partial<FitMap> | null

  return {
    candidate_strengths: readStringArray(fitMap?.candidate_strengths),
    job_requirements: readStringArray(fitMap?.job_requirements),
    match_points: readStringArray(fitMap?.match_points),
    gap_points: readStringArray(fitMap?.gap_points),
    resume_highlights: readStringArray(fitMap?.resume_highlights)
  }
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

async function updateSkillSignals({
  userId,
  sessionId,
  questions
}: {
  userId: string
  sessionId: string
  questions: Array<{
    chain_index: number
    score: number
    interviewer_feedback: {
      weak_signal_tags: string[]
      interviewer_heard: string
    }
  }>
}) {
  const admin = createAdminSupabaseClient()

  for (const question of questions) {
    for (const tag of question.interviewer_feedback.weak_signal_tags) {
      const existing = await admin
        .from("user_skill_signals")
        .select("id, weak_count, examples")
        .eq("user_id", userId)
        .eq("skill_tag", tag)
        .maybeSingle()

      const examples = Array.isArray(existing.data?.examples) ? existing.data.examples : []
      const nextExample = {
        session_id: sessionId,
        chain_index: question.chain_index,
        evidence: question.interviewer_feedback.interviewer_heard
      }

      if (existing.data) {
        await admin
          .from("user_skill_signals")
          .update({
            weak_count: (existing.data.weak_count ?? 0) + 1,
            last_direction: "weak",
            last_score: question.score,
            last_seen_at: new Date().toISOString(),
            examples: [nextExample, ...examples].slice(0, 5)
          })
          .eq("id", existing.data.id)
      } else {
        await admin
          .from("user_skill_signals")
          .insert({
            user_id: userId,
            skill_tag: tag,
            weak_count: 1,
            strong_count: 0,
            last_direction: "weak",
            last_score: question.score,
            examples: [nextExample]
          })
      }
    }
  }
}
