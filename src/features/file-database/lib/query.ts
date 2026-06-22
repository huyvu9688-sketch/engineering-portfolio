/**
 * Columns selected for listing/browsing. Explicit so we never ship the heavy
 * `content_text` body or the `search` tsvector to the client — those exist only
 * to be matched by `.textSearch(...)` server-side.
 */
export const DOCUMENT_LIST_COLUMNS =
  "id,title,description,category,file_ext,mime_type,size_bytes,tags,project_id,storage_path,original_filename,created_at,updated_at";

/**
 * Turn raw search-box text into a clean term for Postgres websearch, or null
 * when there's nothing to search. The browser passes the result straight to
 * `.textSearch("search", term, { type: "websearch" })`.
 */
export function normalizeSearchTerm(raw: string): string | null {
  const t = raw.trim().replace(/\s+/g, " ");
  return t.length ? t : null;
}
