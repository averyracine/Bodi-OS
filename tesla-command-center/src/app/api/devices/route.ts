import { connection } from "next/server";
import { getServerSupabase, getSessionUser } from "@/lib/supabase/server";
import { json, notConfigured } from "@/lib/request";

/** Lists the signed-in user's paired devices via RLS (token hashes are not selectable). */
export async function GET() {
  await connection(); // always per-request: depends on cookies and env
  const supabase = await getServerSupabase();
  if (!supabase) return notConfigured("Paired devices");
  const user = await getSessionUser();
  if (!user) return json({ error: "unauthenticated" }, 401);
  const { data, error } = await supabase
    .from("devices")
    .select("id, label, scope, created_at, last_seen_at, revoked_at")
    .order("created_at", { ascending: false });
  if (error) return json({ error: "load_failed" }, 500);
  return json({ devices: data });
}
