import Link from "next/link";
import { BrandName, DISCLAIMER, Wordmark } from "@/components/BrandMark";
import { DashboardPreview } from "@/components/DashboardPreview";
import { ExploreCta } from "@/components/ExploreCta";
import { Icon, type IconName } from "@/components/Icon";

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: "home", title: "Personalized dashboard", body: "Watch, Listen, Work and Drive modes, each with its own apps and widgets. Rearrange anything by touch, drag or keyboard." },
  { icon: "tv", title: "Entertainment shortcuts", body: "Streaming, sports, music and cloud gaming one tap away. Each opens the service's own site, and you choose new tab or this tab." },
  { icon: "sparkle", title: "AI and productivity", body: "Claude, ChatGPT, Gemini and Perplexity next to mail, calendar and files, plus a built-in timer, notes and checklist." },
  { icon: "layout", title: "Customizable widgets", body: "Clock, weather, markets, calendar, quick launch and notes. Show, hide, resize and reorder per mode." },
  { icon: "bolt", title: "Simple setup", body: "Open the site in your car while parked. Everything else (account, billing, settings) happens on your phone." },
  { icon: "shield", title: "Secure account and pairing", body: "Approve your car from your phone with a single-use 5-minute code. Revoke any paired car from Settings." },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is this for use while driving?",
    a: "No. CruiseCtrl is for parked downtime, like charging stops or waiting in a lot. A web page can't read your car's gear or speed, so it can't detect Park. It doesn't try to, and it never unlocks anything while you're moving.",
  },
  {
    q: "Which apps will play video or music in my car?",
    a: "We don't know yet, and we won't guess. Every tile opens that service's own website, and the vehicle's browser decides what works. Every entry is marked \"Not yet tested on Tesla\" until we've tried it on a parked car. Our first test vehicle is a 2023 Model X Plaid.",
  },
  {
    q: "Do I need other subscriptions?",
    a: "Yes, for those services. Netflix, Spotify and the rest are billed separately by them, and you sign in on their own sites. CruiseCtrl never asks for or stores those passwords.",
  },
  {
    q: "What does $10/month include?",
    a: "Account sync for your modes, apps, widgets and settings, phone-to-car pairing, and ongoing improvements. The dashboard preview is free to explore without an account.",
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
    q: "Are the stock prices real?",
    a: "Only when the live quote feed is connected, and they may be delayed. Until then the ticker and Markets card show sample prices, labelled \"Sample data · not real prices\". Either way it's for information only, not investment advice.",
  },
  {
    q: "Does Drive mode know where my car is?",
    a: "No. Drive is a screen layout for trip prep: maps, charger links, weather and your day. A web page can't read your car's location, battery, gear or speed. Weather uses a city you choose, or this device's location only if you allow it.",
  },
  {
    q: "Is CruiseCtrl made by Tesla? Does it control the car?",
    a: "No to both. CruiseCtrl is an independent web app, not affiliated with or endorsed by Tesla, Inc. or any service in the catalog. Despite the name, it doesn't control the vehicle, its speed or any driving feature, and it doesn't read vehicle data. It's a dashboard for your browser while you're parked.",
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
        <section className="mx-auto max-w-7xl px-5 lg:px-8 pt-8 pb-12 grid gap-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] items-end">
            <div className="min-w-0">
              <p className="chip chip-accent mb-5">CruiseCtrl · $10/month</p>
              <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[1.02] [text-wrap:balance]">
                Your parked time. <span className="bg-gradient-to-r from-accent to-violet bg-clip-text text-transparent">Upgraded.</span>
              </h1>
              <p className="text-xl text-muted mt-5 max-w-xl">
                Streaming, music, AI and everyday essentials in one personalized dashboard for your car&rsquo;s browser, made for charging stops and time spent parked.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap gap-3">
                <ExploreCta className="btn btn-primary text-lg px-6" />
                <Link href="/start" className="btn text-lg px-6">Get CruiseCtrl · $10/month</Link>
              </div>
              <p className="text-sm text-muted lg:text-right max-w-sm">
                The preview below is the real dashboard. Try it, no account needed. Designed for use while parked.
              </p>
            </div>
          </div>
          <DashboardPreview />
        </section>

        <section id="features" className="mx-auto max-w-7xl px-5 lg:px-8 py-16 scroll-mt-20">
          <p className="eyebrow">What you get</p>
          <h2 className="font-display text-4xl font-semibold mt-2 [text-wrap:balance]">One screen for the time you spend parked.</h2>
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
              ["3", "Pick a mode", "Watch, Listen, Work or Drive. Your apps and widgets follow your account."],
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
              <h2 className="font-display text-4xl font-semibold">One plan. No surprises.</h2>
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
              <p className="font-medium"><Wordmark className="text-lg text-fg" /></p>
              <p className="mt-2"><span className="font-display text-6xl font-semibold">$10</span><span className="text-muted text-xl">/month</span></p>
              <ul className="mt-6 space-y-3">
                {["Watch, Listen, Work and Drive modes", "Customizable widgets: weather, markets, calendar and more", "Account sync for apps, modes and settings", "Secure phone-to-car pairing", "Focus timer, notes and checklist", "Cancel anytime in Stripe's portal"].map((x) => (
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
          <h2 className="font-display text-4xl font-semibold">Questions</h2>
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
          <h2 className="font-display text-4xl font-semibold">See it for yourself.</h2>
          <div className="mt-6 flex justify-center"><ExploreCta className="btn btn-primary text-lg px-6" /></div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 py-8 text-sm text-muted flex flex-wrap gap-x-6 gap-y-2">
          <span className="max-w-2xl">{DISCLAIMER}</span>
          <span>Third-party names and logos belong to their owners and don&rsquo;t imply endorsement.</span>
        </div>
      </footer>
    </div>
  );
}
