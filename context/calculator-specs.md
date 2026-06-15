# Calculator Specs

This file defines the math for the Engineering Toolkit. The AI
must implement against these specs and **must not invent
engineering math** (per `ai-workflow-rules.md`). One section per
calculator. Add the next calculator's section before it is built.

> Status: **Unit converter** (§1) BUILT & verified. **Motor
> sizing** (§3) — slices 1–4 BUILT & verified: engine + all five
> mechanisms (direct, lead/ball screw, belt/conveyor, rack &
> pinion, rotary index table) + servo, stepper, AND AC-induction
> acceptance criteria. Only slice 5 (extras) remains. **Pneumatic
> cylinder** (§2) is still a stub for the owner.

---

## 1. Unit Converter

### Scope

Convert a single value between units within one **category**:
length, force, pressure, torque, power, and volumetric flow.
These six categories come from `project-overview.md`.

Out of scope (intentional — documented so it isn't "missing"):

- **Temperature** — it is an *affine* conversion (needs an offset,
  e.g. °C ↔ °F), not a single multiply, so it does not fit the
  factor model below. Add later as its own special case if wanted.
- **Mass / mass flow** — not in the six requested categories.
- **Normal / standard ("free air") flow** (Nl/min, Nm³/h, scfm,
  L/min ANR) — these depend on a reference temperature and
  pressure, so they are NOT a geometric volume conversion. They
  belong in the pneumatic calculator (air consumption), not here.
- **Currency / data / time** — not engineering quantities.

### How the conversion works

Every category has ONE **base unit** — the **coherent SI unit**
(metre, newton, pascal, newton-metre, watt, cubic-metre-per-
second). Converting always goes *through* this SI base, and the
engineering calculators in later sections use the **same** SI base
internally, so a converted value can flow straight into a
calculation with no extra factors (owner's design, 2026-06-14).
Each unit carries a single factor:

```
1 <unit> = <factor> <base unit>     →  value_base = value × factor
```

To convert a value from unit A to unit B (same category):

```
result = value × (factorA / factorB)
```

Always pivot through the base in exactly one multiply + one
divide — never chain conversions (chaining accumulates rounding
error). This stays a **pure function**
(`convert(value, fromUnit, toUnit): number`) with no UI in it, per
`code-standards.md` ("Calculator math isolated as pure
functions … internal units are SI; display conversion at the UI
layer only"). Suggested home: `src/features/toolkit/lib/units.ts`
(data tables + `convert`), consumed by the `/tools` UI.

### Conventions

- **Internal type:** IEEE-754 double (JS `number`). Factors are
  stored to full double precision (the tables below give enough
  digits to copy verbatim).
- **Exactness legend:** `exact` = the decimal shown is the exact
  value; `ratio` = exact fraction whose decimal repeats (the
  fraction is given — store the rounded decimal, it is good to ~15
  digits); `def.` = a defined/conventional empirical value taken
  from NIST.
- **Rounding:** compute at full precision; round **only for
  display**. Default display = **6 significant figures**, trailing
  zeros stripped. Use exponential notation when `|x| ≥ 1e6` or
  `0 < |x| < 1e-4`. Let the user raise precision (e.g. up to 10
  sig figs) but never show raw floating-point noise
  (`0.1 + 0.2`–style artifacts).
- **Input validation:** accept any *finite* real number
  (negative and zero allowed — e.g. gauge/vacuum pressure can be
  negative). Reject empty input, non-numeric text, `NaN`, and
  `±Infinity`; show the field-level error state from
  `ui-context.md` (`--state-error`). Optionally warn (do not
  block) if `|result| ≥ 1e15`.
- **Symbols:** `·` for multiplication in compound units
  (`N·m`), `²`/`³` for powers. Unit labels render in mono per
  `ui-context.md`.

### 1.1 Length — base unit: metre (m)

| Unit | Symbol | 1 unit = … m | Exact? |
| --- | --- | --- | --- |
| Micrometre | µm | 0.000001 | exact |
| Millimetre | mm | 0.001 | exact |
| Centimetre | cm | 0.01 | exact |
| Metre | m | 1 | exact (base) |
| Kilometre | km | 1000 | exact |
| Thou / mil | mil | 0.0000254 | exact |
| Inch | in | 0.0254 | exact |
| Foot | ft | 0.3048 | exact |

Default: **100 mm → in**.

### 1.2 Force — base unit: newton (N)

| Unit | Symbol | 1 unit = … N | Exact? |
| --- | --- | --- | --- |
| Dyne | dyn | 0.00001 | exact |
| Newton | N | 1 | exact (base) |
| Kilonewton | kN | 1000 | exact |
| Kilogram-force | kgf | 9.80665 | exact |

`kgf = 1 kg × g₀`, where g₀ = 9.80665 m/s² (standard gravity), so
it is exact. Default: **1000 N → kgf**.

### 1.3 Pressure — base unit: pascal (Pa)

| Unit | Symbol | 1 unit = … Pa | Exact? |
| --- | --- | --- | --- |
| Pascal | Pa | 1 | exact (base) |
| Kilopascal | kPa | 1000 | exact |
| Megapascal | MPa | 1000000 | exact |
| Millibar | mbar | 100 | exact |
| Bar | bar | 100000 | exact |
| Kgf per cm² | kgf/cm² | 98066.5 | exact |
| Pound-force per in² | psi | 6894.757293168361 | ratio |

Notes: `kgf/cm²` (98066.5 Pa, numerically the technical
atmosphere) is the pressure label engineers actually use on a lot
of pneumatic specs. `psi = lbf/in²` (pound-force per square inch).
Default: **6 bar → psi** (typical shop-air line pressure).

### 1.4 Torque — base unit: newton metre (N·m)

| Unit | Symbol | 1 unit = … N·m | Exact? |
| --- | --- | --- | --- |
| Newton millimetre | N·mm | 0.001 | exact |
| Newton metre | N·m | 1 | exact (base) |
| Kilonewton metre | kN·m | 1000 | exact |
| Kgf metre | kgf·m | 9.80665 | exact |

`kgf·m = 1 kgf × 1 m = 9.80665 N·m`; `N·mm = 0.001 N·m`.
Default: **10 N·m → kgf·m**.

### 1.5 Power — base unit: watt (W)

| Unit | Symbol | 1 unit = … W | Exact? |
| --- | --- | --- | --- |
| Watt | W | 1 | exact (base) |
| Kilowatt | kW | 1000 | exact |
| Megawatt | MW | 1000000 | exact |
| Horsepower | hp | 745.6998715822702 | exact |

Notes: `hp` is mechanical horsepower (`550 ft·lbf/s =
745.6998715822702 W`, US/UK shaft power). Electric horsepower
(746 W, a 0.04%-rounded variant) was intentionally dropped — it is
NOT a safety factor, just a rounding of the same unit; sizing
margin lives in the motor-sizing calculator (Section 3), not here.
Default: **1 kW → hp**.

### 1.6 Volumetric flow — base unit: cubic metre per second (m³/s)

| Unit | Symbol | 1 unit = … m³/s | Exact? |
| --- | --- | --- | --- |
| Cubic metre per second | m³/s | 1 | exact (base) |
| Cubic metre per minute | m³/min | 0.016666666666666666 | ratio (= 1/60) |
| Cubic metre per hour | m³/h | 0.0002777777777777778 | ratio (= 1/3600) |
| Litre per second | L/s | 0.001 | exact |
| Litre per minute | L/min | 0.000016666666666666667 | ratio (= 1/60000) |

**This is geometric volume flow only** — for compressed-air "free
air delivery" (Nl/min, scfm, ANR) see the pneumatic calculator
(Section 2), since those depend on a reference temperature and
pressure and are not a plain volume conversion.
Default: **100 L/min → m³/h**.

### Verification test cases (hand-checkable)

Use these as the unit tests required before shipping (round to the
shown figures):

| Category | Input | Expect |
| --- | --- | --- |
| Length | 1 in | 25.4 mm |
| Length | 1 ft | 0.3048 m |
| Force | 1 kgf | 9.80665 N |
| Pressure | 1 bar | 14.5038 psi |
| Pressure | 6 bar | 87.0226 psi |
| Pressure | 1 kgf/cm² | 0.980665 bar |
| Torque | 1 kgf·m | 9.80665 N·m |
| Torque | 1000 N·mm | 1 N·m |
| Power | 1 hp | 745.700 W |
| Power | 1 kW | 1.34102 hp |
| Flow | 1 m³/h | 16.6667 L/min |
| Flow | 1 L/s | 60 L/min |

Round-trip rule: `A→B→A` must return the original value to
≥ 10 significant figures for every unit (guards against a bad
factor).

### Sources

- NIST Special Publication 811, *Guide for the Use of the
  International System of Units (SI)*, Appendix B.8 — "Factors for
  Units Listed Alphabetically."
  https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8
- NIST SP 811 main guide:
  https://www.nist.gov/pml/special-publication-811
- Exact base definitions used to derive full-precision factors:
  international yard & pound (1959): 1 in = 0.0254 m, 1 lb =
  0.45359237 kg (lb is used only to derive the psi factor, since
  psi = lbf/in²); standard gravity g₀ = 9.80665 m/s².

---

## 2. Pneumatic Cylinder Calculator — TO BE SPECIFIED

Owner to define before build (do not invent):

- Outputs: theoretical force (push/pull), force at a given
  efficiency, air consumption per cycle, free-air consumption rate.
- Formulas + assumptions: piston area from bore (push) vs.
  bore − rod (pull); gauge vs. absolute pressure; the reference
  conditions for "free air" (ANR per ISO 8778 vs. SCFM) — this is
  the bridge to the "normal/standard flow" units left out of the
  converter.
- Input ranges/defaults: bore, rod diameter, stroke, pressure,
  efficiency factor, cycles/min.

## 3. Motor Sizing Calculator

> Status: Spec drafted from authoritative sources and verified on
> paper against the worked examples (see 3.9). BUILD PROGRESS:
> slices 1–4 DONE & verified (2026-06-14/15) — engine + all five
> mechanisms (direct, lead/ball screw, belt/conveyor, rack &
> pinion, rotary index table) + servo / stepper / AC-induction
> acceptance, in `features/toolkit/lib/motor-sizing.ts` (+ tests),
> UI at `/tools/motor-sizing`. Remaining: slice 5 (vertical hoist,
> ball-screw preload, multi-segment duty cycles).

### 3.0 Goal

Given a **drive mechanism** and a **motion requirement**, compute
everything needed to choose a motor: reflected **load inertia**,
**load torque**, the **motion profile** (speed + acceleration),
**acceleration torque**, **peak (required) torque**, **RMS torque**,
**required power**, and the **inertia ratio** — then check a
candidate motor with **motor-type-specific** acceptance criteria
(AC induction, stepper, or servo) and a **margin**.

Method follows the standard industry flow: Oriental Motor's
Technical Reference and Repanich (CSU Chico). Both agree on every
formula below; the worked examples in 3.9 are from Repanich and
reproduce exactly.

### 3.1 Internal units & conventions (coherent SI)

All math is done in coherent SI, per `code-standards.md`:

| Quantity | Unit |
| --- | --- |
| length / distance | m |
| mass | kg |
| force | N |
| angle | rad (1 rev = 2π rad) |
| angular velocity ω | rad/s |
| angular acceleration α | rad/s² |
| moment of inertia J | kg·m² |
| torque T | N·m |
| power P | W |
| time t | s |

- Inputs are entered in friendly units (rpm, mm, kg, °, …) and
  converted to SI at the UI layer (reuse the unit-converter
  factors); results convert back for display.
- Standard gravity `g = 9.80665 m/s²`.
- **rpm ↔ rad/s:** `ω = 2π·N/60 = N / 9.5493`, where the constant
  `9.5493 = 60 / 2π`. The rpm form of acceleration torque is
  `Ta = J·N / (9.5493·t)` and of power is `P = T·N / 9.5493`.
- **Gear/reduction ratio** `i = motor speed / load speed` (`i ≥ 1`
  for a reducer), treated as an ideal (kinematic) ratio: inertia
  `J_motorside = J_load / i²`; torque `T_motorside = T_load/(i·η)`.
  Output speed is `i×` slower; the motor spins `i×` faster. The
  gear is NOT given its own separate efficiency — fold any gearhead
  loss into `η` (see below), i.e. `η` is the TOTAL drivetrain
  efficiency (mechanism × gearhead). A real gearhead also has a
  max permissible load inertia (`J_load·i² ≤ rating`) — that check
  belongs to motor selection, not this engine.
- **Efficiency** `η` (0–1) is applied in TWO places (Repanich
  convention, and physically sound — an η-efficient drive needs
  `1/η` more motor torque to move the load):
  1. it divides the **load/friction/gravity torque**, and
  2. it divides the **driven load's reflected inertia** in the
     acceleration term (`J_load/η`).
  The mechanism's OWN inertia (screw, pulley, pinion, coupler,
  reducer) and the motor rotor are NOT divided by η. The **inertia
  ratio** uses the total reflected load inertia WITHOUT the `/η`.
  - VERIFIED 2026-06-15 against a third source (Oriental Motor
    Technical Reference): our load-torque, inertia, and power
    formulas reproduce OM's worked examples exactly (belt conveyor
    `T_L = 320 oz·in`; ball screw `F·P_B/2πη = 0.4775 lb·in`;
    cylinder `J = ½mR² = (π/32)ρLD⁴`; power `P = T·N/9.5493`). The
    ONE intentional difference: OM's examples do NOT divide the
    reflected load inertia by η in the accel torque (point 2). We
    DO (Repanich) — it is the physically rigorous choice (the motor
    accelerates the load *through* the η-efficient drive, so it
    needs `1/η` more torque) and the more conservative one. This
    makes our required torque slightly higher than OM's (safer).

### 3.2 Motion profile (Step: speed & acceleration)

Works for linear (use distance `X`, speed `V`) or rotary (use angle
`θ`, angular speed `ω`); symbols below use the linear form.

- **Triangular** (accelerate to a peak, then decelerate — no
  cruise): `V = 2X / t_m`, accel time `t_a = t_m / 2`,
  accel `a = V / t_a`. Minimises torque but needs the highest peak
  speed.
- **Trapezoidal** (accel → cruise at `V` → decel): given total move
  time `t_m`, distance `X`, and a chosen cruise speed `V`,
  `t_a = t_m − X/V` (per accel/decel ramp), `a = V / t_a`.
- If a computed peak speed exceeds the allowed max, switch from
  triangular to trapezoidal with the constrained `V`.
- Convert linear → rotary at the drive: see each mechanism for
  `ω = f(V)`. Then `α = a` analog `= ω_max / t_a`.

### 3.3 Inertia building blocks (Step: load inertia)

Anything that moves with the motor counts. Compute each body's J
about the motor axis, sum, then reflect through `i²` if geared.

- **Solid cylinder** (about its axis): `J = ½·m·R²`
  `= (π/32)·ρ·L·D⁴ = (π/2)·ρ·L·R⁴`.
- **Hollow cylinder:** `J = ½·m·(R_o² + R_i²)`,
  with `m = π·L·ρ·(R_o² − R_i²)`.
- **Off-axis body (parallel-axis theorem):** `J = J_cg + m·d²`
  (`d` = distance from the rotation axis). Used for index-table
  workpieces placed at a radius.
- **Linear-moving mass reflected to the motor shaft:**
  - lead/ball screw: `J = m·(P_B / 2π)²` (`P_B` = lead, m/rev)
  - pulley/belt, rack & pinion, wire drum: `J = m·R²`
    (`R` = pulley/pinion pitch radius)
- **Through a gear ratio:** `J_motorside = J / i²`.

Density reference (`ρ`, kg/m³): steel ≈ 7850, stainless ≈ 7900,
aluminium ≈ 2700, brass/bronze ≈ 8500, copper ≈ 8900, plastics
≈ 1100. (Repanich's examples use steel 7750; let users override ρ.)

### 3.4 Force assembly (orientation)

Total linear resisting force `F` at the load, before the mechanism:

- **Horizontal:** `F = μ·m·g + F_ext`
- **Vertical lift:** `F = m·g + F_ext` (gravity always opposes
  raising; also gives a static **holding torque** at rest)
- **Inclined at angle β:** `F = m·g·(sin β + μ·cos β) + F_ext`

`μ` = dynamic friction coefficient (steel/steel ≈ 0.58 dry, 0.15
lubricated; ball/roller guides ≈ 0.002–0.01 — let users override).
`F_ext` = any process/thrust force.

### 3.5 Mechanism modules

Each gives the reflected load inertia `J_L`, the load torque `T_L`
(at the motor shaft), and the linear→rotary speed relation. `η` is
the mechanism efficiency; `i` the optional extra gear ratio.

**(a) Direct / coupled rotary load** (turntable, spindle, drum):
- `J_L = (Σ J_bodies) / i²` (cylinders etc. from 3.3)
- `T_L = (T_friction + T_process) / (i·η)`
- `ω_motor = i·ω_load`

**(b) Lead screw / ball screw:**
- `J_L = [J_screw + m·(P_B/2π)²] / i²`, `J_screw = ½·m_screw·R_screw²`
- `T_L = [F·P_B / (2π·η) (+ preload term)] / i`
- `ω_motor = i·(2π·V / P_B)`  (screw turns `V/P_B` rev/s)
- preload term (ball screws): `+ μ0·F0·P_B/(2π)`, `μ0`≈0.1–0.3,
  `F0` = preload (optional; omit for simple lead screws)

**(c) Belt & pulley / conveyor (tangential):**
- `J_L = [m·R² + Σ J_pulleys (+ J_belt)] / i²`,
  pulley `J = ½·m_p·R²`, belt mass adds `m_belt·R²`
- `T_L = F·R / (η·i)`
- `ω_motor = i·(V / R)`  (`R` = drive-pulley pitch radius)
- conveyor `F` from 3.4 (usually horizontal friction, or incline)

**(d) Rack & pinion:**
- `J_L = [m·R_p² + J_pinion] / i²`, `J_pinion = ½·m_p·R_p²`
- `T_L = F·R_p / (η·i)`
- `ω_motor = i·(V / R_p)`  (`R_p` = pinion pitch radius)

**(e) Rotary index table:**
- `J_L = [½·M_table·R_table² + Σ(m_wp·d_wp²) + J_fixtures] / i²`
  (workpieces via parallel-axis at radius `d_wp`)
- `T_L = (T_friction + T_process) / (i·η)`
- Motion: index angle `θ` per move in the index time → trapezoidal
  rotary profile; `ω_load = θ/…` per 3.2, `ω_motor = i·ω_load`
- APPROXIMATION: workpieces are treated as POINT masses (`m·d²`),
  omitting each piece's own spin inertia `J_cg`. This is the
  parallel-axis term only; it is negligible when `d_wp` ≫ the
  workpiece's own radius (≈1 % in Oriental Motor's index-table
  example, where `J_cg` = 3.3 of 260 oz·in² per piece). For large
  workpieces, add their combined `J_cg` via the fixture-inertia
  input.

**(f) Vertical hoist / wire drum** (optional): like (c) with
`F = m·g + F_ext`; report a **holding torque** `T_hold = m·g·R/(η·i)`
and flag backdrive (a brake or self-locking reducer may be needed).

### 3.6 Torque, RMS, power (Step: required torque)

- **Acceleration torque:** `T_a = (J_load/η + J_mech + J_m)·α`
  (rpm form: `·N/(9.5493·t_a)`), where `J_load` = the driven load's
  reflected inertia (linear mass via screw/pulley/rack, or rotary
  load via gear), `J_mech` = screw/pulley/pinion/coupler/reducer
  reflected inertia, `J_m` = motor rotor inertia (0 until a
  candidate motor is chosen). For direct drive `η = 1` so
  `J_load/η = J_load`.
- **Phase torques** over the cycle:
  - accel `T1 = T_L + T_a`
  - cruise `T2 = T_L`
  - decel `T3 = T_L − T_a` (can be negative = regeneration)
  - rest `T4 = T_hold` (vertical) or `0`
- **Peak / required torque:** `T_peak = max(|T1|, |T3|, …)`;
  **required `= T_peak × S_f`** (safety factor, see 3.7).
- **RMS (effective) torque:**
  `T_rms = √[(T1²·t1 + T2²·t2 + T3²·t3 + T4²·t4) / (t1+t2+t3+t4)]`
- **Power:** mechanical `P = T·ω` (peak `= T_peak·ω_max`;
  `= T·N/9.5493` in rpm).

### 3.7 Motor-type acceptance & margins (Step: select & verify)

The required torque, RMS torque, inertia ratio
(`R_J = J_L / J_m`), and speed determine acceptance. Criteria
differ by motor type:

- **AC induction / gearmotor (constant speed):** size by required
  **torque and power**; acceleration is usually secondary for
  continuous-duty conveyors. Apply the motor's **service factor**
  (NEMA commonly 1.15) AND a **design safety factor 1.5–2.0**.
  Check **starting torque ≥ load** (critical for high inertia).
  Inertia ratio is less critical, but high inertia needs a start
  check. Often selected as a gearmotor by output torque + speed.
- **Stepper (open-loop):** operating speed must stay below the
  pull-out ("knee") of the torque–speed curve; required torque
  (incl. acceleration) must sit within the **pull-out torque at the
  operating speed** with a **safety factor ≈ 2** (no feedback, and
  torque falls with speed). Keep **R_J ≤ ~10** (high-resolution
  steppers tolerate up to ~30 per Oriental Motor — settable via the
  inertia-ratio-limit input). RMS not required (open loop), but the
  running **duty cycle should stay < 50 %** (steppers aren't for
  continuous duty). [IMPLEMENTED — `evaluateStepper`.]
- **Servo (AC servo / BLDC):** **peak (accel) torque ≤ motor peak**
  (peak ≈ 2–3× rated), **RMS torque ≤ motor rated (continuous)**,
  **R_J ≤ 5 ideal / ≤ 10 max** (tuning/stability), plus a **speed
  margin 10–20 %** and a **torque margin 50–100 %** on peak.

**Margin policy summary** (the explicit, owner-chosen multipliers —
NOT a unit trick; electric hp = 746 W is irrelevant here):
general 1.5–2.0, high-precision 1.2–1.5, critical 2.0–3.0; steppers
≈ 2. Default `S_f = 2.0` for steppers, `1.5` otherwise — user
editable.

### 3.8 Inputs, ranges, defaults

Common inputs: orientation (horizontal/vertical/incline + β), move
distance/angle, move time, optional max speed, profile (auto:
triangular unless speed-limited → trapezoidal), gear ratio `i`
(default 1), efficiency `η`, friction `μ`, external force, dwell
time, safety factor, optional candidate motor (rotor inertia,
rated/peak torque, rated speed). Plus per-mechanism geometry
(masses, radii, lead, etc.). All accept finite positive numbers
(angles/forces may be signed); validate per the converter's rules.
Each mechanism ships with a default example = its 3.9 test case so
the tool is usable on first load.

### 3.9 Verification test cases (hand-checkable, from Repanich)

These become the unit tests. Internal SI; tolerances ≈ the figures
shown. (Repanich worked examples reproduce these exactly; the AI
re-derived #1 and #3 and they match.)

**Direct drive (Repanich Ex.1) — steel chuck Ø3.0×L4.0 cm + bit
Ø0.8×L14 cm, ρ=7750, move 0.2 rev in 0.15 s, triangular:**
- `V = 2.67 rev/s`; `J_chuck = 246.5 g·cm²`, `J_bit = 4.36 g·cm²`,
  `J_L = 250.86 g·cm² = 2.5086e-5 kg·m²`
- excl. motor: `T_a = 0.0056 N·m`, `T_f = 0.050`, `T_peak = 0.0556`,
  `P = 0.93 W`
- with motor `J_m = 70 g·cm²`: `T_a = 0.0072`, `T_peak = 0.0572`,
  inertia ratio `R_J = 3.6`

**Lead screw (Repanich Ex.3) — steel screw L=36 in, 5 rev/in,
η=0.65, R=0.5 in, move 1.5 in in 0.5 s, V_max=5 in/s, W=50 lb,
μ=0.01, T_br=25 oz·in:**
- triangular `V=6 in/s` too high → trapezoidal `t_a=0.2 s`,
  `V=25 rev/s`
- `J_load = 0.81 oz·in²`, `J_screw = 15.8 oz·in²`
- `T_a = 34.69 oz·in`, `T_f = 25.39 oz·in`, `T_peak = 60.08 oz·in`,
  `P = 66.7 W`
- with motor `J_m = 6.70 oz·in²`: `T_a = 48.3`, `T_peak = 73.7`,
  inertia ratio `R_J = 2.48`

**Direct drive (Repanich Problem 1) — answer ≈ 20 N·m @ 0.56 rev/s**
(looser end-to-end check).

**RMS cross-check (Oriental Motor blog):** `J_L = 5.56e-4 kg·m²`,
`N_max = 1200 rpm`, `t1=t3=0.1 s`, `t2=1.9 s` → total torque
`0.85 N·m`, `T_rms = 0.24 N·m`.

**Belt conveyor load torque (Oriental Motor Tech Ref F-8):** belt+
work 30 lb, μ=0.3, drum Ø4 in, η=0.9 → `T_L = μmg·R/η = 320 oz·in`
(= 2.260 N·m). Reproduced by `sizeBeltPulley` (a unit test).

**Ball-screw load torque (Oriental Motor Tech Ref F-6):** table+work
90 lb, μ=0.05, lead 0.6 in, η=0.9 → `F·P_B/(2πη) = 0.4775 lb·in`
(= 0.0540 N·m; OM adds a preload term we put under breakaway).
Reproduced by `sizeLeadScrew` (a unit test).

### 3.10 Implementation & build slices

Pure functions in `src/features/toolkit/lib/motor-sizing.ts`
(inertia helpers, force assembly, motion profile, torque/RMS/power,
each mechanism, motor-type acceptance), reusing the unit-converter
factors; `node --test` reproduces every 3.9 case. Calm UI in the
toolkit. Suggested slice order (build + verify one at a time):

1. **Core engine** — inertia helpers, motion profile, torque/RMS/
   power, gear reflection. Tested against Ex.1 numbers.
2. **Direct drive** + **lead/ball screw** mechanisms (validates
   against Ex.1 and Ex.3).
3. **Belt/conveyor** + **rack & pinion** + **rotary index table**.
4. **Motor-type acceptance** layer (AC / stepper / servo criteria,
   inertia ratio, margins) + the UI.
5. (optional) vertical hoist, preload term, multi-segment duty
   cycles for RMS.

### Sources

- Repanich, N., *Introduction to Motor Sizing*, CSU Chico
  (owner-supplied PDF) — seven-step method, per-mechanism inertia/
  torque formulas, worked examples used as test cases.
- Oriental Motor, *Motor Sizing Calculations* (Technical Reference)
  and blog *Motor Sizing Basics Part 3: Acceleration & RMS Torque*
  — required-torque = (load + accel)×safety, the `9.55` constant,
  RMS torque, per-mechanism formulas.
  https://www.orientalmotor.com/technology/motor-sizing-calculations.html
- Servo inertia-ratio (≤5 ideal / ≤10 max) and safety-factor
  guidance: Kollmorgen Application Sizing Guide; LinearMotionTips
  "Three critical factors for servo sizing".
- NEMA service factor (1.15) — see also `progress-tracker.md`.
