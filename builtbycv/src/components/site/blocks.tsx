import Link from "next/link";
import Image from "next/image";
import { site, stats, founder, showPlaceholders } from "@/content/site";
import { services } from "@/content/services";
import { projects as allProjects, statusLabel, type PortfolioProject } from "@/content/projects";
import { projectPricing, startingPriceDisclaimer } from "@/content/pricing";
import { comparison, faqs as allFaqs, financing, testimonials, testimonialsHeading, offers } from "@/content/copy";
import { Section, SectionHeader } from "./Section";
import { PhotoPlaceholder, PlaceholderTag } from "./Placeholder";

export function priceNote(pricingKey: string) {
  return projectPricing.find((x) => x.key === pricingKey)?.priceLabel ?? null;
}

/** Inner-page hero: restrained, text-led. */
export function PageHero({ eyebrow, title, lede, children }: { eyebrow?: string; title: string; lede?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="border-b border-line bg-paper pb-16 pt-16 sm:pb-20 sm:pt-24">
      <div className="container-x">
        {eyebrow && <p className="eyebrow fade-up mb-5">{eyebrow}</p>}
        <h1 className="h-display fade-up max-w-5xl" style={{ animationDelay: "60ms" }}>{title}</h1>
        {lede && <p className="lede fade-up mt-6 max-w-2xl" style={{ animationDelay: "140ms" }}>{lede}</p>}
        {children}
      </div>
    </section>
  );
}

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((it, i) => (
          <li key={it.path} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {i === items.length - 1 ? <span aria-current="page" className="text-ink">{it.name}</span> : <Link href={it.path} className="hover:text-ink">{it.name}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function OffersBlock() {
  return (
    <Section tone="white" labelledBy="offers-h">
      <SectionHeader id="offers-h" eyebrow="Before you commit" title="Three things we do for free." lede="Understand feasibility, design direction and investment before you sign anything." />
      <ol className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
        {offers.map((o, i) => (
          <li key={o.title} className="bg-white p-8 sm:p-10">
            <span className="font-serif text-5xl font-light text-sand-400">0{i + 1}</span>
            <h3 className="h3 mt-6">{o.title}</h3>
            <p className="mt-3 leading-relaxed text-stone">{o.body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10">
        <Link href={site.cta.href} className="btn-primary">{site.cta.primary}</Link>
      </div>
    </Section>
  );
}

export function ServicesGrid({ headingId = "services-h", showHeader = true }: { headingId?: string; showHeader?: boolean }) {
  return (
    <>
      {showHeader && (
        <SectionHeader id={headingId} eyebrow="Services" title="One licensed team, from a single bath to a ground-up build." lede={`Our KB-1 dual license covers residential and commercial building. That means one contract and one point of contact for the whole project.`} />
      )}
      <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s) => (
          <li key={s.slug} className="group bg-white">
            <Link href={`/services/${s.slug}`} className="flex h-full flex-col p-7 transition-colors hover:bg-sand-50">
              <span className="text-sm font-medium text-accent">{priceNote(s.pricingKey)}</span>
              <h3 className="mt-4 font-serif text-2xl font-normal leading-tight">{s.name}</h3>
              <p className="mt-3 flex-1 text-[0.95rem] leading-relaxed text-stone">{s.short}</p>
              <span className="mt-6 text-sm font-medium underline decoration-current/30 underline-offset-[6px] group-hover:decoration-current">
                Learn more<span className="sr-only"> about {s.name}</span> →
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm text-muted">{startingPriceDisclaimer}</p>
    </>
  );
}

export function ProjectStatus({ p }: { p: PortfolioProject }) {
  if (p.status) return <span className="rounded-full border border-current/25 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider">{statusLabel[p.status]}</span>;
  return <PlaceholderTag note="Completed, under construction or planned?">Status?</PlaceholderTag>;
}

export function ProjectCard({ p, priority = false }: { p: PortfolioProject; priority?: boolean }) {
  const photo = p.photos[0];
  return (
    <article className="group">
      <Link href={`/projects/${p.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
          {photo ? (
            <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" priority={priority} />
          ) : (
            <PhotoPlaceholder label={p.name} className="h-full w-full" />
          )}
        </div>
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-2xl font-normal leading-tight group-hover:underline group-hover:underline-offset-4">{p.name}</h3>
            <p className="mt-1 text-sm text-muted">{p.area} · {p.city}</p>
          </div>
          <ProjectStatus p={p} />
        </div>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-stone">{p.summary}</p>
      </Link>
    </article>
  );
}

export function FeaturedProjects({ limit = 6 }: { limit?: number }) {
  const list = allProjects.filter((p) => p.featured).slice(0, limit);
  return (
    <Section tone="paper" labelledBy="projects-h">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHeader id="projects-h" eyebrow="Featured projects" title="Recent and current work across the Valley." />
        <Link href="/projects" className="link-arrow mb-12 shrink-0 sm:mb-16">All projects →</Link>
      </div>
      <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => <ProjectCard key={p.slug} p={p} />)}
      </div>
    </Section>
  );
}

export function ComparisonTable() {
  return (
    <>
      {/* table on larger screens */}
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-white md:block">
        <table className="w-full text-left text-[0.95rem]">
          <caption className="sr-only">{comparison.heading}</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="w-1/5 px-6 py-5 font-medium text-muted"><span className="sr-only">Topic</span></th>
              <th scope="col" className="w-2/5 bg-ink px-6 py-5 font-serif text-xl font-normal text-paper">CV Capital</th>
              <th scope="col" className="w-2/5 px-6 py-5 font-serif text-xl font-normal text-muted">Typical contractor</th>
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((r) => (
              <tr key={r.topic} className="border-b border-line last:border-0">
                <th scope="row" className="px-6 py-5 align-top font-medium">{r.topic}</th>
                <td className="bg-sand-50 px-6 py-5 align-top"><span className="mr-2 text-ok" aria-hidden="true">✓</span>{r.cv}</td>
                <td className="px-6 py-5 align-top text-stone">{r.typical}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* stacked cards on phones */}
      <ul className="grid gap-3 md:hidden">
        {comparison.rows.map((r) => (
          <li key={r.topic} className="card p-5">
            <h3 className="font-medium">{r.topic}</h3>
            <p className="mt-3 text-sm"><span className="font-medium">CV Capital: </span>{r.cv}</p>
            <p className="mt-2 text-sm text-stone"><span className="font-medium">Typical: </span>{r.typical}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 max-w-3xl text-sm text-muted">{comparison.footnote}</p>
    </>
  );
}

export function StatsBand() {
  const visible = stats.filter((s) => s.verified || showPlaceholders);
  return (
    <section aria-label="Company facts" className="bg-ink py-16 text-paper sm:py-20">
      <div className="container-x">
        <dl className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((s) => (
            <div key={s.label} className="flex flex-col border-t border-white/15 pt-6">
              <dt className="order-2 mt-2 text-sm text-white/65">{s.label} {!s.verified && <PlaceholderTag note={s.note}>Needs proof</PlaceholderTag>}</dt>
              <dd className="order-1 font-serif text-4xl font-light tracking-tight sm:text-5xl">{s.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
          <span>Licensed Arizona General Contractor · ROC #{site.license.number}</span>
          {site.insuredVerified ? <span>Bonded & insured</span> : <PlaceholderTag note="Confirm insurance before advertising">“Insured”: confirm</PlaceholderTag>}
          <a href={site.license.lookupUrl} target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-white">Verify our license ↗</a>
        </p>
      </div>
    </section>
  );
}

export function FounderBlock() {
  return (
    <Section tone="white" labelledBy="founder-h">
      <div className="grid items-center gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
          {founder.photo ? (
            <Image src={founder.photo} alt={`${founder.name}, ${founder.title} of ${site.name}`} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          ) : (
            <PhotoPlaceholder label={`Approved portrait of ${founder.name}`} className="h-full w-full" />
          )}
        </div>
        <div>
          <p className="eyebrow mb-4">Founder</p>
          <h2 id="founder-h" className="h2">{founder.name}</h2>
          <p className="mt-2 text-muted">{founder.title}, {site.name}</p>
          <blockquote className="mt-8 border-l-2 border-accent pl-6 font-serif text-2xl font-light italic leading-snug">“{founder.quote}”</blockquote>
          <div className="mt-8 space-y-4 leading-relaxed text-stone">{founder.bio.map((b) => <p key={b}>{b}</p>)}</div>
          <Link href="/our-story" className="link-arrow mt-8">Our story →</Link>
        </div>
      </div>
    </Section>
  );
}

export function Testimonials() {
  const g = site.googleReviews;
  return (
    <Section tone="sand" labelledBy="reviews-h">
      <SectionHeader
        id="reviews-h"
        eyebrow="Client reviews"
        title={testimonialsHeading}
        extra={
          g.rating && g.count ? (
            <p className="mt-6 text-stone">
              <span className="font-medium text-ink">{g.rating.toFixed(1)} ★</span> from {g.count} Google reviews{g.url && <> · <a className="underline" href={g.url} target="_blank" rel="noopener">Read them on Google ↗</a></>}
            </p>
          ) : (
            <p className="mt-6"><PlaceholderTag note="Add rating, count and Google Business Profile link in src/content/site.ts">Google rating & review count</PlaceholderTag></p>
          )
        }
      />
      {testimonials.length > 0 ? (
        <ul className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <li key={t.name + t.city} className="card flex flex-col p-8">
              <blockquote className="flex-1 font-serif text-xl font-light leading-snug">“{t.quote}”</blockquote>
              <p className="mt-6 text-sm"><span className="font-medium">{t.name}</span> · {t.city}{t.project && <span className="text-muted"> · {t.project}</span>}</p>
            </li>
          ))}
        </ul>
      ) : showPlaceholders ? (
        <ul className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <li key={i} className="flex min-h-48 flex-col justify-between rounded-2xl border border-dashed border-sand-400 p-8 text-stone">
              <p className="text-sm">Real client testimonial #{i}: first name, city, project type, and written permission to publish.</p>
              <PlaceholderTag>Testimonial needed</PlaceholderTag>
            </li>
          ))}
        </ul>
      ) : null}
    </Section>
  );
}

export function FinancingBlock({ headingLevel = "h2" }: { headingLevel?: "h1" | "h2" }) {
  const H = headingLevel;
  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
      <div>
        <p className="eyebrow mb-4">Financing & payments</p>
        <H id="financing-h" className="h2">{financing.heading}</H>
        <p className="lede mt-5">{financing.body}</p>
        {(() => {
          const shown = financing.partners.filter((p) => p.confirmed || showPlaceholders);
          if (!shown.length) return null;
          const apply = financing.partners.find((p) => p.confirmed && p.applyUrl);
          return (
            <div className="mt-8">
              <ul className="flex flex-wrap gap-3">
                {shown.map((p) => (
                  <li key={p.name} className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm">
                    {p.name} <span className="text-muted">· {p.note}</span>
                    {!p.confirmed && <PlaceholderTag note="Confirm this platform is available for CV Capital contracts">Confirm</PlaceholderTag>}
                  </li>
                ))}
              </ul>
              {apply && (
                <a href={apply.applyUrl!} target="_blank" rel="noopener" className="btn-ghost mt-5">
                  Check financing options with {apply.name}<span className="sr-only"> (opens in a new tab)</span> ↗
                </a>
              )}
              <p className="mt-3 text-xs text-muted">{financing.partnerDisclaimer}</p>
            </div>
          );
        })()}
      </div>
      <div className="card p-8 sm:p-10">
        <h3 className="font-medium">Milestone payment schedule</h3>
        <ol className="mt-6 grid grid-cols-3 gap-3">
          {financing.milestones.map((m) => (
            <li key={m.label} className="rounded-xl bg-sand-50 p-4 text-center">
              <span className="block font-serif text-3xl font-light">{m.pct}</span>
              <span className="mt-1 block text-xs text-stone">{m.label}</span>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-sm text-muted">{financing.milestoneNote}</p>
        <Link href={site.cta.href} className="btn-primary mt-8 w-full sm:w-auto">Talk through payment options</Link>
      </div>
    </div>
  );
}

export function FaqList({ items = allFaqs, headingLevel = "h3" }: { items?: { q: string; a: string }[]; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((f) => (
        <details key={f.q} className="group py-2">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-3 [&::-webkit-details-marker]:hidden">
            <H className="font-serif text-xl font-normal leading-snug sm:text-2xl">{f.q}</H>
            <span aria-hidden="true" className="text-2xl font-light transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="max-w-3xl pb-6 leading-relaxed text-stone">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function FinalCta({ title = "Let's talk about your project." }: { title?: string }) {
  return (
    <section aria-labelledby="final-cta-h" className="ph-surface relative overflow-hidden py-24 text-white sm:py-32">
      <div className="container-x relative text-center">
        <p className="eyebrow mb-5 text-white/60">{site.promise}</p>
        <h2 id="final-cta-h" className="h2 mx-auto max-w-3xl">{title}</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-white/75">A free on-site consultation and written estimate. No pressure and no obligation.</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={site.cta.href} className="btn-primary">{site.cta.primary}</Link>
          <a href={site.phoneHref} className="btn-ghost">Call {site.phone}</a>
        </div>
      </div>
    </section>
  );
}
