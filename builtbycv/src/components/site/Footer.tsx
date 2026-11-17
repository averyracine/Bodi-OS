import Link from "next/link";
import { site, nav } from "@/content/site";
import { services } from "@/content/services";
import { areas } from "@/content/areas";
import { Logo } from "./Header";
import { PlaceholderTag } from "./Placeholder";

export function Footer() {
  return (
    <footer className="bg-ink pb-28 pt-20 text-paper sm:pb-12">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/65">{site.positioning}</p>
            <dl className="mt-8 space-y-3 text-sm">
              <div>
                <dt className="sr-only">Phone</dt>
                <dd><a className="text-lg text-white hover:underline" href={site.phoneHref}>{site.phone}</a></dd>
              </div>
              <div>
                <dt className="sr-only">Email</dt>
                <dd className="text-white/70">
                  {site.email ? <a href={`mailto:${site.email}`} className="hover:underline">{site.email}</a> : <PlaceholderTag note="No public email confirmed yet">Public email needed</PlaceholderTag>}
                </dd>
              </div>
              <div>
                <dt className="sr-only">Hours</dt>
                <dd className="text-white/70">{site.hours.map((h) => <span key={h.days} className="block">{h.days}: {h.time}</span>)}</dd>
              </div>
              <div>
                <dt className="sr-only">Office</dt>
                <dd className="text-white/70">{site.address.display}</dd>
              </div>
            </dl>
          </div>

          <nav aria-label="Services">
            <h2 className="eyebrow mb-5 text-white/50">Services</h2>
            <ul className="space-y-2.5 text-sm text-white/80">
              {services.map((s) => <li key={s.slug}><Link className="hover:text-white" href={`/services/${s.slug}`}>{s.name}</Link></li>)}
            </ul>
          </nav>

          <nav aria-label="Service areas">
            <h2 className="eyebrow mb-5 text-white/50">Service area</h2>
            <ul className="space-y-2.5 text-sm text-white/80">
              {areas.map((a) => <li key={a.slug}><Link className="hover:text-white" href={`/service-areas/${a.slug}`}>{a.city}</Link></li>)}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-white/50">Plus Cave Creek, San Tan Valley and surrounding Greater Phoenix communities.</p>
          </nav>

          <nav aria-label="Company">
            <h2 className="eyebrow mb-5 text-white/50">Company</h2>
            <ul className="space-y-2.5 text-sm text-white/80">
              {nav.filter((n) => n.href !== "/services").map((n) => <li key={n.href}><Link className="hover:text-white" href={n.href}>{n.label}</Link></li>)}
              <li><Link className="hover:text-white" href="/contact">Contact</Link></li>
            </ul>
            {site.social.length > 0 && (
              <ul className="mt-6 flex gap-4 text-sm">
                {site.social.map((s) => <li key={s.href}><a href={s.href} rel="me noopener" target="_blank" className="text-white/80 hover:text-white">{s.label}</a></li>)}
              </ul>
            )}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-white/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {site.legalLine}. All rights reserved.</p>
          <p>
            Arizona ROC #{site.license.number} · {site.license.classification}
          </p>
        </div>
      </div>
    </footer>
  );
}
