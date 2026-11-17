import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { pipelineStages, projects, users, ROLES, STAGE_KINDS } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { addStage, setUserActive } from "@/app/crm/actions";
import { PageHeader, Panel, Badge, primaryBtn, smallBtn } from "@/components/crm/ui";
import { StageRow, NewUserForm, PasswordForm } from "@/components/crm/forms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const me = await requireUser();
  const stageRows = await db
    .select({ id: pipelineStages.id, name: pipelineStages.name, kind: pipelineStages.kind, count: sql<number>`count(${projects.id})::int` })
    .from(pipelineStages)
    .leftJoin(projects, eq(projects.stageId, pipelineStages.id))
    .groupBy(pipelineStages.id)
    .orderBy(asc(pipelineStages.position));
  const team = can(me.role, "users:manage") ? await db.select().from(users).orderBy(asc(users.createdAt)) : [];
  return (
    <>
      <PageHeader title="Settings" />
      <div className="space-y-6">
        {can(me.role, "pipeline:configure") && (
          <Panel title="Pipeline stages">
            <div id="stages" className="scroll-mt-20" />
            <p className="mb-2 text-sm text-muted">
              Type: <b>open</b> = still selling (counts toward open pipeline value), <b>won</b>/<b>lost</b> = outcome, <b>active</b> = job underway, <b>done</b> = complete. New website leads go into the first stage.
            </p>
            <ul className="divide-y divide-line">
              {stageRows.map((s, i) => <StageRow key={s.id} stage={s} first={i === 0} last={i === stageRows.length - 1} kinds={STAGE_KINDS} />)}
            </ul>
            <form action={addStage} className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row">
              <input name="name" required maxLength={60} placeholder="New stage name" aria-label="New stage name" className="field min-h-10 flex-1 py-2 text-sm" />
              <select name="kind" aria-label="Stage type" className="field min-h-10 py-2 text-sm sm:w-32">{STAGE_KINDS.map((k) => <option key={k}>{k}</option>)}</select>
              <button className={primaryBtn}>Add stage</button>
            </form>
          </Panel>
        )}

        {can(me.role, "users:manage") && (
          <Panel title="Team">
            <ul className="divide-y divide-line">
              {team.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <span><span className="font-medium">{u.name}</span> <span className="text-muted">· {u.email}</span></span>
                  <span className="flex items-center gap-2">
                    <Badge>{u.role}</Badge>
                    {!u.active && <Badge tone="danger">inactive</Badge>}
                    {u.id !== me.id && (
                      <form action={setUserActive.bind(null, u.id, !u.active)}><button className={smallBtn}>{u.active ? "Deactivate" : "Reactivate"}</button></form>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-line pt-4">
              <h3 className="mb-2 text-sm font-medium">Add a team member</h3>
              <p className="mb-3 text-xs text-muted">Roles: admin (everything). Office, sales and field roles exist with narrower permissions for when you add staff (see src/lib/permissions.ts).</p>
              <NewUserForm roles={ROLES} />
            </div>
          </Panel>
        )}

        <Panel title="Your password"><PasswordForm /></Panel>
      </div>
    </>
  );
}
