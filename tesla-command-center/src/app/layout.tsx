import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { PrefsProvider } from "@/components/PrefsProvider";
import { UtmCapture } from "@/components/UtmCapture";
import { ConsentBanner } from "@/components/ConsentBanner";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "CruiseCtrl · Your parked time. Upgraded.", template: "%s · CruiseCtrl" },
  description:
    "CruiseCtrl: your parked time, upgraded. An independent dashboard for your car's browser while parked, with streaming, music, AI and productivity apps, widgets and modes. $10/month. Not affiliated with Tesla; doesn't control the vehicle.",
};

export const viewport: Viewport = {
  themeColor: "#08090e",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${manrope.variable} ${sora.variable}`} data-theme="graphite">
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
