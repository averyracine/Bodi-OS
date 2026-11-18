import { showPlaceholders } from "@/content/site";

/** Yellow tag marking unconfirmed content. Renders nothing once placeholders are switched off. */
export function PlaceholderTag({ children = "Placeholder", note }: { children?: React.ReactNode; note?: string }) {
  if (!showPlaceholders) return null;
  return (
    <span
      title={note}
      className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-dashed border-amber-500 bg-amber-100 px-1.5 py-0.5 align-middle font-sans text-[11px] font-medium normal-case tracking-normal text-amber-900"
    >
      ⚑ {children}
      {note && <span className="sr-only">: {note}</span>}
    </span>
  );
}

/** Stand-in for a missing company-owned photo. */
export function PhotoPlaceholder({
  label,
  className = "",
  tone = "dark",
}: {
  label: string;
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <div
      role="img"
      aria-label={`${label} (photo coming soon)`}
      className={`${tone === "dark" ? "ph-surface text-white/55" : "ph-surface-light text-ink/45"} relative flex items-end overflow-hidden ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="10" r="1.6" />
        <path d="m21 16-5-5-9 8" />
      </svg>
      {showPlaceholders && (
        <span className="m-3 rounded bg-black/30 px-2 py-1 text-[11px] font-medium text-white/80 backdrop-blur">
          ⚑ Photo needed: {label}
        </span>
      )}
    </div>
  );
}
