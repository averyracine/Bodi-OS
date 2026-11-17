import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { projects, getProject } from "@/content/projects";
import { getService } from "@/content/services";
import { beforeAfter } from "@/content/copy";
import { pageMeta, breadcrumbJsonLd } from "@/lib/seo";
import { Section } from "@/components/site/Section";
import { JsonLd } from "@/components/site/JsonLd";
import { PhotoPlaceholder } from "@/components/site/Placeholder";
import { BeforeAfter } from "@/components/site/BeforeAfter";
import { Breadcrumbs, ProjectCard, ProjectStatus, FinalCta } from "@/components/site/blocks";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProject((await params).slug);
  if (!p) return {};
  return pageMeta({ title: `${p.name}, ${p.city}`, description: `${p.summary} A CV Capital project in ${p.area}, ${p.city}, AZ.`, path: `/projects/${p.slug}` });
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProject((await params).slug);
  if (!p) notFound();
  const service = getService(p.service);
  const linkedBa = beforeAfter.find((b) => b.projectSlug === p.slug);
  const others = projects.filter((x) => x.slug !== p.slug).slice(0, 3);
  const crumbs = [{ name: "Home", path: "/" }, { name: "Projects", path: "/projects" }, { name: p.name, path: `/projects/${p.slug}` }];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <section className="bg-paper pb-12 pt-16 sm:pt-24">
        <div className="container-x">
          <Breadcrumbs items={crumbs} />
          <div className="flex flex-wrap items-center gap-3"><p className="eyebrow">{p.area} · {p.city}</p><ProjectStatus p={p} /></div>
          <h1 className="h-display mt-5 max-w-5xl">{p.name}</h1>
          <p className="lede mt-6 max-w-2xl">{p.summary}</p>
        </div>
      </section>
      <section aria-label="Project photos" className="bg-paper pb-20">
        <div className="container-x">
          {p.photos.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {p.photos.map((ph, i) => (
                <div key={ph.src} className={`relative overflow-hidden rounded-2xl ${i === 0 ? "aspect-[16/10] sm:col-span-2" : "aspect-[4/3]"}`}>
                  <Image src={ph.src} alt={ph.alt} fill sizes={i === 0 ? "100vw" : "(min-width: 640px) 50vw, 100vw"} className="object-cover" priority={i === 0} />
                </div>
              ))}
            </div>
          ) : (
            <PhotoPlaceholder label={`${p.name} project photos`} className="aspect-[16/9] rounded-2xl" />
          )}
        </div>
      </section>
      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <dl className="space-y-6 text-sm">
            <div><dt className="eyebrow">Location</dt><dd className="mt-1 text-base">{p.area}, {p.city}, AZ</dd></div>
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
        {linkedBa && (
          <div className="mt-20">
            <h2 className="h3 mb-8">Before & after</h2>
            <BeforeAfter before={linkedBa.before} after={linkedBa.after} />
          </div>
        )}
      </Section>
      <Section tone="paper">
        <h2 className="h2 mb-12">More projects</h2>
        <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">{others.map((o) => <ProjectCard key={o.slug} p={o} />)}</div>
      </Section>
      <FinalCta />
    </>
  );
}
