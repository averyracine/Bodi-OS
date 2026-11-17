import Link from "next/link";
import Image from "next/image";
import { site } from "@/content/site";
import { hero, beforeAfter, faqs, calculatorIntro } from "@/content/copy";
import { LicenseBlock } from "@/components/site/LicenseBlock";
import { AnimatedHeading } from "@/components/site/AnimatedHeading";
import { Section, SectionHeader } from "@/components/site/Section";
import { PriceCalculator } from "@/components/site/PriceCalculator";
import { BeforeAfter } from "@/components/site/BeforeAfter";
import { JsonLd } from "@/components/site/JsonLd";
import { PlaceholderTag } from "@/components/site/Placeholder";
import { PhoneIcon } from "@/components/site/Header";
import {
  OffersBlock, ServicesGrid, FeaturedProjects, ComparisonTable, StatsBand, FounderBlock,
  Testimonials, FinancingBlock, FaqList, FinalCta,
} from "@/components/site/blocks";
import { pageMeta, faqJsonLd } from "@/lib/seo";

export const metadata = pageMeta({
  title: "CV Capital | Residential & Commercial General Contractor in Phoenix",
  description:
    "Licensed residential and commercial general contractor in the Phoenix metro: luxury renovations, custom homes, additions, ADUs and commercial improvements. Arizona ROC #368875, KB-1. Free consultations.",
  path: "/",
  absoluteTitle: true,
});

const homeFaqs = faqs.slice(0, 5); // timeline, cost, permits, warranty, service area

export default function HomePage() {
  const ba = beforeAfter[0];
  return (
    <>
      <JsonLd data={faqJsonLd(homeFaqs)} />

      {/* 1. Hero */}
      <section aria-labelledby="hero-h" className="relative -mt-[76px] flex min-h-[100svh] items-end overflow-hidden bg-ink text-white">
        {hero.video ? (
          <video className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline poster={hero.image ?? undefined} aria-hidden="true">
            <source src={hero.video} type="video/mp4" />
          </video>
        ) : hero.image ? (
          <Image src={hero.image} alt="" fill priority sizes="100vw" className="object-cover" />
        ) : (
          <Image src={ba.after.src} alt="" fill priority sizes="100vw" className="object-cover" />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/30" />
        <div className="container-x relative pb-16 pt-40 sm:pb-24">
          <p className="eyebrow fade-up mb-6 text-white/75">{hero.eyebrow}</p>
          <AnimatedHeading text={hero.heading} className="h-display max-w-5xl" delay={120} />
          <p className="fade-up mt-6 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl" style={{ animationDelay: "650ms" }}>{hero.sub}</p>
          <div className="fade-up mt-10 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "800ms" }}>
            <Link href={site.cta.href} className="btn-primary">{site.cta.primary}</Link>
            <a href={site.phoneHref} className="btn-ghost text-white"><PhoneIcon /> Call Now</a>
            <a href="#price-my-project" className="btn-ghost text-white">{site.cta.secondary}</a>
          </div>
          <p className="fade-up mt-10 text-sm text-white/65" style={{ animationDelay: "950ms" }}>
            Arizona ROC #{site.license.number} · {site.license.classification}
          </p>
          {!hero.image && !hero.video && <p className="mt-3"><PlaceholderTag note="Add a company-owned hero photo or short muted video in src/content/copy.ts">Higher-res hero photo or video needed</PlaceholderTag></p>}
        </div>
      </section>

      {/* License block, directly under the hero */}
      <LicenseBlock />

      {/* 2. Free offers */}
      <OffersBlock />

      {/* 3. Price calculator */}
      <Section id="price-my-project" tone="sand" labelledBy="calc-h" className="scroll-mt-16">
        <div className="grid gap-12 lg:grid-cols-[4fr_7fr] lg:gap-16">
          <div>
            <p className="eyebrow mb-4">Price my project</p>
            <h2 id="calc-h" className="h2">What will my project cost?</h2>
            <p className="lede mt-5">{calculatorIntro.lede}</p>
            <ul className="mt-8 space-y-3 text-sm text-stone">
              {calculatorIntro.points.map((t) => <li key={t}>· {t}</li>)}
            </ul>
          </div>
          <PriceCalculator />
        </div>
      </Section>

      {/* 4. Services */}
      <Section tone="white" labelledBy="services-h">
        <ServicesGrid />
      </Section>

      {/* 5. Featured projects */}
      <FeaturedProjects />

      {/* 6. Before & after */}
      <Section tone="white" labelledBy="ba-h">
        <SectionHeader id="ba-h" eyebrow="Before & after" title="Same kitchen. Different house." lede={ba.detail} />
        <BeforeAfter before={ba.before} after={ba.after} />
        <p className="mt-4 text-sm text-muted">Drag the handle, or use the arrow keys, to compare.</p>
      </Section>

      {/* 7. Comparison */}
      <Section tone="paper" labelledBy="compare-h">
        <SectionHeader id="compare-h" eyebrow="Why CV" title="CV Capital vs. a typical contractor" />
        <ComparisonTable />
      </Section>

      {/* 8. Stats */}
      <StatsBand />

      {/* 9. Founder */}
      <FounderBlock />

      {/* 10. Testimonials */}
      <Testimonials />

      {/* 11. Financing */}
      <Section tone="paper" labelledBy="financing-h">
        <FinancingBlock />
      </Section>

      {/* 12. FAQ */}
      <Section tone="white" labelledBy="faq-h">
        <div className="grid gap-12 lg:grid-cols-[4fr_8fr]">
          <div>
            <p className="eyebrow mb-4">FAQ</p>
            <h2 id="faq-h" className="h2">Common questions</h2>
            <Link href="/faq" className="link-arrow mt-8">All questions →</Link>
          </div>
          <FaqList items={homeFaqs} />
        </div>
      </Section>

      {/* 13. Final CTA */}
      <FinalCta />
    </>
  );
}
