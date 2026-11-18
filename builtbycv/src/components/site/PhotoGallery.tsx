"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type GalleryPhoto = { src: string; alt: string; caption: string; label: string; width: number; height: number };

/** Photo grid; clicking a photo opens it larger in a dialog (arrow keys / buttons to page, Esc to close). */
export function PhotoGallery({ photos, unconfirmedNote }: { photos: GalleryPhoto[]; unconfirmedNote?: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const close = useCallback(() => dialog.current?.close(), []);
  const step = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const onClose = () => setIndex(null);
    el.addEventListener("keydown", onKey);
    el.addEventListener("close", onClose);
    return () => {
      el.removeEventListener("keydown", onKey);
      el.removeEventListener("close", onClose);
    };
  }, [step]);

  const current = index === null ? null : photos[index];

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {photos.map((p, i) => (
          <li key={p.src} className={i === 0 && photos.length > 2 && p.width > p.height ? "col-span-2" : ""}>
            <figure>
              <button type="button" onClick={() => open(i)} className="group relative block w-full overflow-hidden rounded-2xl bg-sand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" style={{ aspectRatio: `${p.width} / ${p.height}` }} aria-label={`Open larger: ${p.caption}`}>
                <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" priority={i === 0} />
                <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-ink/75 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-white">{p.label}</span>
              </button>
              <figcaption className="mt-2 text-sm text-stone">{p.caption}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
      {unconfirmedNote}

      <dialog ref={dialog} aria-label={current ? current.caption : "Photo"} className="m-auto max-h-[100dvh] max-w-[100vw] bg-transparent p-0 backdrop:bg-ink/90" onClick={(e) => { if (e.target === dialog.current) close(); }}>
        {current && (
          <div className="flex max-h-[100dvh] flex-col items-center gap-3 p-4 text-white">
            <div className="relative" style={{ width: `min(${current.width}px, 92vw, calc(82dvh * ${current.width / current.height}))`, aspectRatio: `${current.width} / ${current.height}` }}>
              <Image key={current.src} src={current.src} alt={current.alt} fill sizes="92vw" loading="eager" className="rounded-xl object-contain" />
              <span className="absolute left-3 top-3 rounded-full bg-ink/75 px-3 py-1 text-xs font-medium uppercase tracking-wider">{current.label}</span>
            </div>
            <p className="text-sm text-white/85">{current.caption} <span className="text-white/55">· {index! + 1} of {photos.length}</span></p>
            <div className="flex gap-2">
              {photos.length > 1 && <button type="button" onClick={() => step(-1)} className="btn-ghost min-h-11 border-white/40 text-white">← Previous</button>}
              {photos.length > 1 && <button type="button" onClick={() => step(1)} className="btn-ghost min-h-11 border-white/40 text-white">Next →</button>}
              <button type="button" onClick={close} className="btn-ghost min-h-11 border-white/40 text-white" autoFocus>Close</button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
