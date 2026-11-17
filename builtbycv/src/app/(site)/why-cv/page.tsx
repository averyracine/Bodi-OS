import { pageMeta } from "@/lib/seo";
import { site } from "@/content/site";
import { Section, SectionHeader } from "@/components/site/Section";
import { PageHero, ComparisonTable, StatsBand, Testimonials, FinalCta } from "@/components/site/blocks";

export const metadata = pageMeta({
  title: "Why CV Capital: A KB-1 Licensed Arizona General Contractor",
  description: "Why homeowners and businesses choose CV Capital: KB-1 dual license, residential and commercial capability, a single point of contact, detailed written proposals and design-build coordination.",
  path: "/why-cv",
});

const pillars = [
  { t: "A broad license", b: `CV Property Investments Inc. holds Arizona ROC #${site.license.number}, a KB-1 General Dual Building Contractor license covering residential and commercial building, additions, ADUs and structural work.` },
  { t: "One point of contact", b: "You won't be coordinating separate trades. One CV Capital contact runs the schedule, the crews and the communication." },
  { t: "Everything in writing", b: "Documented scope, pricing and payment milestones before work starts, and written change orders if anything changes." },
  { t: "An investor's eye", b: "We weigh every decision for function, durability, property value and resale, not only how it looks on day one." },
];

export default function WhyPage() {
  return (
    <>
      <PageHero eyebrow="Why CV" title="Built like an investment." lede={site.positioning} />
      <Section tone="white">
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
          {pillars.map((p) => (
            <li key={p.t} className="bg-white p-8 sm:p-12">
              <h2 className="h3">{p.t}</h2>
              <p className="mt-4 text-lg leading-relaxed text-stone">{p.b}</p>
            </li>
          ))}
        </ul>
      </Section>
      <Section tone="paper" labelledBy="cmp-h">
        <SectionHeader id="cmp-h" title="CV Capital vs. a typical contractor" />
        <ComparisonTable />
      </Section>
      <StatsBand />
      <Testimonials />
      <FinalCta />
    </>
  );
}
