import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

/**
 * Phone-to-car pairing.
 *
 * 1. The car (unauthenticated browser) starts a request and shows a short code
 *    plus a QR code that links to our own /pair page. It also receives a
 *    high-entropy poll secret it keeps in memory.
 * 2. A signed-in phone approves the code. Approval is rate limited per user.
 * 3. The car claims the approved request with its poll secret and receives a
 *    scoped device token (stored only as a hash). Claiming is single-use.
 * Everything expires after PAIRING_TTL_MS and devices can be revoked.
 */

export const PAIRING_TTL_MS = 5 * 60 * 1000;
export const START_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };
export const APPROVE_LIMIT = { max: 10, windowMs: 10 * 60 * 1000 };
export const CLAIM_LIMIT = { max: 120, windowMs: 10 * 60 * 1000 };
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
const CODE_LENGTH = 8;

export type PairingStatus = "pending" | "approved" | "claimed" | "expired";

export interface PairingRequestRecord {
  id: string;
  codeHash: string;
  pollSecretHash: string;
  status: PairingStatus;
  userId: string | null;
  deviceLabel: string | null;
  createdAt: number;
  expiresAt: number;
  approvedAt: number | null;
  claimedAt: number | null;
}

export interface DeviceRecord {
  id: string;
  userId: string;
  label: string;
  tokenHash: string;
  scope: "dashboard";
  createdAt: number;
  lastSeenAt: number | null;
  revokedAt: number | null;
}

export interface PairingStore {
  countHits(bucket: string, sinceMs: number): Promise<number>;
  addHit(bucket: string, atMs: number): Promise<void>;
  insertRequest(r: PairingRequestRecord): Promise<void>;
  findRequestByCodeHash(codeHash: string): Promise<PairingRequestRecord | null>;
  findRequestById(id: string): Promise<PairingRequestRecord | null>;
  /** Atomic compare-and-set on status. Returns true only for the single winner. */
  updateRequestIfStatus(id: string, expected: PairingStatus, patch: Partial<PairingRequestRecord>): Promise<boolean>;
  insertDevice(d: DeviceRecord): Promise<void>;
  findDeviceByTokenHash(tokenHash: string): Promise<DeviceRecord | null>;
  touchDevice(id: string, atMs: number): Promise<void>;
}

function pepper(): string {
  const p = process.env.PAIRING_PEPPER;
  if (p && p.length >= 32) return p;
  if (process.env.NODE_ENV === "production") {
    throw new Error("PAIRING_PEPPER must be set (32+ chars) in production");
  }
  return "dev-only-pairing-pepper-not-for-production-use";
}

export function hashSecret(value: string): string {
  return createHmac("sha256", pepper()).update(value).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && ba.length > 0 && timingSafeEqual(ba, bb);
}

export function generateCode(): string {
  // Rejection sampling avoids modulo bias.
  const out: string[] = [];
  while (out.length < CODE_LENGTH) {
    for (const b of randomBytes(16)) {
      if (b < 248 && out.length < CODE_LENGTH) out.push(CODE_ALPHABET[b % CODE_ALPHABET.length]);
    }
  }
  return `${out.slice(0, 4).join("")}-${out.slice(4).join("")}`;
}

export function normalizeCode(input: string): string | null {
  const c = (input ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (c.length !== CODE_LENGTH) return null;
  for (const ch of c) if (!CODE_ALPHABET.includes(ch)) return null;
  return `${c.slice(0, 4)}-${c.slice(4)}`;
}

async function rateLimited(store: PairingStore, bucket: string, limit: { max: number; windowMs: number }, now: number) {
  const n = await store.countHits(bucket, now - limit.windowMs);
  if (n >= limit.max) return true;
  await store.addHit(bucket, now);
  return false;
}

export type StartResult =
  | { ok: true; requestId: string; code: string; pollSecret: string; expiresAt: number }
  | { ok: false; error: "rate_limited" };

export async function startPairing(store: PairingStore, opts: { clientKey: string; now: number }): Promise<StartResult> {
  if (await rateLimited(store, `start:${hashSecret(opts.clientKey)}`, START_LIMIT, opts.now)) {
    return { ok: false, error: "rate_limited" };
  }
  const code = generateCode();
  const pollSecret = randomBytes(32).toString("base64url");
  const rec: PairingRequestRecord = {
    id: randomUUID(),
    codeHash: hashSecret(code),
    pollSecretHash: hashSecret(pollSecret),
    status: "pending",
    userId: null,
    deviceLabel: null,
    createdAt: opts.now,
    expiresAt: opts.now + PAIRING_TTL_MS,
    approvedAt: null,
    claimedAt: null,
  };
  await store.insertRequest(rec);
  return { ok: true, requestId: rec.id, code, pollSecret, expiresAt: rec.expiresAt };
}

export type ApproveResult =
  | { ok: true }
  | { ok: false; error: "unauthenticated" | "invalid_code" | "expired" | "already_used" | "rate_limited" };

export async function approvePairing(
  store: PairingStore,
  opts: { code: string; userId: string | null; label: string; now: number },
): Promise<ApproveResult> {
  if (!opts.userId) return { ok: false, error: "unauthenticated" };
  if (await rateLimited(store, `approve:${opts.userId}`, APPROVE_LIMIT, opts.now)) {
    return { ok: false, error: "rate_limited" };
  }
  const code = normalizeCode(opts.code);
  if (!code) return { ok: false, error: "invalid_code" };
  const rec = await store.findRequestByCodeHash(hashSecret(code));
  if (!rec) return { ok: false, error: "invalid_code" };
  if (rec.expiresAt <= opts.now) {
    if (rec.status === "pending") await store.updateRequestIfStatus(rec.id, "pending", { status: "expired" });
    return { ok: false, error: "expired" };
  }
  if (rec.status !== "pending") return { ok: false, error: "already_used" };
  const label = (opts.label ?? "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 40) || "Car browser";
  const won = await store.updateRequestIfStatus(rec.id, "pending", {
    status: "approved",
    userId: opts.userId,
    deviceLabel: label,
    approvedAt: opts.now,
  });
  return won ? { ok: true } : { ok: false, error: "already_used" };
}

export type ClaimResult =
  | { ok: true; status: "paired"; deviceId: string; deviceToken: string }
  | { ok: true; status: "pending"; expiresAt: number }
  | { ok: false; error: "not_found" | "expired" | "already_claimed" | "rate_limited" };

export async function claimPairing(
  store: PairingStore,
  opts: { requestId: string; pollSecret: string; clientKey: string; now: number },
): Promise<ClaimResult> {
  if (await rateLimited(store, `claim:${hashSecret(opts.clientKey)}`, CLAIM_LIMIT, opts.now)) {
    return { ok: false, error: "rate_limited" };
  }
  const rec = await store.findRequestById(opts.requestId);
  // Wrong poll secret is indistinguishable from an unknown request.
  if (!rec || typeof opts.pollSecret !== "string" || !safeEqualHex(rec.pollSecretHash, hashSecret(opts.pollSecret))) {
    return { ok: false, error: "not_found" };
  }
  if (rec.status === "claimed") return { ok: false, error: "already_claimed" };
  if (rec.status === "expired" || rec.expiresAt <= opts.now) {
    if (rec.status === "pending" || rec.status === "approved") {
      await store.updateRequestIfStatus(rec.id, rec.status, { status: "expired" });
    }
    return { ok: false, error: "expired" };
  }
  if (rec.status === "pending") return { ok: true, status: "pending", expiresAt: rec.expiresAt };

  // status === "approved": single winner via compare-and-set.
  const won = await store.updateRequestIfStatus(rec.id, "approved", { status: "claimed", claimedAt: opts.now });
  if (!won || !rec.userId) return { ok: false, error: "already_claimed" };

  const deviceToken = randomBytes(32).toString("base64url");
  const device: DeviceRecord = {
    id: randomUUID(),
    userId: rec.userId,
    label: rec.deviceLabel ?? "Car browser",
    tokenHash: hashSecret(deviceToken),
    scope: "dashboard",
    createdAt: opts.now,
    lastSeenAt: opts.now,
    revokedAt: null,
  };
  await store.insertDevice(device);
  return { ok: true, status: "paired", deviceId: device.id, deviceToken };
}

/** Resolves a device cookie to its owner. Revoked or unknown tokens return null. */
export async function authenticateDevice(store: PairingStore, token: string | undefined, now: number): Promise<DeviceRecord | null> {
  if (!token || token.length < 20 || token.length > 200) return null;
  const device = await store.findDeviceByTokenHash(hashSecret(token));
  if (!device || device.revokedAt !== null) return null;
  await store.touchDevice(device.id, now);
  return device;
}
