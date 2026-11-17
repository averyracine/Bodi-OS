/**
 * Price calculator rules. EDIT HERE.
 *
 * Confirmed by the owner (questionnaire + preview revisions):
 *   - Bathroom from $7,500, additions from $50,000, ADUs from $75,000
 *   - Whole-home and luxury renovations: $50,000–$500,000, depending on scope
 *   - Kitchens and outdoor living: custom project estimates
 *   - Custom homes: individually quoted; commercial: custom commercial proposals
 *   - No ZIP-code surcharges
 *   - Do NOT publish arbitrary ceilings
 *
 * `priceLabel` is the exact wording shown wherever a service's price appears
 * (services grid, service pages, service-area pages, calculator result).
 *
 * Optional: once the owner confirms ranges per finish level, fill in `finishRanges`
 * (dollars, per project) and the calculator will show that range instead of the
 * starting price. Leave null to keep showing "starting at".
 */
export type FinishLevel = "essential" | "premium" | "luxury";

export const finishLevels: { key: FinishLevel; label: string; description: string }[] = [
  { key: "essential", label: "Essential", description: "Quality materials, functional improvements, clean finishes and efficient construction." },
  { key: "premium", label: "Premium", description: "Custom cabinetry, upgraded fixtures, stone countertops, designer finishes and bigger layout changes." },
  { key: "luxury", label: "Luxury / Bespoke", description: "Fully custom interiors, natural stone, architectural changes and high-end materials throughout." },
];

export type ProjectPricing = {
  key: string;
  label: string;
  sizeLabel: string;
  sizes: string[];
  startingAt: number | null;
  range: { low: number; high: number } | null;
  tailored: boolean;
  priceLabel: string;
  finishRanges: Partial<Record<FinishLevel, { low: number; high: number }>> | null;
};

export const projectPricing: ProjectPricing[] = [
  { key: "kitchen", label: "Kitchen remodel", sizeLabel: "Kitchen size", sizes: ["Small (under 150 sq ft)", "Medium (150–250 sq ft)", "Large (250+ sq ft)"], startingAt: null, range: null, tailored: true, priceLabel: "Custom Project Estimates", finishRanges: null },
  { key: "bathroom", label: "Bathroom remodel", sizeLabel: "Bathroom type", sizes: ["Powder room", "Guest / hall bath", "Primary bath"], startingAt: 7500, range: null, tailored: false, priceLabel: "Starting at $7,500", finishRanges: null },
  { key: "wholeHome", label: "Whole-home renovation", sizeLabel: "Home size", sizes: ["Under 1,800 sq ft", "1,800–3,000 sq ft", "3,000–4,500 sq ft", "4,500+ sq ft"], startingAt: 50000, range: { low: 50000, high: 500000 }, tailored: false, priceLabel: "$50,000–$500,000, depending on scope", finishRanges: null },
  { key: "addition", label: "Home addition", sizeLabel: "Addition size", sizes: ["Under 400 sq ft", "400–800 sq ft", "800+ sq ft"], startingAt: 50000, range: null, tailored: false, priceLabel: "Starting at $50,000", finishRanges: null },
  { key: "adu", label: "ADU / casita", sizeLabel: "Unit size", sizes: ["Studio (under 450 sq ft)", "1 bed (450–750 sq ft)", "2 bed (750+ sq ft)"], startingAt: 75000, range: null, tailored: false, priceLabel: "Starting at $75,000", finishRanges: null },
  { key: "customHome", label: "Ground-up custom home", sizeLabel: "Home size", sizes: ["Under 3,000 sq ft", "3,000–5,000 sq ft", "5,000+ sq ft"], startingAt: null, range: null, tailored: true, priceLabel: "Individually Quoted", finishRanges: null },
  { key: "outdoor", label: "Outdoor living (patio, pergola, outdoor kitchen)", sizeLabel: "Scope", sizes: ["Single feature", "Several features", "Full backyard"], startingAt: null, range: null, tailored: true, priceLabel: "Custom Project Estimates", finishRanges: null },
  { key: "commercial", label: "Commercial / tenant improvement", sizeLabel: "Space size", sizes: ["Under 2,000 sq ft", "2,000–10,000 sq ft", "10,000+ sq ft"], startingAt: null, range: null, tailored: true, priceLabel: "Custom Commercial Proposals", finishRanges: null },
];

/** Shown wherever a starting price or range appears. */
export const startingPriceDisclaimer =
  "Starting prices depend on scope, materials, permits, engineering, and site conditions.";

/** Shown for services priced individually (no starting price), on service pages and in the calculator. */
export const customEstimateText =
  "Every project is individually scoped and priced to reflect your property's requirements, architectural vision, materials, and construction complexity.";

/** Calculator disclaimer; includes the starting-price disclaimer so only one note is shown. */
export const calculatorDisclaimer = `This is a planning-level figure, not a quote. ${startingPriceDisclaimer} Final pricing is set in a written proposal after an on-site consultation.`;

export type CalculatorResult = {
  kind: "range" | "starting" | "tailored";
  low: number | null;
  high: number | null;
  headline: string;
  detail: string;
};

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

export function calculate(typeKey: string, finish: FinishLevel): CalculatorResult | null {
  const p = projectPricing.find((x) => x.key === typeKey);
  if (!p) return null;
  const finishLabel = finishLevels.find((f) => f.key === finish)?.label ?? finish;
  const fr = p.finishRanges?.[finish];
  if (fr) {
    return { kind: "range", low: fr.low, high: fr.high, headline: `${usd(fr.low)} – ${usd(fr.high)}`, detail: `Typical planning range for a ${finishLabel.toLowerCase()} ${p.label.toLowerCase()}.` };
  }
  if (p.range) {
    return { kind: "range", low: p.range.low, high: p.range.high, headline: p.priceLabel, detail: `Typical investment for a ${p.label.toLowerCase()}. ${finishLabel} finishes and the size of your home move you within this range. We'll narrow it at your consultation.` };
  }
  if (p.startingAt) {
    return { kind: "starting", low: p.startingAt, high: null, headline: p.priceLabel, detail: `Qualifying ${p.label.toLowerCase()} projects start here. ${finishLabel} finishes, size and layout changes increase the investment. We'll give you a written figure after an on-site visit.` };
  }
  return { kind: "tailored", low: null, high: null, headline: p.priceLabel, detail: customEstimateText };
}

/** Budget options on the estimate form, with a midpoint used as the CRM pipeline value. */
export const budgetRanges: { label: string; value: number | null }[] = [
  { label: "Under $15,000", value: 10000 },
  { label: "$15,000 – $35,000", value: 25000 },
  { label: "$35,000 – $75,000", value: 55000 },
  { label: "$75,000 – $150,000", value: 110000 },
  { label: "$150,000 – $500,000", value: 300000 },
  { label: "$500,000+", value: 500000 },
  { label: "Not sure yet", value: null },
];

export const timelines = ["As soon as possible", "Within 3 months", "3–6 months", "6–12 months", "Just exploring"];

export const heardAboutOptions = ["Google search", "Google Maps / reviews", "Instagram", "Facebook", "Referral from a friend or neighbor", "Realtor or partner", "Drove by a job site", "Other"];
