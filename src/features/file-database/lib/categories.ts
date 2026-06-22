import type { CategoryKey } from "./types.ts";

export interface CategoryDef {
  key: CategoryKey;
  label: string;
  /** lowercase, no leading dot */
  extensions: string[];
}

// Each extension belongs to exactly one category, so auto-detection from a
// picked file is always exact (no guessing which of several categories a
// shared extension like .pdf "really" means).
export const CATEGORIES: CategoryDef[] = [
  { key: "cad_3d", label: "3D Models", extensions: ["step", "stp", "iges", "igs", "sldprt", "x_t", "stl", "glb"] },
  { key: "drawing_2d", label: "2D Drawings", extensions: ["dwg", "dxf"] },
  { key: "pdf", label: "Documents", extensions: ["pdf", "docx"] },
  { key: "image", label: "Images", extensions: ["png", "jpg", "jpeg", "webp"] },
  { key: "ppt", label: "Presentations", extensions: ["ppt", "pptx"] },
  { key: "excel", label: "Spreadsheets", extensions: ["xlsx", "csv"] },
];

export const CATEGORY_KEYS: CategoryKey[] = CATEGORIES.map((c) => c.key);

export const MAX_FILE_BYTES = 50 * 1024 * 1024;

/**
 * Cap on stored extracted PDF text. Keeps the metadata POST under Vercel's
 * ~4.5 MB body limit and well below Postgres's ~1 MB tsvector ceiling, while
 * still indexing far more than any real datasheet needs.
 */
export const MAX_CONTENT_TEXT_CHARS = 500_000;

/** Extensions we can pull searchable body text from at upload time. */
const TEXT_EXTRACTABLE_EXTENSIONS = new Set(["pdf"]);

export function isTextExtractable(ext: string): boolean {
  return TEXT_EXTRACTABLE_EXTENSIONS.has(ext.toLowerCase());
}

export function getCategory(key: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.key === key);
}

export function isAcceptedExtension(category: CategoryKey, ext: string): boolean {
  const def = getCategory(category);
  if (!def) return false;
  return def.extensions.includes(ext.toLowerCase());
}

/** Value for an <input type="file" accept="..."> attribute. */
export function acceptAttribute(category: CategoryKey): string {
  const def = getCategory(category);
  if (!def) return "";
  return def.extensions.map((e) => `.${e}`).join(",");
}

/**
 * Category whose allowlist includes this extension, or null if none.
 * Used to auto-select a category when a file is picked. Deterministic since
 * no extension appears in more than one category.
 */
export function firstCategoryForExtension(ext: string): CategoryKey | null {
  const lower = ext.toLowerCase();
  const def = CATEGORIES.find((c) => c.extensions.includes(lower));
  return def ? def.key : null;
}
