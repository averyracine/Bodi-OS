import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { visibleProjects, getProject, visiblePhotos, photoLabel } from "@/content/projects";
import { getService } from "@/content/services";
import { visibleBeforeAfter } from "@/content/copy";
import { pageMeta, breadcrumbJsonLd } from "@/lib/seo";
import { Section } from "@/components/site/Section";
import { JsonLd } from "@/components/site/JsonLd";
import { PhotoPlaceholder, PlaceholderTag } from "@/components/site/Placeholder";
import { BeforeAfter } from "@/components/site/BeforeAfter";
import { PhotoGallery } from "@/components/site/PhotoGallery";
import { Breadcrumbs, ProjectCard, ProjectStatus, FinalCta, projectLocation } from "@/components/site/blocks";

export function generateStaticParams() {
  return visibleProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProject((await params).slug);
  if (!p) return {};
  return pageMeta({ title: `${p.name}, ${p.city}`, description: `${p.summary} A CV Capital project in ${p.city}, AZ.`, path: `/projects/${p.slug}` });
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProject((await params).slug);
  if (!p) notFound();
  const service = getService(p.service);
  const photos = visiblePhotos(p);
  const pairs = visibleBeforeAfter().filter((b) => b.projectSlug === p.slug);
  const others = visibleProjects().filter((x) => x.slug !== p.slug).slice(0, 3);
  const crumbs = [{ name: "Home", path: "/" }, { name: "Projects", path: "/projects" }, { name: p.name, path: `/projects/${p.slug}` }];
  const hasRenderings = photos.some((ph) => ph.kind === "rendering");
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <section className="bg-paper pb-12 pt-16 sm:pt-24">
        <div className="container-x">
          <Breadcrumbs items={crumbs} />
          <div className="flex flex-wrap items-center gap-3"><p className="eyebrow">{projectLocation(p)}</p><ProjectStatus p={p} /></div>
          <h1 className="h-display mt-5 max-w-5xl">{p.name}</h1>
          <p className="lede mt-6 max-w-2xl">{p.summary}</p>
        </div>
      </section>
      <section aria-label="Project photos" className="bg-paper pb-20">
        <div className="container-x">
          {photos.length ? (
            <PhotoGallery
              photos={photos.map((ph) => ({ ...ph, label: photoLabel(ph) }))}
              unconfirmedNote={
                <>
                  {hasRenderings && <p className="mt-4 text-sm text-muted">Concept renderings show the planned design. They are not photos of finished work.</p>}
                  {!p.photosConfirmed && <p className="mt-4"><PlaceholderTag note="The owner has not yet confirmed these photos belong to this project; they are hidden at launch until confirmed">Photo match unconfirmed</PlaceholderTag></p>}
                </>
              }
            />
          ) : (
            <PhotoPlaceholder label={`${p.name} project photos`} className="aspect-[16/9] rounded-2xl" />
          )}
        </div>
      </section>
      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <dl className="space-y-6 text-sm">
            <div><dt className="eyebrow">Location</dt><dd className="mt-1 text-base">{p.city}, AZ</dd></div>
            {service && <div><dt className="eyebrow">Service</dt><dd className="mt-1 text-base"><Link className="underline underline-offset-4" href={`/services/${service.slug}`}>{service.name}</Link></dd></div>}
            <div><dt className="eyebrow">Status</dt><dd className="mt-1"><ProjectStatus p={p} /></dd></div>
          </dl>
          <div>
            <h2 className="h3">Scope of work</h2>
            <ul className="mt-6 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
              {p.scope.map((s) => <li key={s} className="bg-white px-5 py-4">{s}</li>)}
            </ul>
          </div>
        </div>
        {pairs.map((b) => (
          <div key={b.title} className="mt-20">
            <h2 className="h3 mb-3">{b.beforeLabel === "Before" ? "Before & after" : `${b.beforeLabel} & after`}: {b.title.toLowerCase()}</h2>
            <p className="mb-8 max-w-2xl text-stone">{b.detail}</p>
            <BeforeAfter before={b.before} after={b.after} beforeLabel={b.beforeLabel} />
          </div>
        ))}
      </Section>
      <Section tone="paper">
        <h2 className="h2 mb-12">More projects</h2>
        <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">{others.map((o) => <ProjectCard key={o.slug} p={o} />)}</div>
      </Section>
      <FinalCta />
    </>
  );
}
