import "server-only";
import { sql } from "drizzle-orm";
import { db } from "./db";

/**
 * Fixed-window counter in Postgres. Returns true when the request is allowed.
 * One atomic upsert per call; safe across serverless instances.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const res = await db.execute<{ count: number }>(sql`
    INSERT INTO rate_limits (key, count, reset_at)
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.reset_at < now() THEN 1 ELSE rate_limits.count + 1 END,
      reset_at = CASE WHEN rate_limits.reset_at < now()
        THEN now() + make_interval(secs => ${windowSeconds}) ELSE rate_limits.reset_at END
    RETURNING count
  `);
  // occasional cleanup of expired rows
  if (Math.random() < 0.02) {
    await db.execute(sql`DELETE FROM rate_limits WHERE reset_at < now() - interval '1 day'`);
  }
  return Number(res.rows[0]?.count ?? 0) <= limit;
}
