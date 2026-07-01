import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleEnv } from "./env";

export function createAdminSupabaseClient() {
  const { url, serviceRoleKey } = getSupabaseServiceRoleEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
