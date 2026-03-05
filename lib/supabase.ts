import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let cached: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  if (!cached) {
    cached = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });
  }

  return cached;
}
