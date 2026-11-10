"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

/**
 * "How to play" setup notes for cloud gaming, opened from an info button on
 * the tile. Static advice only: CruiseCtrl links to the official service and
 * never streams, relays or downloads a game itself.
 */
export const CLOUD_GAMING_STEPS: { title: string; body: string }[] = [
  { title: "Park the car", body: "Cloud gaming is for parked use only. Tesla blocks video while driving, and nothing here changes that." },
  {
    title: "Connect a controller",
    body: "Pair a Bluetooth controller with the car. A PS5 DualSense has been reported to work; Xbox wireless controllers have been reported to fail.",
  },
  { title: "Use a strong connection", body: "Strong Wi-Fi or a phone hotspot. Streaming over a weak signal lags or drops." },
  { title: "Sign in to Xbox", body: "Sign in at xbox.com/play with an account that has Xbox Game Pass." },
  { title: "Mind the hour caps", body: "Cloud play has monthly hour caps by Game Pass tier: 5, 10 or 15 hours a month." },
];

export function GuideButton({ name, className = "" }: { name: string; className?: string }) {
  // The portal target doubles as the open state; it's resolved on click.
  const [host, setHost] = useState<Element | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={btn}
        type="button"
        className={`guide-btn ${className}`}
        aria-haspopup="dialog"
        aria-expanded={host !== null}
        aria-label={`How to play: ${name}`}
        title="How to play"
        onClick={(e) => setHost(e.currentTarget.closest("[data-theme]") ?? document.body)}
      >
        <Icon name="info" size={18} />
      </button>
      {host &&
        // Portal out of the tile: animated (transformed) ancestors would otherwise trap
        // the fixed overlay. The themed app root keeps the theme's colour variables.
        createPortal(
          <GameGuideSheet
            name={name}
            onClose={() => {
              setHost(null);
              btn.current?.focus();
            }}
          />,
          host,
        )}
    </>
  );
}

export function GameGuideSheet({ name, onClose }: { name: string; onClose: () => void }) {
  const titleId = useId();
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative card w-full max-w-lg max-h-[85dvh] overflow-y-auto p-5 shadow-2xl fade-in"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="eyebrow">{name}</p>
            <h2 id={titleId} className="font-display text-2xl font-semibold mt-1">How to play</h2>
          </div>
          <button ref={close} type="button" className="icon-btn shrink-0" aria-label="Close" onClick={onClose}>
            <Icon name="x" size={20} />
          </button>
        </div>
        <p className="chip chip-warn mt-3 inline-flex">Unverified on current Tesla software</p>
        <ol className="mt-4 flex flex-col gap-3">
          {CLOUD_GAMING_STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="grid place-items-center w-7 h-7 rounded-full bg-accent-soft text-accent text-sm font-semibold shrink-0 tabular-nums" aria-hidden="true">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="font-semibold block">{s.title}</span>
                <span className="text-muted text-sm">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="text-muted text-xs mt-4">
          These steps come from public reports and haven&rsquo;t been verified on current Tesla software. The game streams from Xbox Cloud Gaming&rsquo;s own site; CruiseCtrl only opens the link. Game and service names are trademarks of their owners.
        </p>
      </div>
    </div>
  );
}
