import Link from "next/link";
import { SimplePage } from "@/components/SimplePage";

export default function NotFound() {
  return (
    <SimplePage>
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted mt-2">That page doesn&rsquo;t exist.</p>
      <Link href="/app" className="btn btn-primary mt-6">Go to dashboard</Link>
    </SimplePage>
  );
}
