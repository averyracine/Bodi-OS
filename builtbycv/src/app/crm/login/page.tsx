import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/crm");
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <p className="text-center font-serif text-3xl">CV Capital</p>
        <p className="mt-1 text-center text-xs uppercase tracking-[0.25em] text-muted">Team CRM</p>
        <LoginForm />
      </div>
    </main>
  );
}
