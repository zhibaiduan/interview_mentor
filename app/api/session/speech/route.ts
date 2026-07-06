import { createSpeechAudio } from "@/lib/ai/openai-audio"
import { responseError } from "@/lib/product/session-contracts"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return responseError("Sign in before generating interviewer speech.", 401)
  }

  const body = await request.json().catch(() => null) as {
    text?: unknown
    voice?: unknown
    instructions?: unknown
  } | null
  const text = typeof body?.text === "string" ? body.text.trim() : ""
  const voice = typeof body?.voice === "string" ? body.voice.trim() : null
  const instructions = typeof body?.instructions === "string" ? body.instructions.trim() : null

  if (text.length < 2) {
    return responseError("Missing speech text.")
  }

  if (text.length > 1200) {
    return responseError("Speech text is too long.")
  }

  if (!process.env.OPENAI_API_KEY || process.env.DEMO_MODE === "true") {
    return Response.json({
      skipped: true,
      reason: "OpenAI speech is disabled in this environment."
    })
  }

  try {
    const audio = await createSpeechAudio({ text, voice, instructions })
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=300"
      }
    })
  } catch (error) {
    return responseError(error instanceof Error ? error.message : "Could not generate interviewer speech.", 500)
  }
}
