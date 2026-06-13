// Pointer interaction: hover highlight + raycast helpers.

import { THREE } from "./three.js";
import { resolvePartNode, highlightPart, resetHighlight } from "./utils.js";

export class InteractionManager {
    constructor(sceneManager, modelLoader) {
        this.sceneManager = sceneManager;
        this.modelLoader = modelLoader;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredPart = null;
        this.lastMouseMoveTime = 0;
        this.throttleDelay = 33; // ~30fps for hover detection
        this.onMove = (e) => this.onMouseMove(e);
    }

    init() {
        this.sceneManager.renderer.domElement.addEventListener("mousemove", this.onMove);
    }

    onMouseMove(event) {
        if (!this.modelLoader.model) return;

        const now = performance.now();
        if (now - this.lastMouseMoveTime < this.throttleDelay) return;
        this.lastMouseMoveTime = now;

        const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        const visibleParts = this.modelLoader.allParts.filter((p) => p.visible);
        const intersects = this.raycaster.intersectObjects(visibleParts, false);

        if (
            this.hoveredPart &&
            (!intersects.length ||
                resolvePartNode(intersects[0].object, this.modelLoader.model).uuid !==
                    this.hoveredPart.uuid)
        ) {
            resetHighlight(this.hoveredPart);
            this.hoveredPart = null;
            this.hideHoverInfo();
        }

        if (intersects.length > 0) {
            const part = resolvePartNode(intersects[0].object, this.modelLoader.model);
            if (!this.hoveredPart || this.hoveredPart.uuid !== part.uuid) {
                if (this.hoveredPart) resetHighlight(this.hoveredPart);
                this.hoveredPart = part;
                highlightPart(part);
                this.showHoverInfo(part);
            }
        }
    }

    showHoverInfo(part) {
        const hoverInfo = document.getElementById("hover-info");
        const hoverName = document.getElementById("hover-part-name");
        if (hoverInfo && hoverName) {
            hoverInfo.style.display = "block";
            hoverName.textContent = part.name;
        }
    }

    hideHoverInfo() {
        const hoverInfo = document.getElementById("hover-info");
        if (hoverInfo) hoverInfo.style.display = "none";
    }

    getIntersection(event) {
        const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        const visibleParts = this.modelLoader.allParts.filter((p) => p.visible);
        const intersects = this.raycaster.intersectObjects(visibleParts, false);

        if (intersects.length > 0) {
            return {
                point: intersects[0].point.clone(),
                object: intersects[0].object,
                part: resolvePartNode(intersects[0].object, this.modelLoader.model),
            };
        }
        return null;
    }

    clearHover() {
        if (this.hoveredPart) {
            resetHighlight(this.hoveredPart);
            this.hoveredPart = null;
            this.hideHoverInfo();
        }
    }

    dispose() {
        if (this.sceneManager.renderer && this.sceneManager.renderer.domElement) {
            this.sceneManager.renderer.domElement.removeEventListener("mousemove", this.onMove);
        }
        this.hoveredPart = null;
    }
}
