import { pageMeta } from "@/lib/seo";
import Image from "next/image";
import { site, partners, showPlaceholders } from "@/content/site";
import { PlaceholderTag } from "@/components/site/Placeholder";
import { Section } from "@/components/site/Section";
import { PageHero, FounderBlock, FinalCta } from "@/components/site/blocks";

export const metadata = pageMeta({
  title: "Our Story: Creating Value",
  description: "CV Capital is a Phoenix-based construction and development company founded by Noah Burris, bringing an investor's perspective to remodeling, additions, ADUs and commercial work.",
  path: "/our-story",
});

export default function StoryPage() {
  return (
    <>
      <PageHero eyebrow="Our story" title="Creating value." lede={`${site.name} is a full-service Arizona construction and development company. We remodel, add on, build new and renovate commercial space, always asking what each decision does for the property's long-term value.`} />
      <Section tone="white">
        <div className="mx-auto max-w-3xl space-y-6 text-lg leading-relaxed text-stone">
          <p>
            CV Capital grew out of real estate investment. Buying and improving property teaches you quickly which upgrades last, which ones buyers notice, and which ones only look good in photos. We bring that perspective to every client project.
          </p>
          <p>
            Today, as {site.legalLine}, we hold a KB-1 General Dual Building Contractor license (ROC #{site.license.number}) and take on everything from a $7,500 bathroom to a $500,000 whole-home renovation, as well as additions, ADUs, custom homes and commercial work.
          </p>
          <p>
            Our promise is simple: <span className="text-ink">{site.promise}</span>
          </p>
        </div>
      </Section>
      <FounderBlock />
      <Section tone="paper" labelledBy="partners-h">
        <p className="eyebrow mb-4">Partners</p>
        <h2 id="partners-h" className="h2 mb-12">Who we work with</h2>
        <ul className="grid gap-10 md:grid-cols-2">
          {partners.map((p) => (
            <li key={p.name} className="grid items-start gap-6 sm:grid-cols-[12rem_1fr]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand-100">
                <Image src={p.photo} alt={`${p.name}, ${p.role.toLowerCase()}`} fill sizes="(min-width: 640px) 12rem, 100vw" className="object-cover" />
              </div>
              <div>
                <h3 className="h3">{p.name}</h3>
                <p className="mt-1 text-sm text-muted">{p.role}</p>
                {(p.claim.verified || showPlaceholders) && (
                  <p className="mt-4 leading-relaxed text-stone">
                    {p.claim.text} {!p.claim.verified && <PlaceholderTag note="From the current builtbycv.com; confirm before launch">Confirm</PlaceholderTag>}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Section>
      <FinalCta />
    </>
  );
}
