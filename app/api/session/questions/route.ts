import { traceAiWorkflow } from "@/lib/ai/observability/langsmith"
import { buildUserContextFallbackQuestions } from "@/lib/demo/fallback-session"
import {
  responseError,
  type GenerateQuestionsRequest,
  type GenerateQuestionsResponse,
  type SessionFocusType
} from "@/lib/product/session-contracts"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Partial<GenerateQuestionsRequest> | null
  const sessionId = typeof body?.session_id === "string" ? body.session_id.trim() : ""

  if (!sessionId) {
    return responseError("Missing session id.")
  }

  const supabase = createServerSupabaseClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return responseError("Sign in before generating questions.", 401)
  }

  const session = await supabase
    .from("interview_sessions")
    .select("id, focus_type, level, fit_map, generic_role, jd_text_snapshot, question_generation_meta, workflow_stage")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single()

  if (session.error || !session.data) {
    return responseError("Interview session not found.", 404)
  }

  const existing = await supabase
    .from("question_chains")
    .select("chain_index, main_question, question_intent")
    .eq("session_id", sessionId)
    .order("chain_index", { ascending: true })

  if (existing.data && existing.data.length === 3) {
    return Response.json({
      session_id: sessionId,
      questions: existing.data.map((question) => ({
        chain_index: question.chain_index,
        main_question: question.main_question,
        question_intent: question.question_intent ?? "",
        resume_reference: ""
      }))
    } satisfies GenerateQuestionsResponse)
  }

  const questions = await traceAiWorkflow({
    name: "generate-questions",
    run: async () => buildUserContextFallbackQuestions({
      focusType: session.data.focus_type as SessionFocusType,
      level: session.data.level,
      fitMap: session.data.fit_map ?? {},
      companyName: extractCompany(session.data.question_generation_meta),
      genericRole: session.data.generic_role
    })
  })

  const insert = await supabase
    .from("question_chains")
    .upsert(
      questions.map((question) => ({
        session_id: sessionId,
        chain_index: question.chain_index,
        main_question: question.main_question,
        question_intent: question.question_intent,
        exchanges: []
      })),
      { onConflict: "session_id,chain_index" }
    )
    .select("chain_index, main_question, question_intent")
    .order("chain_index", { ascending: true })

  if (insert.error) {
    return responseError("Could not save interview questions.", 500)
  }

  await supabase
    .from("interview_sessions")
    .update({
      workflow_stage: "questions_ready",
      question_generation_meta: {
        ...(session.data.question_generation_meta as Record<string, unknown> | null),
        generated_question_count: questions.length,
        question_generation_source: "user_context_workflow_v1"
      }
    })
    .eq("id", sessionId)

  return Response.json({
    session_id: sessionId,
    questions
  } satisfies GenerateQuestionsResponse)
}

function extractCompany(meta: unknown) {
  if (!meta || typeof meta !== "object") return null
  const interviewer = (meta as { interviewer?: { company?: string | null } }).interviewer
  return interviewer?.company ?? null
}
