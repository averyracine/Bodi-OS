import Link from "next/link";

export function PageHeader({ title, sub, actions, back }: { title: string; sub?: React.ReactNode; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && <Link href={back.href} className="mb-2 inline-block text-sm text-muted hover:text-ink">← {back.label}</Link>}
        <h1 className="truncate font-serif text-3xl sm:text-4xl">{title}</h1>
        {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, actions, className = "" }: { title?: string; children: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <section className={`card p-4 sm:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-medium">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" | "ok" | "warn" | "danger" }) {
  const t = {
    neutral: "bg-sand-100 text-ink-2",
    accent: "bg-accent/10 text-accent-dark",
    ok: "bg-ok/10 text-ok",
    warn: "bg-warn/10 text-warn",
    danger: "bg-danger/10 text-danger",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${t}`}>{children}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">{children}</p>;
}

export const smallBtn = "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-medium hover:bg-sand-50";
export const primaryBtn = "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-ink px-4 text-sm font-medium text-white hover:bg-ink-2 disabled:opacity-60";

export function DefList({ items, labelWidth = "9rem" }: { items: [string, React.ReactNode][]; labelWidth?: string }) {
  return (
    <dl className="grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-[var(--lw)_1fr]" style={{ ["--lw" as string]: labelWidth }}>
      {items.filter(([, v]) => v !== null && v !== undefined && v !== "").map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
