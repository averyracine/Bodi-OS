import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { process } from "@/content/copy";
import { site } from "@/content/site";
import { Section } from "@/components/site/Section";
import { PageHero, FinalCta } from "@/components/site/blocks";

export const metadata = pageMeta({
  title: "Our Process: From Consultation to Final Walkthrough",
  description: "How a CV Capital project runs: free on-site consultation, written proposal with milestone payments, design and permits, construction with one point of contact, and a final walkthrough.",
  path: "/process",
});

export default function ProcessPage() {
  return (
    <>
      <PageHero eyebrow="Our process" title="From concept to completion." lede="Five steps, each documented in writing, with one point of contact from the first conversation to the final walkthrough." />
      <Section tone="white">
        <ol className="relative space-y-0">
          {process.map((step, i) => (
            <li key={step.title} className="grid gap-4 border-t border-line py-10 sm:grid-cols-[8rem_1fr_2fr] sm:gap-10 sm:py-14">
              <span className="font-serif text-5xl font-light text-sand-400 sm:text-6xl">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="h3">{step.title}</h2>
              <p className="text-lg leading-relaxed text-stone">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-10 sm:flex-row">
          <Link href={site.cta.href} className="btn-primary">{site.cta.primary}</Link>
          <Link href="/financing" className="btn-ghost">Payment schedule</Link>
        </div>
      </Section>
      <FinalCta />
    </>
  );
}
