// Run with: node --test src/features/toolkit/lib/units.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CATEGORIES,
  type CategoryId,
  convertById,
  formatResult,
  parseInput,
} from "./units.ts";

/** Assert two numbers agree within a relative tolerance. */
function assertClose(actual: number, expected: number, relTol = 1e-5): void {
  const diff = Math.abs(actual - expected);
  const scale = Math.max(Math.abs(expected), 1e-12);
  assert.ok(
    diff / scale <= relTol,
    `expected ${actual} ≈ ${expected} (rel err ${diff / scale})`,
  );
}

// The hand-checkable cases from context/calculator-specs.md.
const CASES: Array<{
  category: CategoryId;
  value: number;
  from: string;
  to: string;
  expect: number;
}> = [
  { category: "length", value: 1, from: "in", to: "mm", expect: 25.4 },
  { category: "length", value: 1, from: "ft", to: "m", expect: 0.3048 },
  { category: "force", value: 1, from: "kgf", to: "N", expect: 9.80665 },
  { category: "pressure", value: 1, from: "bar", to: "psi", expect: 14.5038 },
  { category: "pressure", value: 6, from: "bar", to: "psi", expect: 87.0226 },
  {
    category: "pressure",
    value: 1,
    from: "kgfcm2",
    to: "bar",
    expect: 0.980665,
  },
  { category: "torque", value: 1, from: "kgfm", to: "Nm", expect: 9.80665 },
  { category: "torque", value: 1000, from: "Nmm", to: "Nm", expect: 1 },
  { category: "power", value: 1, from: "hp", to: "W", expect: 745.7 },
  { category: "power", value: 1, from: "kW", to: "hp", expect: 1.34102 },
  { category: "flow", value: 1, from: "m3h", to: "Lmin", expect: 16.6667 },
  { category: "flow", value: 1, from: "Ls", to: "Lmin", expect: 60 },
];

test("spec conversion cases", () => {
  for (const c of CASES) {
    const result = convertById(c.value, c.category, c.from, c.to);
    assertClose(result, c.expect);
  }
});

test("round-trip A→B→A returns the original (every unit pair)", () => {
  const value = 123.456;
  for (const category of CATEGORIES) {
    for (const a of category.units) {
      for (const b of category.units) {
        const there = convertById(value, category.id, a.id, b.id);
        const back = convertById(there, category.id, b.id, a.id);
        assertClose(back, value, 1e-10);
      }
    }
  }
});

test("base unit converts to itself unchanged", () => {
  for (const category of CATEGORIES) {
    const base = category.units.find((u) => u.toBase === 1);
    assert.ok(base, `${category.id} should declare a base unit (toBase === 1)`);
  }
});

test("formatResult: significant figures, stripping, exponential", () => {
  assert.equal(formatResult(25.4), "25.4");
  assert.equal(formatResult(0.980665), "0.980665");
  assert.equal(formatResult(745.6998715822702), "745.7"); // 6 sig figs
  assert.equal(formatResult(1), "1");
  assert.equal(formatResult(0), "0");
  assert.equal(formatResult(1 / 60000), "1.66667e-5"); // tiny → exponential
  assert.equal(formatResult(1234567), "1.23457e+6"); // large → exponential
  assert.equal(formatResult(Number.NaN), "—");
  assert.equal(formatResult(Number.POSITIVE_INFINITY), "—");
});

test("parseInput: accepts finite numbers, rejects junk", () => {
  assert.equal(parseInput("1000"), 1000);
  assert.equal(parseInput("  -5.5 "), -5.5);
  assert.equal(parseInput("1e3"), 1000);
  assert.equal(parseInput("0"), 0);
  assert.equal(parseInput(""), null);
  assert.equal(parseInput("abc"), null);
  assert.equal(parseInput("Infinity"), null);
});
