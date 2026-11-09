import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { sanitizeUtm } from "@/lib/analytics-schema";
import { safeNextPath } from "@/lib/url";

/** Completes email magic-link sign-in (PKCE code or token hash). */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.redirect(new URL("/login?error=not_configured", origin));

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : { data: null, error: new Error("missing_params") };

  if (error || !data?.user) return NextResponse.redirect(new URL("/login?error=link_invalid", origin));

  // Attach first-touch campaign attribution (campaign tokens only) if not already set.
  const admin = getAdminSupabase();
  const raw = request.cookies.get("tcc_utm")?.value;
  if (admin && raw) {
    try {
      const utm = sanitizeUtm(JSON.parse(decodeURIComponent(raw)));
      await admin
        .from("profiles")
        .update({ utm_source: utm.utm_source ?? null, utm_medium: utm.utm_medium ?? null, utm_campaign: utm.utm_campaign ?? null })
        .eq("id", data.user.id)
        .is("utm_source", null);
    } catch {
      /* attribution is best-effort */
    }
  }
  return NextResponse.redirect(new URL(next, origin));
}
