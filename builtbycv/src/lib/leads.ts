import "server-only";
import { eq, or, sql } from "drizzle-orm";
import { db } from "./db";
import { activities, customers, leads, photos, projects, tasks, users } from "./db/schema";
import { ensureStages } from "./stages";
import { nextBusinessDay } from "./dates";
import { normalizePhone, splitName, formatMoney, displayPhone } from "./format";
import { sendEmail, escapeHtml } from "./email";
import { storeFile } from "./storage";
import type { Attribution } from "./lead-input";

export type NewLead = {
  kind: "estimate" | "calculator";
  name: string;
  email: string;
  phone: string;
  address?: string;
  zip?: string;
  projectType?: string;
  budgetRange?: string;
  timeline?: string;
  heardAbout?: string;
  message?: string;
  calcInputs?: Record<string, unknown>;
  calcLow?: number | null;
  calcHigh?: number | null;
  estimatedValue?: number | null; // dollars, for pipeline value
  attribution: Attribution;
  submittedFrom?: string;
  userAgent?: string;
  ipHash?: string;
  files?: File[];
};

/**
 * Saves a website submission and wires it into the CRM:
 * lead row → customer (matched by email/phone or created) → project in the first
 * pipeline stage → timeline entry → "Call new lead" task due next business day →
 * owner email. Returns the lead id.
 */
export async function createLead(input: NewLead): Promise<string> {
  const stages = await ensureStages();
  const firstStage = stages[0];
  const phone = normalizePhone(input.phone);
  const email = input.email.toLowerCase();
  const { first, last } = splitName(input.name);

  // Upload photos first (outside the transaction; network I/O)
  const stored: { url: string; key: string; type: string; size: number }[] = [];
  for (const f of input.files ?? []) {
    const s = await storeFile(f, "leads");
    stored.push({ ...s, type: f.type, size: f.size });
  }

  const result = await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(customers)
      .where(or(eq(customers.email, email), phone ? eq(customers.phone, phone) : undefined))
      .limit(1);

    let customerId: string;
    if (existing[0]) {
      customerId = existing[0].id;
    } else {
      const [c] = await tx
        .insert(customers)
        .values({ firstName: first, lastName: last, email, phone, address: input.address, zip: input.zip })
        .returning({ id: customers.id });
      customerId = c.id;
    }

    const title = `${input.projectType ?? "Project"} – ${input.name}`;
    const [project] = await tx
      .insert(projects)
      .values({
        customerId,
        stageId: firstStage.id,
        title,
        projectType: input.projectType,
        valueCents: input.estimatedValue != null ? Math.round(input.estimatedValue * 100) : null,
        address: input.address,
        zip: input.zip,
        budgetRange: input.budgetRange,
        timeline: input.timeline,
        description: input.message,
        // newest card goes to the top of its column
        boardPosition: sql`(SELECT COALESCE(MIN(board_position), 0) - 1 FROM projects WHERE stage_id = ${firstStage.id})`,
      })
      .returning({ id: projects.id });

    const a = input.attribution;
    const [lead] = await tx
      .insert(leads)
      .values({
        kind: input.kind,
        name: input.name,
        email,
        phone,
        address: input.address,
        zip: input.zip,
        projectType: input.projectType,
        budgetRange: input.budgetRange,
        timeline: input.timeline,
        heardAbout: input.heardAbout,
        message: input.message,
        calcInputs: input.calcInputs,
        calcLow: input.calcLow ?? null,
        calcHigh: input.calcHigh ?? null,
        utmSource: a.utm_source,
        utmMedium: a.utm_medium,
        utmCampaign: a.utm_campaign,
        utmTerm: a.utm_term,
        utmContent: a.utm_content,
        gclid: a.gclid,
        fbclid: a.fbclid,
        referrer: a.referrer,
        landingPage: a.landing_page,
        submittedFrom: input.submittedFrom,
        userAgent: input.userAgent?.slice(0, 500),
        ipHash: input.ipHash,
        customerId,
        projectId: project.id,
      })
      .returning({ id: leads.id });

    if (stored.length) {
      await tx.insert(photos).values(
        stored.map((s) => ({
          leadId: lead.id,
          projectId: project.id,
          url: s.url,
          storageKey: s.key,
          contentType: s.type,
          sizeBytes: s.size,
          caption: "Uploaded by customer with estimate request",
        })),
      );
    }

    await tx.insert(activities).values({
      type: "lead_created",
      body: input.kind === "calculator" ? "New lead from the price calculator" : "New estimate request from the website",
      meta: { source: sourceLabel(a), leadId: lead.id },
      projectId: project.id,
      customerId,
      leadId: lead.id,
    });

    // Assign the auto task to the first active admin (the owner, for now)
    const [owner] = await tx.select({ id: users.id }).from(users).where(eq(users.role, "admin")).limit(1);
    await tx.insert(tasks).values({
      title: `Call new lead: ${input.name}`,
      dueDate: nextBusinessDay(),
      projectId: project.id,
      customerId,
      assignedUserId: owner?.id ?? null,
      automated: true,
    });

    return { leadId: lead.id, projectId: project.id };
  });

  await notifyOwner(input, result.projectId).catch((e) => console.error("lead email failed", e));
  return result.leadId;
}

export function sourceLabel(a: Partial<Attribution> & Record<string, unknown>): string {
  const src = (a.utm_source ?? (a as Record<string, unknown>).utmSource) as string | undefined;
  const med = (a.utm_medium ?? (a as Record<string, unknown>).utmMedium) as string | undefined;
  const gclid = a.gclid as string | undefined;
  const fbclid = a.fbclid as string | undefined;
  const ref = (a.referrer as string | undefined) ?? undefined;
  if (src) return med ? `${src} / ${med}` : src;
  if (gclid) return "Google Ads";
  if (fbclid) return "Facebook / Instagram";
  if (ref) {
    try {
      const host = new URL(ref).hostname.replace(/^www\./, "");
      if (/google\./.test(host)) return "Google (organic)";
      if (/bing\./.test(host)) return "Bing (organic)";
      if (/facebook\.|instagram\./.test(host)) return "Social: " + host;
      return "Referral: " + host;
    } catch {
      return "Referral";
    }
  }
  return "Direct";
}

async function notifyOwner(input: NewLead, projectId: string) {
  const to = process.env.LEAD_NOTIFY_EMAIL;
  if (!to) return;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const link = `${base}/crm/projects/${projectId}`;
  const range =
    input.calcLow != null
      ? input.calcHigh != null
        ? `${formatMoney(input.calcLow)} – ${formatMoney(input.calcHigh)}`
        : `from ${formatMoney(input.calcLow)}`
      : null;
  const rows: [string, string | undefined | null][] = [
    ["Name", input.name],
    ["Phone", displayPhone(input.phone)],
    ["Email", input.email],
    ["Address / ZIP", [input.address, input.zip].filter(Boolean).join(", ")],
    ["Project", input.projectType],
    ["Budget", input.budgetRange],
    ["Timeline", input.timeline],
    ["Calculator result", range],
    ["Heard about us", input.heardAbout],
    ["Source", sourceLabel(input.attribution)],
    ["Landing page", input.attribution.landing_page],
    ["Photos", input.files?.length ? `${input.files.length} attached in CRM` : null],
    ["Message", input.message],
  ];
  const filled = rows.filter(([, v]) => v);
  const text = filled.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\nOpen in CRM: ${link}\nA "Call new lead" task was created for the next business day.`;
  const html =
    `<h2 style="font-family:sans-serif">New ${input.kind === "calculator" ? "calculator" : "estimate"} lead</h2>` +
    `<table style="font-family:sans-serif;font-size:14px">${filled
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${k}</td><td>${escapeHtml(String(v)).replace(/\n/g, "<br>")}</td></tr>`)
      .join("")}</table><p><a href="${link}">Open in CRM →</a></p>`;
  const r = await sendEmail({ to, subject: `New lead: ${input.name} (${input.projectType ?? "website"})`, text, html, replyTo: input.email });
  if (!r.ok) console.error("Resend error:", r.error);
}
