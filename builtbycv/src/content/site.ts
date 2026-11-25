/**
 * Business facts used across the site. Edit here; every page reads from this file.
 *
 * Anything not yet confirmed by the owner is marked `verified: false` (or null) and is
 * hidden on the live site. Set NEXT_PUBLIC_SHOW_PLACEHOLDERS="true" (review builds only)
 * to see those items with a yellow "Placeholder" tag.
 */
export const showPlaceholders = process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS === "true";

export const site = {
  name: "CV Capital",
  legalName: "CV Property Investments Inc.",
  legalLine: "CV Property Investments Inc. dba CV Capital",
  tagline: "Creating Value. Building Excellence.",
  promise: "From concept to completion. Creating value at every stage.",
  positioning:
    "Premium, full-service residential and commercial general contractor in Arizona: luxury renovations, custom homes, additions, ADUs and commercial improvements.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.builtbycv.com",
  phone: "(602) 743-6957",
  phoneHref: "tel:+16027436957",
  // No public lead inbox confirmed yet. Leave null to hide it; forms still work.
  email: "contact@builtbycv.com" as string | null,
  license: {
    number: "368875",
    classification: "KB-1 General Dual Building Contractor",
    short: "ROC #368875 · KB-1",
    // Opens CV Capital's own record on the Arizona ROC site (shows license, bond and insurance)
    lookupUrl: "https://azroc.my.site.com/AZRoc/s/contractor-search?licenseId=a0ocs00000UeE1NAAV",
  },
  // Confirmed by the owner; also listed on the ROC license record.
  insuredVerified: true,
  insurance: { carrier: "Berkley Aspire", coverage: "$5,000,000 policy" },
  bond: { surety: "PA Manufacturers' Association Insurance Co." },
  hours: [
    { days: "Monday–Friday", time: "8:00 AM – 5:00 PM", schema: { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "17:00" } },
    { days: "Saturday–Sunday", time: "By appointment" },
  ],
  address: {
    // Showroom address not confirmed. Only the metro area is published.
    locality: "Phoenix",
    region: "AZ",
    country: "US",
    display: "Phoenix metro area · by appointment",
  },
  serviceAreaSummary:
    "Phoenix, Scottsdale, Mesa, Tempe, Chandler, Gilbert, Peoria, Queen Creek and surrounding Greater Phoenix communities.",
  // Only verified, company-owned profiles. Empty = no social icons shown.
  social: [] as { label: string; href: string }[],
  googleReviews: {
    rating: null as number | null,
    count: null as number | null,
    url: null as string | null,
  },
  cta: {
    primary: "Schedule a Consultation",
    primaryShort: "Free Consultation",
    secondary: "Start Your Project",
    href: "/contact",
    calculatorHref: "/#price-my-project",
  },
} as const;

/** Headline stats. `verified: false` items show only as placeholders in preview. */
export const stats = [
  { value: "KB-1", label: "Arizona General Dual Building license", verified: true },
  { value: "Residential + Commercial", label: "One licensed team for both", verified: true },
  { value: "120+", label: "Projects completed", verified: false, note: "Publish only with completed-project records" },
  { value: "15+ yrs", label: "Team experience building in the Valley", verified: false, note: "Must refer to team experience; the company was incorporated in 2025" },
];

export const founder = {
  name: "Noah Alexander Burris",
  title: "Founder & CEO",
  photo: "/team/noah-burris.jpg" as string | null, // from the current builtbycv.com
  bio: [
    "Noah Burris is an Arizona entrepreneur, real estate investor and construction executive. He founded CV Capital to bring an investor's discipline to residential and commercial construction.",
    "He leads the company's direction, construction operations and client relationships. His view is simple: every project should improve how a property looks, how it works, how long it lasts, and what it's worth.",
  ],
  quote: "Creating value at every stage, from the first conversation to the final walkthrough.",
};

/** Partners shown on Our Story. Claims marked verified: false are hidden at launch until confirmed. */
export const partners = [
  {
    name: "Michael Penka",
    role: "Exclusive real estate listing partner",
    photo: "/team/michael-penka.jpg",
    claim: { text: "Top 3% of realtors in Arizona, with over $60M in closed transactions.", verified: false },
  },
];

export const nav = [
  { label: "Services", href: "/services" },
  { label: "Projects", href: "/projects" },
  { label: "Process", href: "/process" },
  { label: "Why CV", href: "/why-cv" },
  { label: "Our Story", href: "/our-story" },
  { label: "Financing", href: "/financing" },
  { label: "FAQ", href: "/faq" },
];
