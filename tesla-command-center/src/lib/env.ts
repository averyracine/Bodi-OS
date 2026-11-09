/**
 * Integration availability. When secrets are missing the app runs in an
 * isolated demo mode: everything is local, nothing is charged, and the UI
 * shows a visible demo badge.
 */

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
};

export function isSupabaseConfigured(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabasePublishableKey);
}

/** Server-only: billing requires Supabase (identity) plus Stripe secrets. */
export function isBillingConfigured(): boolean {
  return Boolean(
    isSupabaseConfigured() &&
      process.env.SUPABASE_SECRET_KEY &&
      process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      (process.env.STRIPE_PRICE_LOOKUP_KEY || process.env.STRIPE_PRICE_ID),
  );
}

export function isServerAdminConfigured(): boolean {
  return Boolean(isSupabaseConfigured() && process.env.SUPABASE_SECRET_KEY);
}
