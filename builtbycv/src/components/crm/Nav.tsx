"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS: Record<string, string> = {
  home: "M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  inbox: "M4 4h16v12h-5l-1 3h-4l-1-3H4zM4 13h5l1 2h4l1-2h5",
  board: "M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v13h-4z",
  check: "M4 12l5 5L20 6",
  users: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 19v-1a4 4 0 0 0-3-3.9M15 3.1a3.5 3.5 0 0 1 0 6.8",
  folder: "M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  cog: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 14H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 3V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 10h.1a2 2 0 1 1 0 4z",
};

export const NAV = [
  { href: "/crm", label: "Dashboard", icon: "home", mobile: true },
  { href: "/crm/leads", label: "Leads", icon: "inbox", mobile: true },
  { href: "/crm/pipeline", label: "Pipeline", icon: "board", mobile: true },
  { href: "/crm/tasks", label: "Tasks", icon: "check", mobile: true },
  { href: "/crm/customers", label: "Customers", icon: "users", mobile: true },
  { href: "/crm/projects", label: "Projects", icon: "folder", mobile: false },
  { href: "/crm/settings", label: "Settings", icon: "cog", mobile: false },
];

export function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  );
}

const isActive = (path: string, href: string) => (href === "/crm" ? path === "/crm" : path.startsWith(href));

export function SideNav({ badge }: { badge: number }) {
  const path = usePathname();
  return (
    <ul className="space-y-1">
      {NAV.map((n) => (
        <li key={n.href}>
          <Link href={n.href} aria-current={isActive(path, n.href) ? "page" : undefined} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white aria-[current=page]:bg-white/10 aria-[current=page]:text-white">
            <Icon name={n.icon} />
            <span className="flex-1">{n.label}</span>
            {n.href === "/crm/leads" && badge > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-white">{badge}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function BottomNav({ badge }: { badge: number }) {
  const path = usePathname();
  return (
    <nav aria-label="CRM" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="grid grid-cols-5">
        {NAV.filter((n) => n.mobile).map((n) => (
          <li key={n.href}>
            <Link href={n.href} aria-current={isActive(path, n.href) ? "page" : undefined} className="relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted aria-[current=page]:text-ink">
              <Icon name={n.icon} />
              {n.label}
              {n.href === "/crm/leads" && badge > 0 && <span className="absolute right-[22%] top-1.5 h-2 w-2 rounded-full bg-accent" aria-label={`${badge} new`} />}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
