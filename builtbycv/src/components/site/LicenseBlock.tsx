import { site } from "@/content/site";

/** Prominent Arizona ROC license block, shown directly under the home hero. */
export function LicenseBlock() {
  return (
    <section aria-labelledby="license-h" className="border-b border-line bg-white">
      <div className="container-x grid gap-6 py-10 sm:py-12 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-12">
        <div>
          <p className="eyebrow mb-2">Licensed general contractor</p>
          <h2 id="license-h" className="font-serif text-3xl font-light tracking-tight sm:text-4xl">
            Arizona ROC #{site.license.number}
          </h2>
        </div>
        <dl className="grid gap-1 text-[0.95rem] md:border-l md:border-line md:pl-12">
          <div>
            <dt className="sr-only">Classification</dt>
            <dd className="font-medium">{site.license.classification}</dd>
          </div>
          <div>
            <dt className="sr-only">Licensed company</dt>
            <dd className="text-stone">{site.legalLine}</dd>
          </div>
        </dl>
        <a href={site.license.lookupUrl} target="_blank" rel="noopener" className="link-arrow justify-self-start">
          Verify license<span className="sr-only"> on the Arizona Registrar of Contractors website (opens in a new tab)</span> ↗
        </a>
      </div>
    </section>
  );
}
