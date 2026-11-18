/**
 * Services. Starting prices come from src/content/pricing.ts so the two never drift.
 * Copy is original to CV Capital. Edit freely.
 */
export type Service = {
  slug: string;
  name: string;
  pricingKey: string; // key in pricing.ts
  short: string;
  intro: string;
  includes: string[];
  goodToKnow: string[];
  imageAlt: string;
  // Owner-supplied photo shown on the service page; without one, a marked placeholder shows.
  image?: { src: string; alt: string; width: number; height: number };
  seoTitle: string;
  seoDescription: string;
};

export const services: Service[] = [
  {
    slug: "kitchen-remodeling",
    name: "Kitchen Remodeling",
    pricingKey: "kitchen",
    short: "Layouts, cabinetry, stone and lighting planned around how your household actually cooks and gathers.",
    intro:
      "A kitchen remodel touches nearly every trade in the house: framing, plumbing, electrical, ventilation, cabinetry, stone and finish work. We plan it as one coordinated scope so the sequence holds and the details line up.",
    includes: [
      "Layout planning, including opening walls where structure allows",
      "Custom or semi-custom cabinetry and storage planning",
      "Quartz, natural stone and solid-surface countertops",
      "Plumbing and electrical updates, lighting plans and appliance coordination",
      "Backsplash, flooring and finish carpentry",
      "Permits where the scope requires them",
    ],
    goodToKnow: [
      "Removing or moving a wall may require engineering. We'll tell you at the consultation if your plan needs it.",
      "Cabinet and stone lead times often set the schedule, so selections are made early.",
    ],
    imageAlt: "Remodeled kitchen with island and stone countertops",
    image: { src: "/projects/cave-creek-kitchen-transformation/kitchen-after-2.jpg", alt: "Finished kitchen with a waterfall-edge marble-look counter, glass-front upper cabinets and a stone mosaic backsplash", width: 1344, height: 1008 },
    seoTitle: "Kitchen Remodeling in Phoenix, AZ",
    seoDescription:
      "Kitchen remodeling across the Phoenix metro by CV Capital, a licensed KB-1 Arizona contractor. Layout, cabinetry, stone, lighting and permits under one contract.",
  },
  {
    slug: "bathroom-remodeling",
    name: "Bathroom Remodeling",
    pricingKey: "bathroom",
    short: "Primary suites, guest baths and powder rooms, with walk-in showers, tile and fixtures built to last.",
    intro:
      "Bathrooms are small rooms with a lot packed into them: waterproofing, drainage, ventilation and tile layout all have to be right before the finishes go on. We build the hidden layers carefully so the visible ones last.",
    includes: [
      "Walk-in showers, curbless entries and tub-to-shower conversions",
      "Waterproofing systems and tile installation",
      "Vanities, fixtures, mirrors and lighting",
      "Layout changes, including moving plumbing",
      "Ventilation and electrical updates",
      "Accessibility and aging-in-place upgrades",
    ],
    goodToKnow: [
      "Moving a toilet or shower drain is possible on most slab homes but adds to the scope. We'll price it as its own line item.",
    ],
    imageAlt: "Remodeled bathroom with walk-in shower and floating vanity",
    seoTitle: "Bathroom Remodeling in Phoenix, AZ",
    seoDescription:
      "Bathroom remodels in Phoenix and the East and West Valley. Walk-in showers, tile, vanities and layout changes by a licensed Arizona general contractor.",
  },
  {
    slug: "whole-home-renovations",
    name: "Whole-Home Renovations",
    pricingKey: "wholeHome",
    short: "Complete interior transformations, from floor plan changes and structural work to every finish.",
    intro:
      "Renovating the whole house at once lets you fix the floor plan rather than work around it. We coordinate design, engineering, permits and every trade under one contract and one point of contact.",
    includes: [
      "Floor plan changes and structural modifications",
      "Kitchens, bathrooms, flooring, doors, trim and paint",
      "Windows, roofing and exterior restoration",
      "Electrical, plumbing and mechanical updates",
      "Design-build coordination with architects and engineers",
      "Phased schedules when you're living in the home",
    ],
    goodToKnow: [
      "Older homes can hide surprises behind the walls. Our written agreements spell out how unforeseen conditions and change orders are handled before work starts.",
    ],
    imageAlt: "Open living area after a whole-home renovation",
    seoTitle: "Whole-Home Renovations in Phoenix, AZ",
    seoDescription:
      "Whole-home renovations in the Phoenix metro: structural changes, kitchens, baths, flooring, roofing and systems, coordinated by one licensed KB-1 contractor.",
  },
  {
    slug: "home-additions",
    name: "Home Additions",
    pricingKey: "addition",
    short: "More room without moving: bedroom suites, larger living spaces and second-story additions.",
    intro:
      "An addition has to look as if it was always there. That means matching rooflines, stucco and interior finishes, and tying the new structure and systems into the existing home cleanly.",
    includes: [
      "Bedroom and primary-suite additions",
      "Great-room and kitchen expansions",
      "Engineering, plans and permit coordination",
      "Foundation, framing, roofing and stucco",
      "Matching interior finishes throughout",
    ],
    goodToKnow: [
      "Setbacks, lot coverage and HOA rules decide what can be built. We review these before design begins.",
    ],
    imageAlt: "Home addition framed and tied into an existing roofline",
    seoTitle: "Home Additions in Phoenix, AZ",
    seoDescription:
      "Room and suite additions across the Phoenix metro, from engineering and permits through framing, roofing and finishes, by CV Capital (ROC #368875).",
  },
  {
    slug: "adus-casitas",
    name: "ADUs & Casitas",
    pricingKey: "adu",
    short: "Detached and attached living space for family, guests, rental income or a home office.",
    intro:
      "An ADU or casita is a small house, with its own foundation, utilities, kitchen and bath. We handle zoning review, plans, utilities and construction so the finished unit is ready to live in.",
    includes: [
      "Zoning and feasibility review for your lot",
      "Plans, engineering and permit applications",
      "Utility connections: water, sewer, power and HVAC",
      "Kitchenettes, bathrooms and full finishes",
      "Garage conversions where the property allows",
    ],
    goodToKnow: [
      "ADU rules vary by city and have changed recently in Arizona. We check your city's current requirements before quoting.",
    ],
    imageAlt: "Detached stucco casita beside a main house",
    seoTitle: "ADU & Casita Builder in Phoenix, AZ",
    seoDescription:
      "ADUs, casitas and guest houses built across the Phoenix metro. Feasibility, plans, permits, utilities and construction by a licensed KB-1 contractor.",
  },
  {
    slug: "custom-homes",
    name: "Ground-Up Custom Homes",
    pricingKey: "customHome",
    short: "New homes built from the lot up, coordinated with your architect or through our design partners.",
    intro:
      "A custom home is the largest project most families take on. We bring construction management, budget discipline and an investor's eye on long-term value to every decision, from site work to final finishes.",
    includes: [
      "Pre-construction budgeting and value engineering",
      "Site work, foundations and structure",
      "Coordination with architects, engineers and designers",
      "Full construction management and scheduling",
      "Interior and exterior finishes, landscaping and outdoor living",
    ],
    goodToKnow: [
      "Every custom home receives a tailored proposal. We don't publish a price range because lot conditions and design choices vary too widely.",
    ],
    imageAlt: "Modern desert custom home at dusk",
    seoTitle: "Custom Home Builder in Phoenix, AZ",
    seoDescription:
      "Ground-up custom homes in the Phoenix metro with tailored proposals, construction management and design-build coordination. Arizona ROC #368875, KB-1.",
  },
  {
    slug: "outdoor-living",
    name: "Outdoor Living",
    pricingKey: "outdoor",
    short: "Patios, pergolas, outdoor kitchens, turf, masonry and landscaping built for Arizona heat.",
    intro:
      "In the Valley the backyard is a second living room for much of the year. We design shade, cooking and gathering spaces with materials that stand up to sun, monsoon storms and hard water.",
    includes: [
      "Covered patios, pergolas and shade structures",
      "Outdoor kitchens and built-in grills",
      "Pavers, walkways, masonry and fire features",
      "Artificial turf, irrigation, drainage and planting",
      "Lighting and power for outdoor spaces",
    ],
    goodToKnow: [
      "Attached patio covers and some pergolas need permits. Gas and electrical work always do. We'll tell you which apply.",
    ],
    imageAlt: "Shaded patio with pergola and outdoor kitchen",
    seoTitle: "Outdoor Living: Patios, Pergolas & Outdoor Kitchens in Phoenix",
    seoDescription:
      "Patios, pergolas, outdoor kitchens, turf and landscaping across the Phoenix metro, built for Arizona heat by licensed contractor CV Capital.",
  },
  {
    slug: "commercial-construction",
    name: "Commercial & Tenant Improvements",
    pricingKey: "commercial",
    short: "Commercial construction, renovations and tenant improvements under our KB-1 dual license.",
    intro:
      "Our KB-1 General Dual Building license covers both residential and commercial building. We take on commercial renovations and tenant improvements with the same documented scopes and milestone schedules we use on homes.",
    includes: [
      "Tenant improvements and build-outs",
      "Commercial renovations and remodels",
      "Structural modifications",
      "Permit and inspection coordination",
      "Scheduling around business operations",
    ],
    goodToKnow: [
      "Commercial work always gets a tailored proposal after a site visit and a review of drawings.",
    ],
    imageAlt: "Commercial interior under renovation",
    seoTitle: "Commercial Construction & Tenant Improvements in Phoenix",
    seoDescription:
      "Commercial construction and tenant improvements in the Phoenix metro by CV Capital, a KB-1 General Dual Building Contractor (ROC #368875).",
  },
];

export const getService = (slug: string) => services.find((s) => s.slug === slug);
