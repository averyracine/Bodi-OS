"use client";
import { useEffect, useRef, useState } from "react";
import { budgetRanges, timelines, heardAboutOptions } from "@/content/pricing";
import { services } from "@/content/services";
import { site } from "@/content/site";
import { readAttribution } from "./AttributionTracker";
import { compressImage } from "./image-compress";

const MAX_FILES = 6;
const MAX_TOTAL = 4 * 1024 * 1024;

function F({ id, label, children, hint, error }: { id: string; label: string; children: React.ReactNode; hint?: string; error?: string }) {
  return (
    <div>
      <label htmlFor={`ef-${id}`} className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p id={`ef-${id}-err`} className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

export function EstimateForm({ defaultProject }: { defaultProject?: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Partial<Record<string, string[]>>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [fileMsg, setFileMsg] = useState<string | null>(null);
  const started = useRef(0);
  const doneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    started.current = Date.now();
  }, []);
  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  async function onFiles(list: FileList | null) {
    if (!list) return;
    setFileMsg("Preparing photos…");
    const picked = Array.from(list).slice(0, MAX_FILES);
    const out = await Promise.all(picked.map((f) => compressImage(f)));
    const total = out.reduce((n, f) => n + f.size, 0);
    if (total > MAX_TOTAL) {
      setFiles([]);
      setFileMsg("Those photos are too large together. Try 3–4 photos.");
      return;
    }
    setFiles(out);
    setFileMsg(`${out.length} photo${out.length === 1 ? "" : "s"} ready${list.length > MAX_FILES ? ` (first ${MAX_FILES} kept)` : ""}.`);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.delete("photos");
    files.forEach((f) => fd.append("photos", f));
    fd.set("started_at", String(started.current));
    fd.set("attribution", JSON.stringify(readAttribution()));
    fd.set("page", location.pathname);
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const res = await fetch("/api/leads", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setFields(data.fields ?? {});
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again or call us.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div ref={doneRef} tabIndex={-1} className="card p-8 outline-none sm:p-10" role="status">
        <p className="eyebrow">Request received</p>
        <h2 className="h3 mt-3">Thank you. We&apos;ll be in touch within one business day.</h2>
        <p className="mt-4 text-stone">
          Need us sooner? Call <a className="underline" href={site.phoneHref}>{site.phone}</a>, Monday–Friday, 8 AM–5 PM.
        </p>
      </div>
    );
  }

  const err = (k: string) => fields[k]?.[0];
  const inv = (id: string) => ({ "aria-invalid": !!err(id), "aria-describedby": err(id) ? `ef-${id}-err` : undefined });

  return (
    <form onSubmit={submit} className="card grid gap-5 p-6 sm:grid-cols-2 sm:p-10" noValidate>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>Company website<input name="company_website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <F id="name" error={err("name")} label="Full name *"><input id="ef-name" name="name" className="field" autoComplete="name" required {...inv("name")} /></F>
      <F id="phone" error={err("phone")} label="Phone *"><input id="ef-phone" name="phone" type="tel" className="field" autoComplete="tel" required {...inv("phone")} /></F>
      <F id="email" error={err("email")} label="Email *"><input id="ef-email" name="email" type="email" className="field" autoComplete="email" required {...inv("email")} /></F>
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <F id="address" error={err("address")} label="Street address"><input id="ef-address" name="address" className="field" autoComplete="street-address" {...inv("address")} /></F>
        <F id="zip" error={err("zip")} label="ZIP *"><input id="ef-zip" name="zip" className="field" inputMode="numeric" maxLength={5} autoComplete="postal-code" required {...inv("zip")} /></F>
      </div>
      <F id="projectType" error={err("projectType")} label="Project type *">
        <select id="ef-projectType" name="projectType" className="field" defaultValue={defaultProject ?? ""} required {...inv("projectType")}>
          <option value="" disabled>Choose one</option>
          {services.map((s) => <option key={s.slug}>{s.name}</option>)}
          <option>Roofing & restoration</option>
          <option>Structural modifications</option>
          <option>Something else</option>
        </select>
      </F>
      <F id="budgetRange" error={err("budgetRange")} label="Budget range">
        <select id="ef-budgetRange" name="budgetRange" className="field" defaultValue="">
          <option value="">Choose one</option>
          {budgetRanges.map((b) => <option key={b.label}>{b.label}</option>)}
        </select>
      </F>
      <F id="timeline" error={err("timeline")} label="Timeline">
        <select id="ef-timeline" name="timeline" className="field" defaultValue="">
          <option value="">Choose one</option>
          {timelines.map((t) => <option key={t}>{t}</option>)}
        </select>
      </F>
      <F id="heardAbout" error={err("heardAbout")} label="How did you hear about us?">
        <select id="ef-heardAbout" name="heardAbout" className="field" defaultValue="">
          <option value="">Choose one</option>
          {heardAboutOptions.map((t) => <option key={t}>{t}</option>)}
        </select>
      </F>
      <div className="sm:col-span-2">
        <F id="message" error={err("message")} label="Tell us about your project">
          <textarea id="ef-message" name="message" rows={5} className="field" placeholder="What would you like to change? Anything we should know about the property?" />
        </F>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="ef-photos" className="label">Photos (optional)</label>
        <input id="ef-photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple onChange={(e) => onFiles(e.target.files)}
          className="block w-full text-sm text-stone file:mr-4 file:min-h-11 file:rounded-full file:border-0 file:bg-sand-100 file:px-5 file:text-sm file:font-medium file:text-ink hover:file:bg-sand-200" />
        <p className="mt-1 text-xs text-muted" aria-live="polite">{fileMsg ?? `Up to ${MAX_FILES} photos of the space. They help us prepare for the visit.`}</p>
      </div>
      {error && <p role="alert" className="text-sm text-danger sm:col-span-2">{error}</p>}
      <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">By submitting you agree that {site.name} may contact you about your project. We never sell your information.</p>
        <button className="btn-primary shrink-0" disabled={busy}>{busy ? "Sending…" : site.cta.primary}</button>
      </div>
    </form>
  );
}
