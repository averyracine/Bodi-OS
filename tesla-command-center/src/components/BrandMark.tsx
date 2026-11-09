/** Original mark: a rounded "command" bracket around a dot. Not derived from any vehicle brand. */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="tcc-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="color-mix(in srgb, var(--accent) 40%, #1d6b7a)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="var(--surface-3)" stroke="var(--line)" />
      <path d="M12 9H9.5A1.5 1.5 0 0 0 8 10.5v11A1.5 1.5 0 0 0 9.5 23H12M20 9h2.5a1.5 1.5 0 0 1 1.5 1.5v11a1.5 1.5 0 0 1-1.5 1.5H20" fill="none" stroke="url(#tcc-g)" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2.6" fill="var(--accent)" />
    </svg>
  );
}

export function BrandName({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5 font-semibold tracking-tight">
      <BrandMark size={compact ? 28 : 32} />
      <span className={`font-display ${compact ? "text-base" : "text-lg"}`}>
        Command Center<span className="text-muted font-normal"> for Tesla</span>
      </span>
    </span>
  );
}
