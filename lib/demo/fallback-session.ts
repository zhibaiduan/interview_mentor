import { generateQuestionsFromSession } from "@/lib/ai/workflows/generate-questions"
import type { QuestionSeed, SessionFocusType } from "@/lib/product/session-contracts"

export function buildUserContextFallbackQuestions(input: {
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
  return generateQuestionsFromSession(input)
}
