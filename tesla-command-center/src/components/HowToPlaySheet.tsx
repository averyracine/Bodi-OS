"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

/**
 * Setup sheet for the GTA VI on Xbox Cloud Gaming tile. Owner reports only:
 * nothing here is verified on current Tesla software. CruiseCtrl just opens
 * xbox.com/play; it doesn't stream, relay or embed any game.
 */
export function HowToPlaySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      (lastFocus.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  const steps: { title: string; body: string }[] = [
    { title: "Park the car", body: "Gaming is for use while parked only." },
    { title: "Connect a controller", body: "Pair it over Bluetooth. A PS5 DualSense has been reported to work; Xbox wireless controllers have been reported to fail." },
    { title: "Use a strong connection", body: "Strong Wi-Fi or a phone hotspot. Cloud gaming needs fast, stable internet." },
    { title: "Sign in to Xbox with Game Pass", body: "Use an Xbox account with a Game Pass plan that includes cloud gaming. GTA VI launches Nov 19, 2026." },
    { title: "Mind the cloud-hour cap", body: "Monthly cloud play is reported to be capped at 5, 10 or 15 hours depending on your tier." },
  ];
  // Portal to <body> so the sheet sits above the header, dock and consent banner,
  // not inside the tile grid's animated stacking context.
  return createPortal(
    <div className="fixed inset-0 z-[70] grid place-items-end sm:place-items-center bg-black/65 p-0 sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="card w-full sm:max-w-lg max-h-[90dvh] overflow-y-auto p-5 sm:p-6 rounded-b-none sm:rounded-b-[var(--radius)] fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-xl bg-accent-soft text-accent shrink-0"><Icon name="gamepad" /></span>
          <div className="min-w-0 mr-auto">
            <h2 id={titleId} className="font-display text-xl font-semibold leading-tight">How to play GTA VI on Xbox Cloud Gaming</h2>
            <p className="text-sm text-warn mt-1">Unverified on current Tesla software. These steps come from owner reports.</p>
          </div>
          <button ref={closeRef} className="icon-btn shrink-0" aria-label="Close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <ol className="mt-5 flex flex-col gap-3">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="grid place-items-center w-7 h-7 rounded-full bg-surface-3 text-sm font-semibold tabular-nums shrink-0" aria-hidden="true">{i + 1}</span>
              <div>
                <p className="font-semibold">{s.title}</p>
                <p className="text-sm text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted mt-5">
          CruiseCtrl only opens xbox.com/play in this tab. It doesn&rsquo;t stream or relay games, and it can&rsquo;t change what your car allows while driving.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <a className="btn btn-primary" href="https://www.xbox.com/play" rel="noopener noreferrer" referrerPolicy="no-referrer">
            Open Xbox Cloud Gaming <Icon name="external" size={16} />
          </a>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
