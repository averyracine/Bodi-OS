import { publicEnv } from "@/lib/env";
import { startPairing } from "@/lib/pairing/service";
import { supabasePairingStore } from "@/lib/pairing/supabase-store";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { clientKey, isSameOrigin, json, notConfigured } from "@/lib/request";

/** Called by the car browser. Returns a short code, QR target, and a private poll secret. */
export async function POST() {
  const admin = getAdminSupabase();
  if (!admin) return notConfigured("Car pairing");
  if (!(await isSameOrigin())) return json({ error: "bad_origin" }, 403);
  const r = await startPairing(supabasePairingStore(admin), { clientKey: await clientKey(), now: Date.now() });
  if (!r.ok) return json({ error: r.error }, 429);
  return json({
    requestId: r.requestId,
    pollSecret: r.pollSecret,
    code: r.code,
    expiresAt: r.expiresAt,
    approveUrl: `${publicEnv.appUrl}/pair?code=${encodeURIComponent(r.code)}`,
  });
}
