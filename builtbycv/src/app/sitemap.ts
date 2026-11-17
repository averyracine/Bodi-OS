import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { services } from "@/content/services";
import { projects } from "@/content/projects";
import { areas } from "@/content/areas";

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string) => new URL(p, site.url).toString();
  const now = new Date();
  const fixed = ["/", "/services", "/projects", "/process", "/why-cv", "/our-story", "/faq", "/financing", "/contact", "/service-areas", "/privacy"];
  return [
    ...fixed.map((p) => ({ url: u(p), lastModified: now, changeFrequency: "monthly" as const, priority: p === "/" ? 1 : p === "/contact" ? 0.9 : 0.7 })),
    ...services.map((s) => ({ url: u(`/services/${s.slug}`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...projects.map((p) => ({ url: u(`/projects/${p.slug}`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...areas.map((a) => ({ url: u(`/service-areas/${a.slug}`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
