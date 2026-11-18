import Link from "next/link";
import { and, asc, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, pipelineStages, projects, tasks, customers } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { startOfWeekPhoenix, todayInPhoenix, formatDateTime } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { sourceLabel } from "@/lib/leads";
import { PageHeader, Panel, Badge, Empty } from "@/components/crm/ui";
import { TaskList } from "@/components/crm/TaskList";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const user = await requireUser();
  const today = todayInPhoenix();
  const weekStart = startOfWeekPhoenix();

  const [[week], recent, byStage, [taskCounts], openTasks] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(leads).where(gte(leads.createdAt, weekStart)),
    db.select().from(leads).orderBy(desc(leads.createdAt)).limit(6),
    db
      .select({
        id: pipelineStages.id, name: pipelineStages.name, kind: pipelineStages.kind,
        count: sql<number>`count(${projects.id})::int`,
        value: sql<number>`coalesce(sum(${projects.valueCents}), 0)::bigint`,
      })
      .from(pipelineStages)
      .leftJoin(projects, eq(projects.stageId, pipelineStages.id))
      .groupBy(pipelineStages.id)
      .orderBy(asc(pipelineStages.position)),
    db
      .select({
        overdue: sql<number>`count(*) filter (where ${tasks.dueDate} < ${today})::int`,
        dueToday: sql<number>`count(*) filter (where ${tasks.dueDate} = ${today})::int`,
        open: sql<number>`count(*)::int`,
      })
      .from(tasks)
      .where(isNull(tasks.completedAt)),
    db
      .select({ task: tasks, projectTitle: projects.title, customerName: customers.firstName })
      .from(tasks)
      .leftJoin(projects, eq(projects.id, tasks.projectId))
      .leftJoin(customers, eq(customers.id, tasks.customerId))
      .where(and(isNull(tasks.completedAt), lte(tasks.dueDate, today)))
      .orderBy(asc(tasks.dueDate))
      .limit(10),
  ]);

  const openPipeline = byStage.filter((s) => s.kind === "open");
  const openValue = openPipeline.reduce((n, s) => n + Number(s.value), 0);
  const maxValue = Math.max(1, ...byStage.map((s) => Number(s.value)));

  return (
    <>
      <PageHeader title={`Hi, ${user.name.split(" ")[0]}`} sub={new Intl.DateTimeFormat("en-US", { timeZone: "America/Phoenix", weekday: "long", month: "long", day: "numeric" }).format(new Date())} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="New leads this week" value={week.n} href="/crm/leads" />
        <Stat label="Open pipeline value" value={formatMoney(openValue / 100)} href="/crm/pipeline" />
        <Stat label="Tasks due today" value={taskCounts.dueToday} href="/crm/tasks" />
        <Stat label="Overdue tasks" value={taskCounts.overdue} href="/crm/tasks" tone={taskCounts.overdue > 0 ? "danger" : undefined} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Due today & overdue" actions={<Link href="/crm/tasks" className="text-sm text-muted hover:text-ink">All tasks →</Link>}>
          {openTasks.length ? <TaskList rows={openTasks} today={today} /> : <Empty>Nothing due. Nice.</Empty>}
        </Panel>

        <Panel title="Newest leads" actions={<Link href="/crm/leads" className="text-sm text-muted hover:text-ink">Inbox →</Link>}>
          {recent.length ? (
            <ul className="divide-y divide-line">
              {recent.map((l) => (
                <li key={l.id}>
                  <Link href={`/crm/leads/${l.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-sand-50">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{l.name} {l.status === "new" && <Badge tone="accent">New</Badge>}</p>
                      <p className="truncate text-sm text-muted">{l.projectType ?? "—"} · {sourceLabel(l as never)}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted">{formatDateTime(l.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <Empty>No leads yet. Website submissions will appear here.</Empty>}
        </Panel>
      </div>

      <Panel title="Pipeline value by stage" className="mt-6" actions={<Link href="/crm/pipeline" className="text-sm text-muted hover:text-ink">Board →</Link>}>
        <ul className="space-y-3">
          {byStage.map((s) => (
            <li key={s.id} className="grid grid-cols-[8rem_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[11rem_1fr_9rem]">
              <span className="truncate">{s.name} <span className="text-muted">({s.count})</span></span>
              <span className="h-2.5 overflow-hidden rounded-full bg-sand-100">
                <span className={`block h-full rounded-full ${s.kind === "lost" ? "bg-sand-400" : s.kind === "open" ? "bg-accent" : "bg-ink"}`} style={{ width: `${(Number(s.value) / maxValue) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums">{formatMoney(Number(s.value) / 100)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">Values are estimates from the calculator, budget range or what you enter on each project.</p>
      </Panel>
    </>
  );
}

function Stat({ label, value, href, tone }: { label: string; value: React.ReactNode; href: string; tone?: "danger" }) {
  return (
    <Link href={href} className="card block p-4 hover:border-sand-400 sm:p-5">
      <p className="text-xs text-muted sm:text-sm">{label}</p>
      <p className={`mt-2 font-serif text-2xl tabular-nums sm:text-3xl ${tone === "danger" ? "text-danger" : ""}`}>{value}</p>
    </Link>
  );
}
