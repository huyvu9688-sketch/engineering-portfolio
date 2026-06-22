"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SearchBox } from "./search-box";
import { FilterBar } from "./filter-bar";
import { DocumentCard } from "./document-card";
import { UploadForm } from "./upload-form";
import { SignOutButton } from "./sign-out-button";
import { normalizeSearchTerm, DOCUMENT_LIST_COLUMNS } from "@/features/file-database/lib/query";
import type { CategoryKey, DocumentRecord } from "@/features/file-database/lib/types";

const BUCKET = "documents";

export function DocumentBrowser({
  initialDocuments,
  isAdmin,
}: {
  initialDocuments: DocumentRecord[];
  isAdmin: boolean;
}) {
  const [docs, setDocs] = useState<DocumentRecord[]>(initialDocuments);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  // Public download URL for a stored object (bucket is public-read).
  function publicUrl(path: string): string {
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  const runQuery = useCallback(async () => {
    let q = supabase
      .from("documents")
      .select(DOCUMENT_LIST_COLUMNS)
      .order("created_at", { ascending: false });
    const term = normalizeSearchTerm(query);
    if (term) q = q.textSearch("search", term, { type: "websearch" });
    if (category) q = q.eq("category", category);
    const { data, error: queryError } = await q;
    if (queryError) {
      setError("Search failed — please try again.");
      return;
    }
    setError(null);
    if (data) setDocs(data as DocumentRecord[]);
  }, [supabase, query, category]);

  useEffect(() => {
    const t = setTimeout(runQuery, 250);
    return () => clearTimeout(t);
  }, [runQuery]);

  async function onDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This removes the file and its record.`)) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Delete failed." }));
      setError(body.error ?? "Delete failed.");
      return;
    }
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="mt-10 space-y-6">
      {isAdmin && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
              Admin — add to library
            </p>
            <SignOutButton />
          </div>
          <UploadForm onUploaded={runQuery} />
        </section>
      )}

      <SearchBox value={query} onChange={setQuery} />
      <FilterBar category={category} onCategory={setCategory} />

      <p className="font-mono text-[10px] uppercase tracking-widest tabular-nums text-ink-faint">
        {docs.length} {docs.length === 1 ? "result" : "results"}
      </p>

      {error && (
        <p className="font-mono text-xs uppercase tracking-widest text-state-error">{error}</p>
      )}

      {docs.length === 0 ? (
        <p className="py-16 text-center font-mono text-xs uppercase tracking-widest text-ink-faint">
          No documents match your filters.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => (
            <DocumentCard
              key={d.id}
              doc={d}
              downloadUrl={publicUrl(d.storage_path)}
              onDelete={isAdmin ? () => onDelete(d.id, d.title) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
