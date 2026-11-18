import Link from "next/link";
import { desc, eq, ilike, or, and, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, LEAD_STATUSES } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { displayPhone, formatMoney } from "@/lib/format";
import { sourceLabel } from "@/lib/leads";
import { PageHeader, Badge, Empty } from "@/components/crm/ui";

export const metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireUser("leads:read");
  const { status = "open", q } = await searchParams;
  const conds: SQL[] = [];
  if (status === "open") conds.push(or(eq(leads.status, "new"), eq(leads.status, "reviewed"))!);
  else if ((LEAD_STATUSES as readonly string[]).includes(status)) conds.push(eq(leads.status, status as never));
  if (q) conds.push(or(ilike(leads.name, `%${q}%`), ilike(leads.email, `%${q}%`), ilike(leads.phone, `%${q.replace(/\D/g, "") || q}%`))!);
  const rows = await db.select().from(leads).where(conds.length ? and(...conds) : undefined).orderBy(desc(leads.createdAt)).limit(200);

  const tabs = [["open", "Inbox"], ["new", "New"], ["reviewed", "Reviewed"], ["archived", "Archived"], ["spam", "Spam"], ["all", "All"]];
  return (
    <>
      <PageHeader title="Leads" sub="Every website form and calculator submission, with where it came from." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Filter" className="-mx-1 flex gap-1 overflow-x-auto pb-1">
          {tabs.map(([k, label]) => (
            <Link key={k} href={`/crm/leads?status=${k}${q ? `&q=${encodeURIComponent(q)}` : ""}`} aria-current={status === k ? "page" : undefined} className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-muted hover:bg-white aria-[current=page]:bg-ink aria-[current=page]:text-white">{label}</Link>
          ))}
        </nav>
        <form className="flex gap-2"><input type="hidden" name="status" value={status} /><input name="q" defaultValue={q} placeholder="Search name, email, phone" className="field min-h-10 py-2 text-sm sm:w-64" /></form>
      </div>
      {rows.length === 0 ? <Empty>No leads here.</Empty> : (
        <ul className="card divide-y divide-line overflow-hidden">
          {rows.map((l) => (
            <li key={l.id}>
              <Link href={`/crm/leads/${l.id}`} className="grid gap-1 px-4 py-4 hover:bg-sand-50 sm:grid-cols-[1.4fr_1fr_1fr_8rem] sm:items-center sm:gap-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate font-medium">{l.name} {l.status === "new" && <Badge tone="accent">New</Badge>}</p>
                  <p className="truncate text-sm text-muted">{displayPhone(l.phone)} · {l.email}</p>
                </div>
                <div className="text-sm">
                  <p className="truncate">{l.projectType ?? "—"}</p>
                  <p className="text-muted">{l.kind === "calculator" ? `Calculator · ${l.calcLow ? formatMoney(l.calcLow) + (l.calcHigh ? "–" + formatMoney(l.calcHigh) : "+") : "tailored"}` : l.budgetRange ?? "Estimate form"}</p>
                </div>
                <p className="truncate text-sm"><span className="text-muted sm:hidden">Source: </span>{sourceLabel(l as never)}</p>
                <p className="text-xs text-muted sm:text-right">{formatDateTime(l.createdAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
