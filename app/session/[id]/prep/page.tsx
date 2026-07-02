import { redirect } from "next/navigation"
import { InterviewPrep } from "@/components/product/interview/interview-prep"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { InterviewerProfile } from "@/lib/product/session-contracts"

export default async function SessionPrepPage({ params }: { params: { id: string } }) {
  const { interviewer } = await loadSession(params.id)

  return <InterviewPrep sessionId={params.id} interviewer={interviewer} />
}

async function loadSession(sessionId: string) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) redirect(`/auth?returnTo=${encodeURIComponent(`/session/${sessionId}/prep`)}`)

  const session = await supabase
    .from("interview_sessions")
    .select("id, question_generation_meta")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single()

  if (session.error || !session.data) redirect("/home")

  return {
    interviewer: readInterviewer(session.data.question_generation_meta)
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
