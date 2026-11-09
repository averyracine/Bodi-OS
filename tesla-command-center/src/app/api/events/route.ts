import { isAnalyticsEvent, sanitizeProps, sanitizeUtm } from "@/lib/analytics-schema";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { json } from "@/lib/request";

const CLIENT_EVENTS = new Set(["demo_open", "favorite_added", "checkout_started", "first_dashboard_use"]);

/**
 * Receives consent-gated product events. Only allowlisted names and props are
 * stored; no user id, IP, user agent, notes, or codes are persisted.
 */
export async function POST(req: Request) {
  const text = await req.text();
  if (text.length > 2048) return json({ error: "too_large" }, 413);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  const b = body as Record<string, unknown>;
  // subscription_activated is only ever recorded by the verified webhook.
  if (!isAnalyticsEvent(b.event) || !CLIENT_EVENTS.has(b.event)) return json({ error: "unknown_event" }, 400);
  const row = { event: b.event, props: sanitizeProps(b.props), utm: sanitizeUtm(b.utm) };

  const admin = getAdminSupabase();
  if (!admin) {
    if (process.env.NODE_ENV !== "production") console.info("[analytics:demo]", row);
    return json({ ok: true, stored: false });
  }
  const { error } = await admin.from("analytics_events").insert(row);
  return json({ ok: !error, stored: !error });
}
