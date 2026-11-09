import Link from "next/link";
import { BrandName } from "@/components/BrandMark";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Get started · Command Center" };

/** Mobile-first onboarding: account and billing happen on the phone, not the car screen. */
export default function Start() {
  const steps = [
    { icon: "user" as const, title: "Create your account", body: "Sign in with a one-time link sent to your email. No password to remember.", href: "/login?next=/app/settings%23billing", cta: "Sign in with email" },
    { icon: "check" as const, title: "Subscribe for $10/month", body: "Stripe's secure checkout. Cancel anytime from Settings.", href: "/app/settings#billing", cta: "Go to billing" },
    { icon: "car" as const, title: "Pair your car", body: "In the car's browser, while parked, open this site's /pair/car page. Scan the QR code with this phone and approve.", href: "/pair", cta: "I have a code" },
  ];
  return (
    <div className="app-bg min-h-dvh">
      <header className="px-5 h-20 flex items-center"><Link href="/"><BrandName compact /></Link></header>
      <main id="main" className="px-5 pb-16 max-w-xl mx-auto">
        <h1 className="text-3xl font-semibold tracking-tight">Set up in three steps</h1>
        <p className="text-muted mt-2">Do this on your phone. Your car only needs a 5-minute pairing code.</p>
        <ol className="mt-8 flex flex-col gap-4">
          {steps.map((s, i) => (
            <li key={s.title} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="grid place-items-center w-11 h-11 rounded-xl bg-accent-soft text-accent"><Icon name={s.icon} /></span>
                <span className="text-sm text-muted font-semibold">Step {i + 1}</span>
              </div>
              <h2 className="text-xl font-semibold mt-3">{s.title}</h2>
              <p className="text-muted mt-1">{s.body}</p>
              <Link href={s.href} className="btn w-full mt-4">{s.cta}</Link>
            </li>
          ))}
        </ol>
        <p className="text-sm text-muted mt-6">Just looking? <Link className="text-accent underline" href="/app">Explore the dashboard</Link> without an account.</p>
      </main>
    </div>
  );
}
