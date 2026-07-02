export type RoleMode = "jd" | "quick"
export type SetupFocusType = "resume" | "behavioral" | "motivation" | "culture" | "situational"
export type SetupLevel = "junior" | "mid" | "senior"
export type FollowUpIntensity = "off" | "low" | "medium" | "high"

export type PrivacyField =
  | "Email address"
  | "Phone number"
  | "Home address"
  | "Social profile URLs"
  | "Personal website"
  | "Work authorization"

export type ResumeValidation = {
  valid: boolean
  charCount: number
  text: string
  errors: string[]
  warnings: string[]
  truncated: boolean
}

export type ResumeSignals = {
  roles: string[]
  companies: string[]
  skills: string[]
  projects: string[]
  experiences: ResumeExperience[]
  stripped: PrivacyField[]
  sanitizedText: string
}

export type ResumeExperience = {
  heading: string
  bullets: string[]
}

export type ResumeMaterial = {
  text: string
  experiences: ResumeExperience[]
  removedFields: PrivacyField[]
  removedLineCount: number
  rawCharCount: number
}

export type SessionConfig = {
  mode: "focused"
  resume_text: string
  target_role: {
    type: "jd" | "generic_role"
    generic_role_name: string | null
    jd_text: string | null
    company_name: string | null
    parsed_requirements: string[]
  }
  focus_type: "resume_deep_dive" | "behavioral" | "motivation_fit" | "culture_collaboration" | "situational"
  level: SetupLevel
  interview_language: "en"
  follow_up_intensity: FollowUpIntensity
  max_follow_ups_per_question: 0 | 1 | 3 | 5
  main_question_count: 3
}

const resumeMinChars = 100
const resumeMaxWords = 10000

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const phonePattern = /(?<!\d)(?:\+?\d[\d\s().-]{7,}\d)(?!\d)/
const socialPattern = /\b(?:linkedin|github)\.com\/\S+|\b(?:linkedin|github)\b/i
const urlPattern = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|app|dev|io|me|net|org)\b/i
const addressPattern = /\b(?:home address|address|street|str\.?|straße|road|rd\.?|avenue|ave\.?|platz|allee)\b/i
const workAuthorizationPattern = /\b(?:student visa|work permit|work authorization|20h\/week|visa)\b/i
const headingPattern = /^(summary|profile|work experience|professional experience|experience|employment|projects|selected projects|education|skills|results|certifications|languages)$/i
const experienceHeadingPattern = /^(work experience|professional experience|experience|employment|work history|relevant experience)$/i
const projectHeadingPattern = /^(projects|selected projects|project experience)$/i
const skillsHeadingPattern = /^(skills|technical skills|core skills)$/i
const sectionEndPattern = /^(summary|profile|education|skills|technical skills|core skills|projects|selected projects|results|certifications|languages)$/i

const focusTypeMap: Record<SetupFocusType, SessionConfig["focus_type"]> = {
  resume: "resume_deep_dive",
  behavioral: "behavioral",
  motivation: "motivation_fit",
  culture: "culture_collaboration",
  situational: "situational"
}

const followUpMaxMap: Record<FollowUpIntensity, SessionConfig["max_follow_ups_per_question"]> = {
  off: 0,
  low: 1,
  medium: 3,
  high: 5
}

export function validateResumeText(rawText: string): ResumeValidation {
  const normalized = normalizeWhitespace(rawText)
  const truncated = countWords(normalized) > resumeMaxWords
  const text = truncated ? truncateWords(normalized, resumeMaxWords) : normalized
  const errors: string[] = []
  const warnings: string[] = []

  if (text.length < resumeMinChars) {
    errors.push("Resume content is too short. Add project experience before starting.")
  }

  if (truncated) {
    warnings.push("Resume was trimmed to 10,000 words.")
  }

  if (!/(project|selected projects|experience|work experience|employment)/i.test(text)) {
    warnings.push("No clear project or work experience section detected.")
  }

  if (!/\b(?:\d+%|\d+x|\d+\+|\d+\s?(?:users|customers|teams|projects|months|weeks|revenue|hours))\b/i.test(text)) {
    warnings.push("No concrete numbers or outcomes detected.")
  }

  return {
    valid: errors.length === 0,
    charCount: text.length,
    text,
    errors,
    warnings,
    truncated
  }
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length
}

function truncateWords(value: string, maxWords: number) {
  let count = 0
  const lines: string[] = []

  for (const line of value.split("\n")) {
    const words = line.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      lines.push("")
      continue
    }

    const remaining = maxWords - count
    if (remaining <= 0) break
    lines.push(words.slice(0, remaining).join(" "))
    count += Math.min(words.length, remaining)
  }

  return lines.join("\n").trim()
}

export function sanitizeResumeForAi(rawText: string) {
  const removed = new Set<PrivacyField>()
  const keptLines: string[] = []

  for (const line of rawText.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const fields = detectPrivacyFields(trimmed)
    if (fields.length > 0) {
      fields.forEach((field) => removed.add(field))
      continue
    }

    keptLines.push(trimmed)
  }

  return {
    text: keptLines.join("\n"),
    removedFields: Array.from(removed),
    removedLineCount: rawText.split("\n").filter((line) => detectPrivacyFields(line).length > 0).length
  }
}

export function parseResumeSignals(content: string): ResumeSignals {
  const sanitized = sanitizeResumeForAi(content)
  const experiences = parseWorkExperiences(sanitized.text)
  const skills = extractSkillTags(sanitized.text)
  const projects = extractProjectTags(sanitized.text)
  const roles = extractRoleTags(sanitized.text)
  const companies = extractCompanyTags(sanitized.text)

  return {
    roles: roles.length > 0 ? roles.slice(0, 3) : ["Product-minded builder"],
    companies: companies.length > 0 ? companies.slice(0, 3) : ["OfferUp", "Semester project"],
    skills: skills.length > 0 ? skills.slice(0, 6) : ["Product discovery", "AI product strategy", "React"],
    projects: projects.length > 0 ? projects.slice(0, 4) : ["Interview practice workflow"],
    experiences: experiences.slice(0, 3),
    stripped: sanitized.removedFields.length > 0
      ? sanitized.removedFields
      : ["Email address", "Phone number", "Home address", "Social profile URLs"],
    sanitizedText: sanitized.text
  }
}

export function validateTargetRole(roleMode: RoleMode, jdText: string, quickRole: string) {
  if (roleMode === "quick") {
    return {
      valid: quickRole.trim().length > 0,
      message: quickRole.trim().length > 0 ? "" : "Choose a target role first."
    }
  }

  return {
    valid: jdText.trim().length >= 50,
    message: jdText.trim().length >= 50 ? "" : "Paste at least 50 characters from the job description."
  }
}

export function buildSessionConfig({
  resumeText,
  roleMode,
  jdText,
  companyName,
  quickRole,
  focusType,
  level,
  intensity
}: {
  resumeText: string
  roleMode: RoleMode
  jdText: string
  companyName: string
  quickRole: string
  focusType: SetupFocusType
  level: SetupLevel
  intensity: FollowUpIntensity
}): SessionConfig {
  const sanitized = sanitizeResumeForAi(resumeText)

  return {
    mode: "focused",
    resume_text: sanitized.text,
    target_role: roleMode === "quick"
      ? {
          type: "generic_role",
          generic_role_name: quickRole.trim(),
          jd_text: null,
          company_name: null,
          parsed_requirements: []
        }
      : {
          type: "jd",
          generic_role_name: null,
          jd_text: jdText.trim(),
          company_name: companyName.trim() || null,
          parsed_requirements: []
        },
    focus_type: focusTypeMap[focusType],
    level,
    interview_language: "en",
    follow_up_intensity: intensity,
    max_follow_ups_per_question: followUpMaxMap[intensity],
    main_question_count: 3
  }
}

export function isSupportedResumeFile(fileName: string, mimeType = "") {
  return mimeType.includes("text") || mimeType === "application/pdf" || /\.(txt|md|pdf)$/i.test(fileName)
}

export function buildResumeMaterial(rawText: string): ResumeMaterial {
  const cleaned = normalizeExtractedText(rawText)
  const sanitized = sanitizeResumeForAi(cleaned)
  const experiences = parseWorkExperiences(sanitized.text)

  return {
    text: sanitized.text,
    experiences,
    removedFields: sanitized.removedFields,
    removedLineCount: sanitized.removedLineCount,
    rawCharCount: cleaned.length
  }
}

function detectPrivacyFields(line: string): PrivacyField[] {
  const fields: PrivacyField[] = []

  if (emailPattern.test(line)) fields.push("Email address")
  if (phonePattern.test(line)) fields.push("Phone number")
  if (socialPattern.test(line)) fields.push("Social profile URLs")
  if (addressPattern.test(line)) fields.push("Home address")
  if (workAuthorizationPattern.test(line)) fields.push("Work authorization")
  if (urlPattern.test(line)) fields.push("Personal website")

  return Array.from(new Set(fields))
}

function normalizeWhitespace(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\t/g, " ").trim()
}

function normalizeExtractedText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\f/g, "\n")
    .replace(/-\n(?=[a-z])/g, "")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
}

function parseWorkExperiences(text: string): ResumeExperience[] {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean)
  const startIndex = lines.findIndex((line) => experienceHeadingPattern.test(line))
  if (startIndex === -1) return []

  const entries: ResumeExperience[] = []
  let current: ResumeExperience | null = null

  for (const line of lines.slice(startIndex + 1)) {
    if (sectionEndPattern.test(line)) break

    const bullet = normalizeBullet(line)
    if (bullet) {
      if (!current) {
        current = { heading: "Experience", bullets: [] }
        entries.push(current)
      }
      current.bullets.push(bullet)
      continue
    }

    if (isLikelyExperienceHeading(line)) {
      current = { heading: line, bullets: [] }
      entries.push(current)
      continue
    }

    if (current) {
      current.bullets.push(line)
    } else {
      current = { heading: line, bullets: [] }
      entries.push(current)
    }
  }

  return entries
    .map((entry) => ({
      heading: entry.heading,
      bullets: entry.bullets.filter(Boolean).slice(0, 6)
    }))
    .filter((entry) => entry.heading || entry.bullets.length > 0)
    .slice(0, 6)
}

function normalizeBullet(line: string) {
  const bulletMatch = line.match(/^[-*•]\s*(.+)$/)
  if (bulletMatch) return bulletMatch[1].trim()
  return ""
}

function isLikelyExperienceHeading(line: string) {
  if (headingPattern.test(line)) return false
  if (line.length > 140) return false
  if (/^(20\d{2}|19\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present)/i.test(line)) return false
  return /(\||·| at |,|\b(?:intern|manager|engineer|designer|analyst|researcher|consultant|assistant|working student|werkstudent)\b)/i.test(line)
}

function extractSkillTags(text: string) {
  const skillLine = linesBetween(text, ["SKILLS"], ["RESULTS", "EDUCATION", "WORK EXPERIENCE"]).join(" ")
  const source = skillLine || text
  return source
    .split(/,|·|;|\n/)
    .map((skill) => skill.replace(/^-\s*/, "").trim())
    .filter((skill) => /(product|research|strategy|react|typescript|figma|analysis|communication|design|stakeholder|workflow|data)/i.test(skill))
    .slice(0, 8)
}

function extractProjectTags(text: string) {
  return linesBetween(text, ["SELECTED PROJECTS", "PROJECTS"], ["EDUCATION", "SKILLS", "RESULTS"])
    .filter((line) => !line.startsWith("-"))
    .slice(0, 5)
}

function extractRoleTags(text: string) {
  const matches = text.match(/\b(Product Manager|UX Researcher|Product Designer|Frontend Engineer|Backend Engineer|Data Analyst|Operations)\b/gi) ?? []
  return Array.from(new Set(matches.map((match) => titleCase(match))))
}

function extractCompanyTags(text: string) {
  const candidates = ["OfferUp", "Figma", "Personio", "Alibaba Cloud", "WPS Office"]
  return candidates.filter((company) => text.toLowerCase().includes(company.toLowerCase()))
}

function linesBetween(text: string, startHeadings: string[], endHeadings: string[]) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean)
  const startIndex = lines.findIndex((line) => startHeadings.some((heading) => line.toUpperCase() === heading))

  if (startIndex === -1) return []

  const endIndex = lines.findIndex((line, index) => (
    index > startIndex && endHeadings.some((heading) => line.toUpperCase() === heading)
  ))

  return lines.slice(startIndex + 1, endIndex === -1 ? lines.length : endIndex)
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ")
}
