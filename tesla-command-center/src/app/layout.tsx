import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PrefsProvider } from "@/components/PrefsProvider";
import { UtmCapture } from "@/components/UtmCapture";
import { ConsentBanner } from "@/components/ConsentBanner";

export const metadata: Metadata = {
  title: "Command Center for Tesla: a dashboard for parked downtime",
  description:
    "A calm, large-type browser dashboard for charging stops and parked downtime. Favorites, presets, a focus workspace and phone pairing. $10/month.",
};

export const viewport: Viewport = {
  themeColor: "#0c0e11",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" data-theme="graphite">
      <body className="min-h-full">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] btn btn-primary">
          Skip to content
        </a>
        <PrefsProvider>
          <UtmCapture />
          {children}
          <ConsentBanner />
        </PrefsProvider>
      </body>
    </html>
  );
}
