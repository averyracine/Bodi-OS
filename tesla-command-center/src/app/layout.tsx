import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { PrefsProvider } from "@/components/PrefsProvider";
import { UtmCapture } from "@/components/UtmCapture";
import { ConsentBanner } from "@/components/ConsentBanner";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "Command Center for Tesla",
  description:
    "Entertainment, AI, productivity and everyday essentials in one personalized dashboard for your car's browser. $10/month.",
};

export const viewport: Viewport = {
  themeColor: "#080b10",
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
