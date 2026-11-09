import Link from "next/link";
import type { ReactNode } from "react";
import { BrandName, DISCLAIMER } from "./BrandMark";

export function SimplePage({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="app-bg min-h-dvh">
      <header className="px-5 lg:px-8 h-20 flex items-center">
        <Link href="/" aria-label="CruiseCtrl home"><BrandName compact /></Link>
      </header>
      <main id="main" className={`px-5 pb-10 mx-auto ${wide ? "max-w-4xl" : "max-w-lg"}`}>{children}</main>
      <footer className="px-5 pb-10 mx-auto max-w-lg text-xs text-muted text-center">{DISCLAIMER}</footer>
    </div>
  );
}
