"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, publicEnv } from "../env";

let client: ReturnType<typeof createBrowserClient> | null = null;

/** Returns null in demo mode so callers must handle the unconfigured state. */
export function getBrowserSupabase() {
  if (!isSupabaseConfigured()) return null;
  client ??= createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey);
  return client;
}
