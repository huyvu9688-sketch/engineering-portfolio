// Motor sizing — pure logic. See context/calculator-specs.md §3.
//
// All math is coherent SI: m, kg, N, rad, rad/s, rad/s², kg·m², N·m, W, s.
// The UI converts friendly units (rpm, mm, °, …) to SI before calling these
// and converts results back for display. Method: Repanich (CSU Chico) +
// Oriental Motor. Verified against worked examples in motor-sizing.test.ts.

export const G = 9.80665; // standard gravity, m/s²

// ---------------------------------------------------------------------------
// Inertia building blocks (kg·m²)
// ---------------------------------------------------------------------------

/** Solid cylinder about its own axis: J = ½·m·R². */
export function solidCylinderInertia(massKg: number, radiusM: number): number {
  return 0.5 * massKg * radiusM ** 2;
}

/** Hollow cylinder about its axis: J = ½·m·(Ro² + Ri²). */
export function hollowCylinderInertia(
  massKg: number,
  outerRadiusM: number,
  innerRadiusM: number,
): number {
  return 0.5 * massKg * (outerRadiusM ** 2 + innerRadiusM ** 2);
}

/** Mass of a solid cylinder: m = π·L·ρ·R². */
export function cylinderMass(
  densityKgM3: number,
  lengthM: number,
  radiusM: number,
): number {
  return Math.PI * lengthM * densityKgM3 * radiusM ** 2;
}

/** Solid cylinder inertia straight from geometry: J = (π/2)·ρ·L·R⁴. */
export function solidCylinderInertiaFromGeometry(
  densityKgM3: number,
  lengthM: number,
  radiusM: number,
): number {
  return (Math.PI / 2) * densityKgM3 * lengthM * radiusM ** 4;
}

/** Parallel-axis theorem: J about an axis a distance d from the c.g. */
export function parallelAxisInertia(
  inertiaCgKgM2: number,
  massKg: number,
  distanceM: number,
): number {
  return inertiaCgKgM2 + massKg * distanceM ** 2;
}

/** Reflect an inertia through a reduction ratio i to the motor shaft: J/i². */
export function reflectInertia(inertiaKgM2: number, gearRatio: number): number {
  return inertiaKgM2 / gearRatio ** 2;
}

// ---------------------------------------------------------------------------
// Force assembly (N) — total linear resisting force at the load
// ---------------------------------------------------------------------------

export type Orientation = "horizontal" | "vertical" | "incline";

export interface ForceInput {
  massKg: number;
  orientation: Orientation;
  /** dynamic friction coefficient μ */
  frictionCoeff: number;
  /** any process / thrust force, N */
  externalForceN?: number;
  /** incline angle β (rad), only for orientation "incline" */
  inclineAngleRad?: number;
}

export function loadForce(input: ForceInput): number {
  const {
    massKg,
    orientation,
    frictionCoeff,
    externalForceN = 0,
    inclineAngleRad = 0,
  } = input;
  const weight = massKg * G;
  let resisting: number;
  if (orientation === "horizontal") {
    resisting = frictionCoeff * weight;
  } else if (orientation === "vertical") {
    resisting = weight;
  } else {
    resisting =
      weight *
      (Math.sin(inclineAngleRad) + frictionCoeff * Math.cos(inclineAngleRad));
  }
  return resisting + externalForceN;
}

// ---------------------------------------------------------------------------
// Motion profile
// ---------------------------------------------------------------------------

export type ProfileKind = "triangular" | "trapezoidal";

export interface MotionProfile {
  /** peak (cruise) speed — m/s for linear, rad/s for rotary */
  peakSpeed: number;
  /** acceleration — m/s² or rad/s² */
  acceleration: number;
  /** acceleration ramp time, s */
  accelTime: number;
  /** constant-speed (cruise) time, s — 0 for triangular */
  cruiseTime: number;
  /** deceleration ramp time, s (equals accelTime) */
  decelTime: number;
  kind: ProfileKind;
}

/**
 * Build a point-to-point move profile.
 * `distance` is the total move (m or rad), `moveTime` the total time (s).
 * If `maxSpeed` is given and the triangular peak would exceed it, switch to a
 * trapezoidal profile capped at `maxSpeed`.
 */
export function motionProfile(
  distance: number,
  moveTime: number,
  maxSpeed?: number,
): MotionProfile {
  const triangularPeak = (2 * distance) / moveTime;

  if (maxSpeed === undefined || triangularPeak <= maxSpeed) {
    const accelTime = moveTime / 2;
    return {
      peakSpeed: triangularPeak,
      acceleration: triangularPeak / accelTime,
      accelTime,
      cruiseTime: 0,
      decelTime: accelTime,
      kind: "triangular",
    };
  }

  const peakSpeed = maxSpeed;
  const accelTime = moveTime - distance / peakSpeed;
  return {
    peakSpeed,
    acceleration: peakSpeed / accelTime,
    accelTime,
    cruiseTime: moveTime - 2 * accelTime,
    decelTime: accelTime,
    kind: "trapezoidal",
  };
}

/** Scale a linear profile to a rotary one at the motor shaft (factor rad/m). */
function toRotaryProfile(
  linear: MotionProfile,
  radPerMetre: number,
): MotionProfile {
  return {
    peakSpeed: linear.peakSpeed * radPerMetre,
    acceleration: linear.acceleration * radPerMetre,
    accelTime: linear.accelTime,
    cruiseTime: linear.cruiseTime,
    decelTime: linear.decelTime,
    kind: linear.kind,
  };
}

// ---------------------------------------------------------------------------
// Torque / RMS / power
// ---------------------------------------------------------------------------

/** RMS torque over a sequence of (torque, time) segments. */
export function rmsTorque(
  segments: { torque: number; time: number }[],
): number {
  const totalTime = segments.reduce((sum, s) => sum + s.time, 0);
  if (totalTime <= 0) return 0;
  const weighted = segments.reduce(
    (sum, s) => sum + s.torque ** 2 * s.time,
    0,
  );
  return Math.sqrt(weighted / totalTime);
}

// ---------------------------------------------------------------------------
// Candidate motors + acceptance (servo / stepper / AC induction)
// ---------------------------------------------------------------------------

export interface ServoSpec {
  type: "servo";
  rotorInertia: number; // J_m, kg·m²
  ratedTorque: number; // continuous, N·m
  peakTorque: number; // instantaneous, N·m
  ratedSpeed: number; // rad/s
}

export interface StepperSpec {
  type: "stepper";
  rotorInertia: number; // J_m, kg·m²
  /** pull-out torque AT the operating speed (read off the speed–torque curve), N·m */
  pulloutTorque: number;
  ratedSpeed?: number; // rad/s (optional cap)
  /** load-to-motor inertia ratio limit (default 10; high-res steppers tolerate ~30) */
  inertiaRatioLimit?: number;
}

export interface ACSpec {
  type: "ac";
  ratedTorque: number; // continuous, N·m
  startingTorque: number; // start-up torque, N·m
  ratedSpeed: number; // rad/s
  rotorInertia?: number; // kg·m² (optional; default 0)
  permissibleInertia?: number; // max reflected load inertia (gearhead limit), kg·m²
}

export type MotorCandidate = ServoSpec | StepperSpec | ACSpec;

export interface ServoCheck {
  type: "servo";
  peakTorqueOk: boolean;
  rmsTorqueOk: boolean;
  speedOk: boolean;
  inertiaRatioOk: boolean; // ≤ 10
  inertiaRatioIdeal: boolean; // ≤ 5
  pass: boolean;
  peakTorqueMargin: number;
  rmsTorqueMargin: number;
  speedMargin: number;
}

export interface StepperCheck {
  type: "stepper";
  torqueOk: boolean; // required torque ≤ pull-out
  inertiaRatioOk: boolean;
  speedOk: boolean;
  dutyCycleOk: boolean; // running duty < 50 %
  pass: boolean;
  torqueMargin: number;
  inertiaRatio: number;
  inertiaRatioLimit: number;
  dutyCycle: number; // %
}

export interface ACCheck {
  type: "ac";
  startingOk: boolean; // required torque ≤ starting torque
  ratedOk: boolean; // running (load) torque ≤ rated
  speedOk: boolean;
  inertiaOk: boolean | null; // reflected inertia ≤ permissible (null if not given)
  pass: boolean;
  startingMargin: number;
  ratedMargin: number;
}

export type Acceptance = ServoCheck | StepperCheck | ACCheck;

/** Servo: peak ≤ motor peak, RMS ≤ rated, speed ≤ rated, inertia ratio ≤ 10. */
export function evaluateServo(
  motor: ServoSpec,
  peakTorque: number,
  rms: number,
  peakSpeed: number,
  inertiaRatio: number,
): ServoCheck {
  const peakTorqueOk = peakTorque <= motor.peakTorque;
  const rmsTorqueOk = rms <= motor.ratedTorque;
  const speedOk = peakSpeed <= motor.ratedSpeed;
  const inertiaRatioOk = inertiaRatio <= 10;
  return {
    type: "servo",
    peakTorqueOk,
    rmsTorqueOk,
    speedOk,
    inertiaRatioOk,
    inertiaRatioIdeal: inertiaRatio <= 5,
    pass: peakTorqueOk && rmsTorqueOk && speedOk && inertiaRatioOk,
    peakTorqueMargin: (motor.peakTorque - peakTorque) / peakTorque,
    rmsTorqueMargin: (motor.ratedTorque - rms) / rms,
    speedMargin: (motor.ratedSpeed - peakSpeed) / peakSpeed,
  };
}

/**
 * Stepper: the required torque (incl. safety factor) must fall within the
 * pull-out torque at the operating speed; inertia ratio ≤ limit; the running
 * duty cycle should stay below 50 % (steppers aren't for continuous duty).
 */
export function evaluateStepper(
  motor: StepperSpec,
  requiredTorque: number,
  peakSpeed: number,
  inertiaRatio: number,
  dutyCycle: number,
): StepperCheck {
  const limit = motor.inertiaRatioLimit ?? 10;
  const torqueOk = requiredTorque <= motor.pulloutTorque;
  const inertiaRatioOk = inertiaRatio <= limit;
  const speedOk =
    motor.ratedSpeed === undefined || peakSpeed <= motor.ratedSpeed;
  const dutyCycleOk = dutyCycle <= 50;
  return {
    type: "stepper",
    torqueOk,
    inertiaRatioOk,
    speedOk,
    dutyCycleOk,
    pass: torqueOk && inertiaRatioOk && speedOk && dutyCycleOk,
    torqueMargin: (motor.pulloutTorque - requiredTorque) / requiredTorque,
    inertiaRatio,
    inertiaRatioLimit: limit,
    dutyCycle,
  };
}

/**
 * AC induction / gearmotor: sized by torque, not acceleration. The required
 * (worst-case) torque must be within the motor's starting torque; the steady
 * running (load) torque within the rated torque; speed within rated; and the
 * reflected inertia within the gearhead's permissible inertia (if given).
 */
export function evaluateAC(
  motor: ACSpec,
  requiredTorque: number,
  loadTorque: number,
  peakSpeed: number,
  totalLoadInertia: number,
): ACCheck {
  const startingOk = requiredTorque <= motor.startingTorque;
  const ratedOk = loadTorque <= motor.ratedTorque;
  const speedOk = peakSpeed <= motor.ratedSpeed;
  const inertiaOk =
    motor.permissibleInertia === undefined
      ? null
      : totalLoadInertia <= motor.permissibleInertia;
  return {
    type: "ac",
    startingOk,
    ratedOk,
    speedOk,
    inertiaOk,
    pass: startingOk && ratedOk && speedOk && inertiaOk !== false,
    startingMargin: (motor.startingTorque - requiredTorque) / requiredTorque,
    ratedMargin: (motor.ratedTorque - loadTorque) / loadTorque,
  };
}

// ---------------------------------------------------------------------------
// Core drive evaluation
// ---------------------------------------------------------------------------

export interface DriveContributions {
  /** driven-load inertia reflected to the motor shaft, BEFORE the /η (kg·m²) */
  drivenLoadInertia: number;
  /** screw/pulley/pinion/coupler/reducer inertia reflected to motor (kg·m²) */
  transmissionInertia: number;
  /** mechanism efficiency η (0–1) */
  efficiency: number;
  /** constant resisting torque at the motor shaft (N·m), efficiency+gear folded in */
  loadTorque: number;
  /** torque held at rest, e.g. gravity on a vertical axis (N·m) */
  holdingTorque: number;
  /** rotary motion profile at the motor shaft */
  motion: MotionProfile;
  /** rest/dwell time between moves (s) */
  dwellTime: number;
  /** design safety factor applied to peak torque */
  safetyFactor: number;
  motor?: MotorCandidate;
}

export interface SizingResult {
  peakSpeed: number; // rad/s (motor)
  acceleration: number; // rad/s²
  accelTorque: number; // N·m (includes motor rotor inertia when a motor is given)
  loadTorque: number; // N·m
  peakTorque: number; // N·m
  requiredTorque: number; // N·m (peak × safety factor)
  rmsTorque: number; // N·m
  peakPower: number; // W
  totalLoadInertia: number; // kg·m² (driven load + transmission, reflected)
  runningTime: number; // accel + cruise + decel (s)
  dutyCycle: number; // running / (running + dwell) × 100, %
  inertiaRatio: number | null; // J_load / J_m (null for AC without rotor inertia)
  acceptance: Acceptance | null;
}

function rotorInertiaOf(motor?: MotorCandidate): number {
  if (!motor) return 0;
  if (motor.type === "ac") return motor.rotorInertia ?? 0;
  return motor.rotorInertia;
}

export function evaluateDrive(c: DriveContributions): SizingResult {
  const accelInertia =
    c.drivenLoadInertia / c.efficiency +
    c.transmissionInertia +
    rotorInertiaOf(c.motor);
  const accelTorque = accelInertia * c.motion.acceleration;

  const tAccel = c.loadTorque + accelTorque; // T1
  const tCruise = c.loadTorque; // T2
  const tDecel = c.loadTorque - accelTorque; // T3 (may be negative = regen)
  const tRest = c.holdingTorque; // T4

  const peakTorque = Math.max(
    Math.abs(tAccel),
    Math.abs(tCruise),
    Math.abs(tDecel),
    Math.abs(tRest),
  );
  const requiredTorque = peakTorque * c.safetyFactor;
  const rms = rmsTorque([
    { torque: tAccel, time: c.motion.accelTime },
    { torque: tCruise, time: c.motion.cruiseTime },
    { torque: tDecel, time: c.motion.decelTime },
    { torque: tRest, time: c.dwellTime },
  ]);

  const totalLoadInertia = c.drivenLoadInertia + c.transmissionInertia;
  const runningTime =
    c.motion.accelTime + c.motion.cruiseTime + c.motion.decelTime;
  const dutyCycle = (runningTime / (runningTime + c.dwellTime)) * 100;

  const ji = rotorInertiaOf(c.motor);
  const inertiaRatio = c.motor && ji > 0 ? totalLoadInertia / ji : null;

  let acceptance: Acceptance | null = null;
  if (c.motor?.type === "servo") {
    acceptance = evaluateServo(
      c.motor,
      peakTorque,
      rms,
      c.motion.peakSpeed,
      inertiaRatio ?? Number.POSITIVE_INFINITY,
    );
  } else if (c.motor?.type === "stepper") {
    acceptance = evaluateStepper(
      c.motor,
      requiredTorque,
      c.motion.peakSpeed,
      inertiaRatio ?? Number.POSITIVE_INFINITY,
      dutyCycle,
    );
  } else if (c.motor?.type === "ac") {
    acceptance = evaluateAC(
      c.motor,
      requiredTorque,
      c.loadTorque,
      c.motion.peakSpeed,
      totalLoadInertia,
    );
  }

  return {
    peakSpeed: c.motion.peakSpeed,
    acceleration: c.motion.acceleration,
    accelTorque,
    loadTorque: c.loadTorque,
    peakTorque,
    requiredTorque,
    rmsTorque: rms,
    peakPower: peakTorque * c.motion.peakSpeed,
    totalLoadInertia,
    runningTime,
    dutyCycle,
    inertiaRatio,
    acceptance,
  };
}

// ---------------------------------------------------------------------------
// Mechanism: direct / coupled rotary load
// ---------------------------------------------------------------------------

export interface DirectDriveInput {
  /** summed inertia of rotating bodies at the LOAD shaft (kg·m²) */
  loadInertia: number;
  /** constant resisting torque at the LOAD shaft (N·m) */
  loadTorque: number;
  /** total move angle θ (rad) */
  moveAngle: number;
  /** total move time (s) */
  moveTime: number;
  /** optional max load speed (rad/s) */
  maxSpeed?: number;
  /** extra gear reduction i (default 1) */
  gearRatio?: number;
  /** drive efficiency η (default 1 for a direct coupling) */
  efficiency?: number;
  /** coupler/reducer inertia at the LOAD shaft (kg·m², default 0) */
  transmissionInertia?: number;
  /** holding torque at rest (N·m, default 0) */
  holdingTorque?: number;
  /** rest time between moves (s, default 0) */
  dwellTime?: number;
  /** safety factor (default 1.5) */
  safetyFactor?: number;
  motor?: MotorCandidate;
}

export function sizeDirectDrive(input: DirectDriveInput): SizingResult {
  const i = input.gearRatio ?? 1;
  const efficiency = input.efficiency ?? 1;
  const motion = motionProfile(
    input.moveAngle * i,
    input.moveTime,
    input.maxSpeed === undefined ? undefined : input.maxSpeed * i,
  );
  return evaluateDrive({
    drivenLoadInertia: reflectInertia(input.loadInertia, i),
    transmissionInertia: reflectInertia(input.transmissionInertia ?? 0, i),
    efficiency,
    loadTorque: input.loadTorque / (i * efficiency),
    holdingTorque: input.holdingTorque ?? 0,
    motion,
    dwellTime: input.dwellTime ?? 0,
    safetyFactor: input.safetyFactor ?? 1.5,
    motor: input.motor,
  });
}

// ---------------------------------------------------------------------------
// Mechanism: lead screw / ball screw
// ---------------------------------------------------------------------------

export interface LeadScrewInput {
  /** mass moved linearly, kg */
  loadMass: number;
  /** screw lead P_B (m per rev) */
  lead: number;
  /** screw inertia if known (kg·m²); else give geometry below */
  screwInertia?: number;
  screwLength?: number; // m
  screwRadius?: number; // m
  screwDensity?: number; // kg/m³
  /** coupler inertia at the screw shaft (kg·m², default 0) */
  couplerInertia?: number;
  /** screw/nut efficiency η (default 0.9) */
  efficiency?: number;
  /** friction coefficient μ for the moved mass (default 0) */
  friction?: number;
  /** orientation (default horizontal) */
  orientation?: Orientation;
  /** incline angle β (rad), for orientation "incline" */
  inclineAngle?: number;
  /** external/process force (N, default 0) */
  externalForce?: number;
  /** breakaway torque of the nut (N·m, default 0) */
  breakawayTorque?: number;
  /** total move distance X (m) */
  moveDistance: number;
  /** total move time (s) */
  moveTime: number;
  /** optional max linear speed (m/s) */
  maxSpeed?: number;
  /** extra gear reduction i between motor and screw (default 1) */
  gearRatio?: number;
  /** rest time between moves (s, default 0) */
  dwellTime?: number;
  /** safety factor (default 1.5) */
  safetyFactor?: number;
  motor?: MotorCandidate;
}

export function sizeLeadScrew(input: LeadScrewInput): SizingResult {
  const i = input.gearRatio ?? 1;
  const efficiency = input.efficiency ?? 0.9;
  const orientation = input.orientation ?? "horizontal";

  const screwInertia =
    input.screwInertia ??
    solidCylinderInertiaFromGeometry(
      input.screwDensity ?? 7850,
      input.screwLength ?? 0,
      input.screwRadius ?? 0,
    );

  // Linear mass reflected to the screw shaft: J = m·(P_B/2π)².
  const linearInertia = input.loadMass * (input.lead / (2 * Math.PI)) ** 2;

  const force = loadForce({
    massKg: input.loadMass,
    orientation,
    frictionCoeff: input.friction ?? 0,
    externalForceN: input.externalForce ?? 0,
    inclineAngleRad: input.inclineAngle ?? 0,
  });

  // Load torque at the screw shaft: T = T_breakaway + F·P_B/(2π·η).
  const screwTorque =
    (input.breakawayTorque ?? 0) +
    (force * input.lead) / (2 * Math.PI * efficiency);

  // Linear profile → rotary motor profile (k = rad per metre of travel).
  const linear = motionProfile(
    input.moveDistance,
    input.moveTime,
    input.maxSpeed,
  );
  const radPerMetre = ((2 * Math.PI) / input.lead) * i;
  const motion = toRotaryProfile(linear, radPerMetre);

  return evaluateDrive({
    drivenLoadInertia: reflectInertia(linearInertia, i),
    transmissionInertia: reflectInertia(
      screwInertia + (input.couplerInertia ?? 0),
      i,
    ),
    efficiency,
    loadTorque: screwTorque / i,
    holdingTorque:
      orientation === "vertical"
        ? (input.loadMass * G * input.lead) / (2 * Math.PI * efficiency * i)
        : 0,
    motion,
    dwellTime: input.dwellTime ?? 0,
    safetyFactor: input.safetyFactor ?? 1.5,
    motor: input.motor,
  });
}

// ---------------------------------------------------------------------------
// Tangential drives (belt/pulley/conveyor and rack & pinion)
// ---------------------------------------------------------------------------
// Shared core: a linearly moving load driven through a pulley/pinion of radius
// R. Reflected linear inertia J = m·R²; load torque T = F·R/η; ω = v/R.

interface LinearDriveOptions {
  /** driven mass inertia at the drive axis, before /i² and /η (kg·m²) */
  drivenInertiaAtAxis: number;
  /** pulley/pinion inertia at the drive axis, before /i² (kg·m²) */
  transmissionInertiaAtAxis: number;
  /** drive pulley/pinion pitch radius (m) */
  radius: number;
  /** total linear resisting force (N) */
  force: number;
  /** linear force held at rest, e.g. gravity on a vertical axis (N) */
  holdingForce: number;
  efficiency: number;
  /** linear motion profile (m, m/s, m/s²) */
  linear: MotionProfile;
  gearRatio: number;
  dwellTime: number;
  safetyFactor: number;
  motor?: MotorCandidate;
}

function sizeLinearDrive(opts: LinearDriveOptions): SizingResult {
  const i = opts.gearRatio;
  const radPerMetre = i / opts.radius;
  return evaluateDrive({
    drivenLoadInertia: reflectInertia(opts.drivenInertiaAtAxis, i),
    transmissionInertia: reflectInertia(opts.transmissionInertiaAtAxis, i),
    efficiency: opts.efficiency,
    loadTorque: (opts.force * opts.radius) / (opts.efficiency * i),
    holdingTorque: (opts.holdingForce * opts.radius) / (opts.efficiency * i),
    motion: toRotaryProfile(opts.linear, radPerMetre),
    dwellTime: opts.dwellTime,
    safetyFactor: opts.safetyFactor,
    motor: opts.motor,
  });
}

export interface BeltPulleyInput {
  /** mass moved by the belt (load + carriage), kg */
  loadMass: number;
  /** drive pulley pitch radius, m */
  pulleyRadius: number;
  /** drive pulley mass, kg (default 0) */
  drivePulleyMass?: number;
  /** idler/driven pulley mass, kg (default 0) */
  idlerPulleyMass?: number;
  /** belt mass, kg (default 0) */
  beltMass?: number;
  /** belt-drive efficiency η (default 0.9) */
  efficiency?: number;
  friction?: number;
  orientation?: Orientation;
  inclineAngle?: number;
  externalForce?: number;
  moveDistance: number; // m
  moveTime: number; // s
  maxSpeed?: number; // m/s
  gearRatio?: number;
  dwellTime?: number;
  safetyFactor?: number;
  motor?: MotorCandidate;
}

export function sizeBeltPulley(input: BeltPulleyInput): SizingResult {
  const R = input.pulleyRadius;
  const orientation = input.orientation ?? "horizontal";
  return sizeLinearDrive({
    drivenInertiaAtAxis: (input.loadMass + (input.beltMass ?? 0)) * R ** 2,
    transmissionInertiaAtAxis:
      0.5 * ((input.drivePulleyMass ?? 0) + (input.idlerPulleyMass ?? 0)) *
      R ** 2,
    radius: R,
    force: loadForce({
      massKg: input.loadMass,
      orientation,
      frictionCoeff: input.friction ?? 0,
      externalForceN: input.externalForce ?? 0,
      inclineAngleRad: input.inclineAngle ?? 0,
    }),
    holdingForce: orientation === "vertical" ? input.loadMass * G : 0,
    efficiency: input.efficiency ?? 0.9,
    linear: motionProfile(input.moveDistance, input.moveTime, input.maxSpeed),
    gearRatio: input.gearRatio ?? 1,
    dwellTime: input.dwellTime ?? 0,
    safetyFactor: input.safetyFactor ?? 1.5,
    motor: input.motor,
  });
}

export interface RackPinionInput {
  /** moved mass, kg */
  loadMass: number;
  /** pinion pitch radius, m */
  pinionRadius: number;
  /** pinion mass, kg (default 0) */
  pinionMass?: number;
  /** efficiency η (default 0.9) */
  efficiency?: number;
  friction?: number;
  orientation?: Orientation;
  inclineAngle?: number;
  externalForce?: number;
  moveDistance: number; // m
  moveTime: number; // s
  maxSpeed?: number; // m/s
  gearRatio?: number;
  dwellTime?: number;
  safetyFactor?: number;
  motor?: MotorCandidate;
}

export function sizeRackPinion(input: RackPinionInput): SizingResult {
  const R = input.pinionRadius;
  const orientation = input.orientation ?? "horizontal";
  return sizeLinearDrive({
    drivenInertiaAtAxis: input.loadMass * R ** 2,
    transmissionInertiaAtAxis: 0.5 * (input.pinionMass ?? 0) * R ** 2,
    radius: R,
    force: loadForce({
      massKg: input.loadMass,
      orientation,
      frictionCoeff: input.friction ?? 0,
      externalForceN: input.externalForce ?? 0,
      inclineAngleRad: input.inclineAngle ?? 0,
    }),
    holdingForce: orientation === "vertical" ? input.loadMass * G : 0,
    efficiency: input.efficiency ?? 0.9,
    linear: motionProfile(input.moveDistance, input.moveTime, input.maxSpeed),
    gearRatio: input.gearRatio ?? 1,
    dwellTime: input.dwellTime ?? 0,
    safetyFactor: input.safetyFactor ?? 1.5,
    motor: input.motor,
  });
}

// ---------------------------------------------------------------------------
// Rotary index / dial table (a disc + workpieces at a radius)
// ---------------------------------------------------------------------------

export interface IndexTableInput {
  /** table disc mass, kg */
  tableMass: number;
  /** table disc radius, m */
  tableRadius: number;
  /** mass of one workpiece, kg (default 0) */
  workpieceMass?: number;
  /** number of workpieces (default 0) */
  workpieceCount?: number;
  /** radius at which workpieces sit, m (default 0) */
  workpieceRadius?: number;
  /** extra fixturing inertia, kg·m² (default 0) */
  fixtureInertia?: number;
  /** bearing/seal friction torque at the table, N·m (default 0) */
  frictionTorque?: number;
  /** process torque during the move, N·m (default 0) */
  processTorque?: number;
  /** index angle per move θ, rad */
  indexAngle: number;
  /** total index (move) time, s */
  moveTime: number;
  /** optional max table speed, rad/s */
  maxSpeed?: number;
  gearRatio?: number;
  efficiency?: number;
  dwellTime?: number;
  safetyFactor?: number;
  motor?: MotorCandidate;
}

export function sizeIndexTable(input: IndexTableInput): SizingResult {
  // Workpieces treated as point masses at a radius (parallel-axis: m·d²).
  const workpieceInertia =
    (input.workpieceCount ?? 0) *
    (input.workpieceMass ?? 0) *
    (input.workpieceRadius ?? 0) ** 2;
  const loadInertia =
    solidCylinderInertia(input.tableMass, input.tableRadius) +
    workpieceInertia +
    (input.fixtureInertia ?? 0);

  // A rotary index table is a direct (rotary) drive with a composed inertia.
  return sizeDirectDrive({
    loadInertia,
    loadTorque: (input.frictionTorque ?? 0) + (input.processTorque ?? 0),
    moveAngle: input.indexAngle,
    moveTime: input.moveTime,
    maxSpeed: input.maxSpeed,
    gearRatio: input.gearRatio ?? 1,
    efficiency: input.efficiency ?? 1,
    dwellTime: input.dwellTime ?? 0,
    safetyFactor: input.safetyFactor ?? 1.5,
    motor: input.motor,
  });
}
