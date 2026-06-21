"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SearchBox } from "./search-box";
import { FilterBar } from "./filter-bar";
import { DocumentCard } from "./document-card";
import { normalizeSearchTerm } from "@/features/file-database/lib/query";
import type { CategoryKey, DocumentRecord, Project } from "@/features/file-database/lib/types";

const BUCKET = "documents";

export function DocumentBrowser({
  initialDocuments,
  projects,
}: {
  initialDocuments: DocumentRecord[];
  projects: Project[];
}) {
  const [docs, setDocs] = useState<DocumentRecord[]>(initialDocuments);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Public download URL for a stored object (bucket is public-read).
  function publicUrl(path: string): string {
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      let q = supabase.from("documents").select("*").order("created_at", { ascending: false });
      const term = normalizeSearchTerm(query);
      if (term) q = q.textSearch("search", term, { type: "websearch" });
      if (category) q = q.eq("category", category);
      if (projectId) q = q.eq("project_id", projectId);
      const { data } = await q;
      if (data) setDocs(data as DocumentRecord[]);
    }, 250);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, category, projectId, supabase]);

  return (
    <div className="mt-10 space-y-6">
      <SearchBox value={query} onChange={setQuery} />
      <FilterBar
        category={category}
        projectId={projectId}
        projects={projects}
        onCategory={setCategory}
        onProject={setProjectId}
      />

      <p className="font-mono text-[10px] uppercase tracking-widest tabular-nums text-ink-faint">
        {docs.length} {docs.length === 1 ? "result" : "results"}
      </p>

      {docs.length === 0 ? (
        <p className="py-16 text-center font-mono text-xs uppercase tracking-widest text-ink-faint">
          No documents match your filters.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => (
            <DocumentCard key={d.id} doc={d} downloadUrl={publicUrl(d.storage_path)} />
          ))}
        </div>
      )}
    </div>
  );
}
