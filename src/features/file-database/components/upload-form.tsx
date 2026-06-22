"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, MAX_FILE_BYTES, isAcceptedExtension, firstCategoryForExtension, isTextExtractable } from "@/features/file-database/lib/categories";
import { fileExtension, sanitizeFilename, formatFileSize } from "@/features/file-database/lib/format";
import { extractPdfText } from "@/features/file-database/lib/pdf-text";
import type { CategoryKey, DocumentInput } from "@/features/file-database/lib/types";

export function UploadForm({ onUploaded }: { onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryKey>("cad_3d");
  const [description, setDescription] = useState("");
  const [tagText, setTagText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Click-picker accepts every known extension; auto-categorization handles sorting.
  const acceptAll = useMemo(
    () => Array.from(new Set(CATEGORIES.flatMap((c) => c.extensions))).map((e) => `.${e}`).join(","),
    [],
  );

  function onPickFile(f: File | null) {
    setFile(f);
    setError(null);
    if (!f) return;
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
    // Auto-detect category from extension; only override when the current
    // category can't accept the file (keeps a deliberate pdf/docx choice).
    const ext = fileExtension(f.name);
    if (ext && !isAcceptedExtension(category, ext)) {
      const match = firstCategoryForExtension(ext);
      if (match) setCategory(match);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) return setError("Choose or drop a file first.");
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
    setStatus("Uploading file…");
    const up = await supabase.storage.from("documents").upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (up.error) {
      setBusy(false);
      setStatus(null);
      return setError(`Upload failed: ${up.error.message}`);
    }

    // 2) For PDFs, pull the body text in-browser (the bytes are already here)
    //    so the search box can match words inside the document. Best-effort:
    //    a failure just leaves the file un-indexed, never blocks the upload.
    let contentText: string | null = null;
    if (isTextExtractable(ext)) {
      setStatus("Indexing PDF text…");
      contentText = await extractPdfText(file);
    }

    // 3) POST metadata to the admin-guarded API.
    setStatus("Saving…");
    const payload: DocumentInput = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      file_ext: ext,
      mime_type: file.type || null,
      size_bytes: file.size,
      tags: tagText.split(",").map((t) => t.trim()).filter(Boolean),
      project_id: null,
      storage_path: storagePath,
      original_filename: file.name,
      content_text: contentText,
    };
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    setStatus(null);

    if (!res.ok) {
      // 4) Roll back the orphaned object so Storage and DB stay consistent.
      await supabase.storage.from("documents").remove([storagePath]);
      const body = await res.json().catch(() => ({ error: "Save failed." }));
      return setError(body.error ?? "Save failed.");
    }

    // Reset and notify parent to refresh the list.
    setFile(null);
    setTitle("");
    setDescription("");
    setTagText("");
    onUploaded();
  }

  const labelCls = "font-mono text-[10px] uppercase tracking-widest text-ink-muted";
  const inputCls = "mt-2 w-full rounded-lg border border-hairline bg-surface px-4 py-3 text-base outline-none focus:border-accent";

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-hairline bg-surface p-6">
      {/* Drag-and-drop zone (also click-to-browse via the hidden input). */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onPickFile(e.dataTransfer.files?.[0] ?? null);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center transition-colors ${
          dragOver ? "border-accent bg-canvas" : "border-hairline hover:border-accent"
        }`}
      >
        <input
          type="file"
          accept={acceptAll}
          onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        {file ? (
          <>
            <p className="font-mono text-xs uppercase tracking-widest text-ink">{file.name}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
              {formatFileSize(file.size)} · click or drop to replace
            </p>
            {isTextExtractable(fileExtension(file.name)) && (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-accent">
                Contents will be indexed for search
              </p>
            )}
          </>
        ) : (
          <>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
              Drag &amp; drop a file here
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
              or click to browse · max {formatFileSize(MAX_FILE_BYTES)}
            </p>
          </>
        )}
      </label>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className={labelCls}>Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </label>

        <label className="block">
          <span className={labelCls}>Category (auto-detected)</span>
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

        <label className="block md:col-span-2">
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
        {busy ? (status ?? "Working…") : "Upload Document"}
      </button>
    </form>
  );
}
