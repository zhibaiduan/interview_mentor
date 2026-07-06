import { transcribeAudioFile } from "@/lib/ai/openai-audio"
import { responseError } from "@/lib/product/session-contracts"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return responseError("Sign in before transcribing audio.", 401)
  }

  const formData = await request.formData().catch(() => null)
  const audio = formData?.get("audio")

  if (!(audio instanceof File)) {
    return responseError("Missing audio recording.")
  }

  if (audio.size > 18 * 1024 * 1024) {
    return responseError("Recording is too large. Keep answers under five minutes.")
  }

  try {
    const result = await transcribeAudioFile(audio)
    return Response.json(result)
  } catch (error) {
    return responseError(error instanceof Error ? error.message : "Could not transcribe audio.", 500)
  }
}
