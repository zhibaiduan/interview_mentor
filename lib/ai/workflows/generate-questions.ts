import { labelForFocus, type QuestionSeed, type SessionFocusType } from "@/lib/product/session-contracts"

export function generateQuestionsFromSession({
  focusType,
  level,
  fitMap,
  companyName,
  genericRole
}: {
  focusType: SessionFocusType
  level: "junior" | "mid" | "senior"
  fitMap: {
    resume_highlights?: string[]
    job_requirements?: string[]
    gap_points?: string[]
  }
  companyName: string | null
  genericRole: string | null
}): QuestionSeed[] {
  const highlight = cleanReference(fitMap.resume_highlights?.[0]) || "one of your most relevant projects"
  const secondHighlight = cleanReference(fitMap.resume_highlights?.[1]) || "a recent product or teamwork example"
  const requirement = cleanReference(fitMap.job_requirements?.[0]) || genericRole || "this role"
  const gap = cleanReference(fitMap.gap_points?.[0]) || "the part of the role that feels least proven on paper"
  const target = companyName ? `${companyName} role` : genericRole || "target role"

  if (focusType === "behavioral") {
    return [
      seed(0, `Tell me about a time you had to align people around a difficult decision. What was at stake, and what did you do?`, "Evaluate stakeholder alignment, conflict handling, and decision clarity.", secondHighlight),
      seed(1, `Describe a moment when a project did not go as planned. How did you respond, and what changed because of your actions?`, "Look for reflection, ownership, and evidence of learning.", highlight),
      seed(2, `Give me an example of taking ownership beyond your formal role. How did you know it mattered?`, "Test initiative and impact clarity.", requirement)
    ]
  }

  if (focusType === "motivation_fit") {
    return [
      seed(0, `Why are you interested in ${target}, and how does it connect to the work you have already done?`, "Assess motivation specificity and career narrative.", requirement),
      seed(1, `What makes this role a good next step for you now?`, "Check whether the candidate can explain timing and direction.", gap),
      seed(2, `If you joined this team, which part of your background would help fastest, and where would you need to grow?`, "Balance confidence with self-awareness.", highlight)
    ]
  }

  if (focusType === "culture_collaboration") {
    return [
      seed(0, `Tell me about a time your team disagreed. How did you help the group move forward?`, "Assess collaboration style and conflict maturity.", secondHighlight),
      seed(1, `How do you prefer to work with people from different functions or backgrounds?`, "Evaluate communication and cross-functional fit.", requirement),
      seed(2, `What kind of team environment helps you do your best work, and what responsibility do you take in creating it?`, "Understand culture fit without generic answers.", gap)
    ]
  }

  if (focusType === "situational") {
    return [
      seed(0, `Imagine ${target} needs a decision with incomplete data. How would you structure the next 48 hours?`, "Test prioritization and judgment under ambiguity.", requirement),
      seed(1, `If a stakeholder pushed for a solution you believed would hurt users, how would you respond?`, "Assess user advocacy and communication under pressure.", secondHighlight),
      seed(2, `You discover after launch that the expected impact is not happening. What do you do first?`, "Evaluate diagnosis and iteration instincts.", highlight)
    ]
  }

  const levelPhrase = level === "senior" ? "strategic ownership" : level === "mid" ? "independent ownership" : "your specific contribution"

  return [
    seed(0, `Walk me through ${highlight} — what was your specific ownership, and what did you personally ship?`, `Evaluate ${levelPhrase}, project depth, and concrete contribution.`, highlight),
    seed(1, `Which decision in that work was hardest, and how did you decide what to do?`, "Look for tradeoff thinking and decision logic.", requirement),
    seed(2, `Where does your experience most strongly match ${labelForFocus(focusType).toLowerCase()} for this role, and where might the interviewer still have doubts?`, "Test role fit, self-awareness, and evidence selection.", gap)
  ]
}

function seed(chainIndex: number, mainQuestion: string, intent: string, reference: string): QuestionSeed {
  return {
    chain_index: chainIndex,
    main_question: mainQuestion,
    question_intent: intent,
    resume_reference: reference
  }
}

function cleanReference(value: string | undefined) {
  if (!value) return ""
  return value.replace(/\s+/g, " ").trim().slice(0, 180)
}
