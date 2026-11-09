import { beforeEach, describe, expect, it } from "vitest";
import { MemoryPairingStore } from "@/lib/pairing/memory-store";
import {
  approvePairing, authenticateDevice, claimPairing, normalizeCode, PAIRING_TTL_MS, START_LIMIT, startPairing,
} from "@/lib/pairing/service";

const T0 = 1_800_000_000_000;
let store: MemoryPairingStore;
beforeEach(() => {
  store = new MemoryPairingStore();
});

async function start(now = T0) {
  const r = await startPairing(store, { clientKey: "car-ip", now });
  if (!r.ok) throw new Error("start failed");
  return r;
}

describe("pairing", () => {
  it("never stores the code or poll secret in plaintext", async () => {
    const r = await start();
    const rec = store.requests.get(r.requestId)!;
    expect(JSON.stringify(rec)).not.toContain(r.code);
    expect(JSON.stringify(rec)).not.toContain(r.pollSecret);
    expect(normalizeCode(r.code)).toBe(r.code);
  });

  it("requires an authenticated phone to approve", async () => {
    const r = await start();
    expect(await approvePairing(store, { code: r.code, userId: null, label: "", now: T0 })).toEqual({ ok: false, error: "unauthenticated" });
  });

  it("completes the happy path and issues a working device token", async () => {
    const r = await start();
    expect((await claimPairing(store, { requestId: r.requestId, pollSecret: r.pollSecret, clientKey: "car-ip", now: T0 + 1 })).ok).toBe(true);
    expect(await approvePairing(store, { code: r.code.toLowerCase().replace("-", ""), userId: "user-1", label: "Model X", now: T0 + 1000 })).toEqual({ ok: true });
    const c = await claimPairing(store, { requestId: r.requestId, pollSecret: r.pollSecret, clientKey: "car-ip", now: T0 + 2000 });
    expect(c.ok && c.status === "paired").toBe(true);
    if (!c.ok || c.status !== "paired") return;
    const device = await authenticateDevice(store, c.deviceToken, T0 + 3000);
    expect(device?.userId).toBe("user-1");
    expect(device?.label).toBe("Model X");
  });

  it("rejects approval after expiry", async () => {
    const r = await start();
    expect(await approvePairing(store, { code: r.code, userId: "u", label: "", now: T0 + PAIRING_TTL_MS + 1 })).toEqual({ ok: false, error: "expired" });
    expect(store.requests.get(r.requestId)!.status).toBe("expired");
  });

  it("rejects claim after expiry even if approved", async () => {
    const r = await start();
    await approvePairing(store, { code: r.code, userId: "u", label: "", now: T0 + 10 });
    const c = await claimPairing(store, { requestId: r.requestId, pollSecret: r.pollSecret, clientKey: "k", now: T0 + PAIRING_TTL_MS });
    expect(c).toEqual({ ok: false, error: "expired" });
    expect(store.devices.size).toBe(0);
  });

  it("is single-use: a replayed approval or claim is refused", async () => {
    const r = await start();
    await approvePairing(store, { code: r.code, userId: "u1", label: "", now: T0 + 10 });
    expect(await approvePairing(store, { code: r.code, userId: "attacker", label: "", now: T0 + 20 })).toEqual({ ok: false, error: "already_used" });
    const first = await claimPairing(store, { requestId: r.requestId, pollSecret: r.pollSecret, clientKey: "k", now: T0 + 30 });
    const replay = await claimPairing(store, { requestId: r.requestId, pollSecret: r.pollSecret, clientKey: "k", now: T0 + 40 });
    expect(first.ok).toBe(true);
    expect(replay).toEqual({ ok: false, error: "already_claimed" });
    expect(store.devices.size).toBe(1);
  });

  it("refuses claims with a wrong poll secret", async () => {
    const r = await start();
    await approvePairing(store, { code: r.code, userId: "u1", label: "", now: T0 + 10 });
    expect(await claimPairing(store, { requestId: r.requestId, pollSecret: "guess", clientKey: "k", now: T0 + 20 })).toEqual({ ok: false, error: "not_found" });
  });

  it("rate limits pairing starts per client", async () => {
    for (let i = 0; i < START_LIMIT.max; i++) await start(T0 + i);
    expect(await startPairing(store, { clientKey: "car-ip", now: T0 + 100 })).toEqual({ ok: false, error: "rate_limited" });
    expect((await startPairing(store, { clientKey: "car-ip", now: T0 + START_LIMIT.windowMs + 100 })).ok).toBe(true);
  });

  it("rate limits approval guesses per user", async () => {
    for (let i = 0; i < 10; i++) await approvePairing(store, { code: "AAAA-AAAA", userId: "u", label: "", now: T0 + i });
    expect(await approvePairing(store, { code: "AAAA-AAAA", userId: "u", label: "", now: T0 + 20 })).toEqual({ ok: false, error: "rate_limited" });
  });

  it("revoked devices stop authenticating", async () => {
    const r = await start();
    await approvePairing(store, { code: r.code, userId: "u1", label: "", now: T0 + 10 });
    const c = await claimPairing(store, { requestId: r.requestId, pollSecret: r.pollSecret, clientKey: "k", now: T0 + 20 });
    if (!c.ok || c.status !== "paired") throw new Error("expected paired");
    store.revoke(c.deviceId, T0 + 30);
    expect(await authenticateDevice(store, c.deviceToken, T0 + 40)).toBeNull();
  });
});
