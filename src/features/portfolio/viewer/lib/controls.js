// View controls: isolate, show-all, focus, reset camera.

import { THREE } from "./three.js";
import { fitCameraToModel, resetHighlight, selectHighlight } from "./utils.js";

export class ViewerControls {
    constructor(sceneManager, modelLoader, componentList, historyManager) {
        this.sceneManager = sceneManager;
        this.modelLoader = modelLoader;
        this.componentList = componentList;
        this.historyManager = historyManager;
        this.isolateMode = false;
        this.isolatedPart = null;
        this.selectedPart = null;
        this.onIsolateClickBound = (e) => this.onIsolateClick(e);
    }

    /** Persistently glow a part (accent) and clear any previous selection. */
    selectPart(node) {
        if (this.selectedPart && this.selectedPart !== node) {
            this.selectedPart.userData.isSelected = false;
            resetHighlight(this.selectedPart);
        }
        this.selectedPart = node;
        node.userData.isSelected = true;
        selectHighlight(node);
    }

    clearSelection() {
        if (this.selectedPart) {
            this.selectedPart.userData.isSelected = false;
            resetHighlight(this.selectedPart);
            this.selectedPart = null;
        }
    }

    enableIsolateMode() {
        this.isolateMode = true;

        const banner = document.getElementById("isolate-banner");
        if (banner) banner.style.display = "block";

        const dom = this.sceneManager.renderer?.domElement;
        if (dom) {
            dom.style.cursor = "crosshair";
            dom.addEventListener("click", this.onIsolateClickBound);
        }
    }

    disableIsolateMode() {
        this.isolateMode = false;

        const banner = document.getElementById("isolate-banner");
        if (banner) banner.style.display = "none";

        // Clear the toolbar button's "active" styling when leaving pick mode
        // (whether cancelled or after a part was picked).
        const btn = document.getElementById("isolate-mode");
        if (btn) btn.classList.remove("text-accent", "bg-white/10");

        const dom = this.sceneManager.renderer?.domElement;
        if (dom) {
            dom.style.cursor = "auto";
            dom.removeEventListener("click", this.onIsolateClickBound);
        }
    }

    onIsolateClick(event) {
        if (!this.isolateMode || !this.modelLoader.model) return;

        event.stopPropagation();
        event.preventDefault();

        const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.sceneManager.camera);
        const visibleParts = this.modelLoader.allParts.filter((p) => p.visible);
        const intersects = raycaster.intersectObjects(visibleParts, false);

        if (intersects.length > 0) {
            const part = this.resolvePartNode(intersects[0].object);
            this.isolatePart(part);
            this.disableIsolateMode();
        }
    }

    resolvePartNode(mesh) {
        let node = mesh.parent;
        while (node && node !== this.modelLoader.model) {
            const isNamedGroup =
                (node.isGroup || node.type === "Group") &&
                node.name &&
                node.name.trim() !== "";
            if (isNamedGroup) return node;
            node = node.parent;
        }
        return mesh;
    }

    isolatePart(part, recordHistory = true) {
        let previousState = null;
        if (recordHistory) {
            previousState = new Map();
            this.modelLoader.allParts.forEach((p) => previousState.set(p.uuid, p.visible));
        }

        this.isolatedPart = part;

        const targetMeshes = new Set();
        if (part.isMesh) {
            targetMeshes.add(part.uuid);
        } else {
            part.traverse((child) => {
                if (child.isMesh) targetMeshes.add(child.uuid);
            });
        }

        this.modelLoader.allParts.forEach((p) => {
            p.visible = targetMeshes.has(p.uuid);
        });

        const banner = document.getElementById("isolated-banner");
        const bannerName = document.getElementById("isolated-banner-name");
        if (banner) banner.style.display = "block";
        if (bannerName) bannerName.textContent = part.name;

        fitCameraToModel(part, this.sceneManager.camera, this.sceneManager.controls);

        if (recordHistory && this.historyManager) {
            this.historyManager.recordAction({
                type: "isolate",
                partUuid: part.uuid,
                partName: part.name,
                previousState,
            });
        }
    }

    showAllParts(recordHistory = true) {
        let previousHiddenParts = null;
        const wasIsolated = this.isolatedPart !== null;

        if (recordHistory) {
            previousHiddenParts = Array.from(this.componentList.hiddenParts);
        }

        this.modelLoader.allParts.forEach((p) => {
            if (!this.componentList.hiddenParts.has(p.uuid)) p.visible = true;
        });

        this.isolatedPart = null;

        const banner = document.getElementById("isolated-banner");
        if (banner) banner.style.display = "none";

        if (this.modelLoader.model) {
            fitCameraToModel(
                this.modelLoader.model,
                this.sceneManager.camera,
                this.sceneManager.controls,
            );
        }

        if (
            recordHistory &&
            this.historyManager &&
            (previousHiddenParts.length > 0 || wasIsolated)
        ) {
            this.historyManager.recordAction({
                type: "showAll",
                previousHiddenParts,
            });
        }
    }

    focusOnPart(node) {
        this.selectPart(node);
        fitCameraToModel(node, this.sceneManager.camera, this.sceneManager.controls);

        const hoverInfo = document.getElementById("hover-info");
        const hoverPartName = document.getElementById("hover-part-name");
        if (hoverInfo) hoverInfo.style.display = "block";
        if (hoverPartName) hoverPartName.textContent = node.name;
    }

    resetCamera() {
        // Always frame the whole model so "reset view" shows everything.
        if (this.modelLoader.model) {
            fitCameraToModel(
                this.modelLoader.model,
                this.sceneManager.camera,
                this.sceneManager.controls,
            );
        }
    }
}
