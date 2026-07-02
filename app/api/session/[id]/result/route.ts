import { createServerSupabaseClient } from "@/lib/supabase/server"
import {
  labelForFocus,
  responseError,
  type FeedbackQuestionResult,
  type InterviewerOverallFeedback,
  type InterviewerProfile,
  type MentorOverallFeedback,
  type QuestionInterviewerFeedback,
  type QuestionMentorFeedback,
  type SessionFeedbackResult,
  type SessionFocusType
} from "@/lib/product/session-contracts"

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const result = await loadFeedbackResult(params.id)

  if ("error" in result) {
    return responseError(result.error, result.status)
  }

  return Response.json(result)
}

async function loadFeedbackResult(sessionId: string): Promise<SessionFeedbackResult | { error: string; status: number }> {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "Sign in before viewing feedback.", status: 401 }
  }

  const session = await supabase
    .from("interview_sessions")
    .select("id, focus_type, completed_at, feedback_status, overall_score, question_generation_meta")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single()

  if (session.error || !session.data) {
    return { error: "Interview session was not found.", status: 404 }
  }

  if (session.data.feedback_status !== "ready") {
    return { error: "Feedback is not ready yet.", status: 409 }
  }

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

  if (feedback.error || !feedback.data || questions.error) {
    return { error: "Feedback result was not found.", status: 404 }
  }

  return {
    session_id: session.data.id,
    focus_label: labelForFocus(String(session.data.focus_type) as SessionFocusType),
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
