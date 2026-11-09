import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured, publicEnv } from "../env";

/** Per-request Supabase client acting as the signed-in user (RLS applies). */
export async function getServerSupabase() {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component; the proxy refreshes sessions instead.
        }
      },
    },
  });
}

export interface SessionUser {
  id: string;
  email: string | null;
}

/** Verified user from the session JWT (getClaims validates the signature). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
}
