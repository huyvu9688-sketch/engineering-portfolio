"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/admin");
    router.refresh();
  }
  return (
    <button
      onClick={signOut}
      className="rounded-full border border-hairline px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-muted transition-colors hover:border-accent hover:text-accent"
    >
      Sign Out
    </button>
  );
}
