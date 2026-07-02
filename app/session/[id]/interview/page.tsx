import { redirect } from "next/navigation"
import { InterviewRoom } from "@/components/product/interview/interview-room"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { InterviewerProfile } from "@/lib/product/session-contracts"

export default async function SessionInterviewPage({ params }: { params: { id: string } }) {
  const { interviewer, questions } = await loadSession(params.id)

  return <InterviewRoom sessionId={params.id} interviewer={interviewer} questions={questions} />
}

async function loadSession(sessionId: string) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) redirect(`/auth?returnTo=${encodeURIComponent(`/session/${sessionId}/interview`)}`)

  const session = await supabase
    .from("interview_sessions")
    .select("id, question_generation_meta")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single()

  if (session.error || !session.data) redirect("/home")

  const questions = await supabase
    .from("question_chains")
    .select("chain_index, main_question, question_intent, exchanges")
    .eq("session_id", sessionId)
    .order("chain_index", { ascending: true })

  return {
    interviewer: readInterviewer(session.data.question_generation_meta),
    questions: questions.data ?? []
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
