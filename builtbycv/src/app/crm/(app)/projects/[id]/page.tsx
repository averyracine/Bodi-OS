import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { activities, customers, leads, photos, pipelineStages, projects, tasks, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { updateProject } from "@/app/crm/actions";
import { displayPhone } from "@/lib/format";
import { formatDateTime, todayInPhoenix } from "@/lib/dates";
import { sourceLabel } from "@/lib/leads";
import { budgetRanges, timelines } from "@/content/pricing";
import { PageHeader, Panel, Badge, Empty, primaryBtn, smallBtn } from "@/components/crm/ui";
import { NoteForm, TaskForm } from "@/components/crm/forms";
import { TaskList } from "@/components/crm/TaskList";
import { PhotoGrid } from "@/components/crm/PhotoGrid";
import { PhotoUploader } from "@/components/crm/PhotoUploader";

export const metadata = { title: "Project" };

const ACTIVITY_LABEL: Record<string, string> = {
  lead_created: "Lead", stage_changed: "Stage", note: "Note", task_created: "Task", task_completed: "Task",
  photo_added: "Photos", project_updated: "Edit", project_created: "Created",
};

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("projects:read");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [row] = await db.select({ p: projects, c: customers }).from(projects).innerJoin(customers, eq(customers.id, projects.customerId)).where(eq(projects.id, id));
  if (!row) notFound();
  const { p, c } = row;

  const [stages, team, timeline, taskRows, pics, sourceLead] = await Promise.all([
    db.select().from(pipelineStages).orderBy(asc(pipelineStages.position)),
    db.select({ id: users.id, name: users.name }).from(users).where(eq(users.active, true)),
    db.select({ a: activities, who: users.name }).from(activities).leftJoin(users, eq(users.id, activities.userId)).where(eq(activities.projectId, id)).orderBy(desc(activities.createdAt)).limit(100),
    db.select({ task: tasks }).from(tasks).where(eq(tasks.projectId, id)).orderBy(isNull(tasks.completedAt), asc(tasks.dueDate)),
    db.select().from(photos).where(eq(photos.projectId, id)).orderBy(desc(photos.createdAt)),
    db.select().from(leads).where(eq(leads.projectId, id)).limit(1),
  ]);
  const stage = stages.find((s) => s.id === p.stageId);
  const openTasks = taskRows.filter((t) => !t.task.completedAt).sort((a, b) => String(a.task.dueDate).localeCompare(String(b.task.dueDate)));
  const doneTasks = taskRows.filter((t) => t.task.completedAt);
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ");

  return (
    <>
      <PageHeader
        back={{ href: "/crm/pipeline", label: "Pipeline" }}
        title={name}
        sub={<>{p.projectType ?? p.title} · <Badge tone="accent">{stage?.name}</Badge>{sourceLead[0] && <> · Source: {sourceLabel(sourceLead[0] as never)}</>}</>}
        actions={
          <>
            {c.phone && <a href={`tel:${c.phone}`} className={primaryBtn}>Call {displayPhone(c.phone)}</a>}
            {c.phone && <a href={`sms:${c.phone}`} className={smallBtn}>Text</a>}
            {c.email && <a href={`mailto:${c.email}`} className={smallBtn}>Email</a>}
            <Link href={`/crm/customers/${c.id}`} className={smallBtn}>Customer</Link>
            {sourceLead[0] && <Link href={`/crm/leads/${sourceLead[0].id}`} className={smallBtn}>Original lead</Link>}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <Panel title={`Tasks${openTasks.length ? ` (${openTasks.length} open)` : ""}`}>
            <TaskForm projectId={p.id} users={team} />
            <div className="mt-3">
              {taskRows.length ? <TaskList rows={[...openTasks, ...doneTasks]} today={todayInPhoenix()} showProject={false} /> : <Empty>No tasks yet.</Empty>}
            </div>
          </Panel>

          <Panel title="Activity & team notes">
            <NoteForm projectId={p.id} />
            <ol className="mt-6 space-y-0 border-l border-line pl-5">
              {timeline.map(({ a, who }) => (
                <li key={a.id} className="relative pb-5">
                  <span aria-hidden="true" className={`absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ${a.type === "note" ? "bg-accent" : "bg-sand-400"}`} />
                  <p className="text-xs text-muted">
                    <span className="font-medium uppercase tracking-wider">{ACTIVITY_LABEL[a.type] ?? a.type}</span> · {formatDateTime(a.createdAt)}{who ? ` · ${who}` : a.type === "lead_created" ? " · Website" : ""}
                  </p>
                  {a.body && <p className={`mt-1 whitespace-pre-wrap text-sm ${a.type === "note" ? "rounded-lg bg-sand-50 p-3" : ""}`}>{a.body}</p>}
                </li>
              ))}
              {timeline.length === 0 && <li className="text-sm text-muted">No activity yet.</li>}
            </ol>
          </Panel>

          <Panel title={`Photos (${pics.length})`} actions={<PhotoUploader projectId={p.id} />}>
            {pics.length ? <PhotoGrid photos={pics} /> : <Empty>No photos yet. On a phone, “Add photos” opens the camera.</Empty>}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Project details">
            <form key={p.updatedAt.toISOString()} action={updateProject} className="grid gap-3 text-sm">
              <input type="hidden" name="id" value={p.id} />
              <Field label="Stage">
                <select name="stageId" defaultValue={p.stageId} className="field min-h-10 py-2 text-sm">
                  {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="Title"><input name="title" defaultValue={p.title} required className="field min-h-10 py-2 text-sm" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Project type"><input name="projectType" defaultValue={p.projectType ?? ""} className="field min-h-10 py-2 text-sm" /></Field>
                <Field label="Est. value ($)"><input name="value" inputMode="decimal" defaultValue={p.valueCents != null ? String(Math.round(p.valueCents / 100)) : ""} className="field min-h-10 py-2 text-sm" /></Field>
              </div>
              <Field label="Address"><input name="address" defaultValue={p.address ?? ""} className="field min-h-10 py-2 text-sm" /></Field>
              <div className="grid grid-cols-[1fr_6rem] gap-3">
                <Field label="City"><input name="city" defaultValue={p.city ?? ""} className="field min-h-10 py-2 text-sm" /></Field>
                <Field label="ZIP"><input name="zip" defaultValue={p.zip ?? ""} className="field min-h-10 py-2 text-sm" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Budget">
                  <select name="budgetRange" defaultValue={p.budgetRange ?? ""} className="field min-h-10 py-2 text-sm">
                    <option value="">—</option>
                    {budgetRanges.map((b) => <option key={b.label}>{b.label}</option>)}
                  </select>
                </Field>
                <Field label="Timeline">
                  <select name="timeline" defaultValue={p.timeline ?? ""} className="field min-h-10 py-2 text-sm">
                    <option value="">—</option>
                    {timelines.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Assigned to">
                <select name="assignedUserId" defaultValue={p.assignedUserId ?? ""} className="field min-h-10 py-2 text-sm">
                  <option value="">Unassigned</option>
                  {team.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </Field>
              <Field label="Description / scope"><textarea name="description" rows={5} defaultValue={p.description ?? ""} className="field text-sm" /></Field>
              <button className={`${primaryBtn} mt-1`}>Save details</button>
            </form>
          </Panel>

          <Panel title="Customer">
            <p className="font-medium">{name}</p>
            <p className="mt-1 text-sm text-muted">{[c.address, c.city, c.zip].filter(Boolean).join(", ") || "No address"}</p>
            <p className="mt-2 text-sm">{c.phone && <a className="underline" href={`tel:${c.phone}`}>{displayPhone(c.phone)}</a>}{c.email && <> · <a className="underline" href={`mailto:${c.email}`}>{c.email}</a></>}</p>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
