"use client";

import { useState } from "react";
import { useSession } from "@/hooks/useSession";
import { track } from "@/lib/analytics";

export function SubscribePanel() {
  const session = useSession();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  if (session.state === "loading") return <div className="skeleton h-40 mt-6" />;
  if (session.state === "error") return <p role="alert" className="text-warn mt-6">{session.message}</p>;
  const s = session.session;
  if (s.premium) {
    return <a className="btn btn-primary mt-6" href="/app">Open the dashboard</a>;
  }
  if (!s.actor) {
    return <a className="btn btn-primary mt-6" href="/login?next=/app">Sign in</a>;
  }
  return (
    <div className="card p-5 mt-6 flex flex-col gap-3">
      {s.actor.kind === "user" && <p className="text-sm text-muted">Signed in as {s.actor.email}</p>}
      {s.configured.billing ? (
        <button
          className="btn btn-primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            track("checkout_started", { surface: "subscribe" });
            const r = await fetch("/api/billing/checkout", { method: "POST" });
            const j = await r.json().catch(() => ({}));
            if (j.url) window.location.assign(j.url);
            else {
              setBusy(false);
              setMsg("Couldn't open checkout. Try again shortly.");
            }
          }}
        >
          {busy ? "Opening Stripe…" : "Subscribe for $10/month"}
        </button>
      ) : (
        <p className="text-muted">Subscriptions aren&rsquo;t open yet. No payment can be taken on this site right now.</p>
      )}
      {msg && <p role="alert" className="text-danger text-sm">{msg}</p>}
      <form action="/auth/signout" method="post"><button className="btn btn-sm btn-ghost">Sign out</button></form>
    </div>
  );
}
