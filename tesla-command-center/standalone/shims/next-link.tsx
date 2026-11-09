import type { AnchorHTMLAttributes, ReactNode } from "react";
import { toHash } from "../routes";

export default function Link({ href, children, ...rest }: { href: string; children?: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a href={toHash(href)} {...rest}>{children}</a>;
}
