import { Suspense } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { SetupFlow } from "@/components/product/setup/setup-flow"

export default function SetupPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <SetupFlow />
      </Suspense>
    </AppShell>
  )
}
