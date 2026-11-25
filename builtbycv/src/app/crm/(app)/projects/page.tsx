import Link from "next/link";
import { asc, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, pipelineStages, projects } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { formatDate } from "@/lib/dates";
import { PageHeader, Badge, Empty } from "@/components/crm/ui";

export const metadata = { title: "Projects" };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string; stage?: string }> }) {
  await requireUser("projects:read");
  const { q, stage } = await searchParams;
  const stages = await db.select().from(pipelineStages).orderBy(asc(pipelineStages.position));
  const rows = await db
    .select({ p: projects, first: customers.firstName, last: customers.lastName, stage: pipelineStages.name })
    .from(projects)
    .innerJoin(customers, eq(customers.id, projects.customerId))
    .innerJoin(pipelineStages, eq(pipelineStages.id, projects.stageId))
    .where(
      q
        ? or(ilike(projects.title, `%${q}%`), ilike(customers.firstName, `%${q}%`), ilike(customers.lastName, `%${q}%`), ilike(projects.city, `%${q}%`))
        : stage ? eq(projects.stageId, stage) : undefined,
    )
    .orderBy(desc(projects.updatedAt))
    .limit(300);
  return (
    <>
      <PageHeader title="Projects" sub="To add a project, open the customer first." />
      <form className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input name="q" defaultValue={q} placeholder="Search project, customer or city" className="field min-h-10 py-2 text-sm sm:w-72" aria-label="Search" />
        <select name="stage" defaultValue={stage ?? ""} className="field min-h-10 py-2 text-sm sm:w-56" aria-label="Stage">
          <option value="">All stages</option>
          {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button className="rounded-lg border border-line bg-white px-4 text-sm">Filter</button>
      </form>
      {rows.length === 0 ? <Empty>No projects found.</Empty> : (
        <ul className="card divide-y divide-line overflow-hidden">
          {rows.map(({ p, first, last, stage: st }) => (
            <li key={p.id}>
              <Link href={`/crm/projects/${p.id}`} className="grid gap-1 px-4 py-3.5 hover:bg-sand-50 sm:grid-cols-[2fr_1fr_8rem_7rem] sm:items-center sm:gap-4">
                <div className="min-w-0"><p className="truncate font-medium">{[first, last].filter(Boolean).join(" ")}</p><p className="truncate text-sm text-muted">{p.projectType ?? p.title}</p></div>
                <span><Badge>{st}</Badge></span>
                <span className="text-sm tabular-nums">{p.valueCents ? formatMoney(p.valueCents / 100) : "—"}</span>
                <span className="text-xs text-muted sm:text-right">{formatDate(p.updatedAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
