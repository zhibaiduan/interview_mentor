import type { SessionExchange } from "@/lib/product/session-contracts"

export type FollowUpDecision = {
  nextAction: "follow_up" | "next_question" | "end"
  followupQuestion: string | null
}

export async function decideFollowUp({
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
}): Promise<FollowUpDecision> {
  if (process.env.DEEPSEEK_API_KEY && process.env.DEMO_MODE !== "true") {
    const aiDecision = await decideFollowUpWithDeepSeek({
      answerText,
      questionIntent,
      exchanges,
      chainIndex,
      totalChains,
      maxFollowUps
    }).catch(() => null)

    if (aiDecision) {
      return aiDecision
    }
  }

  return decideFollowUpDeterministic({
    answerText,
    questionIntent,
    exchanges,
    chainIndex,
    totalChains,
    maxFollowUps
  })
}

function decideFollowUpDeterministic({
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

async function decideFollowUpWithDeepSeek({
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
}): Promise<FollowUpDecision | null> {
  const followUpCount = exchanges.filter((exchange) => exchange.role === "interviewer" && exchange.is_followup).length

  if (maxFollowUps <= 0 || followUpCount >= maxFollowUps) {
    return chainIndex >= totalChains - 1
      ? { nextAction: "end", followupQuestion: null }
      : { nextAction: "next_question", followupQuestion: null }
  }

  const response = await fetch(`${normalizeDeepSeekBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a realistic interview follow-up decider. Decide whether the interviewer should ask one concise follow-up question. Return strict JSON only."
        },
        {
          role: "user",
          content: JSON.stringify({
            question_intent: questionIntent,
            current_question_index: chainIndex,
            total_questions: totalChains,
            follow_up_count: followUpCount,
            max_follow_ups: maxFollowUps,
            latest_answer: answerText,
            conversation: exchanges.map((exchange) => ({
              role: exchange.role,
              content: exchange.content,
              is_followup: exchange.is_followup
            })),
            rubric: [
              "Ask a follow-up only if it would reveal missing ownership, impact, decision logic, tradeoff reasoning, or role fit.",
              "Do not ask generic coaching questions.",
              "If the answer is specific enough, move on.",
              "A follow-up must sound like a human interviewer, one sentence, no preamble."
            ],
            output_schema: {
              next_action: "follow_up | next_question | end",
              followup_question: "string or null"
            }
          })
        }
      ]
    })
  })

  if (!response.ok) {
    return null
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = payload.choices?.[0]?.message?.content
  if (!content) return null

  const parsed = JSON.parse(content) as {
    next_action?: string
    followup_question?: unknown
  }

  if (parsed.next_action === "follow_up" && typeof parsed.followup_question === "string") {
    const followup = parsed.followup_question.trim()
    if (followup.length > 0) {
      return { nextAction: "follow_up", followupQuestion: followup.slice(0, 240) }
    }
  }

  if (parsed.next_action === "end" || chainIndex >= totalChains - 1) {
    return { nextAction: "end", followupQuestion: null }
  }

  return { nextAction: "next_question", followupQuestion: null }
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

function normalizeDeepSeekBaseUrl() {
  return (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "")
}
