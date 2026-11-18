"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, hashIp } from "@/lib/request";

const DUMMY_HASH = "$2b$12$WiVpTRUQ7NhG5Rxp3zIV3e/SPQKK.BW0I4o5D0PfkScEDLDAlm3nW";

export async function login(_prev: { error?: string; email?: string } | undefined, form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const ip = hashIp(await clientIp());
  if (!(await rateLimit(`login:${ip}`, 10, 900)) || !(await rateLimit(`login-user:${email}`, 10, 900))) {
    return { error: "Too many attempts. Try again in 15 minutes.", email };
  }
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  // compare even when the user doesn't exist, to keep timing similar
  const ok = await verifyPassword(password, u?.passwordHash ?? DUMMY_HASH);
  if (!u || !ok || !u.active) return { error: "Email or password is incorrect.", email };
  await createSession(u.id);
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/crm") ? next : "/crm");
}

export async function logout() {
  await destroySession();
  redirect("/crm/login");
}
