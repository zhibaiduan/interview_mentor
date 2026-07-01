import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnTo = String(formData.get("returnTo") || "/home");
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: new URL(`/auth/callback?returnTo=${encodeURIComponent(returnTo)}`, request.url).toString()
    }
  });

  if (error || !data.url) {
    const url = new URL("/auth", request.url);
    url.searchParams.set("error", "Could not start Google sign in.");
    url.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(data.url);
}
