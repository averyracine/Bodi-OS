/**
 * Portfolio. Projects and scopes come from the owner's questionnaire.
 *
 * PHOTOS: add only company-owned photos (or photos with commercial-use rights).
 * Put files in /public/projects/<slug>/ and list them below with real alt text.
 * Until then each project shows a marked placeholder.
 *
 * STATUS: "completed" | "under-construction" | "planned" | null (null = not yet confirmed)
 */
export type ProjectStatus = "completed" | "under-construction" | "planned";

export type PortfolioProject = {
  slug: string;
  name: string;
  area: string; // neighborhood / street area, public-safe (no house numbers)
  city: string;
  service: string; // service slug
  status: ProjectStatus | null;
  summary: string;
  scope: string[];
  photos: { src: string; alt: string; width: number; height: number }[];
  beforeAfter: { before: string; after: string; alt: string } | null;
  featured: boolean;
};

export const projects: PortfolioProject[] = [
  {
    slug: "mulberry-luxury-renovation",
    name: "Mulberry Luxury Renovation",
    area: "Mulberry Drive area",
    city: "Phoenix",
    service: "whole-home-renovations",
    status: null,
    summary: "A whole-home transformation with structural improvements, a luxury kitchen and custom stone finishes.",
    scope: ["Whole-home transformation", "Structural improvements", "Luxury kitchen", "Custom stone finishes"],
    photos: [],
    beforeAfter: null,
    featured: true,
  },
  {
    slug: "wickieup-residence-505",
    name: "Wickieup Residence 505",
    area: "Wickieup Lane",
    city: "North Phoenix",
    service: "whole-home-renovations",
    status: null,
    summary: "A residential remodel covering bathrooms, windows, flooring, and outdoor and garage improvements.",
    scope: ["Residential remodeling", "Bathrooms", "Windows", "Flooring", "Outdoor improvements", "Garage improvements"],
    photos: [],
    beforeAfter: null,
    featured: true,
  },
  {
    slug: "wickieup-residence-501",
    name: "Wickieup Residence 501",
    area: "Wickieup Lane",
    city: "North Phoenix",
    service: "home-additions",
    status: "planned",
    summary: "A planned 950 sq ft addition with a new bedroom and bathroom, plus an extensive interior renovation.",
    scope: ["950 sq ft addition", "New bedroom", "New bathroom", "Extensive interior renovation"],
    photos: [],
    beforeAfter: null,
    featured: true,
  },
  {
    slug: "chatham-outdoor-transformation",
    name: "Chatham Outdoor Transformation",
    area: "Chatham area",
    city: "Mesa",
    service: "outdoor-living",
    status: null,
    summary: "A full outdoor rework: artificial turf, masonry, walkways, irrigation, drainage and landscaping.",
    scope: ["Artificial turf", "Masonry", "Walkways", "Irrigation", "Drainage", "Landscaping"],
    photos: [],
    beforeAfter: null,
    featured: true,
  },
  {
    slug: "cave-creek-kitchen-transformation",
    name: "Cave Creek Kitchen Transformation",
    area: "Cave Creek",
    city: "Cave Creek",
    service: "kitchen-remodeling",
    status: null,
    summary: "A custom kitchen with new cabinetry, countertops and appliance improvements.",
    scope: ["Custom kitchen", "Cabinetry", "Countertops", "Appliance improvements"],
    photos: [],
    beforeAfter: null,
    featured: true,
  },
  {
    slug: "queen-creek-outdoor-living",
    name: "Queen Creek Outdoor Living",
    area: "Via de Colina area",
    city: "Queen Creek",
    service: "outdoor-living",
    status: null,
    summary: "Outdoor landscaping with new shade features and planting improvements.",
    scope: ["Outdoor landscaping", "Shade features", "Planting improvements"],
    photos: [],
    beforeAfter: null,
    featured: true,
  },
];

export const statusLabel: Record<ProjectStatus, string> = {
  completed: "Completed",
  "under-construction": "Under construction",
  planned: "Planned",
};

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
