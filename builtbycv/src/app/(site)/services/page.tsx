import { pageMeta } from "@/lib/seo";
import { Section } from "@/components/site/Section";
import { PageHero, ServicesGrid, FinalCta } from "@/components/site/blocks";

export const metadata = pageMeta({
  title: "Remodeling & Construction Services in Phoenix",
  description: "Kitchens, bathrooms, whole-home renovations, additions, ADUs, custom homes, outdoor living and commercial work across the Phoenix metro by licensed KB-1 contractor CV Capital.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <PageHero eyebrow="Services" title="Everything from a guest bath to a ground-up home." lede="One licensed general contractor for residential and commercial work: design-build coordination, permits, construction and finish work under a single contract." />
      <Section tone="white">
        <ServicesGrid showHeader={false} />
      </Section>
      <FinalCta />
    </>
  );
}
