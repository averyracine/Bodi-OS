"use client";

import { useCallback, useEffect, useState } from "react";

export interface SessionInfo {
  mode: "demo" | "live";
  configured: { auth: boolean; billing: boolean };
  actor: null | { kind: "user"; email: string | null } | { kind: "device" };
  subscription?: { status: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean } | null;
  premium?: boolean;
  access?: "subscription" | "owner" | null;
}

export type SessionState =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; session: SessionInfo };

export function useSession() {
  const [s, setS] = useState<SessionState>({ state: "loading" });
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    fetch("/api/session", { signal: ctrl.signal, cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Server responded ${r.status}`);
        return (await r.json()) as SessionInfo;
      })
      .then((session) => alive && setS({ state: "ready", session }))
      .catch((e: Error) => {
        if (alive && e.name !== "AbortError") {
          setS({ state: "error", message: navigator.onLine ? "Couldn't reach the server." : "You're offline." });
        }
      });
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [nonce]);

  return { ...s, reload } as SessionState & { reload: () => void };
}
