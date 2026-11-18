"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  activities, customers, leads, photos, pipelineStages, projects, tasks, users,
  LEAD_STATUSES, ROLES, STAGE_KINDS,
} from "@/lib/db/schema";
import { requireUser, hashPassword } from "@/lib/auth";
import { normalizePhone } from "@/lib/format";
import { storeFile, validateImage } from "@/lib/storage";

const s = (v: FormDataEntryValue | null) => {
  const t = typeof v === "string" ? v.trim() : "";
  return t === "" ? null : t;
};
const dollarsToCents = (v: string | null) => {
  if (!v) return null;
  const n = Number(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};

async function log(entry: typeof activities.$inferInsert) {
  await db.insert(activities).values(entry);
}

/* ---------------- Leads ---------------- */

export async function setLeadStatus(leadId: string, status: string) {
  await requireUser("leads:write");
  const st = z.enum(LEAD_STATUSES).parse(status);
  await db.update(leads).set({ status: st }).where(eq(leads.id, leadId));
  revalidatePath("/crm/leads");
  revalidatePath(`/crm/leads/${leadId}`);
}

/* ---------------- Pipeline ---------------- */

/** Moves a card to a stage and saves the new order of that column. */
export async function moveProject(projectId: string, toStageId: string, orderedIds: string[]) {
  const user = await requireUser("projects:write");
  const [before] = await db.select({ stageId: projects.stageId }).from(projects).where(eq(projects.id, projectId));
  if (!before) throw new Error("Project not found");
  await db.transaction(async (tx) => {
    await tx.update(projects).set({ stageId: toStageId, updatedAt: new Date() }).where(eq(projects.id, projectId));
    const ids = orderedIds.slice(0, 500);
    for (let i = 0; i < ids.length; i++) {
      await tx.update(projects).set({ boardPosition: i }).where(and(eq(projects.id, ids[i]), eq(projects.stageId, toStageId)));
    }
  });
  if (before.stageId !== toStageId) {
    const st = await db.select({ id: pipelineStages.id, name: pipelineStages.name }).from(pipelineStages).where(inArray(pipelineStages.id, [before.stageId, toStageId]));
    const name = (id: string) => st.find((x) => x.id === id)?.name ?? "?";
    await log({ type: "stage_changed", body: `Moved from ${name(before.stageId)} to ${name(toStageId)}`, projectId, userId: user.id, meta: { from: before.stageId, to: toStageId } });
  }
  revalidatePath("/crm/pipeline");
  revalidatePath("/crm");
}

export async function addStage(form: FormData) {
  await requireUser("pipeline:configure");
  const name = z.string().min(1).max(60).parse(s(form.get("name")));
  const kind = z.enum(STAGE_KINDS).parse(s(form.get("kind")) ?? "open");
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${pipelineStages.position}), -1)` }).from(pipelineStages);
  await db.insert(pipelineStages).values({ name, kind, position: Number(max) + 1 });
  revalidatePath("/crm/settings");
  revalidatePath("/crm/pipeline");
}

export async function updateStage(form: FormData) {
  await requireUser("pipeline:configure");
  const id = z.string().uuid().parse(s(form.get("id")));
  const name = z.string().min(1).max(60).parse(s(form.get("name")));
  const kind = z.enum(STAGE_KINDS).parse(s(form.get("kind")));
  await db.update(pipelineStages).set({ name, kind }).where(eq(pipelineStages.id, id));
  revalidatePath("/crm/settings");
  revalidatePath("/crm/pipeline");
}

export async function moveStage(id: string, direction: "up" | "down") {
  await requireUser("pipeline:configure");
  const all = await db.select().from(pipelineStages).orderBy(asc(pipelineStages.position));
  const i = all.findIndex((x) => x.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= all.length) return;
  [all[i], all[j]] = [all[j], all[i]];
  await db.transaction(async (tx) => {
    for (let k = 0; k < all.length; k++) await tx.update(pipelineStages).set({ position: k }).where(eq(pipelineStages.id, all[k].id));
  });
  revalidatePath("/crm/settings");
  revalidatePath("/crm/pipeline");
}

export async function deleteStage(id: string): Promise<{ error?: string }> {
  await requireUser("pipeline:configure");
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(projects).where(eq(projects.stageId, id));
  if (n > 0) return { error: "Move this stage's projects to another stage first." };
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(pipelineStages);
  if (total <= 1) return { error: "You need at least one stage." };
  await db.delete(pipelineStages).where(eq(pipelineStages.id, id));
  revalidatePath("/crm/settings");
  revalidatePath("/crm/pipeline");
  return {};
}

/* ---------------- Projects ---------------- */

export async function updateProject(form: FormData) {
  const user = await requireUser("projects:write");
  const id = z.string().uuid().parse(s(form.get("id")));
  const stageId = s(form.get("stageId"));
  const [before] = await db.select().from(projects).where(eq(projects.id, id));
  if (!before) throw new Error("Not found");
  const assigned = s(form.get("assignedUserId"));
  await db
    .update(projects)
    .set({
      title: s(form.get("title")) ?? before.title,
      projectType: s(form.get("projectType")),
      valueCents: dollarsToCents(s(form.get("value"))),
      address: s(form.get("address")),
      city: s(form.get("city")),
      zip: s(form.get("zip")),
      budgetRange: s(form.get("budgetRange")),
      timeline: s(form.get("timeline")),
      description: s(form.get("description")),
      assignedUserId: assigned,
      stageId: stageId ?? before.stageId,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id));
  if (stageId && stageId !== before.stageId) {
    const st = await db.select().from(pipelineStages).where(inArray(pipelineStages.id, [before.stageId, stageId]));
    const nm = (x: string) => st.find((y) => y.id === x)?.name ?? "?";
    await log({ type: "stage_changed", body: `Moved from ${nm(before.stageId)} to ${nm(stageId)}`, projectId: id, userId: user.id });
  } else {
    await log({ type: "project_updated", body: "Project details updated", projectId: id, userId: user.id });
  }
  revalidatePath(`/crm/projects/${id}`);
  revalidatePath("/crm/pipeline");
}

export async function createProject(form: FormData) {
  const user = await requireUser("projects:write");
  const customerId = z.string().uuid().parse(s(form.get("customerId")));
  const title = z.string().min(1).max(200).parse(s(form.get("title")));
  const [first] = await db.select().from(pipelineStages).orderBy(asc(pipelineStages.position)).limit(1);
  const [c] = await db.select().from(customers).where(eq(customers.id, customerId));
  const [p] = await db
    .insert(projects)
    .values({
      customerId, title, stageId: first.id, projectType: s(form.get("projectType")),
      valueCents: dollarsToCents(s(form.get("value"))), address: c?.address, city: c?.city, zip: c?.zip,
    })
    .returning({ id: projects.id });
  await log({ type: "project_created", body: "Project created", projectId: p.id, customerId, userId: user.id });
  redirect(`/crm/projects/${p.id}`);
}

export async function addNote(form: FormData) {
  const user = await requireUser("projects:read");
  const projectId = s(form.get("projectId"));
  const customerId = s(form.get("customerId"));
  const body = z.string().min(1).max(10000).parse(s(form.get("body")));
  await log({ type: "note", body, projectId, customerId, userId: user.id });
  if (projectId) revalidatePath(`/crm/projects/${projectId}`);
  if (customerId) revalidatePath(`/crm/customers/${customerId}`);
}

/* ---------------- Tasks ---------------- */

export async function addTask(form: FormData) {
  const user = await requireUser("tasks:write");
  const title = z.string().min(1).max(300).parse(s(form.get("title")));
  const dueDate = s(form.get("dueDate"));
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) throw new Error("Bad date");
  const projectId = s(form.get("projectId"));
  const customerId = s(form.get("customerId"));
  await db.insert(tasks).values({
    title, dueDate, projectId, customerId,
    assignedUserId: s(form.get("assignedUserId")) ?? user.id,
    createdById: user.id,
  });
  if (projectId) await log({ type: "task_created", body: `Task added: ${title}`, projectId, userId: user.id });
  revalidatePath("/crm/tasks");
  revalidatePath("/crm");
  if (projectId) revalidatePath(`/crm/projects/${projectId}`);
}

export async function toggleTask(taskId: string) {
  const user = await requireUser("tasks:write");
  const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!t) return;
  const done = !t.completedAt;
  await db.update(tasks).set({ completedAt: done ? new Date() : null }).where(eq(tasks.id, taskId));
  if (t.projectId && done) await log({ type: "task_completed", body: `Completed: ${t.title}`, projectId: t.projectId, userId: user.id });
  revalidatePath("/crm/tasks");
  revalidatePath("/crm");
  if (t.projectId) revalidatePath(`/crm/projects/${t.projectId}`);
}

/* ---------------- Photos ---------------- */

export async function uploadPhotos(form: FormData): Promise<{ error?: string; count?: number }> {
  const user = await requireUser("photos:write");
  const projectId = z.string().uuid().parse(s(form.get("projectId")));
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Choose at least one photo." };
  for (const f of files) {
    const e = validateImage(f);
    if (e) return { error: e };
  }
  const caption = s(form.get("caption"));
  for (const f of files) {
    const stored = await storeFile(f, `projects/${projectId}`);
    await db.insert(photos).values({ projectId, url: stored.url, storageKey: stored.key, contentType: f.type, sizeBytes: f.size, caption, uploadedById: user.id });
  }
  await log({ type: "photo_added", body: `${files.length} photo${files.length > 1 ? "s" : ""} added`, projectId, userId: user.id });
  revalidatePath(`/crm/projects/${projectId}`);
  return { count: files.length };
}

/* ---------------- Customers ---------------- */

export async function saveCustomer(form: FormData) {
  const user = await requireUser("customers:write");
  const id = s(form.get("id"));
  const values = {
    firstName: z.string().min(1).max(100).parse(s(form.get("firstName"))),
    lastName: s(form.get("lastName")),
    email: s(form.get("email"))?.toLowerCase() ?? null,
    phone: normalizePhone(s(form.get("phone"))),
    address: s(form.get("address")),
    city: s(form.get("city")),
    zip: s(form.get("zip")),
    notes: s(form.get("notes")),
    updatedAt: new Date(),
  };
  if (id) {
    await db.update(customers).set(values).where(eq(customers.id, id));
    revalidatePath(`/crm/customers/${id}`);
    return;
  }
  const [c] = await db.insert(customers).values(values).returning({ id: customers.id });
  await log({ type: "customer_created", body: "Customer added", customerId: c.id, userId: user.id });
  redirect(`/crm/customers/${c.id}`);
}

/* ---------------- Users ---------------- */

export async function createUser(form: FormData): Promise<{ error?: string; ok?: boolean }> {
  await requireUser("users:manage");
  const parsed = z
    .object({
      name: z.string().min(1).max(100),
      email: z.string().email().max(200),
      role: z.enum(ROLES),
      password: z.string().min(10, "Password must be at least 10 characters").max(200),
    })
    .safeParse({ name: s(form.get("name")), email: s(form.get("email"))?.toLowerCase(), role: s(form.get("role")), password: s(form.get("password")) });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email));
  if (exists.length) return { error: "A user with that email already exists." };
  await db.insert(users).values({ name: parsed.data.name, email: parsed.data.email, role: parsed.data.role, passwordHash: await hashPassword(parsed.data.password) });
  revalidatePath("/crm/settings");
  return { ok: true };
}

export async function setUserActive(userId: string, active: boolean) {
  const me = await requireUser("users:manage");
  if (userId === me.id && !active) throw new Error("You can't deactivate yourself.");
  await db.update(users).set({ active }).where(eq(users.id, userId));
  revalidatePath("/crm/settings");
}

export async function changeMyPassword(form: FormData): Promise<{ error?: string; ok?: boolean }> {
  const me = await requireUser();
  const pw = s(form.get("password")) ?? "";
  if (pw.length < 10) return { error: "Password must be at least 10 characters." };
  await db.update(users).set({ passwordHash: await hashPassword(pw) }).where(eq(users.id, me.id));
  return { ok: true };
}
