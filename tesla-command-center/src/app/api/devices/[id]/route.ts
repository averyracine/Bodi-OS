import { getAdminSupabase } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/supabase/server";
import { isSameOrigin, json, notConfigured } from "@/lib/request";

/** Revokes one of the signed-in user's devices. Scoped by user_id server-side. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/devices/[id]">) {
  const admin = getAdminSupabase();
  if (!admin) return notConfigured("Paired devices");
  if (!(await isSameOrigin())) return json({ error: "bad_origin" }, 403);
  const user = await getSessionUser();
  if (!user) return json({ error: "unauthenticated" }, 401);
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "not_found" }, 404);
  const { data, error } = await admin
    .from("devices")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .select("id");
  if (error) return json({ error: "revoke_failed" }, 500);
  return data?.length ? json({ ok: true }) : json({ error: "not_found" }, 404);
}
