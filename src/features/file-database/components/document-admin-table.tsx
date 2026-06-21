"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UploadForm } from "./upload-form";
import { getCategory } from "@/features/file-database/lib/categories";
import { formatFileSize } from "@/features/file-database/lib/format";
import type { DocumentRecord, Project } from "@/features/file-database/lib/types";

export function DocumentAdminTable({ initialProjects }: { initialProjects: Project[] }) {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setDocs(data as DocumentRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
    <div className="space-y-10">
      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
          Upload New
        </h2>
        <div className="mt-3">
          <UploadForm projects={initialProjects} onUploaded={load} />
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between border-b border-hairline pb-3">
          <h2 className="text-2xl font-semibold uppercase tracking-tighter">Documents</h2>
          <span className="font-mono text-[10px] uppercase tracking-widest tabular-nums text-ink-faint">
            {docs.length} total
          </span>
        </div>

        {error && (
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-state-error">{error}</p>
        )}
        {loading ? (
          <p className="mt-6 font-mono text-xs uppercase tracking-widest text-ink-faint">Loading…</p>
        ) : (
          <ul className="mt-2 divide-y divide-hairline">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="truncate text-base font-medium">{d.title}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                    {getCategory(d.category)?.label} · .{d.file_ext} · {formatFileSize(d.size_bytes)}
                  </p>
                </div>
                <button
                  onClick={() => onDelete(d.id, d.title)}
                  className="shrink-0 rounded-full border border-hairline px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-muted transition-colors hover:border-state-error hover:text-state-error"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
