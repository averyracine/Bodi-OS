import type { DeviceRecord, PairingRequestRecord, PairingStatus, PairingStore } from "./service";

/** In-memory store used by unit tests. Not used at runtime. */
export class MemoryPairingStore implements PairingStore {
  hits: { bucket: string; at: number }[] = [];
  requests = new Map<string, PairingRequestRecord>();
  devices = new Map<string, DeviceRecord>();

  async countHits(bucket: string, sinceMs: number) {
    return this.hits.filter((h) => h.bucket === bucket && h.at > sinceMs).length;
  }
  async addHit(bucket: string, at: number) {
    this.hits.push({ bucket, at });
  }
  async insertRequest(r: PairingRequestRecord) {
    this.requests.set(r.id, { ...r });
  }
  async findRequestByCodeHash(codeHash: string) {
    for (const r of this.requests.values()) if (r.codeHash === codeHash) return { ...r };
    return null;
  }
  async findRequestById(id: string) {
    const r = this.requests.get(id);
    return r ? { ...r } : null;
  }
  async updateRequestIfStatus(id: string, expected: PairingStatus, patch: Partial<PairingRequestRecord>) {
    const r = this.requests.get(id);
    if (!r || r.status !== expected) return false;
    this.requests.set(id, { ...r, ...patch });
    return true;
  }
  async insertDevice(d: DeviceRecord) {
    this.devices.set(d.id, { ...d });
  }
  async findDeviceByTokenHash(tokenHash: string) {
    for (const d of this.devices.values()) if (d.tokenHash === tokenHash) return { ...d };
    return null;
  }
  async touchDevice(id: string, at: number) {
    const d = this.devices.get(id);
    if (d) d.lastSeenAt = at;
  }
  revoke(id: string, at: number) {
    const d = this.devices.get(id);
    if (d) d.revokedAt = at;
  }
}
