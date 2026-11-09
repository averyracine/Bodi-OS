import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DeviceRecord, PairingRequestRecord, PairingStore } from "./service";

const iso = (ms: number | null) => (ms === null ? null : new Date(ms).toISOString());
const ms = (v: string | null) => (v === null ? null : Date.parse(v));

type ReqRow = {
  id: string; code_hash: string; poll_secret_hash: string; status: PairingRequestRecord["status"];
  user_id: string | null; device_label: string | null; created_at: string; expires_at: string;
  approved_at: string | null; claimed_at: string | null;
};
type DevRow = {
  id: string; user_id: string; label: string; token_hash: string; scope: "dashboard";
  created_at: string; last_seen_at: string | null; revoked_at: string | null;
};

const fromReq = (r: ReqRow): PairingRequestRecord => ({
  id: r.id, codeHash: r.code_hash, pollSecretHash: r.poll_secret_hash, status: r.status,
  userId: r.user_id, deviceLabel: r.device_label, createdAt: Date.parse(r.created_at),
  expiresAt: Date.parse(r.expires_at), approvedAt: ms(r.approved_at), claimedAt: ms(r.claimed_at),
});
const fromDev = (d: DevRow): DeviceRecord => ({
  id: d.id, userId: d.user_id, label: d.label, tokenHash: d.token_hash, scope: d.scope,
  createdAt: Date.parse(d.created_at), lastSeenAt: ms(d.last_seen_at), revokedAt: ms(d.revoked_at),
});

function patchToRow(p: Partial<PairingRequestRecord>) {
  const row: Record<string, unknown> = {};
  if (p.status !== undefined) row.status = p.status;
  if (p.userId !== undefined) row.user_id = p.userId;
  if (p.deviceLabel !== undefined) row.device_label = p.deviceLabel;
  if (p.approvedAt !== undefined) row.approved_at = iso(p.approvedAt);
  if (p.claimedAt !== undefined) row.claimed_at = iso(p.claimedAt);
  return row;
}

export function supabasePairingStore(db: SupabaseClient): PairingStore {
  return {
    async countHits(bucket, sinceMs) {
      const { count, error } = await db
        .from("rate_limit_hits")
        .select("*", { count: "exact", head: true })
        .eq("bucket", bucket)
        .gt("created_at", new Date(sinceMs).toISOString());
      if (error) throw error;
      return count ?? 0;
    },
    async addHit(bucket, at) {
      const { error } = await db.from("rate_limit_hits").insert({ bucket, created_at: iso(at) });
      if (error) throw error;
    },
    async insertRequest(r) {
      const { error } = await db.from("pairing_requests").insert({
        id: r.id, code_hash: r.codeHash, poll_secret_hash: r.pollSecretHash, status: r.status,
        created_at: iso(r.createdAt), expires_at: iso(r.expiresAt),
      });
      if (error) throw error;
    },
    async findRequestByCodeHash(codeHash) {
      const { data, error } = await db.from("pairing_requests").select("*").eq("code_hash", codeHash).maybeSingle();
      if (error) throw error;
      return data ? fromReq(data as ReqRow) : null;
    },
    async findRequestById(id) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
      const { data, error } = await db.from("pairing_requests").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? fromReq(data as ReqRow) : null;
    },
    async updateRequestIfStatus(id, expected, patch) {
      const { data, error } = await db
        .from("pairing_requests")
        .update(patchToRow(patch))
        .eq("id", id)
        .eq("status", expected)
        .select("id");
      if (error) throw error;
      return (data?.length ?? 0) === 1;
    },
    async insertDevice(d) {
      const { error } = await db.from("devices").insert({
        id: d.id, user_id: d.userId, label: d.label, token_hash: d.tokenHash, scope: d.scope,
        created_at: iso(d.createdAt), last_seen_at: iso(d.lastSeenAt),
      });
      if (error) throw error;
    },
    async findDeviceByTokenHash(tokenHash) {
      const { data, error } = await db.from("devices").select("*").eq("token_hash", tokenHash).maybeSingle();
      if (error) throw error;
      return data ? fromDev(data as DevRow) : null;
    },
    async touchDevice(id, at) {
      await db.from("devices").update({ last_seen_at: iso(at) }).eq("id", id);
    },
  };
}
