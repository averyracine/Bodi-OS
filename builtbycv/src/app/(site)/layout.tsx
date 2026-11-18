import { Header, MobileActionBar } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { AttributionTracker } from "@/components/site/AttributionTracker";
import { JsonLd } from "@/components/site/JsonLd";
import { localBusinessJsonLd } from "@/lib/seo";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only z-[60] rounded bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <JsonLd data={localBusinessJsonLd()} />
      <AttributionTracker />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <MobileActionBar />
    </>
  );
}
