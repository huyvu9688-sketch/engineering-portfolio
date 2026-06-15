// Orchestrator: wires the engine modules together and exposes a small
// imperative API (init / loadModel / dispose) for the React component.

import { SceneManager } from "./scene-manager.js";
import { ModelLoader } from "./model-loader.js";
import { ComponentList } from "./component-list.js";
import { InteractionManager } from "./interaction.js";
import { ContextMenu } from "./context-menu.js";
import { ViewerControls } from "./controls.js";
import { HistoryManager } from "./history-manager.js";
import { MeasureTool } from "./measure.js";
import { fitCameraToModel } from "./utils.js";

export class ViewerCore {
    /** @param {HTMLElement} canvasMount element the renderer canvas mounts into */
    constructor(canvasMount) {
        this.canvasMount = canvasMount;

        this.sceneManager = new SceneManager(canvasMount);
        this.modelLoader = new ModelLoader(this.sceneManager);
        this.componentList = new ComponentList();
        this.interactionManager = new InteractionManager(this.sceneManager, this.modelLoader);
        this.historyManager = new HistoryManager(this.modelLoader, this.componentList, null);
        this.viewerControls = new ViewerControls(
            this.sceneManager,
            this.modelLoader,
            this.componentList,
            this.historyManager,
        );
        this.historyManager.viewerControls = this.viewerControls;
        this.contextMenu = new ContextMenu(
            this.viewerControls,
            this.componentList,
            this.historyManager,
        );
        this.measureTool = new MeasureTool(this.sceneManager, this.modelLoader);

        this.boundListeners = [];
        this.onKeyDown = (e) => this.handleKeyDown(e);
        this.onCanvasContextMenu = (e) => this.handleCanvasContextMenu(e);
    }

    init() {
        this.sceneManager.init();
        this.interactionManager.init();
        this.sceneManager.start();
        this.attachEventListeners();
    }

    /**
     * @param {File} file
     * @param {{ onProgress?: (pct: number) => void, onLoaded?: () => void, onError?: (err: Error) => void }} [callbacks]
     */
    loadModel(file, callbacks = {}) {
        this.historyManager.clear();

        this.modelLoader.loadModel(
            file,
            (pct) => callbacks.onProgress?.(pct),
            (model) => {
                fitCameraToModel(model, this.sceneManager.camera, this.sceneManager.controls);
                this.sceneManager.fitHelpersToModel(model);

                const hierarchy = this.componentList.extractHierarchy(model);
                if (hierarchy.length > 0) {
                    this.componentList.display(
                        (component, element) => this.handleComponentClick(component, element),
                        (event, object) =>
                            this.contextMenu.show(event.clientX, event.clientY, object),
                        () => {},
                    );
                    this.componentList.expandAllArrows();
                    this.toggleList(true);
                }

                this.exitMeasureMode();
                this.viewerControls.isolatedPart = null;
                this.viewerControls.selectedPart = null;
                const isoBanner = document.getElementById("isolated-banner");
                if (isoBanner) isoBanner.style.display = "none";

                callbacks.onLoaded?.();
            },
            (err) => callbacks.onError?.(err),
        );
    }

    handleComponentClick(component, element) {
        document.querySelectorAll(".component-item").forEach((el) => {
            el.classList.remove("bg-accent/15");
        });
        if (element) element.classList.add("bg-accent/15");
        if (component.object) this.viewerControls.focusOnPart(component.object);
    }

    bind(id, event, handler) {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener(event, handler);
        this.boundListeners.push({ el, event, handler });
    }

    setToolActive(target, active) {
        target.classList.toggle("text-accent", active);
        target.classList.toggle("bg-white/10", active);
    }

    attachEventListeners() {
        const dom = this.sceneManager.renderer?.domElement;
        if (dom) dom.addEventListener("contextmenu", this.onCanvasContextMenu);

        this.bind("undo-action", "click", () => this.historyManager.undo());
        this.bind("redo-action", "click", () => this.historyManager.redo());
        this.bind("reset-camera", "click", () => this.viewerControls.resetCamera());
        this.bind("show-all-parts", "click", () => this.viewerControls.showAllParts());

        this.bind("toggle-edges", "click", (e) => {
            if (!this.modelLoader.model) return;
            this.setToolActive(e.currentTarget, this.modelLoader.toggleEdges());
        });
        this.bind("toggle-grid", "click", (e) => {
            this.setToolActive(e.currentTarget, this.sceneManager.toggleGrid());
        });
        this.bind("toggle-axes", "click", (e) => {
            this.setToolActive(e.currentTarget, this.sceneManager.toggleAxes());
        });

        this.bind("isolate-mode", "click", (e) => {
            if (!this.modelLoader.model) return;
            if (this.viewerControls.selectedPart) {
                this.exitMeasureMode();
                this.viewerControls.isolatePart(this.viewerControls.selectedPart);
                return;
            }
            this.exitMeasureMode();
            this.viewerControls.enableIsolateMode();
            this.setToolActive(e.currentTarget, true);
        });
        this.bind("exit-isolate-mode", "click", () => this.viewerControls.disableIsolateMode());
        this.bind("exit-isolate", "click", () => this.viewerControls.showAllParts());

        this.bind("measure-mode", "click", (e) => {
            if (!this.modelLoader.model) return;
            if (this.measureTool.active) {
                this.exitMeasureMode();
                return;
            }
            this.viewerControls.disableIsolateMode();
            this.measureTool.enable();
            this.setToolActive(e.currentTarget, true);
        });
        this.bind("exit-measure", "click", () => this.exitMeasureMode());

        this.bind("toggle-list", "click", () => this.toggleList());
        this.bind("close-list", "click", () => this.toggleList(false));

        window.addEventListener("keydown", this.onKeyDown);
        this.historyManager.updateUI();
    }

    toggleList(force) {
        const container = document.getElementById("component-list-container");
        if (!container) return;
        const next = force ?? container.classList.contains("hidden");
        this.componentList.listVisible = next;
        container.classList.toggle("hidden", !next);
    }

    exitMeasureMode() {
        if (!this.measureTool.active) return;
        this.measureTool.disable();
        const btn = document.getElementById("measure-mode");
        if (btn) this.setToolActive(btn, false);
    }

    handleCanvasContextMenu(e) {
        e.preventDefault();
        if (!this.modelLoader.model) return;
        const intersection = this.interactionManager.getIntersection(e);
        if (intersection) this.contextMenu.show(e.clientX, e.clientY, intersection.part);
    }

    handleKeyDown(e) {
        if (!this.modelLoader.model) return;

        if (e.key === "Escape") {
            if (this.measureTool.active) this.exitMeasureMode();
            else if (this.viewerControls.isolateMode) this.viewerControls.disableIsolateMode();
            else if (this.viewerControls.isolatedPart) this.viewerControls.showAllParts();
            return;
        }

        const mod = e.ctrlKey || e.metaKey;
        if (mod && e.key === "z" && !e.shiftKey) {
            e.preventDefault();
            this.historyManager.undo();
        } else if (mod && ((e.key === "z" && e.shiftKey) || e.key === "y")) {
            e.preventDefault();
            this.historyManager.redo();
        }
    }

    dispose() {
        window.removeEventListener("keydown", this.onKeyDown);
        const dom = this.sceneManager.renderer?.domElement;
        if (dom) dom.removeEventListener("contextmenu", this.onCanvasContextMenu);

        this.boundListeners.forEach(({ el, event, handler }) => {
            el.removeEventListener(event, handler);
        });
        this.boundListeners = [];

        this.contextMenu.remove();
        this.viewerControls.disableIsolateMode();
        this.measureTool.dispose();
        this.interactionManager.dispose();
        this.modelLoader.dispose();
        this.sceneManager.dispose();
    }
}
