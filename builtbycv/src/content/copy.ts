/** Smaller content blocks used on the home page and inner pages. */
import { startingPriceDisclaimer } from "./pricing";

export const hero = {
  eyebrow: "Licensed residential & commercial general contractor · Arizona",
  heading: "Exceptional Spaces. Built to Last.",
  sub: "CV Capital is a licensed residential and commercial general contractor delivering luxury renovations, custom homes, additions, ADUs and commercial improvements across the Phoenix metro.",
  // Put a real, company-owned photo or short muted video in /public/hero/ and set these.
  image: null as string | null,
  video: null as string | null,
};

/** Intro beside the price calculator on the home page. */
export const calculatorIntro = {
  lede: "Get a planning-level figure in about a minute. Bathroom remodels start at $7,500; kitchens receive a custom project estimate.",
  points: ["Based on CV Capital's published starting prices", "No ZIP-code surcharges", "Your written proposal follows a free on-site visit"],
};

export const offers = [
  {
    title: "Free project estimate",
    body: "A clear, written estimate of what your project should cost before you commit to anything.",
  },
  {
    title: "Free on-site consultation",
    body: "We visit your home, measure, look at structure and access, and talk through what's feasible.",
  },
  {
    title: "Free preliminary design advice",
    body: "Layout ideas, material options and design direction during your consultation. Plans, engineering and 3D renderings are quoted separately.",
  },
];

/** "CV vs. a typical contractor". Confirmed by the owner. */
export const comparison = {
  heading: "CV Capital vs. a typical contractor",
  rows: [
    { topic: "License", cv: "KB-1 General Dual Building Contractor (ROC #368875)", typical: "Often limited to residential or specialty scopes" },
    { topic: "Project types", cv: "Residential and commercial construction", typical: "Usually one type only" },
    { topic: "Who you call", cv: "A single point of contact for the whole project", typical: "You may coordinate several independent contractors" },
    { topic: "Proposal", cv: "Detailed written scope, pricing and payment milestones", typical: "Verbal or loosely defined scopes" },
    { topic: "Design & permits", cv: "Design, engineering, permits, selections and construction coordinated together", typical: "Left for you to arrange" },
    { topic: "Perspective", cv: "Investment-focused: function, durability, property value and resale", typical: "Focused on finishing the job" },
  ],
  footnote:
    "CV Capital works with skilled crews, specialty trades and licensed subcontractors where appropriate. Pricing and change-order procedures are set in each written agreement.",
};

export const process = [
  { title: "Free consultation", body: "We meet at your property, listen to your goals, measure and assess feasibility, and give preliminary design advice." },
  { title: "Written proposal", body: "You receive a documented scope, pricing and milestone payment schedule. No vague allowances." },
  { title: "Design & selections", body: "We coordinate design, engineering and permits, and help you choose materials so lead times don't stall the build." },
  { title: "Build", body: "One point of contact runs the schedule and trades. You get regular updates, and change orders are agreed in writing first." },
  { title: "Final walkthrough", body: "We walk the finished project with you, complete any punch-list items and hand over warranty documents." },
];

export const faqs = [
  {
    q: "How long does a remodel take?",
    a: "It depends on scope. A bathroom typically takes a few weeks of construction, a kitchen somewhat longer, and additions, ADUs and whole-home renovations several months. Design, permits and material lead times come before construction. You'll get a schedule with your written proposal.",
  },
  {
    q: "How much will my project cost?",
    a: `Bathroom remodels start at $7,500, home additions at $50,000 and ADUs and casitas at $75,000. Whole-home renovations typically run $50,000 to $500,000, depending on scope. Kitchens and outdoor living receive custom project estimates, custom homes are individually quoted, and commercial work receives a custom commercial proposal. ${startingPriceDisclaimer} Use the price calculator for a planning figure; your written proposal sets the real number.`,
  },
  {
    q: "Do you handle permits?",
    a: "Yes. When a project needs permits, which is common for structural, electrical, plumbing, mechanical, additions and many patio covers, we prepare and submit them and schedule inspections. We also help with HOA architectural submissions.",
  },
  {
    q: "What warranty do you offer?",
    a: "Warranty coverage and its duration are set out in your written construction agreement, so you know exactly what's covered before work starts. Manufacturer warranties on products and appliances also apply.",
  },
  {
    q: "What areas do you serve?",
    a: "Phoenix, Scottsdale, Mesa, Tempe, Chandler, Gilbert, Peoria and Queen Creek, plus Cave Creek, Paradise Valley, Glendale, San Tan Valley and surrounding Greater Phoenix communities, subject to availability. We're happy to discuss larger projects elsewhere in Arizona.",
  },
  {
    q: "Are you licensed?",
    a: "Yes. CV Property Investments Inc., doing business as CV Capital, holds Arizona ROC license #368875, classification KB-1 General Dual Building Contractor, covering residential and commercial building. You can verify it on the Arizona Registrar of Contractors website.",
  },
  {
    q: "How do payments work?",
    a: "Payments follow project milestones set in your written agreement. A common structure is 50% to start, 25% at a progress milestone and 25% at completion. Larger projects can use customized schedules.",
  },
  {
    q: "Do you use subcontractors?",
    a: "We work with skilled crews, specialty trades and licensed subcontractors where the work calls for it. Regulated specialty work is performed or subcontracted as Arizona licensing rules require. Either way you have one point of contact at CV Capital.",
  },
];

export const financing = {
  heading: "Flexible project payment options",
  body: "Our team can help you explore available financing and structured construction payment plans designed around your project.",
  milestones: [
    { pct: "50%", label: "Initial payment" },
    { pct: "25%", label: "Progress payment" },
    { pct: "25%", label: "Final payment" },
  ],
  milestoneNote: "A typical schedule. Larger projects can use customized milestones.",
  // Partner platforms must be confirmed for CV Capital contracts before publishing.
  partnersConfirmed: false,
  partners: [
    { name: "Acorn Finance", note: "Loan marketplace" },
    { name: "HFS Financial", note: "Financing platform" },
  ],
  partnerDisclaimer:
    "These are financing platforms, not direct lenders. Approval, rates, terms and eligibility are set by participating lenders.",
};

/** Real testimonials only, with the client's permission. Empty = section shows a placeholder in preview. */
export const testimonials: { quote: string; name: string; city: string; project?: string }[] = [];
export const testimonialsHeading = "Built on trust. Defined by quality.";

/** Before/after pairs (company-owned photos only). First one shows on the home page. */
export const beforeAfter = [
  {
    title: "Kitchen transformation",
    detail: "Full gut and rebuild with a Crystallo Traslux quartzite waterfall island, backsplash and new cabinetry.",
    before: { src: "/projects/kitchen-before-after/before.jpg", alt: "Kitchen gutted to bare walls and concrete slab before the remodel", width: 1124, height: 785 },
    after: { src: "/projects/kitchen-before-after/after.jpg", alt: "Same kitchen after the remodel with wood cabinets, stainless appliances and a quartzite waterfall island", width: 1124, height: 785 },
    projectSlug: null as string | null, // link to a project page once confirmed
  },
];
