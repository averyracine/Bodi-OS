import { NextResponse } from "next/server";
import { estimateSchema, attributionSchema } from "@/lib/lead-input";
import { createLead } from "@/lib/leads";
import { checkSubmission, HONEYPOT_FIELD } from "@/lib/spam";
import { validateImage } from "@/lib/storage";
import { budgetRanges } from "@/content/pricing";

export const runtime = "nodejs";
const MAX_FILES = 6;
const MAX_TOTAL = 4 * 1024 * 1024; // stays under Vercel's 4.5 MB request limit; the form shrinks photos first

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  const guard = await checkSubmission({
    honeypot: form.get(HONEYPOT_FIELD) as string | null,
    startedAt: form.get("started_at") as string | null,
    bucket: "lead",
  });
  if (!guard.ok) {
    if (guard.silent) return NextResponse.json({ ok: true });
    return NextResponse.json({ error: "Too many submissions. Please call us instead." }, { status: 429 });
  }

  const str = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" && v.trim() ? v : undefined;
  };
  const parsed = estimateSchema.safeParse({
    name: str("name") ?? "",
    phone: str("phone") ?? "",
    email: str("email") ?? "",
    address: str("address"),
    zip: str("zip") ?? "",
    projectType: str("projectType") ?? "",
    budgetRange: str("budgetRange"),
    timeline: str("timeline"),
    heardAbout: str("heardAbout"),
    message: str("message"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the highlighted fields.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  let attribution = {};
  try {
    attribution = attributionSchema.parse(JSON.parse(str("attribution") ?? "{}"));
  } catch {
    /* ignore bad attribution */
  }

  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_FILES) return NextResponse.json({ error: `Up to ${MAX_FILES} photos, please.` }, { status: 400 });
  if (files.reduce((n, f) => n + f.size, 0) > MAX_TOTAL) {
    return NextResponse.json({ error: "Photos are too large. Try fewer photos." }, { status: 400 });
  }
  for (const f of files) {
    const err = validateImage(f);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
  }

  const d = parsed.data;
  try {
    await createLead({
      kind: "estimate",
      ...d,
      estimatedValue: budgetRanges.find((b) => b.label === d.budgetRange)?.value ?? null,
      attribution,
      submittedFrom: str("page") ?? req.headers.get("referer") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
      ipHash: guard.ipHash,
      files,
    });
  } catch (e) {
    console.error("createLead failed", e);
    return NextResponse.json({ error: "Something went wrong. Please call us." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
