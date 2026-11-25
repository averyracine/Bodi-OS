import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth";
import { LOCAL_UPLOAD_DIR } from "@/lib/storage";

export const runtime = "nodejs";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif" };

/** Development-only file server for uploads stored on local disk. Staff only. */
export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  if (!(await getCurrentUser())) return new Response("Not found", { status: 404 });
  const { key } = await ctx.params;
  const full = path.resolve(LOCAL_UPLOAD_DIR, ...key);
  if (!full.startsWith(LOCAL_UPLOAD_DIR + path.sep)) return new Response("Not found", { status: 404 });
  try {
    const buf = await readFile(full);
    const ext = full.split(".").pop() ?? "";
    return new Response(new Uint8Array(buf), { headers: { "Content-Type": TYPES[ext] ?? "application/octet-stream", "Cache-Control": "private, max-age=3600" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
