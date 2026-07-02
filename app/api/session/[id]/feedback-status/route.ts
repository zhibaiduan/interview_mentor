import { createServerSupabaseClient } from "@/lib/supabase/server"
import { responseError, type FeedbackStatusResponse } from "@/lib/product/session-contracts"

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return responseError("Sign in before checking feedback status.", 401)
  }

  const session = await supabase
    .from("interview_sessions")
    .select("id, feedback_status, feedback_error")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (session.error || !session.data) {
    return responseError("Interview session was not found.", 404)
  }

  return Response.json({
    session_id: session.data.id,
    feedback_status: session.data.feedback_status,
    feedback_error: session.data.feedback_error
  } satisfies FeedbackStatusResponse)
}
