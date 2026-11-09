"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/hooks/useSession";

const MESSAGES: Record<string, string> = {
  invalid_code: "That code doesn't match an active pairing request. Check the car screen.",
  expired: "That code has expired. Get a new one on the car.",
  already_used: "That code was already used. Get a new one on the car.",
  rate_limited: "Too many attempts. Wait a few minutes and try again.",
  subscription_required: "Pairing is part of the subscription. Subscribe in Settings first.",
  unauthenticated: "Your session ended. Sign in again.",
  bad_origin: "Request blocked. Open this page directly and try again.",
};

export function ApprovePairing() {
  const params = useSearchParams();
  const session = useSession();
  const [code, setCode] = useState(params.get("code") ?? "");
  const [label, setLabel] = useState("My car");
  const [state, setState] = useState<{ kind: "idle" | "busy" | "done" } | { kind: "error"; msg: string }>({ kind: "idle" });

  if (session.state === "loading") return <div className="skeleton h-48 mt-6" aria-busy="true" />;
  if (session.state === "error") {
    return (
      <div className="card p-5 mt-6" role="alert">
        <p>{session.message}</p>
        <button className="btn mt-3" onClick={session.reload}>Try again</button>
      </div>
    );
  }
  const s = session.session;
  if (s.mode === "demo") {
    return <div className="card p-5 mt-6"><p className="chip chip-accent">Demo mode</p><p className="text-muted mt-3">Pairing needs accounts, which aren&rsquo;t configured in this build.</p></div>;
  }
  if (s.actor?.kind !== "user") {
    const next = `/pair${code ? `?code=${encodeURIComponent(code)}` : ""}`;
    return (
      <div className="card p-5 mt-6">
        <p>Sign in on this phone to approve the car.</p>
        <a className="btn btn-primary mt-4 w-full" href={`/login?next=${encodeURIComponent(next)}`}>Sign in</a>
      </div>
    );
  }
  if (state.kind === "done") {
    return (
      <div className="card p-5 mt-6" role="status">
        <p className="font-semibold text-lg">Approved</p>
        <p className="text-muted mt-1">Your car will finish connecting in a few seconds. You can revoke it anytime in Settings → Paired cars.</p>
      </div>
    );
  }
  return (
    <form
      className="card p-5 mt-6 flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ kind: "busy" });
        try {
          const r = await fetch("/api/pair/approve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, label }) });
          const j = await r.json().catch(() => ({}));
          setState(r.ok ? { kind: "done" } : { kind: "error", msg: MESSAGES[j.error] ?? "Couldn't approve. Try again." });
        } catch {
          setState({ kind: "error", msg: "You appear to be offline." });
        }
      }}
    >
      <p className="text-sm text-muted">Signed in as {s.actor.email}</p>
      <label className="flex flex-col gap-1">
        <span className="font-medium">Code on the car screen</span>
        <input className="input font-mono text-2xl tracking-[0.2em] uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="XXXX-XXXX" autoCapitalize="characters" autoComplete="off" maxLength={9} required />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-medium">Name this car</span>
        <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} />
      </label>
      {state.kind === "error" && <p role="alert" className="text-danger text-sm">{state.msg}</p>}
      <button className="btn btn-primary" disabled={state.kind === "busy"}>{state.kind === "busy" ? "Approving…" : "Approve this car"}</button>
    </form>
  );
}
