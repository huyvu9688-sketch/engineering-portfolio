"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError("Sign-in failed. Check your email and password.");
      return;
    }
    router.replace("/admin/documents");
    router.refresh();
  }

  return (
    <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 md:px-6">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
        Admin
      </p>
      <h1 className="mt-2 text-4xl font-semibold uppercase tracking-tighter md:text-5xl">
        Sign In
      </h1>
      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-lg border border-hairline bg-surface px-4 py-3 text-base outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            Password
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-lg border border-hairline bg-surface px-4 py-3 text-base outline-none focus:border-accent"
          />
        </label>
        {error && (
          <p className="font-mono text-xs uppercase tracking-widest text-state-error">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-ink px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-on-dark transition-colors hover:bg-accent disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </section>
  );
}
