import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DocumentBrowser } from "@/features/file-database/components/document-browser";
import { CATEGORIES } from "@/features/file-database/lib/categories";
import type { DocumentRecord } from "@/features/file-database/lib/types";

export const metadata: Metadata = {
  title: "Database — Joseph Vu",
};

// Always fetch fresh counts/listing and the current session on request.
export const dynamic = "force-dynamic";

export default async function DatabasePage() {
  const supabase = await createClient();

  // Is the current visitor the signed-in admin? (Drives the upload + delete UI.)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: admin } = await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    isAdmin = Boolean(admin);
  }

  const { data: docs } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  const documents = (docs ?? []) as DocumentRecord[];
  const categoryCount = new Set(documents.map((d) => d.category)).size;

  return (
    <section className="mx-auto max-w-[1800px] px-4 pb-24 pt-40 md:px-6">
      <div className="flex items-end justify-between border-b border-hairline pb-6">
        <h1 className="text-4xl font-semibold uppercase tracking-tighter md:text-7xl">
          Database
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest tabular-nums text-ink-faint">
          {String(documents.length).padStart(2, "0")} Files
          <span className="text-hairline-dark"> · </span>
          {String(categoryCount).padStart(2, "0")} / {CATEGORIES.length} Categories
        </p>
      </div>

      <p className="mt-8 max-w-xl text-base leading-relaxed text-ink-muted md:text-lg">
        A downloadable library of 3D CAD models, drawings, datasheets, standards,
        and calculation reports. Search by name or tag, filter by category, and
        download any file directly.
      </p>

      <DocumentBrowser initialDocuments={documents} isAdmin={isAdmin} />
    </section>
  );
}
