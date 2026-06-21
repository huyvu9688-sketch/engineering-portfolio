import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/features/file-database/components/sign-out-button";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin");

  const { data: admin } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) redirect("/admin");

  return (
    <div className="mx-auto max-w-[1800px] px-4 pb-24 pt-32 md:px-6">
      <header className="flex items-center justify-between border-b border-hairline pb-6">
        <nav className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest">
          <Link href="/admin/documents" className="transition-colors hover:text-accent">
            Documents
          </Link>
          <Link href="/admin/projects" className="transition-colors hover:text-accent">
            Projects
          </Link>
        </nav>
        <SignOutButton />
      </header>
      <main className="mt-10">{children}</main>
    </div>
  );
}
