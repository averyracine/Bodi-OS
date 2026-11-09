"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { PRESETS } from "@/lib/presets";
import { DEFAULT_PRESET_FAVORITES } from "@/lib/presets";
import { sanitizePreferences, type Theme, type ReducedMotion } from "@/lib/prefs";
import { notesStore } from "@/lib/notes-store";
import { track } from "@/lib/analytics";
import { useSession, type SessionInfo } from "@/hooks/useSession";
import { usePrefs } from "../PrefsProvider";
import { Icon } from "../Icon";

const THEMES: { id: Theme; label: string; swatch: string[] }[] = [
  { id: "graphite", label: "Graphite", swatch: ["#14171c", "#222730", "#52cfe4"] },
  { id: "midnight", label: "Midnight", swatch: ["#0f1424", "#1c2339", "#6fc8ff"] },
  { id: "contrast", label: "High contrast", swatch: ["#000", "#1d1d1d", "#7ff3ff"] },
];

function Section({ id, title, children, desc }: { id: string; title: string; desc?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="card p-5 scroll-mt-24">
      <h2 id={`${id}-h`} className="text-lg font-semibold">{title}</h2>
      {desc && <p className="text-muted text-sm mt-0.5">{desc}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SettingsView() {
  const { prefs, update, store, preview } = usePrefs();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!prefs) return <div className="skeleton h-96" aria-busy="true" aria-label="Loading settings" />;

  const exportPrefs = () => {
    // Export contains preferences only; notes are excluded on purpose.
    const blob = new Blob([JSON.stringify(prefs, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "command-center-preferences.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setMsg({ kind: "ok", text: "Preferences exported." });
  };

  const importPrefs = async (file: File) => {
    if (file.size > 64_000) return setMsg({ kind: "error", text: "That file is too large to be a preferences export." });
    try {
      const parsed = JSON.parse(await file.text());
      const clean = sanitizePreferences(parsed);
      update(() => ({ ...clean, analyticsConsent: prefs.analyticsConsent }));
      setMsg({ kind: "ok", text: "Preferences imported. Anything invalid was skipped." });
    } catch {
      setMsg({ kind: "error", text: "Couldn't read that file. Choose a .json export from this app." });
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-2 fade-in items-start">
      <h1 className="text-2xl font-semibold tracking-tight xl:col-span-2">Settings</h1>
      {store.error && <p role="alert" className="xl:col-span-2 card p-4 text-warn">{store.error}</p>}

      <div className="flex flex-col gap-5 min-w-0">
        <Section id="appearance" title="Appearance">
          <fieldset>
            <legend className="text-sm font-medium mb-2">Theme</legend>
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map((t) => (
                <label key={t.id} className={`card p-3 cursor-pointer flex flex-col gap-2 min-h-[56px] ${prefs.theme === t.id ? "ring-2 ring-accent" : ""}`}>
                  <input type="radio" name="theme" className="sr-only" checked={prefs.theme === t.id} onChange={() => update((p) => ({ ...p, theme: t.id }))} />
                  <span className="flex gap-1" aria-hidden="true">
                    {t.swatch.map((c) => <span key={c} className="h-6 flex-1 rounded-md border border-line" style={{ background: c }} />)}
                  </span>
                  <span className="font-medium">{t.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-5">
            <legend className="text-sm font-medium mb-2">Reduce motion</legend>
            <div className="seg" role="radiogroup" aria-label="Reduce motion">
              {(["system", "on", "off"] as ReducedMotion[]).map((v) => (
                <button key={v} role="radio" aria-checked={prefs.reducedMotion === v} onClick={() => update((p) => ({ ...p, reducedMotion: v }))}>
                  {v === "system" ? "Match device" : v === "on" ? "On" : "Off"}
                </button>
              ))}
            </div>
          </fieldset>
        </Section>

        <Section id="presets" title="Presets" desc="Watch, Listen and Focus each keep their own favorites.">
          <div className="seg" role="radiogroup" aria-label="Active preset">
            {PRESETS.map((p) => (
              <button key={p.id} role="radio" aria-checked={prefs.activePreset === p.id} onClick={() => update((x) => ({ ...x, activePreset: p.id }))}>
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-muted text-sm mt-2">{PRESETS.find((p) => p.id === prefs.activePreset)!.blurb}</p>
          <button
            className="btn btn-sm mt-3"
            onClick={() => {
              update((p) => ({ ...p, presets: { ...p.presets, [p.activePreset]: [...DEFAULT_PRESET_FAVORITES[p.activePreset]] } }));
              setMsg({ kind: "ok", text: "Preset favorites restored." });
            }}
          >
            <Icon name="reset" size={18} /> Restore default favorites for this preset
          </button>
        </Section>

        <Section id="data" title="Your data on this device" desc={preview ? "Preview only. Nothing here is saved." : "Stored in this browser. Notes are never included in exports or sync."}>
          <div className="flex flex-wrap gap-3">
            <button className="btn" onClick={exportPrefs}><Icon name="download" size={20} /> Export</button>
            <button className="btn" onClick={() => fileRef.current?.click()}><Icon name="upload" size={20} /> Import</button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importPrefs(f);
              e.target.value = "";
            }} />
            {!confirmReset ? (
              <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>Reset everything…</button>
            ) : (
              <span className="flex flex-wrap items-center gap-2" role="group" aria-label="Confirm reset">
                <span className="text-sm">Erase preferences and notes on this device?</span>
                <button className="btn btn-danger" onClick={() => {
                  store.reset();
                  if (!preview) notesStore.clear();
                  setConfirmReset(false);
                  setMsg({ kind: "ok", text: "Everything on this device was reset." });
                }}>Yes, reset</button>
                <button className="btn" onClick={() => setConfirmReset(false)}>Cancel</button>
              </span>
            )}
          </div>
          {msg && <p role={msg.kind === "error" ? "alert" : "status"} className={`mt-3 text-sm ${msg.kind === "error" ? "text-danger" : "text-accent"}`}>{msg.text}</p>}
        </Section>

        <Section id="privacy" title="Privacy" desc="Optional, anonymous usage events. Notes, links, emails and codes are never sent.">
          <div className="seg" role="radiogroup" aria-label="Anonymous analytics">
            {(["granted", "denied"] as const).map((v) => (
              <button key={v} role="radio" aria-checked={prefs.analyticsConsent === v} onClick={() => update((p) => ({ ...p, analyticsConsent: v }))}>
                {v === "granted" ? "Allow" : "Don't allow"}
              </button>
            ))}
          </div>
        </Section>
      </div>

      <div className="flex flex-col gap-5 min-w-0">
        {preview ? (
          <Section id="account" title="Account & billing">
            <p className="text-muted">In the real app, this is where you sign in, subscribe through Stripe&rsquo;s hosted checkout, and pair your car.</p>
          </Section>
        ) : (
          <AccountAndBilling />
        )}
      </div>
    </div>
  );
}

function AccountAndBilling() {
  const session = useSession();
  if (session.state === "loading") return <div className="skeleton h-64" aria-busy="true" aria-label="Loading account" />;
  if (session.state === "error")
    return (
      <Section id="account" title="Account">
        <p role="alert" className="text-warn">{session.message} Your local dashboard still works.</p>
        <button className="btn mt-3" onClick={session.reload}>Try again</button>
      </Section>
    );
  const s = session.session;
  if (s.mode === "demo") {
    return (
      <>
        <Section id="account" title="Account">
          <p><span className="chip chip-accent">Demo mode</span></p>
          <p className="text-muted mt-2">Accounts aren&rsquo;t set up in this build, so there&rsquo;s no sign-in and nothing leaves this browser.</p>
        </Section>
        <Section id="billing" title="Billing">
          <p className="text-muted">Billing isn&rsquo;t configured, so no payment can be taken. The plan is <strong className="text-fg">$10/month</strong> through Stripe-hosted checkout once accounts are enabled.</p>
        </Section>
        <Section id="devices" title="Car pairing">
          <p className="text-muted">Pairing needs an account, so it isn&rsquo;t available in demo mode.</p>
        </Section>
      </>
    );
  }
  return <LiveAccount s={s} reload={session.reload} />;
}

function LiveAccount({ s, reload }: { s: SessionInfo; reload: () => void }) {
  const { prefs, update } = usePrefs();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [checkoutParam] = useState(() => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("checkout")));
  const [confirming, setConfirming] = useState(checkoutParam === "returned" && !s.premium);

  // After returning from Stripe we only *poll* the server; the webhook decides access.
  useEffect(() => {
    if (!confirming) return;
    let tries = 0;
    const id = setInterval(async () => {
      tries++;
      try {
        const r = await fetch("/api/billing/status", { cache: "no-store" });
        const j = await r.json();
        if (j.premium) {
          clearInterval(id);
          setConfirming(false);
          reload();
        }
      } catch {
        /* keep trying */
      }
      if (tries >= 15) {
        clearInterval(id);
        setConfirming(false);
        setNote({ kind: "error", text: "We haven't received confirmation from Stripe yet. It can take a minute. Refresh this page shortly." });
      }
    }, 2000);
    return () => clearInterval(id);
  }, [confirming, reload]);

  const post = async (url: string, label: string) => {
    setBusy(label);
    setNote(null);
    try {
      const r = await fetch(url, { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.message ?? j.error ?? `Request failed (${r.status})`);
      return j;
    } catch (e) {
      setNote({ kind: "error", text: navigator.onLine ? `Couldn't ${label}: ${(e as Error).message}` : "You're offline. Try again when connected." });
      return null;
    } finally {
      setBusy(null);
    }
  };

  const sync = async (direction: "push" | "pull") => {
    setBusy(direction);
    setNote(null);
    try {
      if (direction === "push") {
        const r = await fetch("/api/preferences", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ preferences: prefs }) });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? r.status);
        setNote({ kind: "ok", text: "This device's preferences were saved to your account." });
      } else {
        const r = await fetch("/api/preferences", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? r.status);
        if (!j.preferences) return setNote({ kind: "ok", text: "Your account has no saved preferences yet. Import this device's first." });
        update((p) => ({ ...sanitizePreferences(j.preferences), recents: p.recents, analyticsConsent: p.analyticsConsent }));
        setNote({ kind: "ok", text: "Loaded preferences from your account." });
      }
    } catch (e) {
      setNote({ kind: "error", text: `Sync failed: ${(e as Error).message}` });
    } finally {
      setBusy(null);
    }
  };

  const actor = s.actor;
  const signedIn = actor?.kind === "user";
  const isDevice = actor?.kind === "device";
  const status = s.subscription?.status ?? "none";

  return (
    <>
      <Section id="account" title="Account">
        {!actor && (
          <>
            <p className="text-muted">Sign in on your phone with a one-time email link, then pair this car without typing a password here.</p>
            <div className="flex flex-wrap gap-3 mt-3">
              <a className="btn btn-primary" href="/login?next=/app/settings">Sign in</a>
              <a className="btn" href="/pair/car"><Icon name="car" size={20} /> Pair this car from your phone</a>
            </div>
          </>
        )}
        {signedIn && (
          <>
            <p>Signed in as <strong>{actor.email ?? "your account"}</strong></p>
            <form action="/auth/signout" method="post" className="mt-3"><button className="btn btn-sm">Sign out</button></form>
          </>
        )}
        {isDevice && <p>This car browser is paired to an account. Manage or revoke it from Settings on your phone.</p>}

        {(signedIn || isDevice) && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="font-medium">Sync</p>
            {s.premium ? (
              <>
                <p className="text-muted text-sm">Preferences sync only when you choose. Notes always stay on this device.</p>
                <div className="flex flex-wrap gap-3 mt-3">
                  <button className="btn" disabled={busy !== null} onClick={() => sync("push")}>
                    {busy === "push" ? "Saving…" : "Import this device's preferences to my account"}
                  </button>
                  <button className="btn" disabled={busy !== null} onClick={() => sync("pull")}>
                    {busy === "pull" ? "Loading…" : "Load from my account"}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-muted text-sm">Sync is part of the subscription.</p>
            )}
          </div>
        )}
        {note && <p role={note.kind === "error" ? "alert" : "status"} className={`mt-3 text-sm ${note.kind === "error" ? "text-danger" : "text-accent"}`}>{note.text}</p>}
      </Section>

      <Section id="billing" title="Billing">
        {!s.configured.billing ? (
          <p className="text-muted">Billing isn&rsquo;t configured in this environment, so no payment can be taken.</p>
        ) : !signedIn ? (
          <p className="text-muted">{isDevice ? "Manage billing from your phone." : "Sign in to subscribe."}</p>
        ) : confirming ? (
          <p role="status" className="text-accent">Confirming your payment with Stripe…</p>
        ) : s.premium ? (
          <>
            <p><span className="chip chip-accent">Active</span> {s.subscription?.cancelAtPeriodEnd ? "Ends" : "Renews"} {s.subscription?.currentPeriodEnd ? new Date(s.subscription.currentPeriodEnd).toLocaleDateString() : ""}</p>
            <button className="btn mt-3" disabled={busy !== null} onClick={async () => {
              const j = await post("/api/billing/portal", "open billing");
              if (j?.url) window.location.assign(j.url);
            }}>{busy ? "Opening…" : "Manage or cancel in Stripe"}</button>
          </>
        ) : (
          <>
            {status === "past_due" && <p className="text-warn mb-2">Your last payment didn&rsquo;t go through. Update your card to keep sync and pairing.</p>}
            {status === "canceled" && <p className="text-muted mb-2">Your subscription has ended.</p>}
            {checkoutParam === "canceled" && <p className="text-muted mb-2">Checkout was canceled. You haven&rsquo;t been charged.</p>}
            <p className="text-muted">$10/month. Adds account sync and car pairing. Third-party services are billed separately by them.</p>
            <div className="flex flex-wrap gap-3 mt-3">
              <button className="btn btn-primary" disabled={busy !== null} onClick={async () => {
                track("checkout_started", { surface: "settings" });
                const j = await post("/api/billing/checkout", "start checkout");
                if (j?.url) window.location.assign(j.url);
              }}>{busy ? "Opening Stripe…" : "Subscribe for $10/month"}</button>
              {status === "past_due" && (
                <button className="btn" onClick={async () => {
                  const j = await post("/api/billing/portal", "open billing");
                  if (j?.url) window.location.assign(j.url);
                }}>Update payment method</button>
              )}
            </div>
          </>
        )}
      </Section>

      {signedIn && <Devices />}
    </>
  );
}

interface Device { id: string; label: string; created_at: string; last_seen_at: string | null; revoked_at: string | null }

function Devices() {
  const [state, setState] = useState<{ kind: "loading" } | { kind: "error"; msg: string } | { kind: "ok"; devices: Device[] }>({ kind: "loading" });
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let alive = true;
    fetch("/api/devices", { cache: "no-store" })
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => alive && setState({ kind: "ok", devices: j.devices }))
      .catch(() => alive && setState({ kind: "error", msg: "Couldn't load paired devices." }));
    return () => {
      alive = false;
    };
  }, [nonce]);

  return (
    <Section id="devices" title="Paired cars" desc="Each pairing is a separate session with dashboard-only access. Revoke any you don't recognize.">
      {state.kind === "loading" && <div className="skeleton h-20" />}
      {state.kind === "error" && (
        <p role="alert" className="text-warn">{state.msg} <button className="btn btn-sm ml-2" onClick={() => setNonce((n) => n + 1)}>Retry</button></p>
      )}
      {state.kind === "ok" && (
        state.devices.length === 0 ? (
          <p className="text-muted">No cars paired yet. Open <strong className="text-fg">/pair/car</strong> in your car&rsquo;s browser to get a code.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {state.devices.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                <Icon name="car" />
                <div className="mr-auto">
                  <p className="font-medium">{d.label}</p>
                  <p className="text-muted text-sm">
                    Paired {new Date(d.created_at).toLocaleDateString()}
                    {d.last_seen_at ? ` · last used ${new Date(d.last_seen_at).toLocaleString()}` : ""}
                    {" · scope: dashboard"}
                  </p>
                </div>
                {d.revoked_at ? (
                  <span className="chip">Revoked</span>
                ) : (
                  <button className="btn btn-sm btn-danger" onClick={async () => {
                    const r = await fetch(`/api/devices/${d.id}`, { method: "DELETE" });
                    if (r.ok) setNonce((n) => n + 1);
                    else setState({ kind: "error", msg: "Couldn't revoke that device. Try again." });
                  }}>Revoke</button>
                )}
              </li>
            ))}
          </ul>
        )
      )}
    </Section>
  );
}

