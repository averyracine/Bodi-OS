"use client";
import { useActionState, useRef, useState, useTransition } from "react";
import { addNote, addTask, createUser, changeMyPassword, deleteStage, moveStage, updateStage } from "@/app/crm/actions";
import { primaryBtn, smallBtn } from "./ui";
import { nextBusinessDay } from "@/lib/dates";

/** Wraps a server action so the form clears after a successful submit. */
function useResetAction(action: (fd: FormData) => Promise<unknown>) {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      await action(fd);
      ref.current?.reset();
    });
  };
  return { ref, pending, onSubmit };
}

export function NoteForm({ projectId, customerId }: { projectId?: string; customerId?: string }) {
  const { ref, pending, onSubmit } = useResetAction(addNote);
  return (
    <form ref={ref} onSubmit={onSubmit} className="grid gap-2">
      {projectId && <input type="hidden" name="projectId" value={projectId} />}
      {customerId && <input type="hidden" name="customerId" value={customerId} />}
      <label htmlFor="note-body" className="sr-only">Add a team note</label>
      <textarea id="note-body" name="body" rows={3} required placeholder="Add a team note…" className="field text-sm" />
      <div className="flex justify-end"><button className={primaryBtn} disabled={pending}>{pending ? "Saving…" : "Add note"}</button></div>
    </form>
  );
}

export function TaskForm({ projectId, customerId, users }: { projectId?: string; customerId?: string; users: { id: string; name: string }[] }) {
  const { ref, pending, onSubmit } = useResetAction(addTask);
  return (
    <form ref={ref} onSubmit={onSubmit} className="grid gap-2 sm:grid-cols-[1fr_9.5rem_auto]">
      {projectId && <input type="hidden" name="projectId" value={projectId} />}
      {customerId && <input type="hidden" name="customerId" value={customerId} />}
      <label className="sr-only" htmlFor="task-title">Task</label>
      <input id="task-title" name="title" required placeholder="New task…" className="field min-h-10 py-2 text-sm" />
      <label className="sr-only" htmlFor="task-due">Due date</label>
      <input id="task-due" name="dueDate" type="date" defaultValue={nextBusinessDay()} className="field min-h-10 py-2 text-sm" />
      {users.length > 1 && (
        <select name="assignedUserId" aria-label="Assign to" className="field min-h-10 py-2 text-sm sm:col-span-2">
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      )}
      <button className={primaryBtn} disabled={pending}>{pending ? "…" : "Add task"}</button>
    </form>
  );
}

export function StageRow({ stage, first, last, kinds }: { stage: { id: string; name: string; kind: string; count: number }; first: boolean; last: boolean; kinds: readonly string[] }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
      <form action={updateStage} className="flex flex-1 flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={stage.id} />
        <label className="sr-only" htmlFor={`sn-${stage.id}`}>Stage name</label>
        <input id={`sn-${stage.id}`} name="name" defaultValue={stage.name} required maxLength={60} className="field min-h-10 flex-1 py-2 text-sm" />
        <label className="sr-only" htmlFor={`sk-${stage.id}`}>Stage type</label>
        <select id={`sk-${stage.id}`} name="kind" defaultValue={stage.kind} className="field min-h-10 w-32 py-2 text-sm">
          {kinds.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <button className={smallBtn}>Save</button>
      </form>
      <div className="flex items-center gap-1">
        <span className="mr-2 text-xs text-muted">{stage.count} project{stage.count === 1 ? "" : "s"}</span>
        <button type="button" className={smallBtn} disabled={first || pending} onClick={() => start(() => moveStage(stage.id, "up"))} aria-label={`Move ${stage.name} up`}>↑</button>
        <button type="button" className={smallBtn} disabled={last || pending} onClick={() => start(() => moveStage(stage.id, "down"))} aria-label={`Move ${stage.name} down`}>↓</button>
        <button type="button" className={`${smallBtn} text-danger`} disabled={pending} onClick={() => start(async () => { const r = await deleteStage(stage.id); setErr(r.error ?? null); })}>Delete</button>
      </div>
      {err && <p role="alert" className="text-sm text-danger sm:basis-full">{err}</p>}
    </li>
  );
}

export function NewUserForm({ roles }: { roles: readonly string[] }) {
  const [state, action, pending] = useActionState(async (_: unknown, fd: FormData) => createUser(fd), null);
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-2">
      <input name="name" placeholder="Name" required className="field min-h-10 py-2 text-sm" aria-label="Name" />
      <input name="email" type="email" placeholder="Email" required className="field min-h-10 py-2 text-sm" aria-label="Email" />
      <select name="role" className="field min-h-10 py-2 text-sm" aria-label="Role" defaultValue="admin">
        {roles.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <input name="password" type="password" placeholder="Temporary password (10+ chars)" required minLength={10} className="field min-h-10 py-2 text-sm" aria-label="Temporary password" autoComplete="new-password" />
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className={primaryBtn} disabled={pending}>Add user</button>
        {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
        {state?.ok && <p className="text-sm text-ok">User added.</p>}
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(async (_: unknown, fd: FormData) => changeMyPassword(fd), null);
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row">
      <input name="password" type="password" minLength={10} required placeholder="New password (10+ chars)" autoComplete="new-password" aria-label="New password" className="field min-h-10 flex-1 py-2 text-sm" />
      <button className={primaryBtn} disabled={pending}>Change password</button>
      {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="self-center text-sm text-ok">Password changed.</p>}
    </form>
  );
}
