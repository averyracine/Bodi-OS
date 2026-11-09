"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { publicEnv } from "@/lib/env";
import { safeNextPath } from "@/lib/url";

const ERRORS: Record<string, string> = {
  link_invalid: "That sign-in link is invalid or has expired. Request a new one.",
  not_configured: "Accounts aren't configured in this environment.",
};

export function LoginForm() {
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "sending" | "sent" } | { kind: "error"; msg: string }>(() => {
    const e = params.get("error");
    return e ? { kind: "error", msg: ERRORS[e] ?? "Something went wrong. Try again." } : { kind: "idle" };
  });
  const supabase = getBrowserSupabase();

  if (!supabase) {
    return (
      <div className="card p-5 mt-6">
        <p className="chip chip-accent">Demo mode</p>
        <p className="text-muted mt-3">Accounts aren&rsquo;t configured in this build. The dashboard still works locally without signing in.</p>
        <a className="btn btn-primary mt-4" href="/app">Open the dashboard</a>
      </div>
    );
  }

  if (state.kind === "sent") {
    return (
      <div className="card p-5 mt-6" role="status">
        <p className="font-semibold text-lg">Check your email</p>
        <p className="text-muted mt-1">We sent a sign-in link to <strong className="text-fg">{email}</strong>. It expires soon and works once.</p>
        <button className="btn mt-4" onClick={() => setState({ kind: "idle" })}>Use a different email</button>
      </div>
    );
  }

  return (
    <form
      className="card p-5 mt-6 flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ kind: "sending" });
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: `${publicEnv.appUrl}/auth/confirm?next=${encodeURIComponent(next)}` },
        });
        setState(error ? { kind: "error", msg: error.status === 429 ? "Too many requests. Wait a minute and try again." : "Couldn't send the link. Check the address and try again." } : { kind: "sent" });
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="font-medium">Email</span>
        <input className="input" type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      {state.kind === "error" && <p role="alert" className="text-danger text-sm">{state.msg}</p>}
      <button className="btn btn-primary" disabled={state.kind === "sending"}>
        {state.kind === "sending" ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
