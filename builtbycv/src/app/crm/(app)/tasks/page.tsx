import Link from "next/link";
import { and, asc, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, tasks, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { todayInPhoenix } from "@/lib/dates";
import { PageHeader, Panel, Empty } from "@/components/crm/ui";
import { TaskList } from "@/components/crm/TaskList";
import { TaskForm } from "@/components/crm/forms";

export const metadata = { title: "Tasks" };

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ show?: string; mine?: string }> }) {
  const me = await requireUser();
  const { show = "open", mine } = await searchParams;
  const today = todayInPhoenix();
  const team = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.active, true));
  const where = and(show === "done" ? isNotNull(tasks.completedAt) : isNull(tasks.completedAt), mine ? eq(tasks.assignedUserId, me.id) : undefined);
  const rows = await db
    .select({ task: tasks, projectTitle: projects.title })
    .from(tasks)
    .leftJoin(projects, eq(projects.id, tasks.projectId))
    .where(where)
    .orderBy(show === "done" ? desc(tasks.completedAt) : asc(tasks.dueDate))
    .limit(300);
  const overdue = rows.filter((r) => r.task.dueDate && r.task.dueDate < today && !r.task.completedAt);
  const dueToday = rows.filter((r) => r.task.dueDate === today && !r.task.completedAt);
  const later = rows.filter((r) => !overdue.includes(r) && !dueToday.includes(r));
  const q = (o: Record<string, string | undefined>) => "?" + new URLSearchParams(Object.entries({ show, mine, ...o }).filter(([, v]) => v) as [string, string][]).toString();
  return (
    <>
      <PageHeader title="Tasks" />
      <div className="mb-4 flex flex-wrap gap-1">
        <Link href={q({ show: "open" })} aria-current={show === "open" ? "page" : undefined} className="rounded-full px-3 py-1.5 text-sm text-muted aria-[current=page]:bg-ink aria-[current=page]:text-white">Open</Link>
        <Link href={q({ show: "done" })} aria-current={show === "done" ? "page" : undefined} className="rounded-full px-3 py-1.5 text-sm text-muted aria-[current=page]:bg-ink aria-[current=page]:text-white">Done</Link>
        <Link href={q({ mine: mine ? undefined : "1" })} aria-pressed={!!mine} className="rounded-full border border-line px-3 py-1.5 text-sm text-muted aria-pressed:border-ink aria-pressed:text-ink">Assigned to me</Link>
      </div>
      <Panel title="Add a task" className="mb-6"><TaskForm users={team} /></Panel>
      {rows.length === 0 ? <Empty>No tasks.</Empty> : show === "done" ? (
        <Panel><TaskList rows={rows} today={today} /></Panel>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && <Panel title={`Overdue (${overdue.length})`} className="border-danger/30"><TaskList rows={overdue} today={today} /></Panel>}
          {dueToday.length > 0 && <Panel title={`Today (${dueToday.length})`}><TaskList rows={dueToday} today={today} /></Panel>}
          {later.length > 0 && <Panel title={`Upcoming (${later.length})`}><TaskList rows={later} today={today} /></Panel>}
        </div>
      )}
    </>
  );
}
