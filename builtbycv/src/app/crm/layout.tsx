import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "CRM", template: "%s · CV Capital CRM" },
  robots: { index: false, follow: false },
};

export default function CrmRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-sand-50 text-ink">{children}</div>;
}
