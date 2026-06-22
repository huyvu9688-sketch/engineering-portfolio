import type { CategoryKey } from "./types.ts";

export interface CategoryDef {
  key: CategoryKey;
  label: string;
  /** lowercase, no leading dot */
  extensions: string[];
}

// Each extension belongs to exactly one category, so auto-detection from a
// picked file is always exact (no guessing which of several categories a
// shared extension "really" means).
export const CATEGORIES: CategoryDef[] = [
  { key: "cad", label: "CAD", extensions: ["step", "stp", "iges", "igs", "dwg", "dxf", "sat", "sldprt", "sldasm", "slddrw", "ipt", "iam", "prt", "asm", "x_t"] },
  { key: "model_3d", label: "3D Model", extensions: ["glb", "gltf", "obj", "fbx", "stl", "3ds"] },
  { key: "pdf", label: "PDF", extensions: ["pdf"] },
  { key: "word", label: "Word", extensions: ["doc", "docx"] },
  { key: "excel", label: "Excel", extensions: ["xls", "xlsx"] },
  { key: "csv", label: "CSV", extensions: ["csv"] },
  { key: "ppt", label: "PowerPoint", extensions: ["ppt", "pptx"] },
  { key: "image", label: "Image", extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "tiff", "tif"] },
  { key: "text", label: "Text", extensions: ["txt"] },
  { key: "archive", label: "Archive", extensions: ["zip", "rar", "7z", "tar", "gz"] },
  { key: "video", label: "Video", extensions: ["mp4", "avi", "mov", "wmv", "mkv", "webm"] },
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
