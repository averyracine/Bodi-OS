import { NextResponse } from "next/server";
import { calculatorSchema, attributionSchema, isLikelyServiceAreaZip } from "@/lib/lead-input";
import { createLead } from "@/lib/leads";
import { checkSubmission, HONEYPOT_FIELD } from "@/lib/spam";
import { calculate, projectPricing, finishLevels, type FinishLevel } from "@/content/pricing";

export const runtime = "nodejs";

/** Creates a lead, then returns the planning figure. The figure is never sent without a lead. */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = calculatorSchema.safeParse(body);
  const guard = await checkSubmission({
    honeypot: body[HONEYPOT_FIELD] as string | undefined,
    startedAt: String(body.started_at ?? ""),
    bucket: "calc",
  });
  if (!guard.ok && !guard.silent) {
    return NextResponse.json({ error: "Too many requests. Please call us instead." }, { status: 429 });
  }
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the highlighted fields.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const d = parsed.data;
  const result = calculate(d.projectType, d.finish as FinishLevel)!;
  const pricing = projectPricing.find((p) => p.key === d.projectType)!;
  const outsideArea = !isLikelyServiceAreaZip(d.zip);

  if (guard.ok) {
    let attribution = {};
    try {
      attribution = attributionSchema.parse(body.attribution ?? {});
    } catch {}
    try {
      await createLead({
        kind: "calculator",
        name: d.name,
        email: d.email,
        phone: d.phone,
        zip: d.zip,
        projectType: pricing.label,
        calcInputs: {
          projectType: pricing.label,
          size: d.size,
          finish: finishLevels.find((f) => f.key === d.finish)?.label,
          zip: d.zip,
          result: result.headline,
        },
        calcLow: result.low,
        calcHigh: result.high,
        estimatedValue: result.low != null ? (result.high != null ? (result.low + result.high) / 2 : result.low) : null,
        attribution,
        submittedFrom: (body.page as string) ?? req.headers.get("referer") ?? undefined,
        userAgent: req.headers.get("user-agent") ?? undefined,
        ipHash: guard.ipHash,
      });
    } catch (e) {
      console.error("calculator lead failed", e);
      return NextResponse.json({ error: "Something went wrong. Please call us." }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true, result, outsideArea });
}
