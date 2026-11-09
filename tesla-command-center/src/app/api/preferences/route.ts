import { connection } from "next/server";
import { sanitizePreferences } from "@/lib/prefs";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getActor, isSameOrigin, json, notConfigured, userHasPremium } from "@/lib/request";
import type { PresetId } from "@/lib/presets";

const PRESET_IDS: PresetId[] = ["watch", "listen", "focus"];

async function authorize() {
  const admin = getAdminSupabase();
  if (!admin) return { error: notConfigured("Account sync") } as const;
  const actor = await getActor();
  if (!actor) return { error: json({ error: "unauthenticated" }, 401) } as const;
  if (!(await userHasPremium(actor.userId))) return { error: json({ error: "subscription_required" }, 402) } as const;
  return { admin, actor } as const;
}

export async function GET() {
  await connection(); // always per-request: depends on cookies and env
  const a = await authorize();
  if ("error" in a) return a.error;
  const [{ data: pref }, { data: favs }] = await Promise.all([
    a.admin.from("preferences").select("data, updated_at").eq("user_id", a.actor.userId).maybeSingle(),
    a.admin.from("favorites").select("preset, position, service_id").eq("user_id", a.actor.userId).order("position"),
  ]);
  if (!pref) return json({ preferences: null });
  const presets: Record<string, string[]> = { watch: [], listen: [], focus: [] };
  for (const f of favs ?? []) presets[f.preset]?.push(f.service_id);
  const merged = sanitizePreferences({ ...(pref.data as object), presets, updatedAt: Date.parse(pref.updated_at) });
  return json({ preferences: merged });
}

export async function PUT(req: Request) {
  if (!(await isSameOrigin())) return json({ error: "bad_origin" }, 403);
  const a = await authorize();
  if ("error" in a) return a.error;
  const text = await req.text();
  if (text.length > 32_000) return json({ error: "too_large" }, 413);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  const prefs = sanitizePreferences((body as { preferences?: unknown })?.preferences);
  const now = new Date();
  // Notes and analytics consent stay device-local and are never synced.
  const { presets, recents: _recents, analyticsConsent: _consent, ...rest } = prefs;
  void _recents; void _consent;
  const userId = a.actor.userId;

  const { error: e1 } = await a.admin
    .from("preferences")
    .upsert({ user_id: userId, data: rest, updated_at: now.toISOString() });
  if (e1) return json({ error: "save_failed" }, 500);

  const rows = PRESET_IDS.flatMap((preset) =>
    presets[preset].map((service_id, position) => ({ user_id: userId, preset, position, service_id })),
  );
  const { error: e2 } = await a.admin.from("favorites").delete().eq("user_id", userId);
  const { error: e3 } = rows.length ? await a.admin.from("favorites").insert(rows) : { error: null };
  if (e2 || e3) return json({ error: "save_failed" }, 500);
  return json({ ok: true, updatedAt: now.getTime() });
}
