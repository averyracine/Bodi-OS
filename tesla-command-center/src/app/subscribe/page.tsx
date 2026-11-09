import { SimplePage } from "@/components/SimplePage";
import { SubscribePanel } from "./SubscribePanel";

export const metadata = { title: "Subscription" };

export default function SubscribePage() {
  return (
    <SimplePage>
      <h1 className="font-display text-3xl font-semibold">Subscription needed</h1>
      <p className="text-muted mt-2">The CruiseCtrl dashboard is part of the $10/month plan.</p>
      <SubscribePanel />
    </SimplePage>
  );
}
