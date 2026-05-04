# API Setup (Cost-first)

## Chosen Architecture
- STT: speech-to-text (segment-based)
- LLM: `gpt-5.4-mini` for interview flow
- LLM (optional): `gpt-5.4` only for final polish answer
- TTS: text-to-speech for interviewer voice replies

This is cheaper than full realtime voice while keeping a phone-like experience.

## What you need to provide
1. OpenAI API key (`OPENAI_API_KEY`)

## Setup
1. Copy `.env.example` to `.env`
2. Fill `OPENAI_API_KEY`

## Next implementation step
After key is ready, we will wire:
1. browser mic recording (segment upload)
2. STT endpoint call
3. LLM follow-up generation
4. TTS playback
