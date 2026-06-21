import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminGuardResult =
  | { ok: true; supabase: SupabaseClient; userId: string }
  | { ok: false; error: string; status: 401 | 403 };

/** Verify the caller is the admin. Use at the top of every write route. */
export async function requireAdmin(): Promise<AdminGuardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated.", status: 401 };

  const { data: admin } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) return { ok: false, error: "Forbidden.", status: 403 };

  return { ok: true, supabase, userId: user.id };
}
