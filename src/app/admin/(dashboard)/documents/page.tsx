import { createClient } from "@/lib/supabase/server";
import { DocumentAdminTable } from "@/features/file-database/components/document-admin-table";
import type { Project } from "@/features/file-database/lib/types";

export default async function AdminDocumentsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("*").order("name");
  return <DocumentAdminTable initialProjects={(data ?? []) as Project[]} />;
}
