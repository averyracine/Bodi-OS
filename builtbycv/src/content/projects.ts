/**
 * Portfolio. Projects and scopes come from the owner's questionnaire.
 *
 * PHOTOS: only the owner's own photos (or photos with commercial-use rights).
 * Files live in /public/projects/<slug>/. Each photo has a `kind` (before / during /
 * after / rendering / plans), real alt text and its true pixel size (sources are at most
 * 2000 px on the long edge, so they are never upscaled).
 *
 * `photosConfirmed: false` = the owner has not yet confirmed these photos belong to
 * this project, so they stay off the live site. `entryConfirmed: false` = the whole
 * project entry exists only because of unconfirmed photos, so it is hidden too.
 * A project with no photos is hidden on the live site until photos are added.
 *
 * LOCATION: city / area level only. No street names, house numbers or GPS data.
 *
 * STATUS: "completed" | "under-construction" | "planned" | "in-development" | null (null = not yet confirmed)
 */
import { showPlaceholders } from "./site";

export type ProjectStatus = "completed" | "under-construction" | "planned" | "in-development";
export type PhotoKind = "before" | "during" | "after" | "rendering" | "plans";

export type ProjectPhoto = {
  src: string;
  alt: string;
  caption: string;
  kind: PhotoKind;
  room?: string; // shown with the label, e.g. "After · Bathroom", when a project mixes rooms
  width: number;
  height: number;
};

export type PortfolioProject = {
  slug: string;
  name: string;
  area: string | null; // optional area within the city; never a street or address
  city: string;
  service: string; // service slug
  status: ProjectStatus | null;
  summary: string;
  scope: string[];
  photos: ProjectPhoto[]; // first photo is the card cover
  photosConfirmed: boolean;
  entryConfirmed: boolean;
  featured: boolean;
};

const P = (slug: string, file: string, kind: PhotoKind, caption: string, alt: string, width = 1500, height = 2000, room?: string): ProjectPhoto => ({
  src: `/projects/${slug}/${file}`, kind, caption, alt, width, height, ...(room ? { room } : {}),
});

export const projects: PortfolioProject[] = [
  {
    slug: "mulberry-luxury-renovation",
    name: "Mulberry Luxury Renovation",
    area: null,
    city: "Phoenix",
    service: "whole-home-renovations",
    status: "in-development",
    summary: "A whole-home transformation with structural improvements, a luxury kitchen and custom stone finishes.",
    scope: ["Whole-home transformation", "Structural improvements", "Luxury kitchen", "Custom stone finishes"],
    photos: [
      P("mulberry-luxury-renovation", "rendering-front.jpg", "rendering", "Street view at dusk", "Concept rendering of the finished home at dusk: gabled white stucco front, black-framed windows, wood entry door and desert landscaping", 1448, 1086),
      P("mulberry-luxury-renovation", "rendering-aerial.jpg", "rendering", "Aerial view at dusk", "Concept rendering, aerial view at dusk: white stucco single-story home with a dark roof, front landscaping with path lights and a pool behind", 1448, 1086),
      // Architect's sealed permit sheet A3, published with the architect's permission (via the owner).
      P("mulberry-luxury-renovation", "plans-elevations.jpg", "plans", "Permit elevations by Nathan Korkki Design", "Permit drawing sheet A3 by Nathan Korkki Design: west, south, east and north elevations of the Mulberry renovation and addition, with roof heights and exterior materials", 2000, 1333, "Elevations"),
    ],
    photosConfirmed: true,
    entryConfirmed: true,
    featured: true,
  },
  {
    slug: "hillcrest-kitchen-and-bathroom-remodels",
    name: "Hillcrest Full Kitchen and Full Bathroom Remodels",
    area: null,
    city: "North Phoenix", // not yet confirmed by the owner
    service: "whole-home-renovations",
    status: null,
    summary: "A full kitchen and full bathroom remodel.",
    scope: ["Full kitchen remodel", "Full bathroom remodel"],
    photos: [
      P("hillcrest-kitchen-and-bathroom-remodels", "after-1.jpg", "after", "Finished primary bathroom", "Finished primary bathroom: freestanding white tub under a glass-block window, frameless glass shower, marble-look tile floor and walls"),
      P("hillcrest-kitchen-and-bathroom-remodels", "demo-1.jpg", "during", "Bathroom stripped to drywall", "Primary bathroom during demolition, stripped to drywall with the glass-block window and plumbing exposed"),
      P("hillcrest-kitchen-and-bathroom-remodels", "demo-2.jpg", "during", "Shower corner demolished to the slab", "Shower corner demolished down to the slab with the drain exposed"),
      P("hillcrest-kitchen-and-bathroom-remodels", "demo-3.jpg", "during", "Tub area removed", "Tub area removed below the glass-block window during demolition"),
      P("hillcrest-kitchen-and-bathroom-remodels", "progress-1.jpg", "during", "Waterproofing and tile staged", "Shower walls covered in orange waterproofing membrane with large-format tile staged"),
      P("hillcrest-kitchen-and-bathroom-remodels", "progress-2.jpg", "during", "New floor tile down", "Waterproofed wall around the glass-block window with new marble-look floor tile down"),
    ],
    photosConfirmed: true,
    entryConfirmed: true,
    featured: true,
  },
  {
    slug: "wickieup-residence-501",
    name: "Wickieup Residence 501",
    area: null,
    city: "North Phoenix",
    service: "home-additions",
    status: "planned",
    summary: "A planned 950 sq ft addition with a new bedroom and bathroom, plus an extensive interior renovation.",
    scope: ["950 sq ft addition", "New bedroom", "New bathroom", "Extensive interior renovation"],
    photos: [],
    photosConfirmed: false,
    entryConfirmed: true,
    featured: true,
  },
  {
    slug: "chatham-outdoor-transformation",
    name: "Chatham Outdoor Transformation",
    area: null,
    city: "Mesa",
    service: "outdoor-living",
    status: null,
    summary: "A full outdoor rework: artificial turf, masonry, walkways, irrigation, drainage and landscaping.",
    scope: ["Artificial turf", "Masonry", "Walkways", "Irrigation", "Drainage", "Landscaping"],
    photos: [],
    photosConfirmed: false,
    entryConfirmed: true,
    featured: true,
  },
  {
    slug: "cave-creek-kitchen-transformation",
    name: "Cave Creek Kitchen and Bathrooms Full Remodels",
    area: null,
    city: "Cave Creek",
    service: "kitchen-remodeling",
    status: null,
    summary: "Full remodels of the kitchen and bathrooms: white shaker cabinetry, marble-look counters and stainless appliances in the kitchen, and walk-in tiled showers, new vanities and LED mirrors in the bathrooms.",
    scope: ["Full kitchen remodel", "Cabinetry", "Countertops", "Appliances", "Full bathroom remodels", "Walk-in showers", "Vanities and lighting"],
    // Every photo is tagged with its room so bathroom results are never shown as the kitchen.
    photos: [
      // Owner-supplied ARMLS listing photos (kitchen-after-*, listing-after-*), used unedited with the watermark kept, on the owner's instruction.
      P("cave-creek-kitchen-transformation", "kitchen-after-2.jpg", "after", "Kitchen after, from the peninsula", "Finished kitchen seen from the peninsula: waterfall-edge marble-look counter, glass-front upper cabinets, stone mosaic backsplash and an undermount sink at the window", 1344, 1008, "Kitchen"),
      P("cave-creek-kitchen-transformation", "kitchen-after-1.jpg", "after", "Kitchen after, from the dining side", "Finished kitchen seen from the dining side: white shaker cabinets, white marble-look counters and stainless appliances", 1344, 1008, "Kitchen"),
      P("cave-creek-kitchen-transformation", "kitchen-after-3.jpg", "after", "Kitchen after: the full U-shaped layout", "Finished kitchen from the opposite corner, showing the full U-shaped layout with white shaker cabinets and marble-look counters", 1344, 1008, "Kitchen"),
      P("cave-creek-kitchen-transformation", "listing-after-1.jpg", "after", "Bathroom after: walk-in shower", "Finished bathroom: walk-in shower with marble-look tile, niche and frameless glass, white vanity beyond", 1344, 1008, "Bathroom"),
      P("cave-creek-kitchen-transformation", "listing-after-2.jpg", "after", "Bathroom after: double vanity", "Finished bathroom: long white double vanity with LED-backlit mirror and marble-look floor", 1344, 1008, "Bathroom"),
      P("cave-creek-kitchen-transformation", "listing-after-3.jpg", "after", "Bathroom after: shower and vanity", "Finished bathroom: tiled walk-in shower, toilet and floating white vanity with LED mirror", 1344, 1008, "Bathroom"),
      P("cave-creek-kitchen-transformation", "bath-after-1.jpg", "after", "Bathroom after the remodel", "The same bathroom after the remodel: gray marble-look walk-in shower with niche, floating white vanity, LED-backlit mirror and marble-look floor", 1500, 2000, "Bathroom"),
      P("cave-creek-kitchen-transformation", "bath-after-2.jpg", "after", "Bathroom after: vanity and shower", "Bathroom after the remodel: long white quartz vanity with a wide LED mirror and a walk-in tiled shower beyond", 1500, 2000, "Bathroom"),
      P("cave-creek-kitchen-transformation", "kitchen-before-1.jpg", "before", "Kitchen before the remodel", "Kitchen before the remodel: dark cabinets, brown granite counters and stainless appliances", 1500, 2000, "Kitchen"),
      P("cave-creek-kitchen-transformation", "kitchen-before-2.jpg", "before", "Kitchen before, from the peninsula", "The same kitchen before the remodel, seen from the peninsula", 1500, 2000, "Kitchen"),
      P("cave-creek-kitchen-transformation", "bath-before-1.jpg", "before", "Bathroom before the remodel", "Bathroom before the remodel: framed sliding-door tub and shower with beige tile floor", 1500, 2000, "Bathroom"),
      P("cave-creek-kitchen-transformation", "bath-before-2.jpg", "before", "Bathroom before, from the door", "The same bathroom before the remodel, seen from the door: dark vanity and framed shower enclosure", 1500, 2000, "Bathroom"),
    ],
    photosConfirmed: true,
    entryConfirmed: true,
    featured: true,
  },
  {
    slug: "kitchen-remodel-east-valley",
    name: "East Valley Kitchen Remodel",
    area: null,
    city: "East Valley",
    service: "kitchen-remodeling",
    status: null,
    summary: "A kitchen remodel with new white shaker cabinetry, a marble-look waterfall island, new countertops and wood-look plank flooring.",
    scope: ["New cabinetry", "Waterfall island", "Countertops", "Flooring"],
    photos: [
      P("kitchen-remodel-east-valley", "after-1.jpg", "after", "Kitchen after the remodel", "Kitchen after the remodel: white shaker cabinets, white marble-look waterfall island, stainless appliances and wood-look plank floor"),
      P("kitchen-remodel-east-valley", "before-1.jpg", "before", "Kitchen before, over the half wall", "Kitchen before the remodel, seen over a half wall: oak cabinets, soffit and tile backsplash"),
      P("kitchen-remodel-east-valley", "before-2.jpg", "before", "Kitchen before, with peninsula", "The same kitchen before the remodel: oak cabinets, tan laminate-style counters, peninsula and tile floor"),
    ],
    photosConfirmed: false,
    entryConfirmed: false,
    featured: true,
  },
  {
    slug: "queen-creek-outdoor-living",
    name: "Queen Creek Outdoor Living",
    area: null,
    city: "Queen Creek",
    service: "outdoor-living",
    status: null,
    summary: "Outdoor landscaping with new shade features and planting improvements.",
    scope: ["Outdoor landscaping", "Shade features", "Planting improvements"],
    photos: [],
    photosConfirmed: false,
    entryConfirmed: true,
    featured: true,
  },
];

export const statusLabel: Record<ProjectStatus, string> = {
  completed: "Completed",
  "under-construction": "Under construction",
  planned: "Planned",
  "in-development": "In development",
};

export const photoKindLabel: Record<PhotoKind, string> = {
  before: "Before",
  during: "During",
  after: "After",
  rendering: "Concept rendering",
  plans: "Plans",
};

/** Projects shown right now. The live site lists only confirmed projects that have at least one photo. */
export function visibleProjects(): PortfolioProject[] {
  if (showPlaceholders) return projects;
  return projects.filter((p) => p.entryConfirmed && p.photosConfirmed && p.photos.length > 0);
}

/** Photos that may be shown right now for a project. */
export function visiblePhotos(p: PortfolioProject): ProjectPhoto[] {
  return p.photosConfirmed || showPlaceholders ? p.photos : [];
}

/** Visible projects, those with photos first (stable order otherwise). */
export function projectsWithPhotosFirst(list = visibleProjects()): PortfolioProject[] {
  return [...list].sort((a, b) => Number(visiblePhotos(b).length > 0) - Number(visiblePhotos(a).length > 0));
}

/** Label shown on a photo: "After", or "After · Bathroom" when the photo has a room tag. */
export function photoLabel(ph: ProjectPhoto): string {
  return ph.room ? `${photoKindLabel[ph.kind]} · ${ph.room}` : photoKindLabel[ph.kind];
}

export const getProject = (slug: string) => visibleProjects().find((p) => p.slug === slug);
