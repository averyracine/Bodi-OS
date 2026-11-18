import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/** IPs are hashed with a server secret, never stored raw. */
export function hashIp(ip: string) {
  return createHash("sha256")
    .update(`${process.env.SESSION_SECRET ?? "dev"}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}
