import { pageMeta } from "@/lib/seo";
import { projectsWithPhotosFirst } from "@/content/projects";
import { visibleBeforeAfter } from "@/content/copy";
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
      <PageHero eyebrow="Featured projects" title="Work across the Valley." lede="Real CV Capital projects, each labeled by status, with before, during and after photos where we have them." />
      <Section tone="paper">
        <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {projectsWithPhotosFirst().map((p, i) => <ProjectCard key={p.slug} p={p} priority={i < 3} />)}
        </div>
      </Section>
      <Section tone="white">
        <h2 className="h2 mb-12">Before & after</h2>
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-x-12">
          {visibleBeforeAfter().map((b) => (
            <div key={b.title} className={b.after.width > b.after.height ? "lg:col-span-2" : ""}>
              <h3 className="h3">{b.title}</h3>
              <p className="mb-6 mt-2 max-w-2xl text-stone">{b.detail}</p>
              <BeforeAfter before={b.before} after={b.after} beforeLabel={b.beforeLabel} />
            </div>
          ))}
        </div>
      </Section>
      <FinalCta />
    </>
  );
}
