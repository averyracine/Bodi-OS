"use client";
import { useTransition } from "react";
import { setLeadStatus } from "@/app/crm/actions";

const OPTIONS = [
  ["new", "New"],
  ["reviewed", "Reviewed"],
  ["archived", "Archived"],
  ["spam", "Spam"],
] as const;

export function LeadStatusButtons({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <div role="group" aria-label="Lead status" className="grid grid-cols-2 gap-2">
      {OPTIONS.map(([v, label]) => (
        <button key={v} type="button" disabled={pending} aria-pressed={status === v} onClick={() => start(() => setLeadStatus(id, v))}
          className="min-h-11 rounded-lg border border-line bg-white px-3 text-sm aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white disabled:opacity-60">
          {label}
        </button>
      ))}
    </div>
  );
}
