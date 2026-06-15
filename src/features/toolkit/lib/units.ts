// Unit converter — pure logic (no UI). See context/calculator-specs.md.
//
// Every category converts THROUGH its coherent-SI base unit:
//   value_base = value × unit.toBase           (toBase = 1 unit in SI base)
//   result     = value × (from.toBase / to.toBase)
// One multiply + one divide — never chain conversions.

export type CategoryId =
  | "length"
  | "force"
  | "pressure"
  | "torque"
  | "power"
  | "flow";

export interface Unit {
  /** Stable id used in component state and <select> values. */
  id: string;
  /** Human-readable name, e.g. "Millimetre". */
  label: string;
  /** Display symbol, e.g. "mm". */
  symbol: string;
  /** Value of ONE of this unit expressed in the category's SI base unit. */
  toBase: number;
}

export interface Category {
  id: CategoryId;
  label: string;
  /** Symbol of the coherent-SI base unit, e.g. "m". */
  baseSymbol: string;
  units: Unit[];
  /** Sensible starting value + units for the UI. */
  defaultValue: number;
  defaultFrom: string;
  defaultTo: string;
}

// Factors are taken verbatim from context/calculator-specs.md (sourced from
// NIST SP 811). Exact ratios are written as divisions so the full
// double-precision value is preserved and self-documenting.
export const CATEGORIES: Category[] = [
  {
    id: "length",
    label: "Length",
    baseSymbol: "m",
    defaultValue: 100,
    defaultFrom: "mm",
    defaultTo: "in",
    units: [
      { id: "um", label: "Micrometre", symbol: "µm", toBase: 0.000001 },
      { id: "mm", label: "Millimetre", symbol: "mm", toBase: 0.001 },
      { id: "cm", label: "Centimetre", symbol: "cm", toBase: 0.01 },
      { id: "m", label: "Metre", symbol: "m", toBase: 1 },
      { id: "km", label: "Kilometre", symbol: "km", toBase: 1000 },
      { id: "mil", label: "Thou / mil", symbol: "mil", toBase: 0.0000254 },
      { id: "in", label: "Inch", symbol: "in", toBase: 0.0254 },
      { id: "ft", label: "Foot", symbol: "ft", toBase: 0.3048 },
    ],
  },
  {
    id: "force",
    label: "Force",
    baseSymbol: "N",
    defaultValue: 1000,
    defaultFrom: "N",
    defaultTo: "kgf",
    units: [
      { id: "dyn", label: "Dyne", symbol: "dyn", toBase: 0.00001 },
      { id: "N", label: "Newton", symbol: "N", toBase: 1 },
      { id: "kN", label: "Kilonewton", symbol: "kN", toBase: 1000 },
      { id: "kgf", label: "Kilogram-force", symbol: "kgf", toBase: 9.80665 },
    ],
  },
  {
    id: "pressure",
    label: "Pressure",
    baseSymbol: "Pa",
    defaultValue: 6,
    defaultFrom: "bar",
    defaultTo: "psi",
    units: [
      { id: "Pa", label: "Pascal", symbol: "Pa", toBase: 1 },
      { id: "kPa", label: "Kilopascal", symbol: "kPa", toBase: 1000 },
      { id: "MPa", label: "Megapascal", symbol: "MPa", toBase: 1000000 },
      { id: "mbar", label: "Millibar", symbol: "mbar", toBase: 100 },
      { id: "bar", label: "Bar", symbol: "bar", toBase: 100000 },
      { id: "kgfcm2", label: "Kgf per cm²", symbol: "kgf/cm²", toBase: 98066.5 },
      {
        id: "psi",
        label: "Pound-force per in²",
        symbol: "psi",
        toBase: 6894.757293168361,
      },
    ],
  },
  {
    id: "torque",
    label: "Torque",
    baseSymbol: "N·m",
    defaultValue: 10,
    defaultFrom: "Nm",
    defaultTo: "kgfm",
    units: [
      { id: "Nmm", label: "Newton millimetre", symbol: "N·mm", toBase: 0.001 },
      { id: "Nm", label: "Newton metre", symbol: "N·m", toBase: 1 },
      { id: "kNm", label: "Kilonewton metre", symbol: "kN·m", toBase: 1000 },
      { id: "kgfm", label: "Kgf metre", symbol: "kgf·m", toBase: 9.80665 },
    ],
  },
  {
    id: "power",
    label: "Power",
    baseSymbol: "W",
    defaultValue: 1,
    defaultFrom: "kW",
    defaultTo: "hp",
    units: [
      { id: "W", label: "Watt", symbol: "W", toBase: 1 },
      { id: "kW", label: "Kilowatt", symbol: "kW", toBase: 1000 },
      { id: "MW", label: "Megawatt", symbol: "MW", toBase: 1000000 },
      {
        id: "hp",
        label: "Horsepower",
        symbol: "hp",
        toBase: 745.6998715822702,
      },
    ],
  },
  {
    id: "flow",
    label: "Flow",
    baseSymbol: "m³/s",
    defaultValue: 100,
    defaultFrom: "Lmin",
    defaultTo: "m3h",
    units: [
      { id: "m3s", label: "Cubic metre per second", symbol: "m³/s", toBase: 1 },
      {
        id: "m3min",
        label: "Cubic metre per minute",
        symbol: "m³/min",
        toBase: 1 / 60,
      },
      {
        id: "m3h",
        label: "Cubic metre per hour",
        symbol: "m³/h",
        toBase: 1 / 3600,
      },
      { id: "Ls", label: "Litre per second", symbol: "L/s", toBase: 0.001 },
      {
        id: "Lmin",
        label: "Litre per minute",
        symbol: "L/min",
        toBase: 1 / 60000,
      },
    ],
  },
];

export function getCategory(id: CategoryId): Category {
  const category = CATEGORIES.find((c) => c.id === id);
  if (!category) throw new Error(`Unknown category: ${id}`);
  return category;
}

export function getUnit(category: Category, unitId: string): Unit | undefined {
  return category.units.find((u) => u.id === unitId);
}

/** Convert a value between two units of the same category. */
export function convert(value: number, from: Unit, to: Unit): number {
  return (value * from.toBase) / to.toBase;
}

/** Convenience: convert by category + unit ids (used by the UI and tests). */
export function convertById(
  value: number,
  categoryId: CategoryId,
  fromId: string,
  toId: string,
): number {
  const category = getCategory(categoryId);
  const from = getUnit(category, fromId);
  const to = getUnit(category, toId);
  if (!from || !to) {
    throw new Error(`Unknown unit ${fromId}/${toId} in ${categoryId}`);
  }
  return convert(value, from, to);
}

/**
 * Parse raw input text into a finite number.
 * Returns null for empty / non-numeric / NaN / ±Infinity input.
 * Negative and zero are valid (e.g. gauge/vacuum pressure).
 */
export function parseInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/**
 * Format a result to `sig` significant figures for display: trailing zeros
 * stripped, exponential notation for very large/small magnitudes. Computation
 * stays full precision — only display is rounded (see calculator-specs.md).
 */
export function formatResult(value: number, sig = 6): string {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";

  const abs = Math.abs(value);
  if (abs >= 1e6 || abs < 1e-4) {
    const [mantissa, exponent] = value.toExponential(sig - 1).split("e");
    const cleanMantissa = mantissa.includes(".")
      ? mantissa.replace(/\.?0+$/, "")
      : mantissa;
    return `${cleanMantissa}e${exponent}`;
  }

  // toPrecision rounds to sig figs; parseFloat drops trailing zeros/dot.
  return parseFloat(value.toPrecision(sig)).toString();
}
