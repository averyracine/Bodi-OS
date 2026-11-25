import "server-only";
import { clientIp, hashIp } from "./request";
import { rateLimit } from "./rate-limit";

export const HONEYPOT_FIELD = "company_website";

/**
 * Bot and abuse checks for public forms.
 * - honeypot: hidden field humans never fill
 * - timing: submissions faster than 3s after the form rendered are bots
 * - rate limit: 5 submissions per IP per 10 minutes, 20 per day
 * Returns { ok: false, silent: true } for bots so they get a fake success.
 */
export async function checkSubmission(opts: { honeypot?: string | null; startedAt?: string | null; bucket: string }) {
  const ipHash = hashIp(await clientIp());
  if (opts.honeypot) return { ok: false as const, silent: true, ipHash };
  const started = Number(opts.startedAt);
  if (Number.isFinite(started) && started > 0 && Date.now() - started < 3000) {
    return { ok: false as const, silent: true, ipHash };
  }
  const short = await rateLimit(`${opts.bucket}:10m:${ipHash}`, 5, 600);
  const daily = await rateLimit(`${opts.bucket}:1d:${ipHash}`, 20, 86400);
  if (!short || !daily) return { ok: false as const, silent: false, ipHash, status: 429 };
  return { ok: true as const, ipHash };
}
