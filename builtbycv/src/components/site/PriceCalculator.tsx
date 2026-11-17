"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { projectPricing, finishLevels, calculatorDisclaimer, type CalculatorResult } from "@/content/pricing";
import { site } from "@/content/site";
import { readAttribution } from "./AttributionTracker";

type Errors = Partial<Record<string, string[]>>;

export function PriceCalculator() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [type, setType] = useState(projectPricing[0].key);
  const [size, setSize] = useState("");
  const [finish, setFinish] = useState("premium");
  const [zip, setZip] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Errors>({});
  const [result, setResult] = useState<{ result: CalculatorResult; outsideArea: boolean } | null>(null);
  const started = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    started.current = Date.now();
  }, []);

  const pricing = projectPricing.find((p) => p.key === type)!;
  useEffect(() => setSize(""), [type]);
  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  const zipValid = /^\d{5}$/.test(zip);
  const canContinue = Boolean(type && size && finish && zipValid);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const res = await fetch("/api/calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          phone: fd.get("phone"),
          email: fd.get("email"),
          company_website: fd.get("company_website"),
          zip,
          projectType: type,
          size,
          finish,
          started_at: started.current,
          attribution: readAttribution(),
          page: location.pathname,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setFields(data.fields ?? {});
        return;
      }
      setResult({ result: data.result, outsideArea: data.outsideArea });
      setStep(3);
    } catch {
      setError("Network error. Please try again or call us.");
    } finally {
      setBusy(false);
    }
  }

  const err = (k: string) => fields[k]?.[0];

  return (
    <div className="card overflow-hidden">
      <ol className="grid grid-cols-3 border-b border-line text-center text-xs font-medium sm:text-sm" aria-label="Calculator steps">
        {["Your project", "Your details", "Your estimate"].map((label, i) => (
          <li key={label} aria-current={step === i + 1 ? "step" : undefined} className={`px-2 py-3 ${step === i + 1 ? "bg-sand-50 text-ink" : "text-muted"}`}>
            <span className="mr-1 tabular-nums">{i + 1}.</span>
            {label}
          </li>
        ))}
      </ol>

      <div className="p-5 sm:p-8">
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canContinue) setStep(2);
            }}
            className="grid gap-6"
          >
            <div>
              <label htmlFor="calc-type" className="label">Project type</label>
              <select id="calc-type" className="field" value={type} onChange={(e) => setType(e.target.value)}>
                {projectPricing.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>
            <fieldset>
              <legend className="label">{pricing.sizeLabel}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {pricing.sizes.map((s) => (
                  <label key={s} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm has-[:checked]:border-ink has-[:checked]:bg-sand-50">
                    <input type="radio" name="size" value={s} checked={size === s} onChange={() => setSize(s)} className="accent-[var(--color-accent)]" required />
                    {s}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">Finish level</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {finishLevels.map((f) => (
                  <label key={f.key} className="flex cursor-pointer flex-col gap-1 rounded-lg border border-line bg-white px-4 py-3 text-sm has-[:checked]:border-ink has-[:checked]:bg-sand-50">
                    <span className="flex items-center gap-2 font-medium">
                      <input type="radio" name="finish" value={f.key} checked={finish === f.key} onChange={() => setFinish(f.key)} className="accent-[var(--color-accent)]" />
                      {f.label}
                    </span>
                    <span className="text-xs leading-snug text-muted">{f.description}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="max-w-[12rem]">
              <label htmlFor="calc-zip" className="label">Project ZIP code</label>
              <input id="calc-zip" className="field" inputMode="numeric" autoComplete="postal-code" maxLength={5} pattern="\d{5}" value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))} required />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">Takes about a minute. No obligation.</p>
              <button className="btn-primary" disabled={!canContinue}>Continue</button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submit} className="grid gap-5" noValidate>
            <p className="text-stone">Where should we send your figure? We&apos;ll show it right here, and a project advisor may follow up. No spam, ever.</p>
            {/* honeypot */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>Company website<input name="company_website" tabIndex={-1} autoComplete="off" /></label>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label htmlFor="calc-name" className="label">Name</label>
                <input id="calc-name" name="name" className="field" autoComplete="name" required aria-invalid={!!err("name")} aria-describedby={err("name") ? "calc-name-err" : undefined} />
                {err("name") && <p id="calc-name-err" className="mt-1 text-sm text-danger">{err("name")}</p>}
              </div>
              <div>
                <label htmlFor="calc-phone" className="label">Phone</label>
                <input id="calc-phone" name="phone" type="tel" className="field" autoComplete="tel" required aria-invalid={!!err("phone")} aria-describedby={err("phone") ? "calc-phone-err" : undefined} />
                {err("phone") && <p id="calc-phone-err" className="mt-1 text-sm text-danger">{err("phone")}</p>}
              </div>
              <div>
                <label htmlFor="calc-email" className="label">Email</label>
                <input id="calc-email" name="email" type="email" className="field" autoComplete="email" required aria-invalid={!!err("email")} aria-describedby={err("email") ? "calc-email-err" : undefined} />
                {err("email") && <p id="calc-email-err" className="mt-1 text-sm text-danger">{err("email")}</p>}
              </div>
            </div>
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button type="button" className="btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary" disabled={busy}>{busy ? "Calculating…" : "See my estimate"}</button>
            </div>
          </form>
        )}

        {step === 3 && result && (
          <div ref={resultRef} tabIndex={-1} className="outline-none" aria-live="polite">
            <p className="eyebrow">{pricing.label} · {size} · {finishLevels.find((f) => f.key === finish)?.label}</p>
            <p className="mt-4 font-serif text-4xl font-light tracking-tight sm:text-5xl">{result.result.headline}</p>
            <p className="mt-4 max-w-2xl text-stone">{result.result.detail}</p>
            {result.outsideArea && (
              <p className="mt-4 rounded-lg bg-sand-100 p-4 text-sm">ZIP {zip} looks outside our usual Phoenix-metro service area. We&apos;ll confirm availability when we call.</p>
            )}
            <p className="mt-6 border-l-2 border-sand-400 pl-4 text-sm leading-relaxed text-muted">{calculatorDisclaimer}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={site.cta.href} className="btn-primary">{site.cta.primary}</Link>
              <a href={site.phoneHref} className="btn-ghost">Call {site.phone}</a>
              <button type="button" className="btn-ghost" onClick={() => { setResult(null); setStep(1); }}>Price another project</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
