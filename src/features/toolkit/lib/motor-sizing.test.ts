// Run with: npm test  (or: node --test src/features/toolkit/lib/motor-sizing.test.ts)
// Worked examples are from Repanich, "Introduction to Motor Sizing" (CSU Chico).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  G,
  loadForce,
  motionProfile,
  rmsTorque,
  evaluateServo,
  evaluateStepper,
  evaluateAC,
  solidCylinderInertiaFromGeometry,
  sizeDirectDrive,
  sizeLeadScrew,
  sizeBeltPulley,
  sizeRackPinion,
  sizeIndexTable,
  type ServoSpec,
  type StepperSpec,
  type ACSpec,
} from "./motor-sizing.ts";

function assertClose(actual: number, expected: number, relTol = 0.015): void {
  const scale = Math.max(Math.abs(expected), 1e-12);
  const relErr = Math.abs(actual - expected) / scale;
  assert.ok(
    relErr <= relTol,
    `expected ${actual} ≈ ${expected} (rel err ${relErr.toFixed(4)})`,
  );
}

// Unit conversions used only to express the PDF's Imperial answers in SI.
const OZIN_TO_NM = 0.0070615518; // 1 ozf·in
const REV = 2 * Math.PI;

test("loadForce: horizontal / vertical / incline", () => {
  assertClose(
    loadForce({ massKg: 10, orientation: "horizontal", frictionCoeff: 0.5 }),
    0.5 * 10 * G,
  );
  assertClose(
    loadForce({ massKg: 10, orientation: "vertical", frictionCoeff: 0.5 }),
    10 * G,
  );
  assertClose(
    loadForce({
      massKg: 10,
      orientation: "incline",
      frictionCoeff: 0.1,
      inclineAngleRad: Math.PI / 6,
    }),
    10 * G * (Math.sin(Math.PI / 6) + 0.1 * Math.cos(Math.PI / 6)),
  );
});

test("motionProfile: triangular and trapezoidal", () => {
  const tri = motionProfile(0.2 * REV, 0.15); // Repanich Ex.1
  assert.equal(tri.kind, "triangular");
  assertClose(tri.peakSpeed, 16.755, 1e-3);
  assertClose(tri.accelTime, 0.075, 1e-6);

  const trap = motionProfile(0.0381, 0.5, 0.127); // Repanich Ex.3 (1.5 in, 5 in/s)
  assert.equal(trap.kind, "trapezoidal");
  assertClose(trap.accelTime, 0.2, 1e-6);
  assertClose(trap.cruiseTime, 0.1, 1e-6);
  assertClose(trap.acceleration, 0.635, 1e-3);
});

test("rmsTorque: weighted root-mean-square", () => {
  const rms = rmsTorque([
    { torque: 2, time: 1 },
    { torque: 1, time: 2 },
    { torque: 2, time: 1 },
    { torque: 0, time: 1 },
  ]);
  assertClose(rms, Math.sqrt((4 + 2 + 4 + 0) / 5), 1e-9);
});

test("evaluateServo: pass and fail", () => {
  const motor: ServoSpec = {
    type: "servo",
    rotorInertia: 1e-4,
    ratedTorque: 0.3,
    peakTorque: 1.0,
    ratedSpeed: 200,
  };
  const ok = evaluateServo(motor, 0.5, 0.2, 150, 4);
  assert.equal(ok.pass, true);
  assert.equal(ok.inertiaRatioIdeal, true);

  const bad = evaluateServo(motor, 1.2, 0.4, 250, 12);
  assert.equal(bad.peakTorqueOk, false);
  assert.equal(bad.rmsTorqueOk, false);
  assert.equal(bad.speedOk, false);
  assert.equal(bad.inertiaRatioOk, false);
  assert.equal(bad.pass, false);
});

test("evaluateStepper: pass and fail", () => {
  const motor: StepperSpec = {
    type: "stepper",
    rotorInertia: 1e-4,
    pulloutTorque: 1.0,
    ratedSpeed: 200,
    inertiaRatioLimit: 10,
  };
  const ok = evaluateStepper(motor, 0.5, 150, 4, 30);
  assert.equal(ok.pass, true);

  const bad = evaluateStepper(motor, 1.2, 250, 12, 60);
  assert.equal(bad.torqueOk, false);
  assert.equal(bad.inertiaRatioOk, false);
  assert.equal(bad.speedOk, false);
  assert.equal(bad.dutyCycleOk, false);
  assert.equal(bad.pass, false);
});

test("evaluateAC: pass and fail", () => {
  const motor: ACSpec = {
    type: "ac",
    ratedTorque: 0.5,
    startingTorque: 1.2,
    ratedSpeed: 180,
    permissibleInertia: 0.01,
  };
  const ok = evaluateAC(motor, 1.0, 0.4, 150, 0.005);
  assert.equal(ok.pass, true);

  const bad = evaluateAC(motor, 1.5, 0.6, 200, 0.02);
  assert.equal(bad.startingOk, false);
  assert.equal(bad.ratedOk, false);
  assert.equal(bad.speedOk, false);
  assert.equal(bad.inertiaOk, false);
  assert.equal(bad.pass, false);
});

test("duty cycle = running / (running + dwell)", () => {
  const r = sizeDirectDrive({
    loadInertia: 1e-4,
    loadTorque: 0.1,
    moveAngle: 1 * REV,
    moveTime: 0.5,
    dwellTime: 0.5, // running 0.5 s, dwell 0.5 s → 50 %
  });
  assertClose(r.dutyCycle, 50, 1e-9);
});

// --- Repanich Example #1: direct-drive fluted-bit cutting machine ------------
test("Repanich Ex.1 — direct drive", () => {
  const steel = 7750; // ρ kg/m³ used by the PDF
  const chuck = solidCylinderInertiaFromGeometry(steel, 0.04, 0.015); // Ø3, L4 cm
  const bit = solidCylinderInertiaFromGeometry(steel, 0.14, 0.004); // Ø0.8, L14 cm
  assertClose(chuck, 246.5e-7, 0.01); // 246.5 g·cm²
  assertClose(bit, 4.36e-7, 0.01); // 4.36 g·cm²

  const base = {
    loadInertia: chuck + bit,
    loadTorque: 0.05, // cutting torque, N·m
    moveAngle: 0.2 * REV,
    moveTime: 0.15,
  };

  const noMotor = sizeDirectDrive(base);
  assertClose(noMotor.peakSpeed, 16.755, 1e-3);
  assertClose(noMotor.accelTorque, 0.0056, 0.02);
  assertClose(noMotor.peakTorque, 0.0556, 0.01);
  assertClose(noMotor.peakPower, 0.93, 0.01);

  const withMotor = sizeDirectDrive({
    ...base,
    motor: {
      type: "servo",
      rotorInertia: 70e-7, // 70 g·cm²
      ratedTorque: 0.26,
      peakTorque: 0.5,
      ratedSpeed: 200,
    },
  });
  assertClose(withMotor.accelTorque, 0.0072, 0.02);
  assertClose(withMotor.peakTorque, 0.0572, 0.01);
  assertClose(withMotor.inertiaRatio!, 3.6, 0.02);
});

// --- Repanich Example #3: lead screw, "Smart" battery inspection -------------
test("Repanich Ex.3 — lead screw", () => {
  const base = {
    loadMass: 50 * 0.45359237, // 50 lb
    lead: 0.2 * 0.0254, // 0.2 in/rev (pitch 5 rev/in)
    screwDensity: 7750,
    screwLength: 36 * 0.0254,
    screwRadius: 0.5 * 0.0254,
    efficiency: 0.65,
    friction: 0.01,
    orientation: "horizontal" as const,
    breakawayTorque: 25 * OZIN_TO_NM, // 25 oz·in
    moveDistance: 1.5 * 0.0254,
    moveTime: 0.5,
    maxSpeed: 5 * 0.0254, // 5 in/s
  };

  const noMotor = sizeLeadScrew(base);
  assertClose(noMotor.peakSpeed, 25 * REV, 1e-3); // 25 rev/s
  assertClose(noMotor.loadTorque, 25.39 * OZIN_TO_NM, 0.01); // Tf = 25.39 oz·in
  assertClose(noMotor.accelTorque, 34.69 * OZIN_TO_NM, 0.015); // Ta = 34.69 oz·in
  assertClose(noMotor.peakTorque, 60.08 * OZIN_TO_NM, 0.015); // 60.08 oz·in
  assertClose(noMotor.peakPower, 66.7, 0.02);
  assertClose(noMotor.totalLoadInertia, 16.61 * 1.829e-5, 0.01); // 0.81+15.8 oz·in²

  const withMotor = sizeLeadScrew({
    ...base,
    motor: {
      type: "servo",
      rotorInertia: 6.7 * 1.829e-5, // 6.70 oz·in²
      ratedTorque: 0.6,
      peakTorque: 1.0,
      ratedSpeed: 200,
    },
  });
  assertClose(withMotor.accelTorque, 48.3 * OZIN_TO_NM, 0.015); // 48.3 oz·in
  assertClose(withMotor.peakTorque, 73.7 * OZIN_TO_NM, 0.015); // 73.7 oz·in
  assertClose(withMotor.inertiaRatio!, 2.48, 0.02);
});

// --- Repanich Problem #1: bicycle-rim grinding (loose end-to-end check) ------
test("Repanich Problem #1 — direct drive (~20 N·m @ 0.56 rev/s)", () => {
  const steel = 7800;
  const Ro = 0.33 / 2;
  const Ri = 0.315 / 2;
  const L = 0.045;
  const rimMass = Math.PI * L * steel * (Ro ** 2 - Ri ** 2);
  const rimInertia = 0.5 * rimMass * (Ro ** 2 + Ri ** 2);
  const fixtureInertia = 1686e-4; // 1686 kg·cm²

  const result = sizeDirectDrive({
    loadInertia: rimInertia + fixtureInertia,
    loadTorque: 1.6, // grinding friction torque, N·m
    moveAngle: REV / 36,
    moveTime: 0.1,
  });

  assertClose(result.peakSpeed, 0.56 * REV, 0.02); // 0.56 rev/s
  assert.ok(
    result.peakTorque > 16 && result.peakTorque < 22,
    `peak torque ${result.peakTorque} N·m should be ≈ 20`,
  );
});

// --- Tangential & rotary mechanisms: hand-derived first-principles checks ----
test("belt/pulley — hand-derived (J=mR², T=μmgR, Ta=Jα)", () => {
  // 10 kg, R=0.05 m, μ=0.2, horizontal, η=1, 0.5 m in 1 s (triangular).
  const r = sizeBeltPulley({
    loadMass: 10,
    pulleyRadius: 0.05,
    friction: 0.2,
    efficiency: 1,
    moveDistance: 0.5,
    moveTime: 1,
  });
  assertClose(r.peakSpeed, 20, 1e-6); // v=1 m/s → ω=v/R=20 rad/s
  assertClose(r.loadTorque, 0.2 * 10 * G * 0.05, 1e-9); // μmg·R
  assertClose(r.accelTorque, 10 * 0.05 ** 2 * 40, 1e-9); // J·α, α=40 rad/s²
  assertClose(r.peakTorque, 0.2 * 10 * G * 0.05 + 0.025 * 40, 1e-9);
  assertClose(r.peakPower, r.peakTorque * 20, 1e-9);
});

test("belt/pulley — vertical lift holding torque = mgR/η", () => {
  const r = sizeBeltPulley({
    loadMass: 10,
    pulleyRadius: 0.05,
    orientation: "vertical",
    efficiency: 1,
    moveDistance: 0.5,
    moveTime: 1,
  });
  assertClose(r.loadTorque, 10 * G * 0.05, 1e-9); // cruise = mgR
});

test("rack & pinion — hand-derived", () => {
  // 20 kg, R=0.025 m, μ=0.1, horizontal, η=1, 0.3 m in 0.6 s (triangular).
  const r = sizeRackPinion({
    loadMass: 20,
    pinionRadius: 0.025,
    friction: 0.1,
    efficiency: 1,
    moveDistance: 0.3,
    moveTime: 0.6,
  });
  assertClose(r.peakSpeed, 40, 1e-6); // v=1 m/s → ω=40 rad/s
  assertClose(r.loadTorque, 0.1 * 20 * G * 0.025, 1e-9);
  assertClose(r.accelTorque, 20 * 0.025 ** 2 * (40 / 0.3), 1e-9); // α=ω/t_a
  assertClose(r.peakPower, r.peakTorque * 40, 1e-9);
});

test("rotary index table — hand-derived (½MR² + Σm·d²)", () => {
  // Disc 5 kg, R=0.2; 4 workpieces 0.5 kg at 0.15 m; friction 0.5 N·m;
  // index 90° in 0.4 s (triangular), η=1.
  const r = sizeIndexTable({
    tableMass: 5,
    tableRadius: 0.2,
    workpieceMass: 0.5,
    workpieceCount: 4,
    workpieceRadius: 0.15,
    frictionTorque: 0.5,
    indexAngle: Math.PI / 2,
    moveTime: 0.4,
    efficiency: 1,
  });
  const J = 0.5 * 5 * 0.2 ** 2 + 4 * 0.5 * 0.15 ** 2; // 0.145 kg·m²
  assertClose(r.totalLoadInertia, J, 1e-9);
  const omega = (2 * (Math.PI / 2)) / 0.4; // 7.854 rad/s
  assertClose(r.peakSpeed, omega, 1e-6);
  assertClose(r.accelTorque, J * (omega / 0.2), 1e-9);
  assertClose(r.peakTorque, J * (omega / 0.2) + 0.5, 1e-9);
});

// --- Cross-checks vs Oriental Motor Technical Reference worked examples -------
// These validate the LOAD-TORQUE formulas against a third, independent source.
const LBIN_TO_NM = 0.112984829; // 1 lbf·in

test("Oriental Motor belt conveyor (F-8) — load torque T = μmg·R/η = 320 oz·in", () => {
  const r = sizeBeltPulley({
    loadMass: 30 * 0.45359237, // 30 lb belt + work
    pulleyRadius: (4 * 0.0254) / 2, // D = 4 in
    friction: 0.3,
    efficiency: 0.9,
    moveDistance: 0.1, // (motion is irrelevant to load torque)
    moveTime: 1,
  });
  assertClose(r.loadTorque, 320 * OZIN_TO_NM, 0.01); // OM result: 320 oz·in
});

test("Oriental Motor ball screw (F-6) — load torque F·PB/(2πη) = 0.4775 lb·in", () => {
  const r = sizeLeadScrew({
    loadMass: 90 * 0.45359237, // 90 lb table + work
    lead: 0.6 * 0.0254, // PB = 0.6 in/rev
    screwInertia: 0, // isolate the load torque
    efficiency: 0.9,
    friction: 0.05,
    orientation: "horizontal",
    moveDistance: 0.05,
    moveTime: 1,
  });
  // OM splits TL = F·PB/(2πη) [0.4775 lb·in] + preload term [0.043 lb·in].
  // We model the F·PB/(2πη) part (preload would go in breakawayTorque).
  assertClose(r.loadTorque, 0.4775 * LBIN_TO_NM, 0.01);
});
