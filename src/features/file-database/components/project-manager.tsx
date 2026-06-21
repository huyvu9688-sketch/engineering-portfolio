"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/features/file-database/lib/format";
import type { Project } from "@/features/file-database/lib/types";

export function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await createClient().from("projects").select("*").order("name");
    if (error) setError(error.message);
    else setProjects(data as Project[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Name is required.");
    setBusy(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), slug: slugify(name), description: description.trim() || null }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Create failed." }));
      return setError(body.error ?? "Create failed.");
    }
    setName("");
    setDescription("");
    void load();
  }

  async function onDelete(id: string, label: string) {
    if (!confirm(`Delete project "${label}"? Its documents stay but become ungrouped.`)) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Delete failed." }));
      return setError(body.error ?? "Delete failed.");
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  const labelCls = "font-mono text-[10px] uppercase tracking-widest text-ink-muted";
  const inputCls = "mt-2 w-full rounded-lg border border-hairline bg-surface px-4 py-3 text-base outline-none focus:border-accent";

  return (
    <div className="space-y-10">
      <form onSubmit={onCreate} className="rounded-lg border border-hairline bg-surface p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className={labelCls}>Project name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            {name && (
              <span className="mt-1 block font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                slug: {slugify(name)}
              </span>
            )}
          </label>
          <label className="block">
            <span className={labelCls}>Description (optional)</span>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
          </label>
        </div>
        {error && (
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-state-error">{error}</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-6 rounded-full bg-ink px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-on-dark transition-colors hover:bg-accent disabled:opacity-50"
        >
          {busy ? "Creating…" : "Add Project"}
        </button>
      </form>

      <section>
        <div className="flex items-end justify-between border-b border-hairline pb-3">
          <h2 className="text-2xl font-semibold uppercase tracking-tighter">Projects</h2>
          <span className="font-mono text-[10px] uppercase tracking-widest tabular-nums text-ink-faint">
            {projects.length} total
          </span>
        </div>
        <ul className="mt-2 divide-y divide-hairline">
          {projects.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="truncate text-base font-medium">{p.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">{p.slug}</p>
              </div>
              <button
                onClick={() => onDelete(p.id, p.name)}
                className="shrink-0 rounded-full border border-hairline px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-muted transition-colors hover:border-state-error hover:text-state-error"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
