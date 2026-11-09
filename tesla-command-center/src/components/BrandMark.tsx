/**
 * CruiseCtrl brand. Original mark: a keycap with a control caret (⌃).
 * Typographic only; it doesn't reference any vehicle maker's logo.
 */
export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <rect x="1.5" y="1.5" width="29" height="29" rx="8" style={{ fill: "var(--surface-2)", stroke: "var(--line-strong)" }} />
      <rect x="1.5" y="26" width="29" height="4.5" rx="2.25" style={{ fill: "var(--surface-3)" }} opacity="0.7" />
      <path d="M10 17.5 16 11.5l6 6" fill="none" style={{ stroke: "var(--accent)" }} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** "CRUISE CTRL" wordmark; CTRL sits in a subtle keycap. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.32em] font-display font-bold leading-none tracking-[0.06em] ${className}`} aria-label="CruiseCtrl">
      <span aria-hidden="true">CRUISE</span>
      <span aria-hidden="true" className="keycap">CTRL</span>
    </span>
  );
}

export function BrandName({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark size={compact ? 28 : 32} />
      <Wordmark className={compact ? "text-[1.02rem]" : "text-[1.15rem]"} />
    </span>
  );
}

/** Short independent-product disclaimer used on every public page. */
export const DISCLAIMER =
  "CruiseCtrl is an independent dashboard for use while parked. It isn't affiliated with or endorsed by Tesla, and it doesn't control your vehicle or any of its driving features.";
