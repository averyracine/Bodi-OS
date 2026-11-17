"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, site } from "@/content/site";

export function PhoneIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`flex flex-col leading-none ${light ? "text-white" : "text-ink"}`}>
      <span className="font-serif text-[1.45rem] tracking-[0.02em]">CV Capital</span>
      <span className={`mt-1 text-[0.6rem] uppercase tracking-[0.28em] ${light ? "text-white/70" : "text-muted"}`}>Creating Value</span>
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const overHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const transparent = overHero && !scrolled && !open;

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        transparent ? "border-b border-transparent bg-transparent text-white" : "border-b border-line bg-paper/95 text-ink backdrop-blur"
      }`}
    >
      <div className="container-x flex h-[76px] items-center justify-between gap-4">
        <Link href="/" aria-label={`${site.name} home`} className="shrink-0">
          <Logo light={transparent} />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-7 text-[0.92rem]">
            {nav.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={pathname.startsWith(n.href) ? "page" : undefined}
                  className="py-2 opacity-85 hover:opacity-100 aria-[current=page]:opacity-100 aria-[current=page]:underline aria-[current=page]:underline-offset-8"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a href={site.phoneHref} className="hidden items-center gap-2 px-2 py-2 text-[0.92rem] font-medium md:inline-flex">
            <PhoneIcon /> {site.phone}
          </a>
          <a href={site.phoneHref} aria-label={`Call ${site.phone}`} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-current/25 md:hidden">
            <PhoneIcon />
          </a>
          <Link href={site.cta.href} className="btn-primary hidden min-h-11 px-5 sm:inline-flex">
            {site.cta.primaryShort}
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-current/25 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-[76px] z-40 overflow-y-auto bg-paper text-ink lg:hidden">
          <nav aria-label="Mobile" className="container-x py-8">
            <ul className="divide-y divide-line border-y border-line">
              {[{ label: "Home", href: "/" }, ...nav, { label: "Contact", href: "/contact" }].map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="block py-4 font-serif text-2xl">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 grid gap-3">
              <Link href={site.cta.href} className="btn-primary">{site.cta.primary}</Link>
              <a href={site.phoneHref} className="btn-ghost"><PhoneIcon /> Call {site.phone}</a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

/** Fixed call / consultation bar on phones. */
export function MobileActionBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-line bg-paper/95 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
      <a href={site.phoneHref} className="btn-ghost min-h-12 text-ink"><PhoneIcon /> Call</a>
      <Link href={site.cta.href} className="btn-primary min-h-12">{site.cta.primaryShort}</Link>
    </div>
  );
}
