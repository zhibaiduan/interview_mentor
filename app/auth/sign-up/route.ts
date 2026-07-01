import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const returnTo = String(formData.get("returnTo") || "/home");
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: new URL("/auth/callback", request.url).toString()
    }
  });

  if (error) {
    const url = new URL("/auth", request.url);
    url.searchParams.set("mode", "signup");
    url.searchParams.set("error", "Could not create account. Try another email or password.");
    url.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL(returnTo, request.url));
}
