// Measurement tool with three modes:
//   • Distance        — 2 picks → axis-aligned face-to-face gap (X/Y/Z).
//                       Auto-upgrades to axis C–C when both picks are cylindrical faces.
//   • Circle (Ø/R)    — 3 picks on a round edge → fitted circle, diameter+radius.
//   • Center-to-center — two circles (3 picks each) → distance between centres.
//
// Picks use press/release with a small drag threshold, so dragging to orbit
// never drops a point. Click empty space to start over.

import * as THREE from "three";

const MEASURE_COLOR = 0xeb3a14; // accent
const CENTER_COLOR = 0x4488ff; // fitted circle centres / cylinder axis centres
const DRAG_THRESHOLD = 5;

const MODES = {
    distance: { picks: 2, label: "Distance" },
    circle: { picks: 3, label: "Diameter" },
    centers: { picks: 6, label: "Center-to-center" },
};

function dominantAxis(v) {
    const ax = Math.abs(v.x);
    const ay = Math.abs(v.y);
    const az = Math.abs(v.z);
    if (ax >= ay && ax >= az) return "X";
    return ay >= az ? "Y" : "Z";
}

// Circle through 3 points in 3D (circumcentre) → { center, radius, normal }.
function fitCircle(p1, p2, p3) {
    const v1 = new THREE.Vector3().subVectors(p2, p1);
    const v2 = new THREE.Vector3().subVectors(p3, p1);
    const cross = new THREE.Vector3().crossVectors(v1, v2);
    const crossLenSq = cross.lengthSq();
    if (crossLenSq < 1e-12) return null; // (near-)collinear points

    const term1 = new THREE.Vector3().crossVectors(cross, v1).multiplyScalar(v2.lengthSq());
    const term2 = new THREE.Vector3().crossVectors(v2, cross).multiplyScalar(v1.lengthSq());
    const toCenter = term1.add(term2).divideScalar(2 * crossLenSq);
    return {
        center: new THREE.Vector3().addVectors(p1, toCenter),
        radius: toCenter.length(),
        normal: cross.normalize(),
    };
}

export class MeasureTool {
    constructor(core) {
        this.core = core;
        this.active = false;
        this.mode = "distance";
        this.picks = []; // [{ point, axis, faceInfo }]
        this.firstCircle = null; // fitted circle 1 in centers mode
        this.markers = [];
        this.lines = []; // straight lines + fitted circles
        this.helpers = []; // normal arrows
        this.markerRadius = 0.05;
        this.group = new THREE.Group();
        this.group.name = "__measure__";
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.down = { x: 0, y: 0, valid: false };
        this.onPointerDownBound = (e) => this.onPointerDown(e);
        this.onPointerUpBound = (e) => this.onPointerUp(e);
    }

    get dom() {
        return this.core.renderer?.domElement;
    }

    enable() {
        if (this.active) return;
        this.active = true;
        this.core.scene.add(this.group);

        if (this.core.model) {
            const size = new THREE.Box3().setFromObject(this.core.model).getSize(new THREE.Vector3());
            // 0.004 × maxDim — half the old size, less visual clutter
            this.markerRadius = (Math.max(size.x, size.y, size.z) || 1) * 0.004;
        }

        const dom = this.dom;
        if (dom) {
            dom.style.cursor = "crosshair";
            dom.addEventListener("pointerdown", this.onPointerDownBound);
            dom.addEventListener("pointerup", this.onPointerUpBound);
        }
        this.showBanner(true);
        this.highlightMode();
        this.setInstruction(this.instructionFor());
    }

    disable() {
        if (!this.active) return;
        this.active = false;
        const dom = this.dom;
        if (dom) {
            dom.style.cursor = "auto";
            dom.removeEventListener("pointerdown", this.onPointerDownBound);
            dom.removeEventListener("pointerup", this.onPointerUpBound);
        }
        this.clear();
        this.core.scene.remove(this.group);
        this.showBanner(false);
    }

    setMode(mode) {
        if (!MODES[mode] || this.mode === mode) {
            if (MODES[mode]) this.highlightMode();
            return;
        }
        this.mode = mode;
        this.clear();
        this.highlightMode();
        this.setInstruction(this.instructionFor());
    }

    onPointerDown(event) {
        if (event.button !== 0) return;
        this.down.x = event.clientX;
        this.down.y = event.clientY;
        this.down.valid = true;
    }

    onPointerUp(event) {
        if (event.button !== 0 || !this.down.valid) return;
        this.down.valid = false;
        const moved = Math.hypot(event.clientX - this.down.x, event.clientY - this.down.y);
        if (moved <= DRAG_THRESHOLD) this.pick(event);
    }

    pick(event) {
        if (!this.active || !this.core.model) return;

        const rect = this.dom.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.core.camera);
        const visibleParts = this.core.allParts.filter((p) => p.visible);
        const intersects = this.raycaster.intersectObjects(visibleParts, false);

        if (intersects.length === 0) {
            if (this.picks.length > 0 || this.lines.length > 0) {
                this.clear();
                this.setInstruction(this.instructionFor());
            }
            return;
        }

        const max = MODES[this.mode].picks;
        if (this.picks.length >= max) this.clear();

        const hit = intersects[0];
        const hitPoint = hit.point.clone();

        // In distance mode, check if we clicked a cylindrical face and use the
        // computed axis centre as the effective measurement point.
        let faceInfo = null;
        let effectivePoint = hitPoint;
        let isCylinder = false;

        if (this.mode === "distance") {
            faceInfo = this.core.faceSelector.analyzeFace(hit.object, hit.faceIndex);
            if (faceInfo.type === "cylindrical" && faceInfo.cylinderCenter) {
                effectivePoint = faceInfo.cylinderCenter;
                isCylinder = true;
            }
        }

        let normal = null;
        let axis = null;
        if (hit.face && !isCylinder) {
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
            normal = hit.face.normal.clone().applyNormalMatrix(normalMatrix);
            axis = dominantAxis(normal);
        }

        if (isCylinder) {
            // Blue centre marker — visually distinct from a surface pick
            this.addCenterMarker(effectivePoint);
        } else {
            this.addMarker(hitPoint, this.mode === "distance" ? normal : null);
        }

        this.picks.push({ point: effectivePoint, axis, faceInfo, isCylinder });

        if (this.mode === "centers" && this.picks.length === 3) this.drawFirstCircle();

        if (this.picks.length === MODES[this.mode].picks) this.complete();
        else this.setInstruction(this.instructionFor());
    }

    complete() {
        if (this.mode === "distance") this.completeDistance();
        else if (this.mode === "circle") this.completeCircle();
        else this.completeCenters();
        this.setInstruction(this.instructionFor());
    }

    completeDistance() {
        const [a, b] = this.picks;

        // --- Cylinder axis C–C: both picks resolved to a cylinder centre ---
        if (a.isCylinder && b.isCylinder) {
            const dist = a.point.distanceTo(b.point) * this.scale;
            this.addLine(a.point, b.point);
            this.showResult(
                "Axis C–C",
                `${dist.toFixed(2)} mm (${(dist / 25.4).toFixed(3)} in)`,
                "Cylinder axis centre to centre",
            );
            return;
        }

        // --- Mixed or flat: axis-aligned face-to-face gap (original behaviour) ---
        let axis;
        const parallel = !!(a.axis && b.axis && a.axis === b.axis);
        if (a.axis) axis = a.axis;
        else if (b.axis) axis = b.axis;
        else {
            const dx = Math.abs(b.point.x - a.point.x);
            const dy = Math.abs(b.point.y - a.point.y);
            const dz = Math.abs(b.point.z - a.point.z);
            const m = Math.max(dx, dy, dz);
            axis = m === dx ? "X" : m === dy ? "Y" : "Z";
        }
        const key = axis.toLowerCase();
        const gap = Math.abs(b.point[key] - a.point[key]);
        const aligned = a.point.clone();
        aligned[key] = b.point[key];
        this.addLine(a.point, aligned);

        const mm = gap * this.scale;
        this.showResult(
            "Distance",
            `${mm.toFixed(1)} mm (${(mm / 25.4).toFixed(2)} in) · ${axis}`,
            parallel ? `Parallel faces · gap along ${axis}` : `${axis}-axis gap`,
        );
    }

    completeCircle() {
        const [a, b, c] = this.picks.map((p) => p.point);
        const fit = fitCircle(a, b, c);
        if (!fit) {
            this.clear();
            this.setInstruction("Points are in a line — pick 3 spread points · Esc to exit");
            return;
        }
        this.addCenterMarker(fit.center);
        this.drawCircle(fit.center, fit.radius, fit.normal);

        const r = fit.radius * this.scale;
        const d = 2 * r;
        this.showResult(
            "Diameter",
            `${d.toFixed(2)} mm (${(d / 25.4).toFixed(3)} in)`,
            `Radius ${r.toFixed(2)} mm (${(r / 25.4).toFixed(3)} in)`,
        );
    }

    drawFirstCircle() {
        const [a, b, c] = this.picks.map((p) => p.point);
        this.firstCircle = fitCircle(a, b, c);
        if (this.firstCircle) {
            this.addCenterMarker(this.firstCircle.center);
            this.drawCircle(this.firstCircle.center, this.firstCircle.radius, this.firstCircle.normal);
        }
    }

    completeCenters() {
        const p = this.picks.map((x) => x.point);
        const fit2 = fitCircle(p[3], p[4], p[5]);
        if (!this.firstCircle || !fit2) {
            this.clear();
            this.setInstruction("Points are in a line — pick 3 spread points · Esc to exit");
            return;
        }
        this.addCenterMarker(fit2.center);
        this.drawCircle(fit2.center, fit2.radius, fit2.normal);
        this.addLine(this.firstCircle.center, fit2.center);

        const dist = this.firstCircle.center.distanceTo(fit2.center) * this.scale;
        this.showResult(
            "Center-to-center",
            `${dist.toFixed(2)} mm (${(dist / 25.4).toFixed(3)} in)`,
            "Between the two circle centres",
        );
    }

    get scale() {
        return this.core.unitToMm || 1;
    }

    instructionFor() {
        const n = this.picks.length % MODES[this.mode].picks;
        if (this.mode === "distance") {
            if (n === 0) return "Click a surface or cylinder · Esc to exit";
            const first = this.picks[0];
            if (first?.isCylinder) return "Cylinder axis locked · click second surface · Esc to exit";
            return "Click the second point · Esc to exit";
        }
        if (this.mode === "circle") {
            return `Click 3 points around the round edge · ${n + 1}/3 · Esc to exit`;
        }
        const circle = n < 3 ? 1 : 2;
        return `Circle ${circle} — point ${(n % 3) + 1}/3 · Esc to exit`;
    }

    addMarker(point, normal) {
        const geometry = new THREE.SphereGeometry(this.markerRadius, 12, 12);
        const material = new THREE.MeshBasicMaterial({ color: MEASURE_COLOR, depthTest: false });
        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(point);
        marker.renderOrder = 999;
        this.group.add(marker);
        this.markers.push(marker);

        if (normal) {
            const len = this.markerRadius * 6;
            const arrow = new THREE.ArrowHelper(
                normal.clone().normalize(),
                point,
                len,
                MEASURE_COLOR,
                len * 0.4,
                len * 0.28,
            );
            arrow.line.material.depthTest = false;
            arrow.cone.material.depthTest = false;
            arrow.renderOrder = 999;
            this.group.add(arrow);
            this.helpers.push(arrow);
        }
    }

    addCenterMarker(point) {
        const geometry = new THREE.SphereGeometry(this.markerRadius * 1.1, 12, 12);
        const material = new THREE.MeshBasicMaterial({ color: CENTER_COLOR, depthTest: false });
        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(point);
        marker.renderOrder = 1000;
        this.group.add(marker);
        this.markers.push(marker);
    }

    addLine(a, b) {
        const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
        const material = new THREE.LineBasicMaterial({ color: MEASURE_COLOR, depthTest: false });
        const line = new THREE.Line(geometry, material);
        line.renderOrder = 999;
        this.group.add(line);
        this.lines.push(line);
    }

    drawCircle(center, radius, normal) {
        const arbitrary =
            Math.abs(normal.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
        const u = new THREE.Vector3().crossVectors(arbitrary, normal).normalize();
        const v = new THREE.Vector3().crossVectors(normal, u).normalize();

        const segments = 72;
        const pts = [];
        for (let i = 0; i <= segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            pts.push(
                new THREE.Vector3()
                    .copy(center)
                    .addScaledVector(u, radius * Math.cos(a))
                    .addScaledVector(v, radius * Math.sin(a)),
            );
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(pts);
        const material = new THREE.LineBasicMaterial({ color: MEASURE_COLOR, depthTest: false });
        const circle = new THREE.Line(geometry, material);
        circle.renderOrder = 999;
        this.group.add(circle);
        this.lines.push(circle);
    }

    showResult(label, value, note) {
        const panel = document.getElementById("measure-result");
        const labelEl = document.getElementById("measure-label");
        const valueEl = document.getElementById("measure-value");
        const noteEl = document.getElementById("measure-deltas");
        if (panel) panel.style.display = "block";
        if (labelEl) labelEl.textContent = `${label} `;
        if (valueEl) valueEl.textContent = value;
        if (noteEl) noteEl.textContent = note;
    }

    highlightMode() {
        Object.keys(MODES).forEach((m) => {
            const btn = document.getElementById(`measure-mode-${m}`);
            if (!btn) return;
            btn.classList.toggle("text-accent", m === this.mode);
            btn.classList.toggle("bg-white/10", m === this.mode);
        });
    }

    clear() {
        this.markers.forEach((m) => {
            m.geometry.dispose();
            m.material.dispose();
            this.group.remove(m);
        });
        this.markers = [];
        this.lines.forEach((l) => {
            l.geometry.dispose();
            l.material.dispose();
            this.group.remove(l);
        });
        this.lines = [];
        this.helpers.forEach((h) => {
            this.group.remove(h);
            h.dispose?.();
        });
        this.helpers = [];
        this.picks = [];
        this.firstCircle = null;
        const result = document.getElementById("measure-result");
        if (result) result.style.display = "none";
    }

    setInstruction(text) {
        const el = document.getElementById("measure-instruction");
        if (el) el.textContent = text;
    }

    showBanner(show) {
        const banner = document.getElementById("measure-banner");
        if (banner) banner.style.display = show ? "block" : "none";
    }

    dispose() {
        this.disable();
    }
}
