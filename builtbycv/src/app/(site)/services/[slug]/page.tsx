import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { services, getService } from "@/content/services";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import { pageMeta, breadcrumbJsonLd } from "@/lib/seo";
import { Section } from "@/components/site/Section";
import { JsonLd } from "@/components/site/JsonLd";
import { PhotoPlaceholder } from "@/components/site/Placeholder";
import { PageHero, Breadcrumbs, ProjectCard, FinalCta, priceNote } from "@/components/site/blocks";
import { projectPricing, startingPriceDisclaimer, customEstimateText } from "@/content/pricing";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = getService((await params).slug);
  if (!s) return {};
  return pageMeta({ title: s.seoTitle, description: s.seoDescription, path: `/services/${s.slug}` });
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const s = getService((await params).slug);
  if (!s) notFound();
  const related = projects.filter((p) => p.service === s.slug);
  const tailored = projectPricing.find((p) => p.key === s.pricingKey)?.tailored ?? false;
  const crumbs = [{ name: "Home", path: "/" }, { name: "Services", path: "/services" }, { name: s.name, path: `/services/${s.slug}` }];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Service", name: s.name, serviceType: s.name, description: s.intro, provider: { "@id": `${site.url}/#business` }, areaServed: "Phoenix metropolitan area, AZ" }} />
      <PageHero eyebrow="Services" title={s.name} lede={s.short}>
        <p className="mt-5 text-lg font-medium text-accent">{priceNote(s.pricingKey)}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={site.cta.href} className="btn-primary">{site.cta.primary}</Link>
          <Link href="/#price-my-project" className="btn-ghost">{site.cta.secondary}</Link>
        </div>
      </PageHero>
      <Section tone="white">
        <Breadcrumbs items={crumbs} />
        <div className="grid gap-12 lg:grid-cols-[7fr_5fr] lg:gap-20">
          <div>
            <p className="font-serif text-2xl font-light leading-snug sm:text-3xl">{s.intro}</p>
            <h2 className="h3 mt-14">What&apos;s included</h2>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {s.includes.map((i) => <li key={i} className="py-4 text-stone">{i}</li>)}
            </ul>
            <h2 className="h3 mt-14">Good to know</h2>
            <ul className="mt-6 space-y-4 text-stone">{s.goodToKnow.map((g) => <li key={g}>{g}</li>)}</ul>
          </div>
          <aside className="space-y-6">
            <PhotoPlaceholder label={s.imageAlt} className="aspect-[4/5] rounded-2xl" />
            <div className="card p-6">
              <h2 className="font-medium">Investment</h2>
              <p className="mt-2 font-serif text-3xl font-light">{priceNote(s.pricingKey)}</p>
              <p className="mt-3 text-sm leading-relaxed text-stone">{tailored ? customEstimateText : startingPriceDisclaimer}</p>
            </div>
          </aside>
        </div>
      </Section>
      {related.length > 0 && (
        <Section tone="paper">
          <h2 className="h2 mb-12">Related projects</h2>
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">{related.map((p) => <ProjectCard key={p.slug} p={p} />)}</div>
        </Section>
      )}
      <FinalCta title={`Planning a ${s.name.toLowerCase().replace(/s$/, "")} project?`} />
    </>
  );
}
