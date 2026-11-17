import Link from "next/link";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, projects } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { displayPhone } from "@/lib/format";
import { PageHeader, Empty, primaryBtn } from "@/components/crm/ui";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireUser("customers:read");
  const { q } = await searchParams;
  const digits = q?.replace(/\D/g, "");
  const rows = await db
    .select({ c: customers, n: sql<number>`count(${projects.id})::int` })
    .from(customers)
    .leftJoin(projects, eq(projects.customerId, customers.id))
    .where(q ? or(ilike(customers.firstName, `%${q}%`), ilike(customers.lastName, `%${q}%`), ilike(customers.email, `%${q}%`), digits ? ilike(customers.phone, `%${digits}%`) : undefined, ilike(customers.city, `%${q}%`)) : undefined)
    .groupBy(customers.id)
    .orderBy(desc(customers.createdAt))
    .limit(300);
  return (
    <>
      <PageHeader title="Customers" actions={<Link href="/crm/customers/new" className={primaryBtn}>Add customer</Link>} />
      <form className="mb-4"><input name="q" defaultValue={q} placeholder="Search name, email, phone, city" aria-label="Search customers" className="field min-h-10 py-2 text-sm sm:w-80" /></form>
      {rows.length === 0 ? <Empty>No customers yet.</Empty> : (
        <ul className="card divide-y divide-line overflow-hidden">
          {rows.map(({ c, n }) => (
            <li key={c.id}>
              <Link href={`/crm/customers/${c.id}`} className="grid gap-1 px-4 py-3.5 hover:bg-sand-50 sm:grid-cols-[1.5fr_1.5fr_1fr_6rem] sm:items-center sm:gap-4">
                <p className="truncate font-medium">{[c.firstName, c.lastName].filter(Boolean).join(" ")}</p>
                <p className="truncate text-sm text-muted">{displayPhone(c.phone)}{c.email ? ` · ${c.email}` : ""}</p>
                <p className="truncate text-sm text-muted">{c.city ?? c.zip ?? ""}</p>
                <p className="text-sm sm:text-right">{n} project{n === 1 ? "" : "s"}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
