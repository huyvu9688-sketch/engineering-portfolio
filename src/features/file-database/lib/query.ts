/**
 * Turn raw search-box text into a clean term for Postgres websearch, or null
 * when there's nothing to search. The browser passes the result straight to
 * `.textSearch("search", term, { type: "websearch" })`.
 */
export function normalizeSearchTerm(raw: string): string | null {
  const t = raw.trim().replace(/\s+/g, " ");
  return t.length ? t : null;
}
