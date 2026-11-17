import { pageMeta } from "@/lib/seo";
import { projects } from "@/content/projects";
import { beforeAfter } from "@/content/copy";
import { Section } from "@/components/site/Section";
import { PageHero, ProjectCard, FinalCta } from "@/components/site/blocks";
import { BeforeAfter } from "@/components/site/BeforeAfter";

export const metadata = pageMeta({
  title: "Projects: Remodels, Additions & Outdoor Living in Phoenix",
  description: "Renovations, additions, kitchens and outdoor living projects by CV Capital in Phoenix, Mesa, Cave Creek and Queen Creek, each labeled completed, under construction or planned.",
  path: "/projects",
});

export default function ProjectsPage() {
  return (
    <>
      <PageHero eyebrow="Projects" title="Work across the Valley." lede="Real CV Capital projects, each labeled as completed, under construction or planned." />
      <Section tone="paper">
        <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => <ProjectCard key={p.slug} p={p} priority={i < 3} />)}
        </div>
      </Section>
      <Section tone="white">
        <h2 className="h2 mb-4">Before & after</h2>
        <p className="lede mb-10 max-w-2xl">{beforeAfter[0].detail}</p>
        <BeforeAfter before={beforeAfter[0].before} after={beforeAfter[0].after} />
      </Section>
      <FinalCta />
    </>
  );
}
