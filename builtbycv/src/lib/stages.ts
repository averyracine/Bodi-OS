import "server-only";
import { asc } from "drizzle-orm";
import { db } from "./db";
import { pipelineStages, type StageKind } from "./db/schema";

export const DEFAULT_STAGES: { name: string; kind: StageKind }[] = [
  { name: "New lead", kind: "open" },
  { name: "Contacted", kind: "open" },
  { name: "Consultation booked", kind: "open" },
  { name: "Estimate sent", kind: "open" },
  { name: "Won", kind: "won" },
  { name: "In progress", kind: "active" },
  { name: "Complete", kind: "done" },
  { name: "Lost", kind: "lost" },
];

export async function getStages() {
  return db.select().from(pipelineStages).orderBy(asc(pipelineStages.position));
}

/** Creates the default stages if none exist. Returns stages in order. */
export async function ensureStages() {
  let stages = await getStages();
  if (stages.length === 0) {
    await db.insert(pipelineStages).values(DEFAULT_STAGES.map((s, i) => ({ ...s, position: i })));
    stages = await getStages();
  }
  return stages;
}
