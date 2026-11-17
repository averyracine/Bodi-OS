import Link from "next/link";
import { sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { SideNav, BottomNav } from "@/components/crm/Nav";
import { logout } from "../auth-actions";

export const dynamic = "force-dynamic";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(leads).where(sql`${leads.status} = 'new'`);
  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[15rem_1fr]">
      <aside className="hidden bg-ink p-5 text-white lg:flex lg:flex-col">
        <Link href="/crm" className="mb-8 px-3">
          <span className="block font-serif text-2xl">CV Capital</span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-white/50">Team CRM</span>
        </Link>
        <nav aria-label="CRM" className="flex-1"><SideNav badge={n} /></nav>
        <div className="border-t border-white/10 px-3 pt-4 text-sm">
          <p className="truncate text-white">{user.name}</p>
          <p className="truncate text-xs capitalize text-white/50">{user.role}</p>
          <form action={logout}><button className="mt-3 text-xs text-white/60 hover:text-white">Sign out</button></form>
          <Link href="/" className="mt-2 block text-xs text-white/40 hover:text-white">View website ↗</Link>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
        <Link href="/crm" className="font-serif text-xl">CV Capital</Link>
        <div className="flex items-center gap-1 text-sm">
          <Link href="/crm/projects" className="rounded-lg px-3 py-2 hover:bg-sand-50">Projects</Link>
          <Link href="/crm/settings" className="rounded-lg px-3 py-2 hover:bg-sand-50">Settings</Link>
        </div>
      </header>

      <main className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10 [&_.grid>*]:min-w-0">{children}</main>
      <BottomNav badge={n} />
    </div>
  );
}
