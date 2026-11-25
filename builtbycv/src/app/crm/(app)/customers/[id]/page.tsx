import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { activities, customers, leads, pipelineStages, projects, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { createProject } from "@/app/crm/actions";
import { displayPhone, formatMoney } from "@/lib/format";
import { formatDateTime } from "@/lib/dates";
import { sourceLabel } from "@/lib/leads";
import { services } from "@/content/services";
import { PageHeader, Panel, Badge, Empty, primaryBtn, smallBtn } from "@/components/crm/ui";
import { NoteForm } from "@/components/crm/forms";
import { CustomerForm } from "../CustomerForm";

export const metadata = { title: "Customer" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("customers:read");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [c] = await db.select().from(customers).where(eq(customers.id, id));
  if (!c) notFound();
  const [projs, custLeads, notes] = await Promise.all([
    db.select({ p: projects, stage: pipelineStages.name }).from(projects).innerJoin(pipelineStages, eq(pipelineStages.id, projects.stageId)).where(eq(projects.customerId, id)).orderBy(desc(projects.createdAt)),
    db.select().from(leads).where(eq(leads.customerId, id)).orderBy(desc(leads.createdAt)),
    db.select({ a: activities, who: users.name }).from(activities).leftJoin(users, eq(users.id, activities.userId)).where(eq(activities.customerId, id)).orderBy(desc(activities.createdAt)).limit(50),
  ]);
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
  return (
    <>
      <PageHeader
        back={{ href: "/crm/customers", label: "Customers" }}
        title={name}
        sub={`Customer since ${formatDateTime(c.createdAt)}`}
        actions={<>{c.phone && <a href={`tel:${c.phone}`} className={primaryBtn}>Call {displayPhone(c.phone)}</a>}{c.phone && <a href={`sms:${c.phone}`} className={smallBtn}>Text</a>}{c.email && <a href={`mailto:${c.email}`} className={smallBtn}>Email</a>}</>}
      />
      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <Panel title="Projects">
            {projs.length ? (
              <ul className="divide-y divide-line">
                {projs.map(({ p, stage }) => (
                  <li key={p.id}>
                    <Link href={`/crm/projects/${p.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-sand-50">
                      <span className="min-w-0"><span className="block truncate font-medium">{p.projectType ?? p.title}</span><span className="text-sm text-muted">{p.valueCents ? formatMoney(p.valueCents / 100) : "No value yet"}</span></span>
                      <Badge>{stage}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <Empty>No projects yet.</Empty>}
            <form action={createProject} className="mt-4 grid gap-2 border-t border-line pt-4 sm:grid-cols-[1fr_1fr_7rem_auto]">
              <input type="hidden" name="customerId" value={c.id} />
              <input name="title" required placeholder="New project title" aria-label="Project title" className="field min-h-10 py-2 text-sm" />
              <select name="projectType" aria-label="Project type" className="field min-h-10 py-2 text-sm" defaultValue="">
                <option value="">Type…</option>
                {services.map((s) => <option key={s.slug}>{s.name}</option>)}
              </select>
              <input name="value" inputMode="decimal" placeholder="Value $" aria-label="Estimated value in dollars" className="field min-h-10 py-2 text-sm" />
              <button className={primaryBtn}>Add project</button>
            </form>
          </Panel>
          <Panel title="Customer notes">
            <NoteForm customerId={c.id} />
            <ul className="mt-4 space-y-3">
              {notes.filter(({ a }) => a.type === "note").map(({ a, who }) => (
                <li key={a.id} className="rounded-lg bg-sand-50 p-3 text-sm"><p className="whitespace-pre-wrap">{a.body}</p><p className="mt-1 text-xs text-muted">{formatDateTime(a.createdAt)}{who ? ` · ${who}` : ""}</p></li>
              ))}
            </ul>
          </Panel>
          {custLeads.length > 0 && (
            <Panel title="Website submissions">
              <ul className="divide-y divide-line">
                {custLeads.map((l) => (
                  <li key={l.id}><Link href={`/crm/leads/${l.id}`} className="flex justify-between gap-3 py-3 text-sm hover:bg-sand-50"><span>{l.kind === "calculator" ? "Calculator" : "Estimate form"} · {sourceLabel(l as never)}</span><span className="text-muted">{formatDateTime(l.createdAt)}</span></Link></li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
        <Panel title="Contact details"><CustomerForm c={c} /></Panel>
      </div>
    </>
  );
}
