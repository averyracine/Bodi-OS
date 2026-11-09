import { Suspense } from "react";
import { SimplePage } from "@/components/SimplePage";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in · Command Center" };

export default function LoginPage() {
  return (
    <SimplePage>
      <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="text-muted mt-2">We&rsquo;ll email you a one-time sign-in link. Best done on your phone.</p>
      <Suspense fallback={<div className="skeleton h-40 mt-6" />}>
        <LoginForm />
      </Suspense>
    </SimplePage>
  );
}
