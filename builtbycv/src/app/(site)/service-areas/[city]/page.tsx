import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { areas, getArea } from "@/content/areas";
import { getService } from "@/content/services";
import { projectsWithPhotosFirst } from "@/content/projects";
import { site } from "@/content/site";
import { startingPriceDisclaimer } from "@/content/pricing";
import { pageMeta, breadcrumbJsonLd } from "@/lib/seo";
import { Section } from "@/components/site/Section";
import { JsonLd } from "@/components/site/JsonLd";
import { PageHero, Breadcrumbs, ProjectCard, FinalCta, priceNote } from "@/components/site/blocks";

export function generateStaticParams() {
  return areas.map((a) => ({ city: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const a = getArea((await params).city);
  if (!a) return {};
  const svc = a.popular.map((s) => getService(s)?.name.toLowerCase()).filter(Boolean).slice(0, 3).join(", ");
  return pageMeta({
    title: `Remodeling Contractor in ${a.city}, AZ`,
    description: `${svc} and more in ${a.city}, AZ. CV Capital is a licensed KB-1 Arizona contractor (ROC #368875). Free on-site consultations.`.replace(/^./, (c) => c.toUpperCase()),
    path: `/service-areas/${a.slug}`,
  });
}

export default async function AreaPage({ params }: { params: Promise<{ city: string }> }) {
  const a = getArea((await params).city);
  if (!a) notFound();
  const local = projectsWithPhotosFirst().filter((p) => p.city.includes(a.city));
  const crumbs = [{ name: "Home", path: "/" }, { name: "Service areas", path: "/service-areas" }, { name: a.city, path: `/service-areas/${a.slug}` }];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <PageHero eyebrow={`${a.city}, Arizona`} title={`Remodeling & construction in ${a.city}`} lede={a.intro}>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href={site.cta.href} className="btn-primary">{site.cta.primary}</Link>
          <a href={site.phoneHref} className="btn-ghost">Call {site.phone}</a>
        </div>
      </PageHero>
      <Section tone="white">
        <Breadcrumbs items={crumbs} />
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="h3">Homes in {a.city}</h2>
            <p className="mt-5 text-lg leading-relaxed text-stone">{a.homes}</p>
            <h2 className="h3 mt-12">Local know-how</h2>
            <ul className="mt-5 space-y-4 text-stone">{a.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
          <div>
            <h2 className="h3">Popular in {a.city}</h2>
            <ul className="mt-5 divide-y divide-line border-y border-line">
              {a.popular.map((slug) => {
                const s = getService(slug)!;
                return (
                  <li key={slug}>
                    <Link href={`/services/${slug}`} className="flex items-center justify-between gap-4 py-5 hover:text-accent">
                      <span className="font-serif text-xl">{s.name}</span>
                      <span className="text-sm text-muted">{priceNote(s.pricingKey)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-sm text-muted">{startingPriceDisclaimer}</p>
          </div>
        </div>
      </Section>
      {local.length > 0 && (
        <Section tone="paper">
          <h2 className="h2 mb-12">Projects in {a.city}</h2>
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">{local.map((p) => <ProjectCard key={p.slug} p={p} />)}</div>
        </Section>
      )}
      <FinalCta title={`Let's talk about your ${a.city} project.`} />
    </>
  );
}
