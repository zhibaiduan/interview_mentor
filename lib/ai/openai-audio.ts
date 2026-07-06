const openAiBaseUrl = "https://api.openai.com/v1"
const defaultInterviewerSpeechInstructions = [
  "Speak like a calm, senior workplace interviewer in a realistic professional interview.",
  "Use a natural conversational pace that is slightly brisk, not slow or theatrical.",
  "Keep the delivery continuous with subtle intonation and natural phrase grouping.",
  "Sound grounded, warm, and steady; avoid a sales, radio host, or audiobook style.",
  "Ask the question clearly, with a short natural pause only where punctuation requires it."
].join(" ")

export type TranscribeAudioResult = {
  text: string
  source: "openai" | "fallback"
}

export async function transcribeAudioFile(file: File): Promise<TranscribeAudioResult> {
  if (!process.env.OPENAI_API_KEY || process.env.DEMO_MODE === "true") {
    return {
      text: "I led the initiative, owned the decision, worked with stakeholders, and improved the outcome with measurable impact.",
      source: "fallback"
    }
  }

  const formData = new FormData()
  formData.append("file", file)
  formData.append("model", process.env.OPENAI_STT_MODEL || "gpt-4o-mini-transcribe")

  const response = await fetch(`${openAiBaseUrl}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: formData
  })

  if (!response.ok) {
    throw new Error("OpenAI transcription failed.")
  }

  const payload = await response.json() as { text?: string }
  const text = typeof payload.text === "string" ? payload.text.trim() : ""

  if (!text) {
    throw new Error("OpenAI transcription returned empty text.")
  }

  return { text, source: "openai" }
}

export async function createSpeechAudio({
  text,
  voice,
  instructions
}: {
  text: string
  voice?: string | null
  instructions?: string | null
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.")
  }

  const response = await fetch(`${openAiBaseUrl}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      voice: voice || process.env.OPENAI_TTS_VOICE || "cedar",
      input: text,
      instructions: instructions || process.env.OPENAI_TTS_INSTRUCTIONS || defaultInterviewerSpeechInstructions,
      response_format: "mp3"
    })
  })

  if (!response.ok) {
    throw new Error("OpenAI speech generation failed.")
  }

  return response.arrayBuffer()
}
