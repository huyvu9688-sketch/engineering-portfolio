// Undo/redo stack for visibility + isolate actions.

import { fitCameraToModel } from "./utils.js";

export class HistoryManager {
    constructor(modelLoader, componentList, viewerControls) {
        this.modelLoader = modelLoader;
        this.componentList = componentList;
        this.viewerControls = viewerControls;
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistorySize = 50;
    }

    recordAction(action) {
        this.undoStack.push(action);
        this.redoStack = [];
        if (this.undoStack.length > this.maxHistorySize) this.undoStack.shift();
        this.updateUI();
    }

    undo() {
        if (this.undoStack.length === 0) return;
        const action = this.undoStack.pop();
        this.executeUndo(action);
        this.redoStack.push(action);
        this.updateUI();
    }

    redo() {
        if (this.redoStack.length === 0) return;
        const action = this.redoStack.pop();
        this.executeRedo(action);
        this.undoStack.push(action);
        this.updateUI();
    }

    executeUndo(action) {
        switch (action.type) {
            case "hide":
                this.undoHide(action);
                break;
            case "show":
                this.undoShow(action);
                break;
            case "isolate":
                this.undoIsolate(action);
                break;
            case "showAll":
                this.undoShowAll(action);
                break;
        }
    }

    executeRedo(action) {
        switch (action.type) {
            case "hide":
                this.redoHide(action);
                break;
            case "show":
                this.redoShow(action);
                break;
            case "isolate":
                this.redoIsolate(action);
                break;
            case "showAll":
                this.redoShowAll(action);
                break;
        }
    }

    setMeshVisibility(part, visible) {
        part.traverse((child) => {
            if (child.isMesh && !child.userData.isEdgeHelper) child.visible = visible;
        });
    }

    undoHide(action) {
        const part = this.modelLoader.model.getObjectByProperty("uuid", action.partUuid);
        if (part) {
            this.componentList.hiddenParts.delete(action.partUuid);
            this.setMeshVisibility(part, true);
            this.componentList.updateVisibility();
        }
    }

    redoHide(action) {
        const part = this.modelLoader.model.getObjectByProperty("uuid", action.partUuid);
        if (part) {
            this.componentList.hiddenParts.add(action.partUuid);
            this.setMeshVisibility(part, false);
            this.componentList.updateVisibility();
        }
    }

    undoShow(action) {
        const part = this.modelLoader.model.getObjectByProperty("uuid", action.partUuid);
        if (part) {
            this.componentList.hiddenParts.add(action.partUuid);
            this.setMeshVisibility(part, false);
            this.componentList.updateVisibility();
        }
    }

    redoShow(action) {
        this.undoHide(action);
    }

    undoIsolate(action) {
        this.modelLoader.allParts.forEach((part) => {
            const wasVisible = action.previousState.get(part.uuid);
            if (wasVisible !== undefined) part.visible = wasVisible;
        });

        this.viewerControls.isolatedPart = null;

        const isolatedInfo = document.getElementById("isolated-info");
        if (isolatedInfo) isolatedInfo.style.display = "none";

        if (this.modelLoader.model) {
            fitCameraToModel(
                this.modelLoader.model,
                this.viewerControls.sceneManager.camera,
                this.viewerControls.sceneManager.controls,
            );
        }
    }

    redoIsolate(action) {
        const part = this.modelLoader.model.getObjectByProperty("uuid", action.partUuid);
        if (part) this.viewerControls.isolatePart(part, false);
    }

    undoShowAll(action) {
        this.componentList.hiddenParts = new Set(action.previousHiddenParts);
        this.modelLoader.allParts.forEach((part) => {
            const shouldBeHidden = this.componentList.hiddenParts.has(part.uuid);
            this.setMeshVisibility(part, !shouldBeHidden);
        });
        this.componentList.updateVisibility();
    }

    redoShowAll() {
        this.viewerControls.showAllParts(false);
    }

    updateUI() {
        const undoBtn = document.getElementById("undo-action");
        const redoBtn = document.getElementById("redo-action");

        if (undoBtn) {
            undoBtn.disabled = this.undoStack.length === 0;
            undoBtn.classList.toggle("opacity-40", this.undoStack.length === 0);
            undoBtn.classList.toggle("cursor-not-allowed", this.undoStack.length === 0);
        }
        if (redoBtn) {
            redoBtn.disabled = this.redoStack.length === 0;
            redoBtn.classList.toggle("opacity-40", this.redoStack.length === 0);
            redoBtn.classList.toggle("cursor-not-allowed", this.redoStack.length === 0);
        }
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.updateUI();
    }
}
