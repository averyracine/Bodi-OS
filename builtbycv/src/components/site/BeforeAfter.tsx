"use client";
import Image from "next/image";
import { useId, useState } from "react";

type Img = { src: string; alt: string; width: number; height: number };

/**
 * Accessible before/after comparison: drag, tap, or use arrow keys on the range input.
 * Portrait pairs are capped in width so they don't fill a desktop screen top to bottom,
 * and no image is ever shown larger than its source.
 */
export function BeforeAfter({ before, after, beforeLabel = "Before" }: { before: Img; after: Img; beforeLabel?: string }) {
  const [pos, setPos] = useState(50);
  const id = useId();
  const portrait = after.height > after.width;
  const maxWidth = portrait ? Math.min(after.width, 560) : after.width;
  return (
    <figure className="mx-auto w-full" style={{ maxWidth }}>
      <div className="relative overflow-hidden rounded-2xl bg-sand-100" style={{ aspectRatio: `${after.width} / ${after.height}` }}>
        <Image src={after.src} alt={after.alt} fill sizes={`(min-width: 1024px) ${maxWidth}px, 100vw`} className="object-cover" loading="lazy" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <Image src={before.src} alt={before.alt} fill sizes={`(min-width: 1024px) ${maxWidth}px, 100vw`} className="object-cover" loading="lazy" />
        </div>
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white">{beforeLabel}</span>
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white">After</span>
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" style={{ left: `${pos}%` }}>
          <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-lg">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m9 6-6 6 6 6M15 6l6 6-6 6" /></svg>
          </span>
        </div>
        <label htmlFor={id} className="sr-only">Drag to compare {beforeLabel.toLowerCase()} and after</label>
        <input id={id} type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="ba-range absolute inset-0 h-full w-full cursor-ew-resize opacity-0 focus-visible:opacity-100" aria-valuetext={`${pos}% ${beforeLabel.toLowerCase()}`} />
      </div>
    </figure>
  );
}
