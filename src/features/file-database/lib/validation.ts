import type { CategoryKey, DocumentInput, ProjectInput } from "./types.ts";
import { CATEGORY_KEYS, MAX_FILE_BYTES, isAcceptedExtension } from "./categories.ts";
import { normalizeExtractedText } from "./pdf-text.ts";

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function cleanString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function normalizeTags(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  for (const raw of v) {
    if (typeof raw !== "string") continue;
    const t = raw.trim().toLowerCase();
    if (t) seen.add(t);
  }
  return [...seen];
}

export function validateDocumentInput(raw: unknown): Validated<DocumentInput> {
  if (!isObject(raw)) return { ok: false, error: "Invalid payload." };

  const title = cleanString(raw.title);
  if (!title) return { ok: false, error: "Title is required." };

  const category = raw.category;
  if (typeof category !== "string" || !CATEGORY_KEYS.includes(category as CategoryKey)) {
    return { ok: false, error: "Unknown category." };
  }

  const file_ext = cleanString(raw.file_ext)?.toLowerCase() ?? null;
  if (!file_ext) return { ok: false, error: "File extension is required." };
  if (!isAcceptedExtension(category as CategoryKey, file_ext)) {
    return { ok: false, error: `.${file_ext} is not allowed for this category.` };
  }

  const size_bytes = raw.size_bytes;
  if (typeof size_bytes !== "number" || !Number.isFinite(size_bytes) || size_bytes <= 0) {
    return { ok: false, error: "File size is invalid." };
  }
  if (size_bytes > MAX_FILE_BYTES) {
    return { ok: false, error: "File exceeds the 50 MB limit." };
  }

  const storage_path = cleanString(raw.storage_path);
  if (!storage_path) return { ok: false, error: "Storage path is required." };

  const original_filename = cleanString(raw.original_filename);
  if (!original_filename) return { ok: false, error: "Original filename is required." };

  const project_id =
    raw.project_id === null || raw.project_id === undefined
      ? null
      : typeof raw.project_id === "string" && raw.project_id.trim()
        ? raw.project_id.trim()
        : null;

  return {
    ok: true,
    value: {
      title,
      description: cleanString(raw.description),
      category: category as CategoryKey,
      file_ext,
      mime_type: cleanString(raw.mime_type),
      size_bytes: Math.round(size_bytes),
      tags: normalizeTags(raw.tags),
      project_id,
      storage_path,
      original_filename,
      // Extracted PDF body text (client-supplied); re-normalized and capped
      // here. Absent/empty for non-PDFs and for PDFs we couldn't read.
      content_text: normalizeExtractedText(raw.content_text),
    },
  };
}

export function validateProjectInput(raw: unknown): Validated<ProjectInput> {
  if (!isObject(raw)) return { ok: false, error: "Invalid payload." };
  const name = cleanString(raw.name);
  if (!name) return { ok: false, error: "Project name is required." };
  const slug = cleanString(raw.slug);
  if (!slug) return { ok: false, error: "Project slug is required." };
  return { ok: true, value: { name, slug, description: cleanString(raw.description) } };
}
