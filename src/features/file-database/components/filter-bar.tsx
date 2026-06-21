"use client";

import { CATEGORIES } from "@/features/file-database/lib/categories";
import type { CategoryKey } from "@/features/file-database/lib/types";

export function FilterBar({
  category,
  onCategory,
}: {
  category: CategoryKey | null;
  onCategory: (c: CategoryKey | null) => void;
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
    </div>
  );
}
