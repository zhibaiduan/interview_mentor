import { redirect } from "next/navigation"
import { FeedbackReport } from "@/components/product/feedback/feedback-report"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import {
  isSessionFocusType,
  labelForFocus,
  type FeedbackQuestionResult,
  type InterviewerOverallFeedback,
  type InterviewerProfile,
  type MentorOverallFeedback,
  type QuestionInterviewerFeedback,
  type QuestionMentorFeedback,
  type SessionFeedbackResult
} from "@/lib/product/session-contracts"

export default async function FeedbackPage({ params }: { params: { id: string } }) {
  const feedback = await loadFeedback(params.id)

  return <FeedbackReport feedback={feedback} />
}

async function loadFeedback(sessionId: string): Promise<SessionFeedbackResult> {
  const supabase = createServerSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) redirect(`/auth?returnTo=${encodeURIComponent(`/session/${sessionId}/feedback`)}`)

  const session = await supabase
    .from("interview_sessions")
    .select("id, focus_type, completed_at, feedback_status, overall_score, question_generation_meta")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single()

  if (session.error || !session.data) redirect("/home")
  if (session.data.feedback_status !== "ready") redirect(`/session/${sessionId}/wrap`)

  const focusType = String(session.data.focus_type)
  if (!isSessionFocusType(focusType)) redirect("/home")

  const feedback = await supabase
    .from("session_feedback")
    .select("interviewer_overall, mentor_overall, overall_score")
    .eq("session_id", sessionId)
    .single()

  const questions = await supabase
    .from("question_chains")
    .select("chain_index, main_question, question_intent, interviewer_feedback, mentor_feedback, score")
    .eq("session_id", sessionId)
    .order("chain_index", { ascending: true })

  if (feedback.error || !feedback.data || questions.error) redirect(`/session/${sessionId}/wrap`)

  return {
    session_id: session.data.id,
    focus_label: labelForFocus(focusType),
    interviewer: readInterviewer(session.data.question_generation_meta),
    completed_at: session.data.completed_at,
    overall_score: feedback.data.overall_score ?? session.data.overall_score ?? 3,
    interviewer_overall: feedback.data.interviewer_overall as InterviewerOverallFeedback,
    mentor_overall: feedback.data.mentor_overall as MentorOverallFeedback,
    questions: (questions.data ?? []).map((question): FeedbackQuestionResult => ({
      chain_index: question.chain_index,
      question_text: question.main_question,
      question_intent: question.question_intent,
      score: question.score ?? 3,
      interviewer_feedback: question.interviewer_feedback as QuestionInterviewerFeedback,
      mentor_feedback: question.mentor_feedback as QuestionMentorFeedback
    }))
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
