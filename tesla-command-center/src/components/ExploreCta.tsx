import Link from "next/link";
import { Icon } from "./Icon";

/** demo_open is recorded once per session when the dashboard actually loads (see HomeView). */
export function ExploreCta({ className = "btn btn-primary" }: { className?: string }) {
  return (
    <Link href="/app" className={className}>
      Explore the dashboard <Icon name="right" size={20} />
    </Link>
  );
}
