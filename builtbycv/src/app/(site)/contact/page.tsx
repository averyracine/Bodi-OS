import { pageMeta } from "@/lib/seo";
import { site } from "@/content/site";
import { Section } from "@/components/site/Section";
import { EstimateForm } from "@/components/site/EstimateForm";
import { PageHero } from "@/components/site/blocks";

export const metadata = pageMeta({
  title: "Schedule a Free Consultation",
  description: `Request a free on-site consultation and estimate from CV Capital. Call ${site.phone} or send your project details and photos.`,
  path: "/contact",
});

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project } = await searchParams;
  return (
    <>
      <PageHero eyebrow="Free consultation" title="Tell us about your project." lede="We reply within one business day to schedule your free on-site consultation." />
      <Section tone="sand">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <aside className="space-y-8">
            <div>
              <h2 className="eyebrow mb-2">Call</h2>
              <a href={site.phoneHref} className="font-serif text-3xl font-light hover:underline">{site.phone}</a>
            </div>
            <div>
              <h2 className="eyebrow mb-2">Hours</h2>
              {site.hours.map((h) => <p key={h.days} className="text-stone">{h.days}: {h.time}</p>)}
            </div>
            <div>
              <h2 className="eyebrow mb-2">Service area</h2>
              <p className="text-stone">{site.serviceAreaSummary}</p>
            </div>
            <div>
              <h2 className="eyebrow mb-2">License</h2>
              <p className="text-stone">Arizona ROC #{site.license.number}<br />{site.license.classification}</p>
            </div>
          </aside>
          <EstimateForm defaultProject={project} />
        </div>
      </Section>
    </>
  );
}
