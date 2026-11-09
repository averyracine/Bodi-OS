import { cookies } from "next/headers";
import { claimPairing } from "@/lib/pairing/service";
import { supabasePairingStore } from "@/lib/pairing/supabase-store";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { clientKey, DEVICE_COOKIE, isSameOrigin, json, notConfigured } from "@/lib/request";

const STATUS: Record<string, number> = { not_found: 404, expired: 410, already_claimed: 409, rate_limited: 429 };

/** Polled by the car. On approval, sets an httpOnly device cookie exactly once. */
export async function POST(req: Request) {
  const admin = getAdminSupabase();
  if (!admin) return notConfigured("Car pairing");
  if (!(await isSameOrigin())) return json({ error: "bad_origin" }, 403);
  const body = (await req.json().catch(() => ({}))) as { requestId?: unknown; pollSecret?: unknown };
  const r = await claimPairing(supabasePairingStore(admin), {
    requestId: typeof body.requestId === "string" ? body.requestId : "",
    pollSecret: typeof body.pollSecret === "string" ? body.pollSecret : "",
    clientKey: await clientKey(),
    now: Date.now(),
  });
  if (!r.ok) return json({ error: r.error }, STATUS[r.error] ?? 400);
  if (r.status === "pending") return json({ status: "pending", expiresAt: r.expiresAt });

  (await cookies()).set(DEVICE_COOKIE, r.deviceToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return json({ status: "paired" });
}
