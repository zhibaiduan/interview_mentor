import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { prepareSessionContext } from "@/lib/ai/workflows/create-session"
import { traceAiWorkflow } from "@/lib/ai/observability/langsmith"
import {
  responseError,
  validateCreateSessionRequest,
  type CreateSessionResponse
} from "@/lib/product/session-contracts"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = validateCreateSessionRequest(body)

  if (!parsed.ok) {
    return responseError(parsed.error)
  }

  const supabase = createServerSupabaseClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return responseError("Sign in before starting an interview.", 401)
  }

  const existing = await findExistingSession(parsed.data.setup_request_id, user.id)
  if (existing) {
    return Response.json(existing)
  }

  const prepared = await traceAiWorkflow({
    name: "create-session",
    run: async () => prepareSessionContext(parsed.data)
  })

  const config = parsed.data.session_config
  const resumeTitle = parsed.data.resume_title || "Setup resume"

  const resumeInsert = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      title: resumeTitle,
      content_text: config.resume_text
    })
    .select("id")
    .single()

  if (resumeInsert.error) {
    return responseError("Could not save resume material.", 500)
  }

  let jdId: string | null = null
  if (config.target_role.type === "jd" && config.target_role.jd_text) {
    const jdInsert = await supabase
      .from("jd_history")
      .insert({
        user_id: user.id,
        company_name: config.target_role.company_name,
        job_title: inferJobTitle(config.target_role.jd_text),
        jd_text: config.target_role.jd_text
      })
      .select("id")
      .single()

    if (jdInsert.error) {
      return responseError("Could not save job description.", 500)
    }

    jdId = jdInsert.data.id
  }

  const sessionInsert = await supabase
    .from("interview_sessions")
    .insert({
      user_id: user.id,
      resume_id: resumeInsert.data.id,
      jd_id: jdId,
      mode: config.mode,
      focus_type: config.focus_type,
      level: config.level,
      language: config.interview_language,
      follow_up_intensity: config.follow_up_intensity,
      interviewer_agent: prepared.interviewerAgent,
      resume_text_snapshot: config.resume_text,
      jd_text_snapshot: config.target_role.jd_text,
      generic_role: config.target_role.generic_role_name,
      fit_map: prepared.fitMap,
      question_generation_meta: prepared.questionMeta,
      status: "in_progress",
      workflow_stage: "created",
      current_chain_index: 0
    })
    .select("id")
    .single()

  if (sessionInsert.error) {
    return responseError("Could not create interview session.", 500)
  }

  const admin = createAdminSupabaseClient()
  const spend = await admin.rpc("spend_credits", {
    p_user_id: user.id,
    p_amount: 3,
    p_reason: "interview_start",
    p_idempotency_key: `interview_start:${parsed.data.setup_request_id}`,
    p_session_id: sessionInsert.data.id,
    p_answer_bank_id: null,
    p_metadata: {
      focus_type: config.focus_type,
      source: "setup"
    }
  })

  if (spend.error) {
    await supabase
      .from("interview_sessions")
      .update({ status: "abandoned", workflow_stage: "created" })
      .eq("id", sessionInsert.data.id)

    if (spend.error.message.includes("insufficient_credits")) {
      return responseError("You need 3 credits to start this interview.", 402)
    }

    return responseError("Could not spend interview credits.", 500)
  }

  const account = await supabase
    .from("credit_accounts")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle()

  const response: CreateSessionResponse = {
    session_id: sessionInsert.data.id,
    credit_balance: account.data?.balance ?? null,
    interviewer: prepared.interviewer
  }

  return Response.json(response)
}

async function findExistingSession(setupRequestId: string, userId: string): Promise<CreateSessionResponse | null> {
  const admin = createAdminSupabaseClient()
  const existing = await admin
    .from("interview_sessions")
    .select("id, focus_type, generic_role, question_generation_meta")
    .eq("user_id", userId)
    .filter("question_generation_meta->>setup_request_id", "eq", setupRequestId)
    .neq("status", "abandoned")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing.error || !existing.data) return null

  const meta = existing.data.question_generation_meta as { interviewer?: CreateSessionResponse["interviewer"] } | null

  return {
    session_id: existing.data.id,
    credit_balance: null,
    interviewer: meta?.interviewer ?? {
      name: "Marcus",
      role: "Hiring Manager",
      company: null,
      avatar: "M",
      focus: String(existing.data.focus_type ?? "Resume Deep Dive"),
      duration: "~15 min"
    }
  }
}

function inferJobTitle(jdText: string) {
  const firstUsefulLine = jdText
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 4 && line.length < 90)

  return firstUsefulLine || "Target role"
}
