import { traceAiWorkflow } from "@/lib/ai/observability/langsmith"
import { createExchange, decideFollowUp } from "@/lib/ai/workflows/submit-answer"
import {
  responseError,
  validateSubmitAnswerRequest,
  type SessionExchange,
  type SubmitAnswerResponse
} from "@/lib/product/session-contracts"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = validateSubmitAnswerRequest(body)

  if (!parsed.ok) {
    return responseError(parsed.error)
  }

  const supabase = createServerSupabaseClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return responseError("Sign in before submitting an answer.", 401)
  }

  const session = await supabase
    .from("interview_sessions")
    .select("id, user_id, follow_up_intensity, workflow_stage, status, current_chain_index")
    .eq("id", parsed.data.session_id)
    .eq("user_id", user.id)
    .single()

  if (session.error || !session.data) {
    return responseError("Interview session not found.", 404)
  }

  if (session.data.status !== "in_progress") {
    return responseError("This interview session is already closed.", 409)
  }

  const chains = await supabase
    .from("question_chains")
    .select("chain_index, main_question, question_intent, exchanges")
    .eq("session_id", parsed.data.session_id)
    .order("chain_index", { ascending: true })

  if (chains.error || !chains.data || chains.data.length === 0) {
    return responseError("Interview questions are not ready.", 409)
  }

  const currentChain = chains.data.find((chain) => chain.chain_index === parsed.data.chain_index)
  if (!currentChain) {
    return responseError("Question not found.", 404)
  }

  const existingExchanges = normalizeExchanges(currentChain.exchanges)
  const duplicate = existingExchanges.find((exchange) => exchange.client_message_id === parsed.data.client_message_id)
  if (duplicate) {
    return Response.json(buildDuplicateResponse({
      sessionId: parsed.data.session_id,
      chainIndex: parsed.data.chain_index,
      exchanges: existingExchanges,
      totalChains: chains.data.length
    }))
  }

  const candidateExchange = createExchange({
    role: "candidate",
    content: parsed.data.answer_text,
    isFollowup: hasActiveFollowUp(existingExchanges),
    clientMessageId: parsed.data.client_message_id
  })

  const withCandidate = [...existingExchanges, candidateExchange]
  const decision = await traceAiWorkflow({
    name: "followup.decide",
    run: async () => decideFollowUp({
      answerText: parsed.data.answer_text,
      questionIntent: currentChain.question_intent,
      exchanges: withCandidate,
      chainIndex: parsed.data.chain_index,
      totalChains: chains.data.length,
      maxFollowUps: maxFollowUpsForIntensity(session.data.follow_up_intensity)
    })
  })

  const finalExchanges = decision.nextAction === "follow_up" && decision.followupQuestion
    ? [
        ...withCandidate,
        createExchange({
          role: "interviewer",
          content: decision.followupQuestion,
          isFollowup: true
        })
      ]
    : withCandidate

  const updateChain = await supabase
    .from("question_chains")
    .update({ exchanges: finalExchanges })
    .eq("session_id", parsed.data.session_id)
    .eq("chain_index", parsed.data.chain_index)

  if (updateChain.error) {
    return responseError("Could not save answer.", 500)
  }

  const nextChainIndex = decision.nextAction === "next_question" ? parsed.data.chain_index + 1 : null
  const sessionPatch = decision.nextAction === "end"
    ? {
        workflow_stage: "completed",
        status: "completed",
        completed_at: new Date().toISOString(),
        current_chain_index: parsed.data.chain_index
      }
    : {
        workflow_stage: "interviewing",
        current_chain_index: nextChainIndex ?? parsed.data.chain_index
      }

  await supabase
    .from("interview_sessions")
    .update(sessionPatch)
    .eq("id", parsed.data.session_id)

  return Response.json({
    session_id: parsed.data.session_id,
    chain_index: parsed.data.chain_index,
    exchanges: finalExchanges,
    next_action: decision.nextAction,
    next_chain_index: nextChainIndex,
    followup_question: decision.followupQuestion
  } satisfies SubmitAnswerResponse)
}

function normalizeExchanges(value: unknown): SessionExchange[] {
  return Array.isArray(value) ? value.filter(isSessionExchange) : []
}

function isSessionExchange(value: unknown): value is SessionExchange {
  if (!value || typeof value !== "object") return false
  const exchange = value as Partial<SessionExchange>
  return (exchange.role === "interviewer" || exchange.role === "candidate") && typeof exchange.content === "string"
}

function hasActiveFollowUp(exchanges: SessionExchange[]) {
  const last = exchanges[exchanges.length - 1]
  return last?.role === "interviewer" && last.is_followup
}

function maxFollowUpsForIntensity(intensity: string) {
  if (intensity === "off") return 0
  if (intensity === "low") return 1
  if (intensity === "high") return 5
  return 3
}

function buildDuplicateResponse({
  sessionId,
  chainIndex,
  exchanges,
  totalChains
}: {
  sessionId: string
  chainIndex: number
  exchanges: SessionExchange[]
  totalChains: number
}): SubmitAnswerResponse {
  const last = exchanges[exchanges.length - 1]
  const followupQuestion = last?.role === "interviewer" && last.is_followup ? last.content : null
  const nextAction = followupQuestion
    ? "follow_up"
    : chainIndex >= totalChains - 1
      ? "end"
      : "next_question"

  return {
    session_id: sessionId,
    chain_index: chainIndex,
    exchanges,
    next_action: nextAction,
    next_chain_index: nextAction === "next_question" ? chainIndex + 1 : null,
    followup_question: followupQuestion
  }
}
