import type { SessionExchange } from "@/lib/product/session-contracts"

export type FollowUpDecision = {
  nextAction: "follow_up" | "next_question" | "end"
  followupQuestion: string | null
}

export function decideFollowUp({
  answerText,
  questionIntent,
  exchanges,
  chainIndex,
  totalChains,
  maxFollowUps
}: {
  answerText: string
  questionIntent: string | null
  exchanges: SessionExchange[]
  chainIndex: number
  totalChains: number
  maxFollowUps: number
}): FollowUpDecision {
  const followUpCount = exchanges.filter((exchange) => exchange.role === "interviewer" && exchange.is_followup).length
  const wordCount = answerText.trim().split(/\s+/).filter(Boolean).length
  const hasSpecificEvidence = /\b\d+%|\b\d+x|\b\d+\+|\b(users|customers|revenue|weeks|months|hours|stakeholders|engineers|designers)\b/i.test(answerText)
  const hasOwnership = /\bI\s+(led|owned|built|created|designed|decided|initiated|managed|shipped|improved|changed)\b/i.test(answerText)
  const needsFollowUp = maxFollowUps > 0 && followUpCount < maxFollowUps && (wordCount < 75 || !hasSpecificEvidence || !hasOwnership)

  if (needsFollowUp) {
    return {
      nextAction: "follow_up",
      followupQuestion: buildFollowUpQuestion({ answerText, questionIntent, hasSpecificEvidence, hasOwnership })
    }
  }

  if (chainIndex >= totalChains - 1) {
    return {
      nextAction: "end",
      followupQuestion: null
    }
  }

  return {
    nextAction: "next_question",
    followupQuestion: null
  }
}

export function createExchange({
  role,
  content,
  isFollowup,
  clientMessageId
}: {
  role: "interviewer" | "candidate"
  content: string
  isFollowup: boolean
  clientMessageId?: string
}): SessionExchange {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    is_followup: isFollowup,
    client_message_id: clientMessageId,
    created_at: new Date().toISOString()
  }
}

function buildFollowUpQuestion({
  answerText,
  questionIntent,
  hasSpecificEvidence,
  hasOwnership
}: {
  answerText: string
  questionIntent: string | null
  hasSpecificEvidence: boolean
  hasOwnership: boolean
}) {
  if (!hasOwnership) {
    return "What part of that work was specifically yours, and where did you personally make the decision?"
  }

  if (!hasSpecificEvidence) {
    return "Can you make the impact more concrete with a result, number, user signal, or before-and-after example?"
  }

  if (questionIntent && /decision|tradeoff|judgment/i.test(questionIntent)) {
    return "What tradeoff did you consider, and why did you choose that direction?"
  }

  if (/we\b/i.test(answerText)) {
    return "You used 'we' in a few places. What did you personally own in that team effort?"
  }

  return "What was the hardest part of that example, and what would your manager say you contributed?"
}
