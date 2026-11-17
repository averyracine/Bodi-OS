import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, photos } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { displayPhone, formatMoney } from "@/lib/format";
import { sourceLabel } from "@/lib/leads";
import { PageHeader, Panel, Badge, DefList, smallBtn, primaryBtn } from "@/components/crm/ui";
import { LeadStatusButtons } from "@/components/crm/LeadStatusButtons";
import { PhotoGrid } from "@/components/crm/PhotoGrid";

export const metadata = { title: "Lead" };

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("leads:read");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [l] = await db.select().from(leads).where(eq(leads.id, id));
  if (!l) notFound();
  const pics = await db.select().from(photos).where(eq(photos.leadId, id));
  const calc = (l.calcInputs ?? null) as Record<string, string> | null;

  const rows: [string, React.ReactNode][] = [
    ["Phone", l.phone && <a className="underline" href={`tel:${l.phone}`}>{displayPhone(l.phone)}</a>],
    ["Email", l.email && <a className="underline" href={`mailto:${l.email}`}>{l.email}</a>],
    ["Address", [l.address, l.zip].filter(Boolean).join(", ")],
    ["Project", l.projectType],
    ["Budget", l.budgetRange],
    ["Timeline", l.timeline],
    ["Heard about us", l.heardAbout],
  ];
  const source: [string, string | null][] = [
    ["Source", sourceLabel(l as never)],
    ["UTM source", l.utmSource], ["UTM medium", l.utmMedium], ["UTM campaign", l.utmCampaign], ["UTM term", l.utmTerm], ["UTM content", l.utmContent],
    ["Google click ID", l.gclid], ["Facebook click ID", l.fbclid],
    ["Referrer", l.referrer], ["Landing page", l.landingPage], ["Submitted from", l.submittedFrom],
  ];

  return (
    <>
      <PageHeader
        back={{ href: "/crm/leads", label: "Leads" }}
        title={l.name}
        sub={<>{l.kind === "calculator" ? "Price calculator" : "Estimate request"} · {formatDateTime(l.createdAt)} · <Badge tone={l.status === "new" ? "accent" : "neutral"}>{l.status}</Badge></>}
        actions={
          <>
            {l.phone && <a href={`tel:${l.phone}`} className={primaryBtn}>Call</a>}
            {l.phone && <a href={`sms:${l.phone}`} className={smallBtn}>Text</a>}
            {l.projectId && <Link href={`/crm/projects/${l.projectId}`} className={smallBtn}>Open project</Link>}
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <Panel title="Details">
            <DefList items={rows} />
            {l.message && <div className="mt-5 whitespace-pre-wrap rounded-lg bg-sand-50 p-4 text-sm">{l.message}</div>}
          </Panel>
          {calc && (
            <Panel title="Calculator">
              <DefList items={[
                ["Project type", calc.projectType], ["Size", calc.size], ["Finish", calc.finish], ["ZIP", calc.zip],
                ["Figure shown", l.calcLow ? `${formatMoney(l.calcLow)}${l.calcHigh ? ` – ${formatMoney(l.calcHigh)}` : "+"}` : "Tailored proposal"],
              ]} />
            </Panel>
          )}
          {pics.length > 0 && <Panel title={`Photos (${pics.length})`}><PhotoGrid photos={pics} /></Panel>}
        </div>
        <div className="space-y-6">
          <Panel title="Status"><LeadStatusButtons id={l.id} status={l.status} /></Panel>
          <Panel title="Lead source">
            <DefList items={source} labelWidth="8rem" />
          </Panel>
        </div>
      </div>
    </>
  );
}
