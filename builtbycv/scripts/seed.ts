/**
 * Seeds pipeline stages and the first admin user (from ADMIN_EMAIL / ADMIN_PASSWORD).
 * Safe to run more than once: it only creates what's missing.
 *   npm run db:seed
 * Reset a password:  npm run db:seed -- --reset-password
 */
import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

loadEnvConfig(process.cwd());

const STAGES: [string, string][] = [
  ["New lead", "open"], ["Contacted", "open"], ["Consultation booked", "open"], ["Estimate sent", "open"],
  ["Won", "won"], ["In progress", "active"], ["Complete", "done"], ["Lost", "lost"],
];

async function main() {
  const url = process.env.DATABASE_URL!;
  const local = /localhost|127\.0\.0\.1/.test(url);
  const pool = new Pool({ connectionString: url, ssl: local ? undefined : { rejectUnauthorized: true } });

  const { rows: s } = await pool.query("select count(*)::int as n from pipeline_stages");
  if (s[0].n === 0) {
    for (const [i, [name, kind]] of STAGES.entries()) {
      await pool.query("insert into pipeline_stages (name, kind, position) values ($1,$2,$3)", [name, kind, i]);
    }
    console.log("Created default pipeline stages.");
  }

  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD");
  if (password.length < 10 && process.env.NODE_ENV === "production") throw new Error("ADMIN_PASSWORD must be 10+ characters");
  const hash = await bcrypt.hash(password, 12);
  const { rows: u } = await pool.query("select id from users where email = $1", [email]);
  if (!u[0]) {
    await pool.query("insert into users (email, name, password_hash, role) values ($1,$2,$3,'admin')", [email, process.env.ADMIN_NAME ?? "Owner", hash]);
    console.log(`Created admin ${email}.`);
  } else if (process.argv.includes("--reset-password")) {
    await pool.query("update users set password_hash = $1 where email = $2", [hash, email]);
    console.log(`Password reset for ${email}.`);
  } else {
    console.log(`Admin ${email} already exists.`);
  }
  await pool.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
