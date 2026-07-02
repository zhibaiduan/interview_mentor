import { redirect } from "next/navigation"
import { InterviewWrap } from "@/components/product/interview/interview-wrap"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { InterviewerProfile } from "@/lib/product/session-contracts"

export default async function SessionWrapPage({ params }: { params: { id: string } }) {
  const { interviewer, feedbackStatus } = await loadSession(params.id)

  return <InterviewWrap sessionId={params.id} interviewer={interviewer} feedbackStatus={feedbackStatus} />
}

async function loadSession(sessionId: string) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) redirect(`/auth?returnTo=${encodeURIComponent(`/session/${sessionId}/wrap`)}`)

  const session = await supabase
    .from("interview_sessions")
    .select("id, question_generation_meta, feedback_status")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single()

  if (session.error || !session.data) redirect("/home")

  return {
    interviewer: readInterviewer(session.data.question_generation_meta),
    feedbackStatus: session.data.feedback_status
  }
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
