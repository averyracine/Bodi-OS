import type { Metadata } from "next";
import { site, founder } from "@/content/site";
import { areas } from "@/content/areas";
import { services } from "@/content/services";

export function pageMeta({ title, description, path, absoluteTitle = false }: { title: string; description: string; path: string; absoluteTitle?: boolean }): Metadata {
  const url = new URL(path, site.url).toString();
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: site.name,
      title: absoluteTitle ? title : `${title} | ${site.name}`,
      description,
      locale: "en_US",
    },
    twitter: { card: "summary_large_image", title: absoluteTitle ? title : `${title} | ${site.name}`, description },
  };
}

export function localBusinessJsonLd() {
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["GeneralContractor", "HomeAndConstructionBusiness"],
    "@id": `${site.url}/#business`,
    name: site.name,
    legalName: site.legalName,
    slogan: site.tagline,
    description: site.positioning,
    url: site.url,
    telephone: "+1-602-743-6957",
    image: `${site.url}/opengraph-image`,
    priceRange: "$$$",
    address: { "@type": "PostalAddress", addressLocality: site.address.locality, addressRegion: site.address.region, addressCountry: site.address.country },
    areaServed: [...areas.map((a) => ({ "@type": "City", name: `${a.city}, AZ` })), { "@type": "City", name: "Cave Creek, AZ" }, { "@type": "City", name: "San Tan Valley, AZ" }],
    openingHoursSpecification: site.hours.flatMap((h) =>
      "schema" in h ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: [...h.schema.days], opens: h.schema.opens, closes: h.schema.closes }] : [],
    ),
    founder: { "@type": "Person", name: founder.name, jobTitle: founder.title },
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "license",
      name: `Arizona ROC License #${site.license.number} (${site.license.classification})`,
      recognizedBy: { "@type": "GovernmentOrganization", name: "Arizona Registrar of Contractors" },
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Construction services",
      itemListElement: services.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.name, url: `${site.url}/services/${s.slug}` } })),
    },
  };
  if (site.email) ld.email = site.email;
  if (site.social.length) ld.sameAs = site.social.map((s) => s.href);
  if (site.googleReviews.rating && site.googleReviews.count) {
    ld.aggregateRating = { "@type": "AggregateRating", ratingValue: site.googleReviews.rating, reviewCount: site.googleReviews.count };
  }
  return ld;
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: new URL(it.path, site.url).toString() })),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
