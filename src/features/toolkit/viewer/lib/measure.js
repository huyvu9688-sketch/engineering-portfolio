// Axis-aligned two-point distance measurement on the loaded model.
//
// Click two points on visible geometry; the tool finds the dominant axis
// (X, Y or Z), snaps the span to it, and reports that axis distance in mm (in).
// A third click starts over.

import * as THREE from "three";

const MEASURE_COLOR = 0xeb3a14; // accent

export class MeasureTool {
    constructor(core) {
        this.core = core; // the ViewerCore (scene, camera, renderer, allParts, model)
        this.active = false;
        this.points = [];
        this.markers = [];
        this.line = null;
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

        const point = intersects[0].point.clone();
        this.addMarker(point);
        this.points.push(point);

        if (this.points.length === 2) this.measureAxis();
    }

    // Snap the span to the dominant axis and report that axis distance.
    measureAxis() {
        const [p1, p2] = this.points;
        const dx = Math.abs(p2.x - p1.x);
        const dy = Math.abs(p2.y - p1.y);
        const dz = Math.abs(p2.z - p1.z);
        const maxDelta = Math.max(dx, dy, dz);

        const aligned = p2.clone();
        let axis;
        if (maxDelta === dx) {
            aligned.y = p1.y;
            aligned.z = p1.z;
            axis = "X";
        } else if (maxDelta === dy) {
            aligned.x = p1.x;
            aligned.z = p1.z;
            axis = "Y";
        } else {
            aligned.x = p1.x;
            aligned.y = p1.y;
            axis = "Z";
        }

        this.drawLine(p1, aligned);
        this.showDistance(maxDelta, axis);
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

    drawLine(a, b) {
        const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
        const material = new THREE.LineBasicMaterial({ color: MEASURE_COLOR, depthTest: false });
        this.line = new THREE.Line(geometry, material);
        this.line.renderOrder = 999;
        this.group.add(this.line);
    }

    showDistance(rawDelta, axis) {
        const mm = rawDelta * (this.core.unitToMm || 1);
        const inches = mm / 25.4;
        const result = document.getElementById("measure-result");
        const value = document.getElementById("measure-value");
        if (result) result.style.display = "block";
        if (value) value.textContent = `${mm.toFixed(1)} mm (${inches.toFixed(2)} in) · ${axis}`;
    }

    clear() {
        this.markers.forEach((m) => {
            m.geometry.dispose();
            m.material.dispose();
            this.group.remove(m);
        });
        this.markers = [];
        if (this.line) {
            this.line.geometry.dispose();
            this.line.material.dispose();
            this.group.remove(this.line);
            this.line = null;
        }
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
