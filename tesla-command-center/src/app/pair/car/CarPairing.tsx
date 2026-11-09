"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import { useNow } from "@/hooks/useBrowser";

type State =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "waiting"; code: string; qr: string; expiresAt: number; requestId: string; pollSecret: string }
  | { kind: "paired" }
  | { kind: "expired" }
  | { kind: "error"; msg: string; retry: boolean };

/** Car side of pairing. The poll secret lives only in memory on this page. */
export function CarPairing() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const now = useNow(1000);
  const polling = useRef(false);
  const router = useRouter();

  const start = useCallback(async () => {
    setState({ kind: "starting" });
    try {
      const r = await fetch("/api/pair/start", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (r.status === 503) return setState({ kind: "error", msg: "Pairing isn't available in demo mode (accounts aren't configured).", retry: false });
      if (r.status === 429) return setState({ kind: "error", msg: "Too many codes requested. Wait a few minutes.", retry: true });
      if (!r.ok) throw new Error();
      const qr = await QRCode.toDataURL(j.approveUrl, { margin: 1, width: 320, color: { dark: "#0c0e11", light: "#ffffff" } });
      setState({ kind: "waiting", code: j.code, qr, expiresAt: j.expiresAt, requestId: j.requestId, pollSecret: j.pollSecret });
    } catch {
      setState({ kind: "error", msg: navigator.onLine ? "Couldn't start pairing." : "This browser is offline.", retry: true });
    }
  }, []);

  useEffect(() => {
    if (state.kind !== "waiting") return;
    const { requestId, pollSecret } = state;
    const id = setInterval(async () => {
      if (polling.current) return;
      polling.current = true;
      try {
        const r = await fetch("/api/pair/claim", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ requestId, pollSecret }) });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j.status === "paired") {
          setState({ kind: "paired" });
          setTimeout(() => router.push("/app"), 1500);
        } else if (r.status === 410) {
          setState({ kind: "expired" });
        } else if (r.status === 409 || r.status === 404) {
          setState({ kind: "error", msg: "This pairing request is no longer valid.", retry: true });
        }
      } catch {
        /* transient: keep polling */
      } finally {
        polling.current = false;
      }
    }, 2500);
    return () => clearInterval(id);
  }, [state, router]);

  const remaining = state.kind === "waiting" && now ? Math.max(0, state.expiresAt - now.getTime()) : null;
  const expiredLocally = remaining === 0;

  return (
    <div className="mt-8">
      {state.kind === "idle" && (
        <div className="card p-6">
          <p className="text-lg">You&rsquo;ll get a code that expires in 5 minutes and works once.</p>
          <button className="btn btn-primary mt-4 text-lg" onClick={start}>Show pairing code</button>
        </div>
      )}
      {state.kind === "starting" && <div className="skeleton h-80" aria-busy="true" aria-label="Creating code" />}
      {state.kind === "waiting" && !expiredLocally && (
        <div className="card p-6 grid gap-6 md:grid-cols-[320px_1fr] items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={state.qr} alt="QR code that opens the approval page on your phone" width={320} height={320} className="rounded-2xl bg-white" />
          <div>
            <p className="text-muted">Or open <strong className="text-fg">/pair</strong> on your phone and enter:</p>
            <p className="font-mono text-6xl font-semibold tracking-[0.15em] mt-2" aria-label={`Code ${state.code.split("").join(" ")}`}>{state.code}</p>
            <p className="text-muted mt-4" role="timer">
              Expires in {remaining !== null ? `${Math.floor(remaining / 60000)}:${String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0")}` : "…"}
            </p>
            <p className="text-sm text-muted mt-2" aria-live="polite">Waiting for approval on your phone…</p>
            <button className="btn mt-4" onClick={() => setState({ kind: "idle" })}>Cancel</button>
          </div>
        </div>
      )}
      {(state.kind === "expired" || (state.kind === "waiting" && expiredLocally)) && (
        <div className="card p-6" role="alert">
          <p className="text-lg font-semibold">That code expired.</p>
          <button className="btn btn-primary mt-4" onClick={start}>Get a new code</button>
        </div>
      )}
      {state.kind === "paired" && (
        <div className="card p-6" role="status">
          <p className="text-2xl font-semibold text-accent">Paired</p>
          <p className="text-muted mt-1">Opening your dashboard…</p>
        </div>
      )}
      {state.kind === "error" && (
        <div className="card p-6" role="alert">
          <p className="text-lg">{state.msg}</p>
          <div className="flex gap-3 mt-4">
            {state.retry && <button className="btn btn-primary" onClick={start}>Try again</button>}
            <a className="btn" href="/app">Back to dashboard</a>
          </div>
        </div>
      )}
    </div>
  );
}
