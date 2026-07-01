import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const returnTo = String(formData.get("returnTo") || "/home");
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const url = new URL("/auth", request.url);
    url.searchParams.set("error", "Could not sign in. Check your email and password.");
    url.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL(returnTo, request.url));
}
