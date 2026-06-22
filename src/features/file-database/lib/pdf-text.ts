import { MAX_CONTENT_TEXT_CHARS } from "./categories.ts";

/**
 * Collapse the whitespace soup that PDF extraction produces into single-spaced
 * text, then cap it. Pure so it can be unit-tested without a real PDF.
 * Returns null when there's nothing usable to index.
 */
export function normalizeExtractedText(
  raw: unknown,
  cap: number = MAX_CONTENT_TEXT_CHARS,
): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  return cleaned.length > cap ? cleaned.slice(0, cap) : cleaned;
}

/**
 * Extract searchable body text from a PDF in the browser. `unpdf` is loaded
 * lazily so its pdf.js payload never enters the main bundle — only admins who
 * upload a PDF pay for it. Extraction is best-effort: any failure resolves to
 * null so the upload still proceeds (the file is simply not content-indexed).
 */
export async function extractPdfText(file: File): Promise<string | null> {
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return normalizeExtractedText(text);
  } catch (err) {
    console.error("PDF text extraction failed:", err);
    return null;
  }
}
