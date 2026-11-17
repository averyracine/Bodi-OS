import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { areas } from "@/content/areas";
import { Section } from "@/components/site/Section";
import { PageHero, FinalCta } from "@/components/site/blocks";

export const metadata = pageMeta({
  title: "Service Areas Across the Phoenix Metro",
  description: "CV Capital serves Phoenix, Scottsdale, Paradise Valley, Mesa, Tempe, Chandler, Gilbert, Glendale, Peoria, Queen Creek and surrounding Greater Phoenix communities.",
  path: "/service-areas",
});

export default function AreasPage() {
  return (
    <>
      <PageHero eyebrow="Service areas" title="Across the Valley." lede="Primary service across the Phoenix metro, plus Cave Creek, San Tan Valley and surrounding communities, subject to availability." />
      <Section tone="white">
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((a) => (
            <li key={a.slug} className="bg-white">
              <Link href={`/service-areas/${a.slug}`} className="block h-full p-8 hover:bg-sand-50">
                <h2 className="font-serif text-2xl">{a.city}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-stone">{a.intro}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
      <FinalCta />
    </>
  );
}
