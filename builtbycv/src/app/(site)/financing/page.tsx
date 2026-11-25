import { pageMeta } from "@/lib/seo";
import { Section } from "@/components/site/Section";
import { PageHero, FinancingBlock, FinalCta } from "@/components/site/blocks";

export const metadata = pageMeta({
  title: "Financing & Payment Options",
  description: "Milestone-based payment schedules and help exploring financing for your remodel, addition or ADU with CV Capital in the Phoenix metro.",
  path: "/financing",
});

export default function FinancingPage() {
  return (
    <>
      <PageHero eyebrow="Financing" title="Payments that follow progress." lede="You pay as the work is delivered, on a schedule set out in your written agreement." />
      <Section tone="paper"><FinancingBlock /></Section>
      <FinalCta />
    </>
  );
}
