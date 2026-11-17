/** Prints the pricing data and calculator results the preview needs, straight from src/content. */
import { projectPricing, finishLevels, calculate, calculatorDisclaimer } from "../../src/content/pricing";
import { site } from "../../src/content/site";

const results: Record<string, Record<string, ReturnType<typeof calculate>>> = {};
for (const p of projectPricing) {
  results[p.key] = {};
  for (const f of finishLevels) results[p.key][f.key] = calculate(p.key, f.key);
}

console.log(
  JSON.stringify({
    pricing: projectPricing.map((p) => ({ key: p.key, label: p.label, sizeLabel: p.sizeLabel, sizes: p.sizes })),
    finishes: finishLevels,
    disclaimer: calculatorDisclaimer,
    results,
    cta: site.cta.primary,
    phone: site.phone,
    phoneHref: site.phoneHref,
  }),
);
