"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, MAX_FILE_BYTES, acceptAttribute, isAcceptedExtension } from "@/features/file-database/lib/categories";
import { fileExtension, sanitizeFilename, formatFileSize } from "@/features/file-database/lib/format";
import type { CategoryKey, DocumentInput, Project } from "@/features/file-database/lib/types";

export function UploadForm({ projects, onUploaded }: { projects: Project[]; onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryKey>("cad_3d");
  const [description, setDescription] = useState("");
  const [tagText, setTagText] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function onPickFile(f: File | null) {
    setFile(f);
    setError(null);
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) return setError("Choose a file first.");
    if (file.size > MAX_FILE_BYTES) return setError(`File exceeds ${formatFileSize(MAX_FILE_BYTES)}.`);
    const ext = fileExtension(file.name);
    if (!ext) return setError("File has no extension.");
    if (!isAcceptedExtension(category, ext)) {
      return setError(`.${ext} is not allowed for ${category}. Pick the right category.`);
    }
    if (!title.trim()) return setError("Title is required.");

    setBusy(true);
    const supabase = createClient();
    const id = crypto.randomUUID();
    const storagePath = `${id}/${sanitizeFilename(file.name)}`;

    // 1) Upload the binary straight to Storage (bypasses Vercel's body cap).
    const up = await supabase.storage.from("documents").upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (up.error) {
      setBusy(false);
      return setError(`Upload failed: ${up.error.message}`);
    }

    // 2) POST metadata to the admin-guarded API.
    const payload: DocumentInput = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      file_ext: ext,
      mime_type: file.type || null,
      size_bytes: file.size,
      tags: tagText.split(",").map((t) => t.trim()).filter(Boolean),
      project_id: projectId || null,
      storage_path: storagePath,
      original_filename: file.name,
    };
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);

    if (!res.ok) {
      // 3) Roll back the orphaned object so Storage and DB stay consistent.
      await supabase.storage.from("documents").remove([storagePath]);
      const body = await res.json().catch(() => ({ error: "Save failed." }));
      return setError(body.error ?? "Save failed.");
    }

    // Reset and notify parent to refresh the list.
    setFile(null);
    setTitle("");
    setDescription("");
    setTagText("");
    setProjectId("");
    onUploaded();
  }

  const labelCls = "font-mono text-[10px] uppercase tracking-widest text-ink-muted";
  const inputCls = "mt-2 w-full rounded-lg border border-hairline bg-surface px-4 py-3 text-base outline-none focus:border-accent";

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-hairline bg-surface p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className={labelCls}>File (max {formatFileSize(MAX_FILE_BYTES)})</span>
          <input
            type="file"
            accept={acceptAttribute(category)}
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            className={inputCls}
          />
          {file && (
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-widest text-ink-faint">
              {file.name} · {formatFileSize(file.size)}
            </span>
          )}
        </label>

        <label className="block">
          <span className={labelCls}>Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </label>

        <label className="block">
          <span className={labelCls}>Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryKey)}
            className={inputCls}
          >
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelCls}>Project (optional)</span>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
            <option value="">— None —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelCls}>Tags (comma-separated)</span>
          <input value={tagText} onChange={(e) => setTagText(e.target.value)} className={inputCls} />
        </label>

        <label className="block md:col-span-2">
          <span className={labelCls}>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputCls}
          />
        </label>
      </div>

      {error && (
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-state-error">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 rounded-full bg-ink px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-on-dark transition-colors hover:bg-accent disabled:opacity-50"
      >
        {busy ? "Uploading…" : "Upload Document"}
      </button>
    </form>
  );
}
