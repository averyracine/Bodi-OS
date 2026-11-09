import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "../env";

/**
 * Service-role client. Bypasses RLS, so it is only used inside route handlers
 * for webhook reconciliation, pairing, and other server-owned tables.
 */
export function getAdminSupabase() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!publicEnv.supabaseUrl || !key) return null;
  return createClient(publicEnv.supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
