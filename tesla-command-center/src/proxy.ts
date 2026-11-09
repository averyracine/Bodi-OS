import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Refresh auth cookies on app, pairing and API routes; skip static assets and the Stripe webhook.
  matcher: ["/app/:path*", "/pair/:path*", "/pair", "/login", "/api/((?!stripe/webhook).*)"],
};
