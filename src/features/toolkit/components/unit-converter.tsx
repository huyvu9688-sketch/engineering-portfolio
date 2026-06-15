"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import {
  CATEGORIES,
  type CategoryId,
  convert,
  formatResult,
  getCategory,
  getUnit,
  parseInput,
} from "@/features/toolkit/lib/units";

const PRECISIONS = [4, 6, 8, 10] as const;

// Shared control styling: token-driven, tabular figures so digits never
// jitter, and a visible focus ring for keyboard users.
const fieldClass =
  "w-full rounded-lg border border-hairline bg-surface px-3 py-2 font-mono text-sm tabular-nums text-ink outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/25";

export function UnitConverter() {
  const [categoryId, setCategoryId] = useState<CategoryId>("length");
  const initial = getCategory("length");
  const [fromId, setFromId] = useState(initial.defaultFrom);
  const [toId, setToId] = useState(initial.defaultTo);
  const [value, setValue] = useState(String(initial.defaultValue));
  const [precision, setPrecision] = useState(6);

  const category = getCategory(categoryId);
  const from = getUnit(category, fromId);
  const to = getUnit(category, toId);

  const parsed = parseInput(value);
  const isInvalid = parsed === null && value.trim() !== "";
  const result =
    parsed !== null && from && to ? convert(parsed, from, to) : null;

  function selectCategory(id: CategoryId) {
    const next = getCategory(id);
    setCategoryId(id);
    setFromId(next.defaultFrom);
    setToId(next.defaultTo);
    setValue(String(next.defaultValue));
  }

  function swapUnits() {
    setFromId(toId);
    setToId(fromId);
    // Carry the current result into the input so the swap feels continuous.
    if (result !== null) setValue(formatResult(result, precision));
  }

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4">
      {/* Category selector */}
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Quantity to convert"
      >
        {CATEGORIES.map((c) => {
          const active = c.id === categoryId;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => selectCategory(c.id)}
              className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                active
                  ? "border-ink bg-ink text-on-dark"
                  : "border-hairline bg-surface text-ink-muted hover:border-accent hover:text-accent"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* From */}
      <div className="mt-5">
        <label
          htmlFor="convert-input"
          className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-ink-muted"
        >
          From
        </label>
        <input
          id="convert-input"
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={isInvalid}
          className={`${fieldClass} text-base ${
            isInvalid ? "border-error focus:border-error focus-visible:ring-error/25" : ""
          }`}
        />
        <select
          aria-label="Convert from unit"
          value={fromId}
          onChange={(e) => setFromId(e.target.value)}
          className={`${fieldClass} mt-2`}
        >
          {category.units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label} ({u.symbol})
            </option>
          ))}
        </select>
      </div>

      {/* Swap */}
      <div className="my-2 flex justify-center">
        <button
          type="button"
          onClick={swapUnits}
          aria-label="Swap from and to units"
          className="rounded-full border border-hairline bg-surface p-2 text-ink-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
        >
          <ArrowLeftRight className="h-4 w-4 rotate-90 stroke-[1.5]" />
        </button>
      </div>

      {/* To — the readout. The answer is the loudest thing in the panel. */}
      <div>
        <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-ink-muted">
          To
        </span>
        <output
          htmlFor="convert-input"
          className="flex items-baseline justify-between gap-2 rounded-lg border border-hairline bg-canvas px-3 py-2.5"
        >
          <span className="font-mono text-2xl leading-none tabular-nums text-ink">
            {result === null ? "—" : formatResult(result, precision)}
          </span>
          {to && (
            <span className="font-mono text-xs uppercase tracking-widest text-ink-faint">
              {to.symbol}
            </span>
          )}
        </output>
        <select
          aria-label="Convert to unit"
          value={toId}
          onChange={(e) => setToId(e.target.value)}
          className={`${fieldClass} mt-2`}
        >
          {category.units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label} ({u.symbol})
            </option>
          ))}
        </select>
      </div>

      {/* Footer: validation / equivalence + precision */}
      <div className="mt-5 flex flex-col gap-2 border-t border-hairline pt-3">
        <p className="font-mono text-xs tabular-nums text-ink-muted">
          {isInvalid ? (
            <span className="text-error">Enter a valid number</span>
          ) : from && to ? (
            <>
              1 {from.symbol} = {formatResult(convert(1, from, to), precision)}{" "}
              {to.symbol}
            </>
          ) : null}
        </p>

        <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
          Precision
          <select
            aria-label="Display precision (significant figures)"
            value={precision}
            onChange={(e) => setPrecision(Number(e.target.value))}
            className="rounded-full border border-hairline bg-surface px-3 py-1 font-mono text-xs tabular-nums text-ink outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
          >
            {PRECISIONS.map((p) => (
              <option key={p} value={p}>
                {p} sig figs
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
