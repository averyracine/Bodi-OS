import { Suspense } from "react";
import { SimplePage } from "@/components/SimplePage";
import { ApprovePairing } from "./ApprovePairing";

export const metadata = { title: "Approve car" };

export default function PairApprovePage() {
  return (
    <SimplePage>
      <h1 className="text-3xl font-semibold tracking-tight">Approve your car</h1>
      <p className="text-muted mt-2">Only approve a code shown on your own car&rsquo;s screen, right now.</p>
      <Suspense fallback={<div className="skeleton h-48 mt-6" />}>
        <ApprovePairing />
      </Suspense>
    </SimplePage>
  );
}
