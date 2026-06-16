// Axis-aligned face-to-face distance measurement on the loaded model.
//
// Click a point on one component face, then a point on another. Both clicked
// points are kept as markers on the real surfaces; the measurement line is
// drawn PARALLEL to the dominant X/Y/Z axis (for an accurate axis gap), and a
// faint connector ties the axis line back to the second face so nothing floats.
// Reports the axis distance + per-axis ΔX/ΔY/ΔZ, all in mm (in).

import * as THREE from "three";

const MEASURE_COLOR = 0xeb3a14; // accent

export class MeasureTool {
    constructor(core) {
        this.core = core; // the ViewerCore (scene, camera, renderer, allParts, model)
        this.active = false;
        this.points = [];
        this.markers = [];
        this.lines = [];
        this.markerRadius = 0.05;
        this.group = new THREE.Group();
        this.group.name = "__measure__";
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.onClickBound = (e) => this.onClick(e);
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
            this.markerRadius = (Math.max(size.x, size.y, size.z) || 1) * 0.008;
        }

        const dom = this.dom;
        if (dom) {
            dom.style.cursor = "crosshair";
            dom.addEventListener("click", this.onClickBound);
        }
        this.showBanner(true);
    }

    disable() {
        if (!this.active) return;
        this.active = false;
        const dom = this.dom;
        if (dom) {
            dom.style.cursor = "auto";
            dom.removeEventListener("click", this.onClickBound);
        }
        this.clear();
        this.core.scene.remove(this.group);
        this.showBanner(false);
    }

    onClick(event) {
        if (!this.active || !this.core.model) return;

        const rect = this.dom.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.core.camera);
        const visibleParts = this.core.allParts.filter((p) => p.visible);
        const intersects = this.raycaster.intersectObjects(visibleParts, false);
        if (intersects.length === 0) return;

        if (this.points.length >= 2) this.clear();

        // Snap the point to the exact surface hit so both ends are on faces.
        const point = intersects[0].point.clone();
        this.addMarker(point);
        this.points.push(point);

        if (this.points.length === 2) this.complete();
    }

    complete() {
        const [p1, p2] = this.points;
        const dx = Math.abs(p2.x - p1.x);
        const dy = Math.abs(p2.y - p1.y);
        const dz = Math.abs(p2.z - p1.z);
        const maxDelta = Math.max(dx, dy, dz);

        // Axis-parallel endpoint: p1's coords with the dominant axis taken from p2.
        const aligned = p1.clone();
        let axis;
        if (maxDelta === dx) {
            aligned.x = p2.x;
            axis = "X";
        } else if (maxDelta === dy) {
            aligned.y = p2.y;
            axis = "Y";
        } else {
            aligned.z = p2.z;
            axis = "Z";
        }

        this.addLine(p1, aligned, false); // main axis-parallel dimension line
        this.addLine(aligned, p2, true); // faint connector back to the 2nd face
        this.showDistance(maxDelta, axis, dx, dy, dz);
    }

    addMarker(point) {
        const geometry = new THREE.SphereGeometry(this.markerRadius, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: MEASURE_COLOR, depthTest: false });
        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(point);
        marker.renderOrder = 999;
        this.group.add(marker);
        this.markers.push(marker);
    }

    addLine(a, b, faint) {
        const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
        const material = new THREE.LineBasicMaterial({
            color: MEASURE_COLOR,
            depthTest: false,
            transparent: faint,
            opacity: faint ? 0.4 : 1,
        });
        const line = new THREE.Line(geometry, material);
        line.renderOrder = 999;
        this.group.add(line);
        this.lines.push(line);
    }

    showDistance(rawDelta, axis, dx, dy, dz) {
        const scale = this.core.unitToMm || 1;
        const mm = rawDelta * scale;
        const inches = mm / 25.4;
        const result = document.getElementById("measure-result");
        const value = document.getElementById("measure-value");
        const deltas = document.getElementById("measure-deltas");
        if (result) result.style.display = "block";
        if (value) value.textContent = `${mm.toFixed(1)} mm (${inches.toFixed(2)} in) · ${axis}`;
        if (deltas) {
            deltas.textContent =
                `ΔX ${(dx * scale).toFixed(1)} · ` +
                `ΔY ${(dy * scale).toFixed(1)} · ` +
                `ΔZ ${(dz * scale).toFixed(1)} mm`;
        }
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
        this.points = [];
        const result = document.getElementById("measure-result");
        if (result) result.style.display = "none";
    }

    showBanner(show) {
        const banner = document.getElementById("measure-banner");
        if (banner) banner.style.display = show ? "block" : "none";
    }

    dispose() {
        this.disable();
    }
}
