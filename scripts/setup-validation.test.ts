import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import {
  buildResumeMaterial,
  buildSessionConfig,
  isSupportedResumeFile,
  parseResumeSignals,
  sanitizeResumeForAi,
  validateResumeText,
  validateTargetRole
} from "../lib/product/setup-validation.ts"

const validResume = `Product Manager with experience in AI workflow products and interview preparation tools.

WORK EXPERIENCE
- Led discovery interviews with students and early-career candidates to identify interview preparation gaps.
- Designed an AI interview practice workflow that turns resumes and target roles into structured mock interview questions.
- Collaborated with engineering and design to prioritize onboarding clarity and measurable completion.

PROJECTS
- OfferUp interview practice product: built a focused setup flow and improved user trust by showing extracted resume signals before the session starts.

SKILLS
Product discovery, stakeholder communication, AI product strategy, React, TypeScript, data-informed prioritization.

RESULTS
Reduced setup confusion and created a repeatable 3-question focused practice flow.`

const validJd = "We are looking for a Product Manager working student to support discovery, analytics, stakeholder alignment, roadmap decisions, and clear communication with engineering and design teams."

const redactedPdfContactFixture = `Xiaoyan Duan
English(C1)|German(C1cert.)|Chinese(native) • German student visa|20h/week work permit
Berlin,Germany • me@example.com • +49 170 1234567 • linkedin.com/in/example • duanxy.vercel.app
SUMMARY
I build workflow products and public automation prototypes.
PROJECTS
- Built and publicly shared an end-to-end automation pipeline using n8n, AI agents, Airtable, and Telegram to track applications.`

const localPdfPath = "/Users/miumiu/Documents/项目/job_applications/resume/output/resume_en.pdf"

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

test("validates the 100 character minimum for resumes", () => {
  assert.equal(validateResumeText("Product manager. React. AI.").valid, false)
  assert.equal(validateResumeText(validResume).valid, true)
})

test("trims resumes above the 10000 word boundary", () => {
  const longResume = Array.from({ length: 10005 }, (_, index) => `word${index}`).join(" ")
  const result = validateResumeText(`WORK EXPERIENCE\n${longResume}`)

  assert.equal(result.truncated, true)
  assert.equal(result.warnings.includes("Resume was trimmed to 10,000 words."), true)
  assert.equal(result.text.split(/\s+/).length, 10000)
})

test("validates JD and quick role target paths", () => {
  assert.equal(validateTargetRole("jd", "Product Manager internship.", "").valid, false)
  assert.equal(validateTargetRole("jd", validJd, "").valid, true)
  assert.equal(validateTargetRole("quick", "", "").valid, false)
  assert.equal(validateTargetRole("quick", "", "Product Manager").valid, true)
})

test("removes contact and authorization fields from resume material", () => {
  const sanitized = sanitizeResumeForAi(redactedPdfContactFixture)

  assert.equal(sanitized.text.includes("me@example.com"), false)
  assert.equal(sanitized.text.includes("+49 170"), false)
  assert.equal(sanitized.text.includes("linkedin.com"), false)
  assert.equal(sanitized.text.includes("duanxy.vercel.app"), false)
  assert.equal(sanitized.text.includes("student visa"), false)
  assert.equal(sanitized.text.includes("work permit"), false)
  assert.equal(sanitized.removedFields.includes("Email address"), true)
  assert.equal(sanitized.removedFields.includes("Phone number"), true)
  assert.equal(sanitized.removedFields.includes("Social profile URLs"), true)
  assert.equal(sanitized.removedFields.includes("Personal website"), true)
  assert.equal(sanitized.removedFields.includes("Work authorization"), true)
})

test("does not remove useful project lines containing Telegram", () => {
  const sanitized = sanitizeResumeForAi(redactedPdfContactFixture)
  assert.equal(sanitized.text.includes("Telegram to track applications"), true)
})

test("parses resume signals from sanitized material", () => {
  const signals = parseResumeSignals(`${validResume}\nEmail: me@example.com`)
  assert.equal(signals.roles.includes("Product Manager"), true)
  assert.equal(signals.stripped.includes("Email address"), true)
  assert.equal(signals.sanitizedText.includes("me@example.com"), false)
})

test("keeps sanitized resume material complete instead of rule-formatting it", () => {
  const material = buildResumeMaterial(`${redactedPdfContactFixture}
EXPERIENCE
OfferUp | Product Manager | 2025
- Led resume-based interview setup and evaluation workflows.
- Partnered with engineering to turn candidate materials into focused practice questions.
EDUCATION
Semester project`)

  assert.equal(material.text.includes("SUMMARY"), true)
  assert.equal(material.text.includes("I build workflow products"), true)
  assert.equal(material.text.includes("OfferUp | Product Manager | 2025"), true)
  assert.equal(material.text.includes("Led resume-based interview setup"), true)
  assert.equal(material.text.includes("EDUCATION"), true)
  assert.equal(material.text.includes("Semester project"), true)
  assert.equal(material.text.includes("me@example.com"), false)
  assert.equal(material.removedFields.includes("Email address"), true)
  assert.equal(material.experiences.length > 0, true)
})

test("builds focused interview session config with sanitized resume text", () => {
  const config = buildSessionConfig({
    resumeText: `${validResume}\nPhone: +49 170 1234567`,
    roleMode: "jd",
    jdText: validJd,
    companyName: "Personio",
    quickRole: "",
    focusType: "behavioral",
    level: "mid",
    intensity: "high"
  })

  assert.equal(config.mode, "focused")
  assert.equal(config.target_role.type, "jd")
  assert.equal(config.target_role.company_name, "Personio")
  assert.equal(config.focus_type, "behavioral")
  assert.equal(config.level, "mid")
  assert.equal(config.interview_language, "en")
  assert.equal(config.follow_up_intensity, "high")
  assert.equal(config.max_follow_ups_per_question, 5)
  assert.equal(config.main_question_count, 3)
  assert.equal(config.resume_text.includes("+49 170"), false)
})

test("accepts PDF files for server-side parsing but still rejects DOC files", () => {
  assert.equal(isSupportedResumeFile("resume.txt", "text/plain"), true)
  assert.equal(isSupportedResumeFile("resume.md", ""), true)
  assert.equal(isSupportedResumeFile("resume.pdf", "application/pdf"), true)
  assert.equal(isSupportedResumeFile("resume.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"), false)
})

test("local real PDF fixture is present when running on the project owner's machine", () => {
  if (!existsSync(localPdfPath)) {
    console.log(`SKIP local PDF fixture not found: ${localPdfPath}`)
    return
  }

  assert.equal(isSupportedResumeFile(localPdfPath, "application/pdf"), true)
})
