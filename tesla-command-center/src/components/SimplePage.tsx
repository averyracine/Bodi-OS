import Link from "next/link";
import type { ReactNode } from "react";
import { BrandName } from "./BrandMark";

export function SimplePage({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="app-bg min-h-dvh">
      <header className="px-5 lg:px-8 h-20 flex items-center">
        <Link href="/" aria-label="Command Center home"><BrandName compact /></Link>
      </header>
      <main id="main" className={`px-5 pb-16 mx-auto ${wide ? "max-w-4xl" : "max-w-lg"}`}>{children}</main>
    </div>
  );
}
