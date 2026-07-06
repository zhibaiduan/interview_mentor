import { Suspense } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { SetupFlow } from "@/components/product/setup/setup-flow"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export default async function SetupPage() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  const creditAccount = user
    ? await supabase
      .from("credit_accounts")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle()
    : null

  return (
    <AppShell>
      <Suspense fallback={null}>
        <SetupFlow initialCreditBalance={creditAccount?.data?.balance ?? null} />
      </Suspense>
    </AppShell>
  )
}
