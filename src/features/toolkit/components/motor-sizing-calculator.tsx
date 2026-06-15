"use client";

import { useMemo, useState, type ComponentType } from "react";
import { formatResult, parseInput } from "@/features/toolkit/lib/units";
import {
  BallScrewIcon,
  BeltConveyorIcon,
  RackPinionIcon,
  IndexTableIcon,
  DirectDriveIcon,
} from "@/features/toolkit/components/mechanism-icons";
import {
  sizeDirectDrive,
  sizeLeadScrew,
  sizeBeltPulley,
  sizeRackPinion,
  sizeIndexTable,
  type MotorCandidate,
  type Orientation,
  type SizingResult,
} from "@/features/toolkit/lib/motor-sizing";

type MotorType = "none" | "servo" | "stepper" | "ac";

type Mechanism = "leadscrew" | "direct" | "belt" | "rack" | "index";

type OrientationState = {
  orientation: Orientation;
  inclineAngle: string;
  externalForce: string;
};

const REV = 2 * Math.PI;
const RPM = (2 * Math.PI) / 60;
const DEG = Math.PI / 180;

const LINEAR_MECHANISMS: Mechanism[] = ["leadscrew", "belt", "rack"];

const MECHANISMS: [Mechanism, string, ComponentType<{ className?: string }>][] =
  [
    ["leadscrew", "Ball Screw", BallScrewIcon],
    ["belt", "Belt Conveyor", BeltConveyorIcon],
    ["rack", "Rack & Pinion", RackPinionIcon],
    ["index", "Index Table", IndexTableIcon],
    ["direct", "Direct Drive", DirectDriveIcon],
  ];

// Illustration per mechanism (drop the PNGs in /public/mechanisms — see its
// README). Cards fall back to the built-in line icon if a file is missing.
const MECH_IMAGES: Record<Mechanism, string> = {
  leadscrew: "/mechanisms/ball-screw.png",
  belt: "/mechanisms/belt-conveyor.png",
  rack: "/mechanisms/rack-pinion.png",
  index: "/mechanisms/index-table.png",
  direct: "/mechanisms/direct-drive.png",
};

// Per-mechanism equations revealed when a card is selected (see
// calculator-specs.md §3.5). i = gear ratio, η = drive efficiency.
const FORMULAS: Record<
  Mechanism,
  { inertia: string; torque: string; speed: string }
> = {
  leadscrew: {
    inertia: "J = [ J_screw + m·(P_B/2π)² ] / i²",
    torque: "T_L = [ T_brk + F·P_B/(2πη) ] / i",
    speed: "ω = i · 2π·V / P_B",
  },
  belt: {
    inertia: "J = [ m·R² + ½·m_pulley·R² (+ belt) ] / i²",
    torque: "T_L = F·R / (η·i)",
    speed: "ω = i · V / R",
  },
  rack: {
    inertia: "J = [ m·R_p² + ½·m_pinion·R_p² ] / i²",
    torque: "T_L = F·R_p / (η·i)",
    speed: "ω = i · V / R_p",
  },
  index: {
    inertia: "J = [ ½·M·R² + Σ m·d² + J_fixture ] / i²",
    torque: "T_L = (T_friction + T_process) / (η·i)",
    speed: "ω = i · ω_table",
  },
  direct: {
    inertia: "J = J_load / i²",
    torque: "T_L = T_load / (η·i)",
    speed: "ω = i · ω_load",
  },
};

// Shared across every mechanism.
const COMMON_FORMULAS = [
  "F = F_ext + m·g·(sin β + μ·cos β)",
  "T_a = (J_load/η + J_mech + J_m) · α   (α = ω_peak / t_a)",
  "T_required = (T_L + T_a) × safety factor",
];

// Shared fields reset to each mechanism's sensible starting point on switch.
const MECH_COMMON: Record<
  Mechanism,
  { efficiency: string; maxSpeed: string; moveTime: string }
> = {
  leadscrew: { efficiency: "0.65", maxSpeed: "127", moveTime: "0.5" },
  belt: { efficiency: "0.9", maxSpeed: "", moveTime: "1.5" },
  rack: { efficiency: "0.9", maxSpeed: "", moveTime: "0.5" },
  index: { efficiency: "0.9", maxSpeed: "", moveTime: "0.5" },
  direct: { efficiency: "1", maxSpeed: "", moveTime: "0.15" },
};

const fieldClass =
  "w-full rounded-lg border border-hairline bg-surface px-3 py-2 font-mono text-sm tabular-nums text-ink outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/25";

const DIRECT_DEFAULTS = {
  loadInertia: "2.5086", // kg·cm² (Repanich Ex.1 chuck + bit)
  loadTorque: "0.05",
  moveAngle: "0.2", // rev
};
const SCREW_DEFAULTS = {
  loadMass: "22.68", // kg (50 lb)
  lead: "5.08", // mm/rev
  screwLength: "914.4",
  screwDiameter: "25.4",
  screwDensity: "7750",
  friction: "0.01",
  orientation: "horizontal" as Orientation,
  inclineAngle: "0",
  externalForce: "0",
  breakawayTorque: "0.1765",
  moveDistance: "38.1", // mm
};
const BELT_DEFAULTS = {
  loadMass: "20",
  pulleyRadius: "30", // mm
  drivePulleyMass: "1",
  idlerPulleyMass: "1",
  beltMass: "0.5",
  friction: "0.2",
  orientation: "horizontal" as Orientation,
  inclineAngle: "0",
  externalForce: "0",
  moveDistance: "300", // mm
};
const RACK_DEFAULTS = {
  loadMass: "15",
  pinionRadius: "20", // mm
  pinionMass: "0.5",
  friction: "0.1",
  orientation: "horizontal" as Orientation,
  inclineAngle: "0",
  externalForce: "0",
  moveDistance: "200", // mm
};
const TABLE_DEFAULTS = {
  tableMass: "8",
  tableRadius: "150", // mm
  workpieceMass: "0.5",
  workpieceCount: "6",
  workpieceRadius: "120", // mm
  fixtureInertia: "0", // kg·cm²
  frictionTorque: "0.3",
  processTorque: "0",
  indexAngle: "60", // °
};
const COMMON_DEFAULTS = {
  moveTime: "0.5",
  maxSpeed: "127", // leadscrew Ex.3
  gearRatio: "1",
  efficiency: "0.65",
  safetyFactor: "1.5",
  dwellTime: "0",
};
const SERVO_DEFAULTS = {
  rotorInertia: "1.226", // kg·cm²
  ratedTorque: "0.6",
  peakTorque: "1.0",
  ratedSpeed: "3000", // rpm
};
const STEPPER_DEFAULTS = {
  rotorInertia: "0.48", // kg·cm²
  pulloutTorque: "0.5", // N·m at the operating speed
  ratedSpeed: "600", // rpm
  inertiaRatioLimit: "10",
};
const AC_DEFAULTS = {
  ratedTorque: "0.25", // N·m
  startingTorque: "0.5", // N·m
  ratedSpeed: "1700", // rpm
  rotorInertia: "0", // kg·cm² (optional)
  permissibleInertia: "", // kg·cm² (optional gearhead limit)
};

function Field(props: {
  label: string;
  unit?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-ink-muted">
        {props.label}
        {props.unit ? ` (${props.unit})` : ""}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className={fieldClass}
      />
    </label>
  );
}

function Row(props: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
        {props.label}
      </span>
      <span
        className={`font-mono text-sm tabular-nums ${props.accent ? "text-accent" : "text-ink"}`}
      >
        {props.value}
      </span>
    </div>
  );
}

function MechanismVisual({
  mechanism,
  Icon,
  active,
}: {
  mechanism: Mechanism;
  Icon: ComponentType<{ className?: string }>;
  active: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <Icon className={`h-16 w-16 ${active ? "text-accent" : ""}`} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={MECH_IMAGES[mechanism]}
      alt=""
      onError={() => setFailed(true)}
      className="h-24 w-full object-contain"
    />
  );
}

function Check(props: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
        {props.label}
      </span>
      <span
        className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
          props.ok ? "border-success text-success" : "border-error text-error"
        }`}
      >
        {props.ok ? "OK" : "Over"}
      </span>
    </div>
  );
}

export function MotorSizingCalculator() {
  const [mechanism, setMechanism] = useState<Mechanism | null>(null);
  const [direct, setDirect] = useState(DIRECT_DEFAULTS);
  const [screw, setScrew] = useState(SCREW_DEFAULTS);
  const [belt, setBelt] = useState(BELT_DEFAULTS);
  const [rack, setRack] = useState(RACK_DEFAULTS);
  const [table, setTable] = useState(TABLE_DEFAULTS);
  const [common, setCommon] = useState(COMMON_DEFAULTS);
  const [motorType, setMotorType] = useState<MotorType>("servo");
  const [servo, setServo] = useState(SERVO_DEFAULTS);
  const [stepper, setStepper] = useState(STEPPER_DEFAULTS);
  const [ac, setAc] = useState(AC_DEFAULTS);

  const isLinear =
    mechanism !== null && LINEAR_MECHANISMS.includes(mechanism);

  const result = useMemo<SizingResult | null>(() => {
    if (mechanism === null) return null;
    const n = (s: string) => parseInput(s);
    const moveTime = n(common.moveTime);
    const gearRatio = n(common.gearRatio);
    const efficiency = n(common.efficiency);
    const safetyFactor = n(common.safetyFactor);
    const dwellTime = n(common.dwellTime) ?? 0;
    const maxSpeedRaw = n(common.maxSpeed);
    if (!moveTime || !gearRatio || !efficiency || !safetyFactor) return null;

    let motorSpec: MotorCandidate | undefined;
    if (motorType === "servo") {
      const ji = n(servo.rotorInertia);
      const rt = n(servo.ratedTorque);
      const pt = n(servo.peakTorque);
      const rs = n(servo.ratedSpeed);
      if (ji === null || rt === null || pt === null || rs === null) return null;
      motorSpec = {
        type: "servo",
        rotorInertia: ji * 1e-4,
        ratedTorque: rt,
        peakTorque: pt,
        ratedSpeed: rs * RPM,
      };
    } else if (motorType === "stepper") {
      const ji = n(stepper.rotorInertia);
      const pot = n(stepper.pulloutTorque);
      const rs = n(stepper.ratedSpeed);
      const lim = n(stepper.inertiaRatioLimit);
      if (ji === null || pot === null) return null;
      motorSpec = {
        type: "stepper",
        rotorInertia: ji * 1e-4,
        pulloutTorque: pot,
        ratedSpeed: rs === null ? undefined : rs * RPM,
        inertiaRatioLimit: lim ?? 10,
      };
    } else if (motorType === "ac") {
      const rt = n(ac.ratedTorque);
      const st = n(ac.startingTorque);
      const rs = n(ac.ratedSpeed);
      const ji = n(ac.rotorInertia);
      const pi = n(ac.permissibleInertia);
      if (rt === null || st === null || rs === null) return null;
      motorSpec = {
        type: "ac",
        ratedTorque: rt,
        startingTorque: st,
        ratedSpeed: rs * RPM,
        rotorInertia: (ji ?? 0) * 1e-4,
        permissibleInertia: pi === null ? undefined : pi * 1e-4,
      };
    }

    const shared = {
      moveTime,
      gearRatio,
      efficiency,
      dwellTime,
      safetyFactor,
      motor: motorSpec,
    };

    try {
      let out: SizingResult | null = null;

      if (mechanism === "direct") {
        const loadInertia = n(direct.loadInertia);
        const loadTorque = n(direct.loadTorque);
        const moveAngle = n(direct.moveAngle);
        if (loadInertia === null || loadTorque === null || !moveAngle) {
          return null;
        }
        out = sizeDirectDrive({
          ...shared,
          loadInertia: loadInertia * 1e-4,
          loadTorque,
          moveAngle: moveAngle * REV,
          maxSpeed: maxSpeedRaw === null ? undefined : maxSpeedRaw * REV,
        });
      } else if (mechanism === "leadscrew") {
        const v = {
          loadMass: n(screw.loadMass),
          lead: n(screw.lead),
          screwLength: n(screw.screwLength),
          screwDiameter: n(screw.screwDiameter),
          screwDensity: n(screw.screwDensity),
          moveDistance: n(screw.moveDistance),
        };
        if (
          !v.loadMass ||
          !v.lead ||
          v.screwLength === null ||
          v.screwDiameter === null ||
          !v.screwDensity ||
          !v.moveDistance
        ) {
          return null;
        }
        out = sizeLeadScrew({
          ...shared,
          loadMass: v.loadMass,
          lead: v.lead * 1e-3,
          screwLength: v.screwLength * 1e-3,
          screwRadius: (v.screwDiameter * 1e-3) / 2,
          screwDensity: v.screwDensity,
          friction: n(screw.friction) ?? 0,
          orientation: screw.orientation,
          inclineAngle: (n(screw.inclineAngle) ?? 0) * DEG,
          externalForce: n(screw.externalForce) ?? 0,
          breakawayTorque: n(screw.breakawayTorque) ?? 0,
          moveDistance: v.moveDistance * 1e-3,
          maxSpeed: maxSpeedRaw === null ? undefined : maxSpeedRaw * 1e-3,
        });
      } else if (mechanism === "belt") {
        const loadMass = n(belt.loadMass);
        const pulleyRadius = n(belt.pulleyRadius);
        const moveDistance = n(belt.moveDistance);
        if (!loadMass || !pulleyRadius || !moveDistance) return null;
        out = sizeBeltPulley({
          ...shared,
          loadMass,
          pulleyRadius: pulleyRadius * 1e-3,
          drivePulleyMass: n(belt.drivePulleyMass) ?? 0,
          idlerPulleyMass: n(belt.idlerPulleyMass) ?? 0,
          beltMass: n(belt.beltMass) ?? 0,
          friction: n(belt.friction) ?? 0,
          orientation: belt.orientation,
          inclineAngle: (n(belt.inclineAngle) ?? 0) * DEG,
          externalForce: n(belt.externalForce) ?? 0,
          moveDistance: moveDistance * 1e-3,
          maxSpeed: maxSpeedRaw === null ? undefined : maxSpeedRaw * 1e-3,
        });
      } else if (mechanism === "rack") {
        const loadMass = n(rack.loadMass);
        const pinionRadius = n(rack.pinionRadius);
        const moveDistance = n(rack.moveDistance);
        if (!loadMass || !pinionRadius || !moveDistance) return null;
        out = sizeRackPinion({
          ...shared,
          loadMass,
          pinionRadius: pinionRadius * 1e-3,
          pinionMass: n(rack.pinionMass) ?? 0,
          friction: n(rack.friction) ?? 0,
          orientation: rack.orientation,
          inclineAngle: (n(rack.inclineAngle) ?? 0) * DEG,
          externalForce: n(rack.externalForce) ?? 0,
          moveDistance: moveDistance * 1e-3,
          maxSpeed: maxSpeedRaw === null ? undefined : maxSpeedRaw * 1e-3,
        });
      } else {
        const tableMass = n(table.tableMass);
        const tableRadius = n(table.tableRadius);
        const indexAngle = n(table.indexAngle);
        if (tableMass === null || !tableRadius || !indexAngle) return null;
        out = sizeIndexTable({
          ...shared,
          tableMass,
          tableRadius: tableRadius * 1e-3,
          workpieceMass: n(table.workpieceMass) ?? 0,
          workpieceCount: n(table.workpieceCount) ?? 0,
          workpieceRadius: (n(table.workpieceRadius) ?? 0) * 1e-3,
          fixtureInertia: (n(table.fixtureInertia) ?? 0) * 1e-4,
          frictionTorque: n(table.frictionTorque) ?? 0,
          processTorque: n(table.processTorque) ?? 0,
          indexAngle: indexAngle * DEG,
          maxSpeed: maxSpeedRaw === null ? undefined : maxSpeedRaw * REV,
        });
      }

      return out && Number.isFinite(out.peakTorque) ? out : null;
    } catch {
      return null;
    }
  }, [mechanism, direct, screw, belt, rack, table, common, motorType, servo, stepper, ac]);

  const f = (x: number) => formatResult(x, 4);

  // Orientation + incline + external-force block shared by belt/rack/screw.
  function orientationFields(
    state: OrientationState,
    set: (patch: Partial<OrientationState>) => void,
  ) {
    return (
      <>
        <label className="block">
          <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            Orientation
          </span>
          <select
            value={state.orientation}
            onChange={(e) =>
              set({ orientation: e.target.value as Orientation })
            }
            className={fieldClass}
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
            <option value="incline">Incline</option>
          </select>
        </label>
        {state.orientation === "incline" && (
          <Field
            label="Incline angle"
            unit="°"
            value={state.inclineAngle}
            onChange={(v) => set({ inclineAngle: v })}
          />
        )}
        <Field
          label="External force"
          unit="N"
          value={state.externalForce}
          onChange={(v) => set({ externalForce: v })}
        />
      </>
    );
  }

  return (
    <div>
      {/* Mechanism — illustration cards */}
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        role="group"
        aria-label="Drive mechanism"
      >
        {MECHANISMS.map(([id, label, MechIcon]) => {
          const active = id === mechanism;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setMechanism(id);
                setCommon((c) => ({ ...c, ...MECH_COMMON[id] }));
              }}
              className={`flex flex-col items-center justify-end gap-2 rounded-lg border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 ${
                active
                  ? "border-accent bg-accent/5 text-ink"
                  : "border-hairline bg-surface text-ink-muted hover:border-accent hover:text-ink"
              }`}
            >
              <MechanismVisual mechanism={id} Icon={MechIcon} active={active} />
              <span className="text-center font-mono text-[10px] uppercase tracking-widest leading-tight">
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {mechanism === null ? (
        <p className="mt-10 max-w-md font-mono text-sm leading-relaxed text-ink-muted">
          Select a drive mechanism above to reveal its formulas and input
          parameters.
        </p>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-12">
          {/* Inputs */}
          <div className="space-y-8">
            {/* Formulas for the selected mechanism */}
            <div className="rounded-lg border border-hairline bg-canvas p-4">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-accent">
            Formulas — {MECHANISMS.find((m) => m[0] === mechanism)?.[1]}
          </p>
          <dl className="space-y-2 font-mono text-xs text-ink">
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-ink-faint">
                Reflected inertia
              </dt>
              <dd className="mt-0.5">{FORMULAS[mechanism].inertia}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-ink-faint">
                Load torque
              </dt>
              <dd className="mt-0.5">{FORMULAS[mechanism].torque}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-ink-faint">
                Motor speed
              </dt>
              <dd className="mt-0.5">{FORMULAS[mechanism].speed}</dd>
            </div>
          </dl>
          <div className="mt-3 space-y-1 border-t border-hairline pt-3 font-mono text-[11px] text-ink-muted">
            {COMMON_FORMULAS.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        {/* Mechanism inputs */}
        <fieldset className="rounded-lg border border-hairline bg-surface p-5">
          <legend className="px-2 font-mono text-[10px] uppercase tracking-widest text-accent">
            Mechanism
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {mechanism === "direct" && (
              <>
                <Field
                  label="Load inertia"
                  unit="kg·cm²"
                  value={direct.loadInertia}
                  onChange={(v) => setDirect({ ...direct, loadInertia: v })}
                />
                <Field
                  label="Load torque"
                  unit="N·m"
                  value={direct.loadTorque}
                  onChange={(v) => setDirect({ ...direct, loadTorque: v })}
                />
              </>
            )}

            {mechanism === "leadscrew" && (
              <>
                <Field
                  label="Load mass"
                  unit="kg"
                  value={screw.loadMass}
                  onChange={(v) => setScrew({ ...screw, loadMass: v })}
                />
                <Field
                  label="Screw lead"
                  unit="mm/rev"
                  value={screw.lead}
                  onChange={(v) => setScrew({ ...screw, lead: v })}
                />
                <Field
                  label="Screw length"
                  unit="mm"
                  value={screw.screwLength}
                  onChange={(v) => setScrew({ ...screw, screwLength: v })}
                />
                <Field
                  label="Screw diameter"
                  unit="mm"
                  value={screw.screwDiameter}
                  onChange={(v) => setScrew({ ...screw, screwDiameter: v })}
                />
                <Field
                  label="Screw density"
                  unit="kg/m³"
                  value={screw.screwDensity}
                  onChange={(v) => setScrew({ ...screw, screwDensity: v })}
                />
                <Field
                  label="Friction μ"
                  value={screw.friction}
                  onChange={(v) => setScrew({ ...screw, friction: v })}
                />
                <Field
                  label="Breakaway torque"
                  unit="N·m"
                  value={screw.breakawayTorque}
                  onChange={(v) =>
                    setScrew({ ...screw, breakawayTorque: v })
                  }
                />
                {orientationFields(screw, (patch) =>
                  setScrew({ ...screw, ...patch }),
                )}
              </>
            )}

            {mechanism === "belt" && (
              <>
                <Field
                  label="Load mass"
                  unit="kg"
                  value={belt.loadMass}
                  onChange={(v) => setBelt({ ...belt, loadMass: v })}
                />
                <Field
                  label="Pulley radius"
                  unit="mm"
                  value={belt.pulleyRadius}
                  onChange={(v) => setBelt({ ...belt, pulleyRadius: v })}
                />
                <Field
                  label="Drive pulley mass"
                  unit="kg"
                  value={belt.drivePulleyMass}
                  onChange={(v) => setBelt({ ...belt, drivePulleyMass: v })}
                />
                <Field
                  label="Idler pulley mass"
                  unit="kg"
                  value={belt.idlerPulleyMass}
                  onChange={(v) => setBelt({ ...belt, idlerPulleyMass: v })}
                />
                <Field
                  label="Belt mass"
                  unit="kg"
                  value={belt.beltMass}
                  onChange={(v) => setBelt({ ...belt, beltMass: v })}
                />
                <Field
                  label="Friction μ"
                  value={belt.friction}
                  onChange={(v) => setBelt({ ...belt, friction: v })}
                />
                {orientationFields(belt, (patch) =>
                  setBelt({ ...belt, ...patch }),
                )}
              </>
            )}

            {mechanism === "rack" && (
              <>
                <Field
                  label="Load mass"
                  unit="kg"
                  value={rack.loadMass}
                  onChange={(v) => setRack({ ...rack, loadMass: v })}
                />
                <Field
                  label="Pinion radius"
                  unit="mm"
                  value={rack.pinionRadius}
                  onChange={(v) => setRack({ ...rack, pinionRadius: v })}
                />
                <Field
                  label="Pinion mass"
                  unit="kg"
                  value={rack.pinionMass}
                  onChange={(v) => setRack({ ...rack, pinionMass: v })}
                />
                <Field
                  label="Friction μ"
                  value={rack.friction}
                  onChange={(v) => setRack({ ...rack, friction: v })}
                />
                {orientationFields(rack, (patch) =>
                  setRack({ ...rack, ...patch }),
                )}
              </>
            )}

            {mechanism === "index" && (
              <>
                <Field
                  label="Table mass"
                  unit="kg"
                  value={table.tableMass}
                  onChange={(v) => setTable({ ...table, tableMass: v })}
                />
                <Field
                  label="Table radius"
                  unit="mm"
                  value={table.tableRadius}
                  onChange={(v) => setTable({ ...table, tableRadius: v })}
                />
                <Field
                  label="Workpiece mass"
                  unit="kg"
                  value={table.workpieceMass}
                  onChange={(v) => setTable({ ...table, workpieceMass: v })}
                />
                <Field
                  label="Workpiece count"
                  value={table.workpieceCount}
                  onChange={(v) => setTable({ ...table, workpieceCount: v })}
                />
                <Field
                  label="Workpiece radius"
                  unit="mm"
                  value={table.workpieceRadius}
                  onChange={(v) => setTable({ ...table, workpieceRadius: v })}
                />
                <Field
                  label="Fixture inertia"
                  unit="kg·cm²"
                  value={table.fixtureInertia}
                  onChange={(v) => setTable({ ...table, fixtureInertia: v })}
                />
                <Field
                  label="Friction torque"
                  unit="N·m"
                  value={table.frictionTorque}
                  onChange={(v) => setTable({ ...table, frictionTorque: v })}
                />
                <Field
                  label="Process torque"
                  unit="N·m"
                  value={table.processTorque}
                  onChange={(v) => setTable({ ...table, processTorque: v })}
                />
              </>
            )}
          </div>
        </fieldset>

        {/* Motion */}
        <fieldset className="rounded-lg border border-hairline bg-surface p-5">
          <legend className="px-2 font-mono text-[10px] uppercase tracking-widest text-accent">
            Motion
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {mechanism === "direct" && (
              <Field
                label="Move angle"
                unit="rev"
                value={direct.moveAngle}
                onChange={(v) => setDirect({ ...direct, moveAngle: v })}
              />
            )}
            {mechanism === "index" && (
              <Field
                label="Index angle"
                unit="°"
                value={table.indexAngle}
                onChange={(v) => setTable({ ...table, indexAngle: v })}
              />
            )}
            {mechanism === "leadscrew" && (
              <Field
                label="Move distance"
                unit="mm"
                value={screw.moveDistance}
                onChange={(v) => setScrew({ ...screw, moveDistance: v })}
              />
            )}
            {mechanism === "belt" && (
              <Field
                label="Move distance"
                unit="mm"
                value={belt.moveDistance}
                onChange={(v) => setBelt({ ...belt, moveDistance: v })}
              />
            )}
            {mechanism === "rack" && (
              <Field
                label="Move distance"
                unit="mm"
                value={rack.moveDistance}
                onChange={(v) => setRack({ ...rack, moveDistance: v })}
              />
            )}
            <Field
              label="Move time"
              unit="s"
              value={common.moveTime}
              onChange={(v) => setCommon({ ...common, moveTime: v })}
            />
            <Field
              label="Max speed (optional)"
              unit={isLinear ? "mm/s" : "rev/s"}
              value={common.maxSpeed}
              onChange={(v) => setCommon({ ...common, maxSpeed: v })}
            />
            <Field
              label="Dwell time"
              unit="s"
              value={common.dwellTime}
              onChange={(v) => setCommon({ ...common, dwellTime: v })}
            />
          </div>
        </fieldset>

        {/* Drive */}
        <fieldset className="rounded-lg border border-hairline bg-surface p-5">
          <legend className="px-2 font-mono text-[10px] uppercase tracking-widest text-accent">
            Drive
          </legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Gear ratio i"
              value={common.gearRatio}
              onChange={(v) => setCommon({ ...common, gearRatio: v })}
            />
            <Field
              label="Efficiency η"
              value={common.efficiency}
              onChange={(v) => setCommon({ ...common, efficiency: v })}
            />
            <Field
              label="Safety factor"
              value={common.safetyFactor}
              onChange={(v) => setCommon({ ...common, safetyFactor: v })}
            />
          </div>
        </fieldset>

        {/* Candidate motor */}
        <fieldset className="rounded-lg border border-hairline bg-surface p-5">
          <legend className="px-2 font-mono text-[10px] uppercase tracking-widest text-accent">
            Candidate motor
          </legend>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Motor type"
          >
            {(
              [
                ["none", "None"],
                ["servo", "Servo"],
                ["stepper", "Stepper"],
                ["ac", "AC Induction"],
              ] as [MotorType, string][]
            ).map(([id, label]) => {
              const active = id === motorType;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setMotorType(id);
                    if (id === "stepper" || id === "ac") {
                      setCommon((c) => ({ ...c, safetyFactor: "2" }));
                    } else if (id === "servo") {
                      setCommon((c) => ({ ...c, safetyFactor: "1.5" }));
                    }
                  }}
                  className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    active
                      ? "border-ink bg-ink text-on-dark"
                      : "border-hairline bg-surface text-ink-muted hover:border-accent hover:text-accent"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {motorType === "servo" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Rotor inertia"
                unit="kg·cm²"
                value={servo.rotorInertia}
                onChange={(v) => setServo({ ...servo, rotorInertia: v })}
              />
              <Field
                label="Rated (cont.) torque"
                unit="N·m"
                value={servo.ratedTorque}
                onChange={(v) => setServo({ ...servo, ratedTorque: v })}
              />
              <Field
                label="Peak torque"
                unit="N·m"
                value={servo.peakTorque}
                onChange={(v) => setServo({ ...servo, peakTorque: v })}
              />
              <Field
                label="Rated speed"
                unit="rpm"
                value={servo.ratedSpeed}
                onChange={(v) => setServo({ ...servo, ratedSpeed: v })}
              />
            </div>
          )}

          {motorType === "stepper" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Rotor inertia"
                unit="kg·cm²"
                value={stepper.rotorInertia}
                onChange={(v) => setStepper({ ...stepper, rotorInertia: v })}
              />
              <Field
                label="Pull-out torque @ speed"
                unit="N·m"
                value={stepper.pulloutTorque}
                onChange={(v) => setStepper({ ...stepper, pulloutTorque: v })}
              />
              <Field
                label="Max speed"
                unit="rpm"
                value={stepper.ratedSpeed}
                onChange={(v) => setStepper({ ...stepper, ratedSpeed: v })}
              />
              <Field
                label="Inertia ratio limit"
                value={stepper.inertiaRatioLimit}
                onChange={(v) =>
                  setStepper({ ...stepper, inertiaRatioLimit: v })
                }
              />
            </div>
          )}

          {motorType === "ac" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Rated (cont.) torque"
                unit="N·m"
                value={ac.ratedTorque}
                onChange={(v) => setAc({ ...ac, ratedTorque: v })}
              />
              <Field
                label="Starting torque"
                unit="N·m"
                value={ac.startingTorque}
                onChange={(v) => setAc({ ...ac, startingTorque: v })}
              />
              <Field
                label="Rated speed"
                unit="rpm"
                value={ac.ratedSpeed}
                onChange={(v) => setAc({ ...ac, ratedSpeed: v })}
              />
              <Field
                label="Rotor inertia"
                unit="kg·cm²"
                value={ac.rotorInertia}
                onChange={(v) => setAc({ ...ac, rotorInertia: v })}
              />
              <Field
                label="Permissible inertia"
                unit="kg·cm²"
                value={ac.permissibleInertia}
                onChange={(v) => setAc({ ...ac, permissibleInertia: v })}
              />
            </div>
          )}
        </fieldset>
      </div>

      {/* Results */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-ink-faint">
          Results
        </p>
        <div className="rounded-lg border border-hairline bg-surface p-5">
          {result === null ? (
            <p className="font-mono text-sm text-ink-muted">
              Enter valid numbers to see results.
            </p>
          ) : (
            <>
              {/* Headline readout — the value you size the motor to */}
              <div className="border-b border-hairline pb-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                  Required torque (×SF)
                </p>
                <p className="mt-1 font-mono text-3xl leading-none tabular-nums text-accent">
                  {f(result.requiredTorque)}
                  <span className="ml-1.5 text-base text-ink-faint">N·m</span>
                </p>
              </div>

              <div className="divide-y divide-hairline pt-1">
                <Row
                  label="Peak speed"
                  value={`${f(result.peakSpeed / RPM)} rpm`}
                />
                <Row
                  label="Accel. torque"
                  value={`${f(result.accelTorque)} N·m`}
                />
                <Row label="Load torque" value={`${f(result.loadTorque)} N·m`} />
                <Row
                  label="Peak torque"
                  value={`${f(result.peakTorque)} N·m`}
                  accent
                />
                <Row label="RMS torque" value={`${f(result.rmsTorque)} N·m`} />
                <Row label="Peak power" value={`${f(result.peakPower)} W`} />
                <Row
                  label="Load inertia"
                  value={`${f(result.totalLoadInertia * 1e4)} kg·cm²`}
                />
                {result.inertiaRatio !== null && (
                  <Row
                    label="Inertia ratio"
                    value={`${f(result.inertiaRatio)} : 1`}
                  />
                )}
                <Row label="Duty cycle" value={`${f(result.dutyCycle)} %`} />
              </div>

              {result.acceptance && (
                <div className="mt-4 border-t border-hairline pt-4">
                  {/* Verdict — pass or undersized, stated plainly */}
                  <div
                    className={`mb-3 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                      result.acceptance.pass
                        ? "border-success/40 bg-success/5"
                        : "border-error/40 bg-error/5"
                    }`}
                  >
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                      {result.acceptance.type === "servo"
                        ? "Servo check"
                        : result.acceptance.type === "stepper"
                          ? "Stepper check"
                          : "AC motor check"}
                    </span>
                    <span
                      className={`font-mono text-xs font-semibold uppercase tracking-widest ${
                        result.acceptance.pass ? "text-success" : "text-error"
                      }`}
                    >
                      {result.acceptance.pass ? "Pass" : "Undersized"}
                    </span>
                  </div>

                  {result.acceptance.type === "servo" && (
                    <>
                      <Check
                        label="Peak ≤ motor peak"
                        ok={result.acceptance.peakTorqueOk}
                      />
                      <Check
                        label="RMS ≤ rated"
                        ok={result.acceptance.rmsTorqueOk}
                      />
                      <Check label="Speed ≤ rated" ok={result.acceptance.speedOk} />
                      <Check
                        label="Inertia ratio ≤ 10"
                        ok={result.acceptance.inertiaRatioOk}
                      />
                      {!result.acceptance.inertiaRatioIdeal &&
                        result.acceptance.inertiaRatioOk && (
                          <p className="mt-2 font-mono text-[10px] text-ink-muted">
                            Ratio above 5:1 — fine, but harder to tune.
                          </p>
                        )}
                    </>
                  )}

                  {result.acceptance.type === "stepper" && (
                    <>
                      <Check
                        label="Required ≤ pull-out"
                        ok={result.acceptance.torqueOk}
                      />
                      <Check
                        label={`Inertia ratio ≤ ${f(result.acceptance.inertiaRatioLimit)}`}
                        ok={result.acceptance.inertiaRatioOk}
                      />
                      <Check label="Speed ≤ max" ok={result.acceptance.speedOk} />
                      <Check
                        label="Duty cycle < 50%"
                        ok={result.acceptance.dutyCycleOk}
                      />
                    </>
                  )}

                  {result.acceptance.type === "ac" && (
                    <>
                      <Check
                        label="Required ≤ starting"
                        ok={result.acceptance.startingOk}
                      />
                      <Check
                        label="Running ≤ rated"
                        ok={result.acceptance.ratedOk}
                      />
                      <Check label="Speed ≤ rated" ok={result.acceptance.speedOk} />
                      {result.acceptance.inertiaOk !== null && (
                        <Check
                          label="Inertia ≤ permissible"
                          ok={result.acceptance.inertiaOk}
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
        </div>
      )}
    </div>
  );
}
