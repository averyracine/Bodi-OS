import { SimplePage } from "@/components/SimplePage";
import { CarPairing } from "./CarPairing";

export const metadata = { title: "Sign in this car" };

export default function CarPairPage() {
  return (
    <SimplePage wide>
      <h1 className="font-display text-4xl font-semibold">Sign in this car</h1>
      <p className="text-muted text-lg mt-2">
        Scan the code with your phone and tap Approve. No email or password on this screen. The car then stays signed in.
      </p>
      <CarPairing />
      <p className="text-sm text-muted mt-6">
        Not in the car? <a className="text-accent underline" href="/login?next=/app">Sign in with email instead</a>.
      </p>
    </SimplePage>
  );
}
