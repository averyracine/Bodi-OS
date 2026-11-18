/**
 * Service-area pages. Each has distinct content so search engines treat them as
 * useful local pages rather than duplicates. Keep claims general and true;
 * add local projects as they're photographed.
 */
export type Area = {
  slug: string;
  city: string;
  primary: boolean;
  intro: string;
  homes: string;
  popular: string[]; // service slugs
  notes: string[];
};

export const areas: Area[] = [
  {
    slug: "phoenix",
    city: "Phoenix",
    primary: true,
    intro:
      "Phoenix is our home base. We work in neighborhoods across the city, from established central areas to newer communities in North Phoenix, on everything from single-room remodels to whole-home transformations and additions.",
    homes:
      "Phoenix has an unusually wide mix of housing: mid-century ranch homes, 1970s and '80s block construction, and newer stucco builds. Each era has its own quirks, such as older electrical panels, galvanized plumbing and slab-on-grade drain lines. We plan for them before demolition, not after.",
    popular: ["whole-home-renovations", "kitchen-remodeling", "home-additions", "adus-casitas"],
    notes: [
      "Permits for most structural, electrical, plumbing and addition work go through the City of Phoenix Planning & Development Department. We prepare and submit them.",
      "Current projects include the Mulberry renovation and two Wickieup residences in North Phoenix.",
    ],
  },
  {
    slug: "scottsdale",
    city: "Scottsdale",
    primary: true,
    intro:
      "In Scottsdale, homeowners often want a finish level that matches the setting: designer kitchens, spa-style primary baths and outdoor rooms built around desert views.",
    homes:
      "Scottsdale homes range from 1960s ranch homes in the south to custom and semi-custom homes in the north, many in HOA communities with design review. We account for HOA approval timelines when planning exterior work.",
    popular: ["kitchen-remodeling", "bathroom-remodeling", "outdoor-living", "whole-home-renovations"],
    notes: [
      "Many Scottsdale communities require HOA architectural approval for exterior changes, patio covers and color changes. We help prepare those submissions.",
    ],
  },
  {
    slug: "paradise-valley",
    city: "Paradise Valley",
    primary: false,
    intro:
      "Paradise Valley's large lots and custom homes call for high-end renovations, additions and outdoor living projects with careful site management and discreet job sites.",
    homes:
      "Most homes here are custom-built on acre-plus lots, so renovations often involve architectural modifications, natural stone and bespoke interiors rather than standard upgrades. Our luxury and bespoke finish level is built for this kind of work.",
    popular: ["whole-home-renovations", "home-additions", "outdoor-living", "custom-homes"],
    notes: [
      "The Town of Paradise Valley has its own permitting and hillside rules. We review lot-specific requirements during feasibility.",
    ],
  },
  {
    slug: "mesa",
    city: "Mesa",
    primary: true,
    intro:
      "Mesa homeowners come to us for kitchen and bath updates, backyard transformations and additions that make an existing home fit a growing family.",
    homes:
      "Mesa's established neighborhoods have many single-story homes on generous lots, which makes them a good fit for additions, casitas and full backyard projects with turf, masonry and drainage.",
    popular: ["outdoor-living", "adus-casitas", "kitchen-remodeling", "home-additions"],
    notes: [
      "Our Chatham Outdoor Transformation in Mesa covered turf, masonry, walkways, irrigation, drainage and landscaping.",
    ],
  },
  {
    slug: "tempe",
    city: "Tempe",
    primary: true,
    intro:
      "In Tempe we update older homes for modern living, open closed-in floor plans and add ADUs for family members, guests or long-term rental income.",
    homes:
      "Many Tempe neighborhoods were built in the 1960s and '70s. Kitchens and baths from that era benefit from layout changes, and the lots often have room for a detached casita.",
    popular: ["adus-casitas", "whole-home-renovations", "kitchen-remodeling", "bathroom-remodeling"],
    notes: [
      "ADU requirements differ by city. We confirm Tempe's current rules for your lot before design starts.",
    ],
  },
  {
    slug: "chandler",
    city: "Chandler",
    primary: true,
    intro:
      "Chandler homeowners often bring us projects that update 2000s-era builder finishes: new kitchens, reworked primary baths and shaded outdoor living for long summers.",
    homes:
      "Much of Chandler was built in the 1990s and 2000s, often in master-planned HOA communities. Builder-grade cabinets, tile and fixtures from that period are now due for an upgrade, and backyards are ready for shade and outdoor kitchens.",
    popular: ["kitchen-remodeling", "bathroom-remodeling", "outdoor-living", "whole-home-renovations"],
    notes: ["We coordinate HOA approvals for exterior and backyard work in Chandler's planned communities."],
  },
  {
    slug: "gilbert",
    city: "Gilbert",
    primary: true,
    intro:
      "Gilbert families come to us for room additions, casitas for visiting relatives, and kitchens and backyards designed for busy households.",
    homes:
      "Gilbert's newer, family-oriented neighborhoods have homes that work well with additions and casitas, and backyards with room for covered patios, pergolas and outdoor kitchens.",
    popular: ["home-additions", "adus-casitas", "outdoor-living", "kitchen-remodeling"],
    notes: ["Most Gilbert neighborhoods have HOAs. We plan exterior work around architectural review."],
  },
  {
    slug: "glendale",
    city: "Glendale",
    primary: false,
    intro:
      "In Glendale we take on kitchen and bath remodels, whole-home updates and outdoor projects for homeowners in both established and newer parts of the city.",
    homes:
      "Glendale's housing ranges from older central neighborhoods to newer subdivisions in the north and west. Older homes often need system upgrades alongside the cosmetic work, and we scope both together.",
    popular: ["whole-home-renovations", "kitchen-remodeling", "bathroom-remodeling", "outdoor-living"],
    notes: ["Glendale is part of our extended service area, subject to project availability."],
  },
  {
    slug: "peoria",
    city: "Peoria",
    primary: true,
    intro:
      "Peoria homeowners work with us on kitchen and bath remodels, outdoor living and additions, from central neighborhoods to the newer communities in the north.",
    homes:
      "Peoria stretches from established neighborhoods to newer hillside and lake communities. Homes in the north often have view lots that suit outdoor living and shade structures.",
    popular: ["outdoor-living", "kitchen-remodeling", "bathroom-remodeling", "home-additions"],
    notes: ["We confirm City of Peoria permit and HOA requirements during the consultation."],
  },
  {
    slug: "queen-creek",
    city: "Queen Creek",
    primary: true,
    intro:
      "Queen Creek's larger lots and newer homes are a natural fit for outdoor living, casitas and additions. We help homeowners make the most of the space they have.",
    homes:
      "Many Queen Creek homes sit on larger lots, some with room for horses or a detached guest house. That opens up casitas, full backyard builds and generous shade structures.",
    popular: ["outdoor-living", "adus-casitas", "home-additions", "custom-homes"],
    notes: ["Our Queen Creek Outdoor Living project added shade features, landscaping and planting improvements."],
  },
];

export const getArea = (slug: string) => areas.find((a) => a.slug === slug);
