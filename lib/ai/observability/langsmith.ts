export async function traceAiWorkflow<T>({
  name,
  run
}: {
  name: string
  run: () => Promise<T>
}) {
  if (process.env.LANGSMITH_TRACING === "true" && !process.env.LANGSMITH_API_KEY) {
    console.warn(`LangSmith tracing requested for ${name}, but LANGSMITH_API_KEY is missing.`)
  }

  return run()
}
