import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, projects } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { ensureStages } from "@/lib/stages";
import { PipelineBoard } from "@/components/crm/PipelineBoard";
import { PageHeader, smallBtn } from "@/components/crm/ui";
import Link from "next/link";

export const metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  await requireUser("projects:read");
  const stages = await ensureStages();
  const rows = await db
    .select({ p: projects, first: customers.firstName, last: customers.lastName })
    .from(projects)
    .innerJoin(customers, eq(customers.id, projects.customerId))
    .orderBy(asc(projects.boardPosition), asc(projects.createdAt));
  const cards = rows.map(({ p, first, last }) => ({
    id: p.id, title: p.title, stageId: p.stageId, city: p.city ?? p.zip, type: p.projectType,
    value: p.valueCents != null ? Math.round(p.valueCents / 100) : null,
    customer: [first, last].filter(Boolean).join(" "),
  }));
  return (
    <>
      <PageHeader title="Pipeline" sub="Drag projects between stages." actions={<Link href="/crm/settings#stages" className={smallBtn}>Edit stages</Link>} />
      <PipelineBoard columns={stages.map((s) => ({ id: s.id, name: s.name, kind: s.kind }))} cards={cards} />
    </>
  );
}
