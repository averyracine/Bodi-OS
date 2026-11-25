import { pageMeta, faqJsonLd } from "@/lib/seo";
import { faqs } from "@/content/copy";
import { Section } from "@/components/site/Section";
import { JsonLd } from "@/components/site/JsonLd";
import { PageHero, FaqList, FinalCta } from "@/components/site/blocks";

export const metadata = pageMeta({
  title: "FAQ: Remodeling Costs, Timelines, Permits & Warranty",
  description: "Answers about remodeling costs, timelines, permits, warranties, payments, licensing and service areas from CV Capital, a licensed Arizona general contractor.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <PageHero eyebrow="FAQ" title="Questions, answered." lede="Still wondering about something? Call us. We're happy to talk it through." />
      <Section tone="white">
        <div className="mx-auto max-w-4xl"><FaqList items={faqs} headingLevel="h2" /></div>
      </Section>
      <FinalCta />
    </>
  );
}
