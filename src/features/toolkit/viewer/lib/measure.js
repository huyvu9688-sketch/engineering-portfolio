// Two-point straight-line distance measurement on the loaded model.
//
// Click two points on visible geometry; the tool draws markers + a line and
// reports the distance in the model's own units. A third click starts over.

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

        if (this.points.length === 2) {
            this.drawLine();
            this.showDistance();
        }
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

    drawLine() {
        const geometry = new THREE.BufferGeometry().setFromPoints(this.points);
        const material = new THREE.LineBasicMaterial({ color: MEASURE_COLOR, depthTest: false });
        this.line = new THREE.Line(geometry, material);
        this.line.renderOrder = 999;
        this.group.add(this.line);
    }

    showDistance() {
        const distance = this.points[0].distanceTo(this.points[1]);
        const result = document.getElementById("measure-result");
        const value = document.getElementById("measure-value");
        if (result) result.style.display = "block";
        if (value) value.textContent = distance.toFixed(2);
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
