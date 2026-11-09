import Link from "next/link";
import { BrandName } from "@/components/BrandMark";
import { DashboardPreview } from "@/components/DashboardPreview";
import { ExploreCta } from "@/components/ExploreCta";
import { Icon, type IconName } from "@/components/Icon";

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: "grid", title: "Big, readable favorites", body: "Six to eight large tiles with full app names, sized for a touchscreen at arm's length." },
  { icon: "star", title: "Watch, Listen and Focus presets", body: "Each preset keeps its own favorites. Switch with one tap, and rearrange with Move buttons or drag." },
  { icon: "search", title: "A searchable app library", body: "A curated starter catalog plus your own HTTPS links. You choose how each one opens." },
  { icon: "focus", title: "Focus workspace", body: "A built-in timer, scratchpad and checklist, in one pane or side by side." },
  { icon: "phone", title: "Pair from your phone", body: "Approve your car with a short code or QR on your phone, so you never type a password on the car screen." },
  { icon: "shield", title: "Honest by design", body: "No fake safety locks and no restriction workarounds. Links open each service's own site." },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is this for use while driving?",
    a: "No. Command Center is for parked downtime, like charging stops or waiting in a lot. A web page can't read your car's gear or speed, so it can't detect Park. It doesn't try to, and it never unlocks anything while you're moving.",
  },
  {
    q: "Which apps will play video or music in my car?",
    a: "We don't know yet, and we won't guess. Every tile opens that service's own website, and the vehicle's browser decides what works. Every entry is marked \"Not yet tested on Tesla\" until we've tried it on a parked car. Our first test vehicle is a 2023 Model X Plaid.",
  },
  {
    q: "Do I need other subscriptions?",
    a: "Yes, for those services. Netflix, Spotify and the rest are billed separately by them, and you sign in on their own sites. Command Center never asks for or stores those passwords.",
  },
  {
    q: "What does $10/month include?",
    a: "Account sync for your presets and settings, phone-to-car pairing, and ongoing improvements to the dashboard. The local dashboard preview is free to explore without an account.",
  },
  {
    q: "How do I cancel?",
    a: "Anytime, from Settings → Billing, which opens Stripe's customer portal. We never see or store your card details.",
  },
  {
    q: "What do you collect?",
    a: "Only what's needed to run your account and subscription. Analytics are off until you allow them, and even then they're a few named events with no notes, links or codes. Your scratchpad never leaves your browser.",
  },
  {
    q: "Is this made by Tesla?",
    a: "No. Command Center is an independent web app and isn't affiliated with or endorsed by Tesla, Inc. or any service in the catalog.",
  },
];

export default function Landing() {
  return (
    <div className="app-bg min-h-dvh">
      <header className="mx-auto max-w-7xl px-5 lg:px-8 h-20 flex items-center gap-4">
        <BrandName />
        <nav aria-label="Site" className="ml-auto hidden md:flex items-center gap-1">
          <a href="#features" className="btn btn-ghost btn-sm">Features</a>
          <a href="#pricing" className="btn btn-ghost btn-sm">Pricing</a>
          <a href="#faq" className="btn btn-ghost btn-sm">FAQ</a>
        </nav>
        <Link href="/start" className="btn btn-sm ml-auto md:ml-2">Get started</Link>
      </header>

      <main id="main">
        <section className="mx-auto max-w-7xl px-5 lg:px-8 pt-10 pb-12 grid gap-10">
          <div className="max-w-3xl">
            <p className="chip chip-accent mb-5">For parked downtime · $10/month</p>
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">Your Tesla downtime, upgraded.</h1>
            <p className="text-xl text-muted mt-5 max-w-2xl">
              A calm, large-type home screen for your car&rsquo;s web browser, with your favorite services, presets for watching,
              listening or focusing, and a scratchpad. Built for charging stops and time spent parked.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <ExploreCta className="btn btn-primary text-lg px-6" />
              <a href="#pricing" className="btn">See pricing</a>
            </div>
            <p className="text-sm text-muted mt-4">No account needed to explore. The preview below is the real dashboard. Try it.</p>
          </div>
          <DashboardPreview />
        </section>

        <section id="features" className="mx-auto max-w-7xl px-5 lg:px-8 py-16 scroll-mt-20">
          <h2 className="text-3xl font-semibold tracking-tight">What&rsquo;s inside</h2>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
            {FEATURES.map((f) => (
              <li key={f.title} className="card p-6">
                <span className="grid place-items-center w-12 h-12 rounded-xl bg-accent-soft text-accent"><Icon name={f.icon} /></span>
                <h3 className="text-lg font-semibold mt-4">{f.title}</h3>
                <p className="text-muted mt-1">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-7xl px-5 lg:px-8 py-8">
          <div className="card p-6 md:p-8 grid gap-6 md:grid-cols-3">
            {[
              ["1", "Open it in the car", "Visit the site in your car's browser while parked."],
              ["2", "Approve from your phone", "Scan the QR code, sign in on your phone, and tap Approve. The code expires in 5 minutes and works once."],
              ["3", "Pick a preset", "Watch, Listen or Focus. Your favorites follow your account."],
            ].map(([n, t, b]) => (
              <div key={n}>
                <span className="text-accent font-semibold">Step {n}</span>
                <h3 className="text-lg font-semibold mt-1">{t}</h3>
                <p className="text-muted mt-1">{b}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-5 lg:px-8 py-16 scroll-mt-20">
          <div className="grid gap-8 lg:grid-cols-2 items-start">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">One plan. No surprises.</h2>
              <p className="text-muted mt-3 text-lg">
                Explore the dashboard free in your browser. Subscribe when you want your setup synced and paired to your car.
              </p>
              <div className="mt-6 rounded-2xl border border-line p-5 text-sm text-muted">
                <p className="font-semibold text-fg">Before you subscribe</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Streaming, music and game services are separate subscriptions, billed by those companies.</li>
                  <li>Playback, audio and fullscreen depend on your car&rsquo;s browser. We haven&rsquo;t validated any service on a vehicle yet.</li>
                  <li>Use video and interactive apps only while parked.</li>
                </ul>
              </div>
            </div>
            <div className="card p-8">
              <p className="text-muted font-medium">Command Center</p>
              <p className="mt-2"><span className="text-6xl font-semibold tracking-tight">$10</span><span className="text-muted text-xl">/month</span></p>
              <ul className="mt-6 space-y-3">
                {["Watch, Listen and Focus presets", "Account sync for favorites and settings", "Secure phone-to-car pairing", "Focus timer, scratchpad and checklist", "Cancel anytime in Stripe's portal"].map((x) => (
                  <li key={x} className="flex items-start gap-3"><Icon name="check" className="text-accent shrink-0 mt-0.5" size={20} />{x}</li>
                ))}
              </ul>
              <div className="flex flex-col gap-3 mt-8">
                <ExploreCta className="btn btn-primary w-full" />
                <Link href="/start" className="btn w-full">Set up on your phone</Link>
              </div>
              <p className="text-xs text-muted mt-4">Payments go through Stripe&rsquo;s hosted checkout. Taxes may apply.</p>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl px-5 lg:px-8 py-16 scroll-mt-20">
          <h2 className="text-3xl font-semibold tracking-tight">Questions</h2>
          <div className="mt-6 flex flex-col gap-3">
            {FAQ.map((f) => (
              <details key={f.q} className="card group">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 p-5 min-h-[56px] font-semibold text-lg">
                  {f.q}
                  <Icon name="plus" className="shrink-0 text-muted group-open:rotate-45 transition-transform" />
                </summary>
                <p className="px-5 pb-5 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 lg:px-8 pb-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">See it for yourself.</h2>
          <div className="mt-6 flex justify-center"><ExploreCta className="btn btn-primary text-lg px-6" /></div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 py-8 text-sm text-muted flex flex-wrap gap-x-6 gap-y-2">
          <span>Independent app. Not affiliated with or endorsed by Tesla, Inc.</span>
          <span>Third-party names belong to their owners and don&rsquo;t imply endorsement.</span>
        </div>
      </footer>
    </div>
  );
}
