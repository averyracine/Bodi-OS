import { approvePairing } from "@/lib/pairing/service";
import { supabasePairingStore } from "@/lib/pairing/supabase-store";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/supabase/server";
import { isSameOrigin, json, notConfigured, userHasPremium } from "@/lib/request";

const STATUS: Record<string, number> = {
  unauthenticated: 401, invalid_code: 404, expired: 410, already_used: 409, rate_limited: 429,
};

/** Called by the signed-in phone. Requires an active subscription. */
export async function POST(req: Request) {
  const admin = getAdminSupabase();
  if (!admin) return notConfigured("Car pairing");
  if (!(await isSameOrigin())) return json({ error: "bad_origin" }, 403);
  const user = await getSessionUser();
  if (!user) return json({ error: "unauthenticated" }, 401);
  if (!(await userHasPremium(user.id))) return json({ error: "subscription_required" }, 402);

  const body = (await req.json().catch(() => ({}))) as { code?: unknown; label?: unknown };
  const r = await approvePairing(supabasePairingStore(admin), {
    code: typeof body.code === "string" ? body.code : "",
    label: typeof body.label === "string" ? body.label : "",
    userId: user.id,
    now: Date.now(),
  });
  return r.ok ? json({ ok: true }) : json({ error: r.error }, STATUS[r.error] ?? 400);
}
