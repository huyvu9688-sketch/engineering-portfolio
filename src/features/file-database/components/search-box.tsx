"use client";

import { Search } from "lucide-react";

export function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 stroke-[1.5] text-ink-faint" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="SEARCH TITLE, DESCRIPTION, TAGS"
        className="w-full rounded-full border border-hairline bg-surface py-3 pl-11 pr-4 font-mono text-xs uppercase tracking-widest outline-none placeholder:text-ink-faint focus:border-accent"
      />
    </div>
  );
}
