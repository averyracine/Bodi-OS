import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif",
};

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

/**
 * Stores a file. Production: Vercel Blob (needs BLOB_READ_WRITE_TOKEN).
 * Development: local disk, served only to logged-in staff via /api/files.
 * Blob URLs are long and unguessable but public if shared — don't post them.
 */
export async function storeFile(file: File, folder: string): Promise<{ url: string; key: string }> {
  const ext = EXT[file.type] ?? "bin";
  const key = `${folder}/${randomUUID()}.${ext}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(key, file, { access: "public", contentType: file.type, addRandomSuffix: true });
    return { url: blob.url, key: blob.pathname };
  }
  if (process.env.VERCEL) throw new Error("BLOB_READ_WRITE_TOKEN is required on Vercel");
  const full = path.join(LOCAL_UPLOAD_DIR, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, Buffer.from(await file.arrayBuffer()));
  return { url: `/api/files/${key}`, key };
}

export function validateImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "Photos must be JPG, PNG, WEBP or HEIC.";
  if (file.size > MAX_IMAGE_BYTES) return "Each photo must be under 8 MB.";
  return null;
}
