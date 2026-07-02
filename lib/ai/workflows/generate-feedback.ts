import {
  labelForFocus,
  type DimensionScore,
  type FeedbackQuestionResult,
  type FitMap,
  type InterviewerOverallFeedback,
  type MentorOverallFeedback,
  type QuestionInterviewerFeedback,
  type QuestionMentorFeedback,
  type SessionExchange,
  type SessionFeedbackResult,
  type SessionFocusType,
  type InterviewerProfile
} from "@/lib/product/session-contracts"

type FeedbackSessionInput = {
  session_id: string
  focus_type: SessionFocusType
  interviewer: InterviewerProfile
  completed_at: string | null
  fit_map: FitMap
  questions: Array<{
    chain_index: number
    main_question: string
    question_intent: string | null
    exchanges: SessionExchange[]
  }>
}

type AnswerSignals = {
  answerText: string
  wordCount: number
  firstPersonCount: number
  teamCount: number
  hasNumber: boolean
  hasDecisionLanguage: boolean
  hasImpactLanguage: boolean
}

export function generateFeedback(input: FeedbackSessionInput): SessionFeedbackResult {
  const questions = input.questions.map((question) => buildQuestionFeedback(question, input.focus_type))
  const overallScore = Math.max(1, Math.min(5, Math.round(average(questions.map((question) => question.score)))))
  const strongest = [...questions].sort((left, right) => right.score - left.score)[0] ?? questions[0]
  const weakest = [...questions].sort((left, right) => left.score - right.score)[0] ?? questions[0]
  const focusLabel = labelForFocus(input.focus_type)

  return {
    session_id: input.session_id,
    focus_label: focusLabel,
    interviewer: input.interviewer,
    completed_at: input.completed_at,
    overall_score: overallScore,
    interviewer_overall: buildInterviewerOverall({
      focusLabel,
      overallScore,
      strongest,
      weakest,
      fitMap: input.fit_map
    }),
    mentor_overall: buildMentorOverall({
      focusType: input.focus_type,
      overallScore,
      questions,
      fitMap: input.fit_map
    }),
    questions
  }
}

function buildQuestionFeedback(
  question: FeedbackSessionInput["questions"][number],
  focusType: SessionFocusType
): FeedbackQuestionResult {
  const signals = readAnswerSignals(question.exchanges)
  const score = scoreAnswer(signals)
  const interviewerFeedback = buildInterviewerQuestionFeedback(signals, score, question.chain_index)
  const mentorFeedback = buildMentorQuestionFeedback(signals, score, question.chain_index, focusType)

  return {
    chain_index: question.chain_index,
    question_text: question.main_question,
    question_intent: question.question_intent,
    score,
    interviewer_feedback: interviewerFeedback,
    mentor_feedback: mentorFeedback
  }
}

function buildInterviewerOverall({
  focusLabel,
  overallScore,
  strongest,
  weakest,
  fitMap
}: {
  focusLabel: string
  overallScore: number
  strongest: FeedbackQuestionResult | undefined
  weakest: FeedbackQuestionResult | undefined
  fitMap: FitMap
}): InterviewerOverallFeedback {
  const recommendation = overallScore >= 4 ? "Yes" : overallScore >= 3 ? "Maybe" : "No"
  const strengthLabel = overallScore >= 4 ? "Clear evidence" : "Real material"
  const weaknessLabel = weakest?.interviewer_feedback.weak_signal_tags[0]?.replaceAll("_", " ") ?? "Signal clarity"
  const matchPoint = fitMap.match_points[0] ?? fitMap.resume_highlights[0] ?? "the session contained usable experience"

  return {
    summary: overallScore >= 4
      ? `This candidate gave a credible ${focusLabel.toLowerCase()} signal with concrete material the interviewer can repeat. The strongest answer made the experience feel owned rather than memorized.`
      : overallScore === 3
        ? `The candidate has relevant experience, but the interviewer would still be piecing together personal ownership. ${matchPoint} came through, while the answers needed sharper decision logic.`
        : `The interview showed some relevant background, but the signal stayed too vague for a confident recommendation. The interviewer heard activity before clear ownership, impact, or decision-making.`,
    recommendation,
    recommendation_reason: overallScore >= 4
      ? "Enough concrete ownership and impact evidence appeared across the session."
      : overallScore === 3
        ? "The background fits, but several answers need clearer personal contribution before the signal is strong."
        : "The answers did not yet give the interviewer enough specific evidence to defend the hire.",
    strength_label: strengthLabel,
    strength_evidence: strongest
      ? `Q${strongest.chain_index + 1} was the clearest moment: ${strongest.interviewer_feedback.you_signaled.toLowerCase()}.`
      : "The session included enough material to start shaping stronger answers.",
    weakness_label: titleCase(weaknessLabel),
    weakness_evidence: weakest
      ? `Q${weakest.chain_index + 1} left the biggest gap: ${weakest.interviewer_feedback.interviewer_heard.toLowerCase()}.`
      : "The session needs more specific ownership and impact evidence.",
    risk_note: overallScore <= 2
      ? "The hiring risk is that the interviewer cannot tell what the candidate personally owned."
      : null
  }
}

function buildMentorOverall({
  focusType,
  overallScore,
  questions,
  fitMap
}: {
  focusType: SessionFocusType
  overallScore: number
  questions: FeedbackQuestionResult[]
  fitMap: FitMap
}): MentorOverallFeedback {
  const weakest = [...questions].sort((left, right) => left.score - right.score)[0]
  const strongest = [...questions].sort((left, right) => right.score - left.score)[0]
  const primaryGap = weakest?.interviewer_feedback.weak_signal_tags[0] ?? "ownership_clarity"
  const genuineStrength = fitMap.candidate_strengths[0] ?? strongest?.interviewer_feedback.you_signaled ?? "You brought real experience into the session."

  return {
    genuine_strength: strongest
      ? `${genuineStrength} The clearest evidence showed up in Q${strongest.chain_index + 1}, where your answer had enough substance to build from.`
      : `${genuineStrength} That gives the next practice session something real to sharpen.`,
    primary_gap: gapLabel(primaryGap),
    priority_action: weakest
      ? `Rewrite Q${weakest.chain_index + 1} first. Replace broad team phrasing with one sentence on what you personally decided, then add the result or trade-off that made the decision matter.`
      : "Rewrite the weakest answer by naming your personal decision, the trade-off, and the measurable result.",
    next_practice: overallScore >= 4
      ? "Run one more focused session and push for sharper executive-level reasoning."
      : `Practice another ${labelForFocus(focusType)} round and deliberately answer with ownership, decision, and impact in that order.`,
    dimension_scores: buildDimensionScores(focusType, questions)
  }
}

function buildInterviewerQuestionFeedback(
  signals: AnswerSignals,
  score: number,
  chainIndex: number
): QuestionInterviewerFeedback {
  const weakTags = weakSignalTags(signals)

  return {
    you_signaled: signals.wordCount === 0
      ? "No candidate answer was recorded for this question."
      : [
          signals.firstPersonCount > 0 ? "personal involvement" : "team involvement",
          signals.hasNumber ? "some quantified evidence" : "limited quantified evidence",
          signals.hasDecisionLanguage ? "decision awareness" : "low decision visibility"
        ].join(", "),
    interviewer_heard: score >= 4
      ? "A candidate with credible ownership and enough concrete evidence to follow the story."
      : score === 3
        ? "A contributor with relevant experience, but the interviewer still has to infer what you personally led."
        : "A team story more than your story; it is difficult to tell what you personally owned or changed.",
    missing_signals: weakTags.length > 0
      ? weakTags.map(gapLabel).join(" ")
      : `Q${chainIndex + 1} mostly had the core signals; the next step is making the reasoning more concise.`,
    language_note: shouldAddLanguageNote(signals)
      ? "The answer has enough content, but hedged or broad phrasing may soften the professional signal."
      : null,
    weak_signal_tags: weakTags
  }
}

function buildMentorQuestionFeedback(
  signals: AnswerSignals,
  score: number,
  chainIndex: number,
  focusType: SessionFocusType
): QuestionMentorFeedback {
  const primaryGap = weakSignalTags(signals)[0] ?? "decision_logic"

  return {
    gap_diagnosis: score >= 4
      ? "Depth problem — the answer works, but it can still show more explicit reasoning."
      : `${gapLabel(primaryGap)} The underlying experience may be real, but the framing does not yet make the signal easy to defend.`,
    how_to_fix: `For Q${chainIndex + 1}, use a four-sentence version: context, your decision, why that decision, and the result. Keep the focus on the ${labelForFocus(focusType).toLowerCase()} signal the question is testing.`,
    language_tip: signals.teamCount > signals.firstPersonCount
      ? "Try replacing one broad 'we' sentence with 'I led', 'I decided', or 'I owned', then state the evidence."
      : null
  }
}

function readAnswerSignals(exchanges: SessionExchange[]): AnswerSignals {
  const answerText = exchanges
    .filter((exchange) => exchange.role === "candidate")
    .map((exchange) => exchange.content)
    .join(" ")
    .trim()
  const lower = answerText.toLowerCase()
  const words = answerText.split(/\s+/).filter(Boolean)

  return {
    answerText,
    wordCount: words.length,
    firstPersonCount: countMatches(lower, /\b(i|my|me|mine|myself)\b/g),
    teamCount: countMatches(lower, /\b(we|our|us|team)\b/g),
    hasNumber: /\d|percent|percentage|kpi|metric|revenue|users|growth|reduced|increased/i.test(answerText),
    hasDecisionLanguage: /\b(decided|chose|prioritized|trade[- ]?off|because|reason|hypothesis|recommend|led|owned)\b/i.test(answerText),
    hasImpactLanguage: /\b(result|impact|outcome|learned|improved|reduced|increased|saved|launched|converted)\b/i.test(answerText)
  }
}

function scoreAnswer(signals: AnswerSignals) {
  if (signals.wordCount === 0) return 1

  let score = 2
  if (signals.wordCount >= 45) score += 1
  if (signals.firstPersonCount > 0 && signals.firstPersonCount >= signals.teamCount) score += 1
  if (signals.hasNumber || signals.hasImpactLanguage) score += 1
  if (signals.hasDecisionLanguage) score += 1

  return Math.max(1, Math.min(5, score))
}

function weakSignalTags(signals: AnswerSignals) {
  const tags: string[] = []

  if (signals.firstPersonCount === 0 || signals.teamCount > signals.firstPersonCount) tags.push("ownership_clarity")
  if (!signals.hasNumber && !signals.hasImpactLanguage) tags.push("impact_evidence")
  if (!signals.hasDecisionLanguage) tags.push("decision_logic")
  if (signals.wordCount < 45) tags.push("answer_depth")

  return tags
}

function buildDimensionScores(focusType: SessionFocusType, questions: FeedbackQuestionResult[]): DimensionScore[] {
  const labelsByFocus: Record<SessionFocusType, string[]> = {
    resume_deep_dive: ["Ownership clarity", "Impact evidence", "Decision logic", "Language clarity"],
    behavioral: ["Situation setup", "Action specificity", "Result tangibility", "Language clarity"],
    motivation_fit: ["Authenticity signal", "Company research", "Career narrative", "Language clarity"],
    culture_collaboration: ["Team framing", "Conflict resolution", "Adaptability", "Language clarity"],
    situational: ["Problem framing", "Trade-off reasoning", "Action plan", "Language clarity"]
  }
  const averageScore = Math.max(1, Math.min(5, Math.round(average(questions.map((question) => question.score)))))

  return labelsByFocus[focusType].map((label, index) => ({
    label,
    score: Math.max(1, Math.min(5, averageScore + (index === 3 ? 0 : index % 2 === 0 ? 0 : -1))),
    evidence: index === 3
      ? "Language was evaluated only where phrasing affected credibility or clarity."
      : "Score is based on the recorded answers and follow-up exchanges in this session."
  }))
}

function shouldAddLanguageNote(signals: AnswerSignals) {
  return signals.wordCount > 80 && signals.firstPersonCount === 0
}

function gapLabel(tag: string) {
  const labels: Record<string, string> = {
    ownership_clarity: "Ownership clarity gap — the listener needs to know what you personally led.",
    impact_evidence: "Impact evidence gap — the answer needs a result, metric, or observable change.",
    decision_logic: "Decision logic gap — explain why you chose that action over alternatives.",
    answer_depth: "Answer depth gap — the answer needs enough detail for the interviewer to verify the story."
  }

  return labels[tag] ?? "Signal clarity gap — the answer needs more concrete evidence."
}

function titleCase(value: string) {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function countMatches(value: string, pattern: RegExp) {
  return value.match(pattern)?.length ?? 0
}

function average(values: number[]) {
  if (values.length === 0) return 1
  return values.reduce((sum, value) => sum + value, 0) / values.length
}
