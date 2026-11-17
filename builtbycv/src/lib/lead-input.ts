import { z } from "zod";
import { projectPricing, finishLevels, budgetRanges, timelines, heardAboutOptions } from "@/content/pricing";

const optional = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));

export const attributionSchema = z
  .object({
    utm_source: optional(200),
    utm_medium: optional(200),
    utm_campaign: optional(200),
    utm_term: optional(200),
    utm_content: optional(200),
    gclid: optional(300),
    fbclid: optional(300),
    referrer: optional(1000),
    landing_page: optional(1000),
  })
  .partial();

const contact = {
  name: z.string().trim().min(2, "Please enter your name").max(120),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Please enter a valid phone number"),
  email: z.string().trim().max(200).email("Please enter a valid email"),
};

const zip = z.string().trim().regex(/^\d{5}$/, "Please enter a 5-digit ZIP");

export const estimateSchema = z.object({
  ...contact,
  address: optional(300),
  zip,
  projectType: z.string().trim().min(1, "Please choose a project type").max(120),
  budgetRange: z.enum(budgetRanges.map((b) => b.label) as [string, ...string[]]).optional(),
  timeline: z.enum(timelines as [string, ...string[]]).optional(),
  heardAbout: z.enum(heardAboutOptions as [string, ...string[]]).optional(),
  message: optional(5000),
});

export const calculatorSchema = z.object({
  ...contact,
  zip,
  projectType: z.enum(projectPricing.map((p) => p.key) as [string, ...string[]]),
  size: z.string().trim().min(1).max(80),
  finish: z.enum(finishLevels.map((f) => f.key) as [string, ...string[]]),
});

export type EstimateInput = z.infer<typeof estimateSchema>;
export type CalculatorInput = z.infer<typeof calculatorSchema>;
export type Attribution = z.infer<typeof attributionSchema>;

/** Phoenix-metro ZIPs are 850xx–853xx and 85x for most of the service area. */
export function isLikelyServiceAreaZip(zip: string) {
  const n = Number(zip.slice(0, 3));
  return n >= 850 && n <= 853;
}
