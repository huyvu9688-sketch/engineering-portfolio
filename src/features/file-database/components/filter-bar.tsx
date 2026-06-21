"use client";

import { CATEGORIES } from "@/features/file-database/lib/categories";
import type { CategoryKey, Project } from "@/features/file-database/lib/types";

export function FilterBar({
  category,
  projectId,
  projects,
  onCategory,
  onProject,
}: {
  category: CategoryKey | null;
  projectId: string | null;
  projects: Project[];
  onCategory: (c: CategoryKey | null) => void;
  onProject: (p: string | null) => void;
}) {
  const chip = (active: boolean) =>
    `rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
      active ? "border-accent text-accent" : "border-hairline text-ink-muted hover:border-accent"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={() => onCategory(null)} className={chip(category === null)}>
        All
      </button>
      {CATEGORIES.map((c) => (
        <button key={c.key} onClick={() => onCategory(c.key)} className={chip(category === c.key)}>
          {c.label}
        </button>
      ))}

      <select
        value={projectId ?? ""}
        onChange={(e) => onProject(e.target.value || null)}
        className="ml-auto rounded-full border border-hairline bg-surface px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-muted outline-none focus:border-accent"
      >
        <option value="">All Projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  );
}
