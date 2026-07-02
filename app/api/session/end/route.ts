import {
  responseError,
  validateEndSessionRequest,
  type EndSessionResponse
} from "@/lib/product/session-contracts"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = validateEndSessionRequest(body)

  if (!parsed.ok) {
    return responseError(parsed.error)
  }

  const supabase = createServerSupabaseClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return responseError("Sign in before ending an interview.", 401)
  }

  const update = await supabase
    .from("interview_sessions")
    .update({
      status: "completed",
      workflow_stage: "completed",
      completed_at: new Date().toISOString()
    })
    .eq("id", parsed.data.session_id)
    .eq("user_id", user.id)
    .select("id, feedback_status")
    .single()

  if (update.error || !update.data) {
    return responseError("Could not end interview session.", 500)
  }

  return Response.json({
    session_id: update.data.id,
    status: "completed",
    feedback_status: update.data.feedback_status
  } satisfies EndSessionResponse)
}
