"use client";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { toggleTask } from "@/app/crm/actions";
import type { Task } from "@/lib/db/schema";
import { formatDate } from "@/lib/dates";

type Row = { task: Task; projectTitle?: string | null; customerName?: string | null };

export function TaskList({ rows, today, showProject = true }: { rows: Row[]; today: string; showProject?: boolean }) {
  const [, start] = useTransition();
  const [optimistic, flip] = useOptimistic(rows, (state, id: string) =>
    state.map((r) => (r.task.id === id ? { ...r, task: { ...r.task, completedAt: r.task.completedAt ? null : new Date() } } : r)),
  );
  return (
    <ul className="divide-y divide-line">
      {optimistic.map(({ task: t, projectTitle }) => {
        const overdue = !t.completedAt && t.dueDate && t.dueDate < today;
        const dueToday = !t.completedAt && t.dueDate === today;
        return (
          <li key={t.id} className="flex items-start gap-3 py-3">
            <input
              type="checkbox"
              checked={!!t.completedAt}
              onChange={() => start(async () => { flip(t.id); await toggleTask(t.id); })}
              aria-label={`Mark "${t.title}" ${t.completedAt ? "not done" : "done"}`}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-ink)]"
            />
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${t.completedAt ? "text-muted line-through" : ""}`}>{t.title} {t.automated && <span className="text-xs text-muted">· auto</span>}</p>
              <p className="mt-0.5 text-xs text-muted">
                {t.dueDate && <span className={overdue ? "font-medium text-danger" : dueToday ? "font-medium text-warn" : ""}>{overdue ? "Overdue · " : dueToday ? "Today · " : "Due "}{formatDate(t.dueDate)}</span>}
                {showProject && t.projectId && projectTitle && <> · <Link href={`/crm/projects/${t.projectId}`} className="underline-offset-2 hover:underline">{projectTitle}</Link></>}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
