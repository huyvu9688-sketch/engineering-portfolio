export type CategoryKey =
  | "cad_3d"
  | "drawing_2d"
  | "datasheet"
  | "standard"
  | "report"
  | "image";

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  description: string | null;
  category: CategoryKey;
  file_ext: string;
  mime_type: string | null;
  size_bytes: number;
  tags: string[];
  project_id: string | null;
  storage_path: string;
  original_filename: string;
  created_at: string;
  updated_at: string;
}

/** Payload accepted by POST /api/documents (no server-generated columns). */
export interface DocumentInput {
  title: string;
  description: string | null;
  category: CategoryKey;
  file_ext: string;
  mime_type: string | null;
  size_bytes: number;
  tags: string[];
  project_id: string | null;
  storage_path: string;
  original_filename: string;
}

export interface ProjectInput {
  name: string;
  slug: string;
  description: string | null;
}
