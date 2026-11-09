"use client";

import Link from "next/link";
import { createContext, useContext, type ReactNode } from "react";

export type ViewId = "home" | "library" | "focus" | "discover" | "settings";

export const VIEW_HREF: Record<ViewId, string> = {
  home: "/app",
  library: "/app/library",
  focus: "/app/focus",
  discover: "/app/discover",
  settings: "/app/settings",
};

/** In the landing-page preview, navigation switches views in place instead of routing. */
const NavContext = createContext<{ select?: (v: ViewId) => void }>({});

export function NavProvider({ select, children }: { select?: (v: ViewId) => void; children: ReactNode }) {
  return <NavContext.Provider value={{ select }}>{children}</NavContext.Provider>;
}

export function ViewLink({
  view,
  hash,
  className,
  children,
  ariaCurrent,
  ariaLabel,
  onClick,
}: {
  view: ViewId;
  hash?: string;
  className?: string;
  children: ReactNode;
  ariaCurrent?: boolean;
  ariaLabel?: string;
  onClick?: () => void;
}) {
  const { select } = useContext(NavContext);
  if (select) {
    return (
      <button type="button" className={className} aria-current={ariaCurrent ? "page" : undefined} aria-label={ariaLabel} onClick={() => { onClick?.(); select(view); }}>
        {children}
      </button>
    );
  }
  return (
    <Link href={VIEW_HREF[view] + (hash ? `#${hash}` : "")} className={className} aria-current={ariaCurrent ? "page" : undefined} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </Link>
  );
}
