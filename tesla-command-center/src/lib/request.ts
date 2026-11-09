import "server-only";
import { cookies, headers } from "next/headers";
import { getAdminSupabase } from "./supabase/admin";
import { getSessionUser } from "./supabase/server";
import { authenticateDevice } from "./pairing/service";
import { supabasePairingStore } from "./pairing/supabase-store";
import { getAccess } from "./access";

export const DEVICE_COOKIE = "tcc_device";

/** Rate-limit key: never stored raw (hashed with the pairing pepper). */
export async function clientKey(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || h.get("x-real-ip") || "unknown";
}

export type Actor =
  | { kind: "user"; userId: string; email: string | null }
  | { kind: "device"; userId: string; deviceId: string };

/** Resolves either a signed-in user (Supabase session) or a paired car device. */
export async function getActor(): Promise<Actor | null> {
  const user = await getSessionUser();
  if (user) return { kind: "user", userId: user.id, email: user.email };
  const token = (await cookies()).get(DEVICE_COOKIE)?.value;
  const admin = getAdminSupabase();
  if (!token || !admin) return null;
  const device = await authenticateDevice(supabasePairingStore(admin), token, Date.now());
  return device ? { kind: "device", userId: device.userId, deviceId: device.id } : null;
}

/** Server-side access check: active subscription (webhook-maintained) or owner entitlement. */
export async function userHasPremium(userId: string): Promise<boolean> {
  return (await getAccess(userId)).allowed;
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}

export function notConfigured(feature: string) {
  return json({ error: "not_configured", message: `${feature} is not configured in this environment (demo mode).` }, 503);
}

/** Same-origin check for state-changing requests that rely on cookies. */
export async function isSameOrigin(): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
