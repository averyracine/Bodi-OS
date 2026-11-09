import { SimplePage } from "@/components/SimplePage";
import { CarPairing } from "./CarPairing";

export const metadata = { title: "Pair this car" };

export default function CarPairPage() {
  return (
    <SimplePage wide>
      <h1 className="text-4xl font-semibold tracking-tight">Pair this car</h1>
      <p className="text-muted text-lg mt-2">Scan with your phone and approve. No password typing on this screen.</p>
      <CarPairing />
    </SimplePage>
  );
}
