// Minimal GLB/GLTF viewer — dark environment, real model colours, free-tumble
// rotation, a searchable component tree, isolate, measure, and a view cube.
//
// Rotation uses TrackballControls (not OrbitControls) so the model can be spun a
// full 360° about any axis — OrbitControls clamps at the top/bottom poles, which
// stopped vertical rotation and made the view-cube top/bottom snaps feel stuck.

import * as THREE from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ComponentList } from "./component-list.js";
import { MeasureTool } from "./measure.js";
import { ViewCube } from "./view-cube.js";
import { FaceSelector } from "./face-select.js";

const DRACO_DECODER_PATH = "https://www.gstatic.com/draco/versioned/decoders/1.5.6/";
const TEXTURE_SLOTS = ["map", "emissiveMap", "metalnessMap", "roughnessMap", "aoMap", "normalMap"];
const SELECT_COLOR = 0xeb3a14; // accent glow on the focused part
const EXPLODE_MAX = 1.5; // slider 100% pushes parts 1.5× their centre offset

// Standard-view directions (from target) + the up vector each needs.
const VIEW_DIRS = {
    front: [0, 0, 1],
    back: [0, 0, -1],
    right: [1, 0, 0],
    left: [-1, 0, 0],
    top: [0, 1, 0],
    bottom: [0, -1, 0],
};
const VIEW_UPS = { top: [0, 0, -1], bottom: [0, 0, 1] };

// Compact number for the volume read-out: thousands grouped, ~4 sig figs small.
function fmtVolume(n) {
    if (!Number.isFinite(n) || n === 0) return "0";
    if (n >= 1000) return Math.round(n).toLocaleString();
    if (n >= 1) return n.toFixed(2);
    return n.toPrecision(3);
}

// A GLB carries a material NAME + colour but no density, so weight is estimated
// by matching the name to common engineering materials. Order matters (check the
// more specific name first); unmatched parts fall back to steel, flagged below.
const MATERIAL_DENSITY = [
    { keys: ["stainless", "inox", "304", "316"], density: 8000, label: "Stainless steel" },
    { keys: ["steel", "iron", "carbon"], density: 7850, label: "Steel" },
    { keys: ["alumin", "6061", "7075"], density: 2700, label: "Aluminium" },
    { keys: ["titan"], density: 4500, label: "Titanium" },
    { keys: ["brass"], density: 8500, label: "Brass" },
    { keys: ["bronze"], density: 8800, label: "Bronze" },
    { keys: ["copper"], density: 8960, label: "Copper" },
    { keys: ["acetal", "delrin", "pom"], density: 1410, label: "Acetal (POM)" },
    { keys: ["polycarbonate"], density: 1200, label: "Polycarbonate" },
    { keys: ["nylon", "polyamide", "pa6", "pa66"], density: 1140, label: "Nylon" },
    { keys: ["acrylic", "pmma", "plexi"], density: 1180, label: "Acrylic" },
    { keys: ["abs"], density: 1050, label: "ABS" },
    { keys: ["pla"], density: 1240, label: "PLA" },
    { keys: ["pvc"], density: 1380, label: "PVC" },
    { keys: ["polyethylene", "hdpe", "uhmw"], density: 950, label: "Polyethylene" },
    { keys: ["rubber", "silicone", "epdm", "nbr"], density: 1200, label: "Rubber" },
    { keys: ["glass"], density: 2500, label: "Glass" },
    { keys: ["wood", "plywood", "mdf"], density: 700, label: "Wood" },
];

function inferMaterial(name) {
    const n = (name || "").toLowerCase();
    for (const entry of MATERIAL_DENSITY) {
        if (entry.keys.some((k) => n.includes(k))) {
            return { density: entry.density, label: entry.label, assumed: false };
        }
    }
    return { density: 7850, label: "Steel", assumed: true };
}

// Weight in grams (< 1 kg) or kilograms.
function fmtWeight(kg) {
    if (!Number.isFinite(kg)) return "—";
    if (kg < 1) return `${(kg * 1000).toFixed(1)} g`;
    return `${kg.toFixed(2)} kg`;
}

export class ViewerCore {
    /** @param {HTMLElement} mount element the renderer canvas mounts into */
    constructor(mount) {
        this.mount = mount;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.allParts = [];
        // GLB has no unit. Auto-detected on load: a metre-scale model → units
        // are metres (×1000 = mm); an already-large model → units are mm (×1).
        this.unitToMm = 1;
        this.dracoLoader = null;
        this.environmentTexture = null;
        this.animationId = null;
        this.running = false;

        this.componentList = new ComponentList();
        this.measureTool = new MeasureTool(this);
        this.faceSelector = new FaceSelector(this);
        this.selectedObject = null;
        this.isolatedObject = null;
        this.isolateMode = false;
        this.boundListeners = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.lastHoverTime = 0;
        this.contextTarget = null; // part the right-click menu acts on
        this.rightDown = { x: 0, y: 0 }; // to tell a right-click from a right-drag
        this.leftDown = { x: 0, y: 0 }; // to tell a click-to-select from a drag
        this.edgesVisible = false;
        this.edgeLines = []; // EdgesGeometry overlays parented to each mesh
        this.viewCube = null;
        this.exploded = false;
        this.explodeFactor = 0;
        this.explodeData = []; // [{ object, base, dir }] captured on entering explode
        this.sectionActive = false;
        this.sectionPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
        this.sectionNormal = new THREE.Vector3(1, 0, 0);
        this.sectionPct = 50;
        this.sectionFacePick = false;
        this.selectedFacePoint = null; // world point of the last picked face
        this.selectedFaceNormal = null; // its world normal — used by the section

        // Fallback only for meshes that somehow ship with no material at all.
        this.defaultMaterial = new THREE.MeshStandardMaterial({
            color: 0x9a9a9a,
            metalness: 0.0,
            roughness: 0.6,
            side: THREE.DoubleSide,
        });

        this.onResize = () => this.onWindowResize();
        this.onVisibility = () => this.handleVisibility();
        this.onIsolatePickBound = (e) => this.onIsolatePick(e);
        this.onKeyDown = (e) => this.handleKeyDown(e);
        this.onMouseMoveBound = (e) => this.onMouseMove(e);
        this.onContextMenuBound = (e) => this.onContextMenu(e);
        this.onPointerDownBound = (e) => this.onPointerDown(e);
        this.onSelectUpBound = (e) => this.onSelectUp(e);
        this.onDocClickBound = (e) => this.onDocumentClick(e);
        this.onWheelHideBound = () => this.hideContextMenu();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111); // dark viewport

        const aspect = this.mount.clientWidth / this.mount.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(5, 5, 5);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.mount.clientWidth, this.mount.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        // "PBR Neutral" preserves authored material colour (vs ACES, which
        // shifts it) — the right choice for showing real component colour.
        this.renderer.toneMapping = THREE.NeutralToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.localClippingEnabled = true; // for the section-view cutaway

        this.mount.innerHTML = "";
        this.mount.appendChild(this.renderer.domElement);

        // Neutral image-based lighting so metallic/PBR materials reflect a soft
        // room (and show their colour) instead of rendering black.
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        this.environmentTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        this.scene.environment = this.environmentTexture;
        pmrem.dispose();

        this.controls = new TrackballControls(this.camera, this.renderer.domElement);
        this.controls.rotateSpeed = 3.5; // trackball is slow at the default 1.0
        this.controls.zoomSpeed = 1.2;
        this.controls.panSpeed = 0.8;
        this.controls.staticMoving = false; // light damping
        this.controls.dynamicDampingFactor = 0.15;

        this.viewCube = new ViewCube();

        this.setupLighting();
        this.attachUiListeners();

        this.renderer.domElement.addEventListener("mousemove", this.onMouseMoveBound);
        this.renderer.domElement.addEventListener("contextmenu", this.onContextMenuBound);
        this.renderer.domElement.addEventListener("pointerdown", this.onPointerDownBound);
        this.renderer.domElement.addEventListener("pointerup", this.onSelectUpBound);
        this.renderer.domElement.addEventListener("wheel", this.onWheelHideBound, { passive: true });
        document.addEventListener("click", this.onDocClickBound);
        window.addEventListener("resize", this.onResize);
        window.addEventListener("keydown", this.onKeyDown);
        document.addEventListener("visibilitychange", this.onVisibility);

        this.start();
    }

    setupLighting() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.25));

        const key = new THREE.DirectionalLight(0xffffff, 1.4);
        key.position.set(5, 10, 7.5);
        this.scene.add(key);

        const fill = new THREE.DirectionalLight(0xffffff, 0.5);
        fill.position.set(-6, -2, -7.5);
        this.scene.add(fill);
    }

    bind(id, event, handler) {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener(event, handler);
        this.boundListeners.push({ el, event, handler });
    }

    setToolActive(target, active) {
        if (!target) return;
        target.classList.toggle("text-accent", active);
        target.classList.toggle("bg-white/10", active);
    }

    attachUiListeners() {
        this.bind("toggle-list", "click", () => this.toggleList());
        this.bind("close-list", "click", () => this.toggleList(false));
        this.bind("reset-camera", "click", () => this.resetCamera());
        this.bind("show-all-parts", "click", () => this.showAll());

        this.bind("isolate-mode", "click", (e) => {
            if (!this.model) return;
            this.exitMeasureMode();
            // A part chosen in the tree? Isolate it straight away.
            if (this.selectedObject) {
                this.isolatePart(this.selectedObject);
                return;
            }
            this.enableIsolateMode();
            this.setToolActive(e.currentTarget, true);
        });
        this.bind("exit-isolate-mode", "click", () => this.disableIsolateMode());
        this.bind("exit-isolate", "click", () => this.showAll());

        this.bind("measure-mode", "click", (e) => {
            if (!this.model) return;
            if (this.measureTool.active) {
                this.exitMeasureMode();
                return;
            }
            this.disableIsolateMode();
            this.measureTool.enable();
            this.setToolActive(e.currentTarget, true);
        });
        this.bind("exit-measure", "click", () => this.exitMeasureMode());
        this.bind("measure-mode-distance", "click", () => this.measureTool.setMode("distance"));
        this.bind("measure-mode-circle", "click", () => this.measureTool.setMode("circle"));
        this.bind("measure-mode-centers", "click", () => this.measureTool.setMode("centers"));

        this.bind("ctx-isolate", "click", () => {
            if (this.contextTarget) this.isolatePart(this.contextTarget);
            this.hideContextMenu();
        });
        this.bind("ctx-show-all", "click", () => {
            this.showAll();
            this.hideContextMenu();
        });

        this.bind("toggle-edges", "click", () => {
            if (this.model) this.toggleEdges();
        });
        this.bind("compute-volume", "click", () => this.computeVolume());
        this.bind("volume-dismiss", "click", () => {
            const panel = document.getElementById("volume-result");
            if (panel) panel.style.display = "none";
        });
        this.bind("toggle-explode", "click", () => {
            if (this.model) this.toggleExplode();
        });
        this.bind("explode-slider", "input", (e) => {
            this.setExplodeFactor((parseFloat(e.target.value) / 100) * EXPLODE_MAX);
        });
        this.bind("exit-explode", "click", () => {
            if (this.exploded) this.exitExplode();
        });
        this.bind("view-cube-hit", "click", (e) => this.onViewCubeClick(e));
        this.bind("properties-close", "click", () => this.hideProperties());

        this.bind("export-stl", "click", () => {
            if (this.model) this.exportSTL();
        });

        this.bind("toggle-section", "click", () => {
            if (this.model) this.toggleSection();
        });
        this.bind("section-axis-x", "click", () => this.setSectionAxis("X"));
        this.bind("section-axis-y", "click", () => this.setSectionAxis("Y"));
        this.bind("section-axis-z", "click", () => this.setSectionAxis("Z"));
        this.bind("section-slider", "input", (e) => {
            this.sectionPct = parseFloat(e.target.value);
            this.updateSectionPlane();
        });
        this.bind("section-flip", "click", () => this.flipSection());
        this.bind("section-face", "click", () => this.armSectionFacePick());
        this.bind("exit-section", "click", () => {
            if (this.sectionActive) this.exitSection();
        });
    }

    toggleList(force) {
        const container = document.getElementById("component-list-container");
        if (!container) return;
        const next = force ?? container.classList.contains("hidden");
        container.classList.toggle("hidden", !next);
    }

    /**
     * @param {File} file
     * @param {{ onLoaded?: () => void, onError?: (err: Error) => void }} [callbacks]
     */
    loadModel(file, callbacks = {}) {
        this.clearModel();
        const url = URL.createObjectURL(file);

        const loader = new GLTFLoader();
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
        loader.setDRACOLoader(this.dracoLoader);

        loader.load(
            url,
            (gltf) => {
                URL.revokeObjectURL(url);
                try {
                    this.addModel(gltf.scene);
                    callbacks.onLoaded?.();
                } catch (err) {
                    callbacks.onError?.(err);
                }
            },
            undefined,
            (err) => {
                URL.revokeObjectURL(url);
                callbacks.onError?.(err);
            },
        );
    }

    addModel(scene) {
        this.model = scene;

        this.model.traverse((child) => {
            if (!child.isMesh) return;
            if (child.geometry && !child.geometry.attributes.normal) {
                child.geometry.computeVertexNormals();
            }
            // Bad CAD bounding spheres can frustum-cull a visible mesh.
            child.frustumCulled = false;
            this.allParts.push(child);

            if (!child.material) {
                child.material = this.defaultMaterial;
                return;
            }
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((mat) => this.sanitizeMaterial(mat));
        });

        this.scene.add(this.model);
        this.recenter();
        this.fitToObject(this.model);

        // Guess the unit from the model's overall size so measurements can show
        // mm. < 10 units across → metre-scale export (×1000); otherwise the
        // units are already mm-scale (×1).
        const span = new THREE.Box3().setFromObject(this.model).getSize(new THREE.Vector3());
        const maxDim = Math.max(span.x, span.y, span.z) || 1;
        this.unitToMm = maxDim < 10 ? 1000 : 1;

        // Reset interaction state from any prior model.
        this.isolatedObject = null;
        const isoBanner = document.getElementById("isolated-banner");
        if (isoBanner) isoBanner.style.display = "none";
        const cubeHit = document.getElementById("view-cube-hit");
        if (cubeHit) cubeHit.style.display = "block";

        // Build + show the component tree.
        const hierarchy = this.componentList.extractHierarchy(this.model);
        if (hierarchy.length > 0) {
            this.componentList.display(
                (component, element) => this.handleComponentClick(component, element),
                (component, event) => this.showContextMenu(event, component.object),
            );
            this.toggleList(true);
        }
    }

    handleComponentClick(component, element) {
        document.querySelectorAll(".component-item").forEach((el) => {
            el.classList.remove("bg-accent/15");
        });
        if (element) element.classList.add("bg-accent/15");
        if (component.object) {
            this.faceSelector.clearSelect(); // tree picks a whole part, not a face
            this.selectedFacePoint = null;
            this.selectedFaceNormal = null;
            this.focusOnPart(component.object);
            this.showProperties(component.object);
        }
    }

    focusOnPart(object) {
        this.selectPart(object);
        this.fitToObject(object);
    }

    // ----- Hover glow ----------------------------------------------------

    onMouseMove(event) {
        if (!this.model) return;
        const now = performance.now();
        if (now - this.lastHoverTime < 33) return; // ~30fps
        this.lastHoverTime = now;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const visibleParts = this.allParts.filter((p) => p.visible);
        const intersects = this.raycaster.intersectObjects(visibleParts, false);
        const hit = intersects[0];
        if (hit) this.faceSelector.showHover(hit.object, hit.faceIndex);
        else this.faceSelector.clearHover();
    }

    // Persistent accent glow on the focused part, clearing the previous one.
    selectPart(object) {
        if (this.selectedObject && this.selectedObject !== object) {
            this.setEmissive(this.selectedObject, 0x000000, 0);
        }
        this.selectedObject = object;
        this.setEmissive(object, SELECT_COLOR, 0.5);
    }

    setEmissive(node, hex, intensity) {
        node.traverse((child) => {
            if (child.isMesh && child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((mat) => {
                    if (!mat.emissive) return;
                    mat.emissive.setHex(hex);
                    mat.emissiveIntensity = intensity;
                });
            }
        });
    }

    // ----- Isolate -------------------------------------------------------

    enableIsolateMode() {
        this.isolateMode = true;
        const banner = document.getElementById("isolate-banner");
        if (banner) banner.style.display = "block";
        const dom = this.renderer?.domElement;
        if (dom) {
            dom.style.cursor = "crosshair";
            dom.addEventListener("click", this.onIsolatePickBound);
        }
    }

    disableIsolateMode() {
        this.isolateMode = false;
        const banner = document.getElementById("isolate-banner");
        if (banner) banner.style.display = "none";
        this.setToolActive(document.getElementById("isolate-mode"), false);
        const dom = this.renderer?.domElement;
        if (dom) {
            dom.style.cursor = "auto";
            dom.removeEventListener("click", this.onIsolatePickBound);
        }
    }

    onIsolatePick(event) {
        if (!this.isolateMode || !this.model) return;
        event.stopPropagation();
        event.preventDefault();

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const visibleParts = this.allParts.filter((p) => p.visible);
        const intersects = this.raycaster.intersectObjects(visibleParts, false);

        if (intersects.length > 0) {
            this.isolatePart(this.resolvePartNode(intersects[0].object));
            this.disableIsolateMode();
        }
    }

    // Walk up from a clicked mesh to the nearest named group, so isolating a
    // face isolates the whole part rather than one triangle.
    resolvePartNode(mesh) {
        let node = mesh.parent;
        while (node && node !== this.model) {
            const isNamedGroup =
                (node.isGroup || node.type === "Group") && node.name && node.name.trim() !== "";
            if (isNamedGroup) return node;
            node = node.parent;
        }
        return mesh;
    }

    isolatePart(object) {
        const targets = new Set();
        if (object.isMesh) {
            targets.add(object.uuid);
        } else {
            object.traverse((child) => {
                if (child.isMesh) targets.add(child.uuid);
            });
        }
        this.allParts.forEach((p) => {
            p.visible = targets.has(p.uuid);
        });

        this.isolatedObject = object;
        const banner = document.getElementById("isolated-banner");
        const name = document.getElementById("isolated-banner-name");
        if (banner) banner.style.display = "block";
        if (name) name.textContent = object.name || "part";
        // Camera intentionally stays put — isolating just hides the other parts.
    }

    showAll() {
        this.allParts.forEach((p) => {
            p.visible = true;
        });
        this.isolatedObject = null;
        const banner = document.getElementById("isolated-banner");
        if (banner) banner.style.display = "none";
        // Camera stays where it is — bringing the parts back shouldn't re-frame.
    }

    // ----- Right-click context menu --------------------------------------

    onPointerDown(event) {
        if (event.button === 2) {
            this.rightDown.x = event.clientX;
            this.rightDown.y = event.clientY;
        } else if (event.button === 0) {
            this.leftDown.x = event.clientX;
            this.leftDown.y = event.clientY;
        }
    }

    // A stationary left-click (not a drag, and not in measure/isolate mode)
    // selects the part under the cursor and shows its properties card.
    onSelectUp(event) {
        if (event.button !== 0 || !this.model) return;
        if (this.measureTool.active || this.isolateMode) return;
        const moved = Math.hypot(event.clientX - this.leftDown.x, event.clientY - this.leftDown.y);
        if (moved > 6) return; // a drag (rotate), not a click

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const visibleParts = this.allParts.filter((p) => p.visible);
        const intersects = this.raycaster.intersectObjects(visibleParts, false);

        // Section "Face" mode: the next click sets the cut plane from that face.
        if (this.sectionFacePick) {
            const hit = intersects[0];
            if (hit && hit.face) {
                const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
                const worldNormal = hit.face.normal.clone().applyNormalMatrix(normalMatrix);
                this.setSectionFromFace(hit.point.clone(), worldNormal);
            }
            this.disarmSectionFacePick();
            return;
        }

        if (intersects.length === 0) {
            this.faceSelector.clearSelect();
            this.selectedFacePoint = null;
            this.selectedFaceNormal = null;
            return;
        }
        // Clear any part-level glow (from a tree click) — the face is the focus.
        if (this.selectedObject) {
            this.setEmissive(this.selectedObject, 0x000000, 0);
            this.selectedObject = null;
        }
        const hit = intersects[0];
        const node = this.resolvePartNode(hit.object);
        const faceInfo = this.faceSelector.selectFace(hit.object, hit.faceIndex);
        this.showProperties(node, faceInfo);
        if (faceInfo) {
            this.selectedFacePoint = hit.point.clone();
            this.selectedFaceNormal = faceInfo.worldNormal.clone();
            // If a section is already on, move the cut to this face right away.
            if (this.sectionActive) {
                this.setSectionFromFace(this.selectedFacePoint.clone(), this.selectedFaceNormal.clone());
            }
        }
    }

    onContextMenu(event) {
        if (!this.model) return;
        event.preventDefault();
        // A right-drag pans/orbits — only a near-stationary right-click opens the menu.
        const moved = Math.hypot(event.clientX - this.rightDown.x, event.clientY - this.rightDown.y);
        if (moved > 6) {
            this.hideContextMenu();
            return;
        }

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const visibleParts = this.allParts.filter((p) => p.visible);
        const intersects = this.raycaster.intersectObjects(visibleParts, false);
        const node = intersects.length ? this.resolvePartNode(intersects[0].object) : null;
        this.showContextMenu(event, node);
    }

    // Place the menu at the cursor (inside the viewer). `target` null means empty
    // space — then only "Show all" appears, and only while something is isolated.
    showContextMenu(event, target) {
        const menu = document.getElementById("viewer-context-menu");
        const root = document.getElementById("viewer-root");
        if (!menu || !root) return;

        this.contextTarget = target || null;
        const isolateBtn = document.getElementById("ctx-isolate");
        const showAllBtn = document.getElementById("ctx-show-all");
        if (isolateBtn) isolateBtn.style.display = target ? "flex" : "none";
        if (showAllBtn) showAllBtn.style.display = this.isolatedObject ? "flex" : "none";

        if (!target && !this.isolatedObject) {
            this.hideContextMenu();
            return;
        }

        menu.style.display = "block";
        const rect = root.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;
        if (x + menu.offsetWidth > rect.width) x = Math.max(4, rect.width - menu.offsetWidth - 4);
        if (y + menu.offsetHeight > rect.height) y = Math.max(4, rect.height - menu.offsetHeight - 4);
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
    }

    hideContextMenu() {
        const menu = document.getElementById("viewer-context-menu");
        if (menu) menu.style.display = "none";
    }

    onDocumentClick(event) {
        const menu = document.getElementById("viewer-context-menu");
        if (!menu || menu.style.display === "none") return;
        if (menu.contains(event.target)) return;
        this.hideContextMenu();
    }

    // ----- Edges overlay -------------------------------------------------

    toggleEdges() {
        if (this.edgesVisible) this.disableEdges();
        else this.enableEdges();
        this.setToolActive(document.getElementById("toggle-edges"), this.edgesVisible);
    }

    // Feature edges drawn as black lines. `thresholdAngle` controls how sharp an
    // edge must be to show: 30° = standard, 15° = fine (reveals chamfers/fillets).
    enableEdges(thresholdAngle = 30) {
        this.edgesVisible = true;
        this.allParts.forEach((mesh) => {
            if (!mesh.geometry || mesh.userData.__edges) return;
            const edgesGeometry = new THREE.EdgesGeometry(mesh.geometry, thresholdAngle);
            const material = new THREE.LineBasicMaterial({ color: 0x000000 });
            if (this.sectionActive) material.clippingPlanes = [this.sectionPlane];
            const lines = new THREE.LineSegments(edgesGeometry, material);
            lines.frustumCulled = false;
            lines.userData.isEdgeHelper = true;
            mesh.add(lines);
            mesh.userData.__edges = lines;
            this.edgeLines.push(lines);
        });
    }

    disableEdges() {
        this.edgesVisible = false;
        this.edgeLines.forEach((lines) => {
            const parent = lines.parent;
            if (parent) {
                parent.remove(lines);
                delete parent.userData.__edges;
            }
            lines.geometry.dispose();
            lines.material.dispose();
        });
        this.edgeLines = [];
    }

    // ----- Volume --------------------------------------------------------

    // Closed-mesh volume (mm³) of a set of meshes, in world space scaled by
    // unitToMm. Signed tetra volume per triangle; abs per mesh so a flipped
    // winding still counts +.
    volumeMm3(meshes) {
        const a = new THREE.Vector3();
        const b = new THREE.Vector3();
        const c = new THREE.Vector3();
        const cross = new THREE.Vector3();
        let totalRaw = 0;

        meshes.forEach((mesh) => {
            const geom = mesh.geometry;
            if (!geom || !geom.attributes.position) return;
            mesh.updateWorldMatrix(true, false);
            const matrix = mesh.matrixWorld;
            const pos = geom.attributes.position;
            const index = geom.index;
            const triCount = index ? index.count : pos.count;
            let partRaw = 0;
            for (let i = 0; i < triCount; i += 3) {
                const ia = index ? index.getX(i) : i;
                const ib = index ? index.getX(i + 1) : i + 1;
                const ic = index ? index.getX(i + 2) : i + 2;
                a.fromBufferAttribute(pos, ia).applyMatrix4(matrix);
                b.fromBufferAttribute(pos, ib).applyMatrix4(matrix);
                c.fromBufferAttribute(pos, ic).applyMatrix4(matrix);
                cross.crossVectors(b, c);
                partRaw += a.dot(cross) / 6;
            }
            totalRaw += Math.abs(partRaw);
        });

        const scale = this.unitToMm || 1;
        return totalRaw * scale * scale * scale;
    }

    // Volume of every VISIBLE part (so it adapts to isolate).
    computeVolume() {
        if (!this.model) return;
        const visibleParts = this.allParts.filter((p) => p.visible);
        this.showVolume(this.volumeMm3(visibleParts), visibleParts.length);
    }

    showVolume(mm3, partCount) {
        const cm3 = mm3 / 1000;
        const in3 = mm3 / 16387.064;
        const panel = document.getElementById("volume-result");
        const value = document.getElementById("volume-value");
        const extra = document.getElementById("volume-extra");
        if (panel) panel.style.display = "block";
        if (value) value.textContent = `${fmtVolume(cm3)} cm³ (${fmtVolume(in3)} in³)`;
        if (extra) {
            extra.textContent = `${fmtVolume(mm3)} mm³ · ${partCount} part${partCount === 1 ? "" : "s"}`;
        }
    }

    // ----- Properties card -----------------------------------------------

    // Name + material (from the GLB) + estimated weight (volume × inferred
    // density) for a clicked component. With `faceInfo` (from a face click) it
    // also shows that face's area + orientation.
    showProperties(node, faceInfo) {
        if (!node) return;
        const meshes = [];
        node.traverse((c) => {
            if (c.isMesh && !c.userData.isEdgeHelper) meshes.push(c);
        });
        if (meshes.length === 0) return;

        // Collect the material name(s) + a representative colour.
        const names = new Set();
        let firstMat = null;
        meshes.forEach((m) => {
            const mats = Array.isArray(m.material) ? m.material : [m.material];
            mats.forEach((mat) => {
                if (!mat) return;
                if (!firstMat) firstMat = mat;
                if (mat.name) names.add(mat.name);
            });
        });
        const namedMaterial = names.size === 1 ? [...names][0] : "";
        const info = inferMaterial(namedMaterial || (firstMat && firstMat.name) || "");

        const mm3 = this.volumeMm3(meshes);
        const weightKg = mm3 * 1e-9 * info.density; // mm³→m³ × kg/m³

        const set = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };
        let materialLabel = namedMaterial;
        if (!materialLabel) materialLabel = names.size > 1 ? `Multiple (${names.size})` : info.label;

        set("prop-name", node.name || "Unnamed");
        set("prop-material", materialLabel);
        set("prop-volume", `${fmtVolume(mm3 / 1000)} cm³`);
        set("prop-weight", fmtWeight(weightKg));
        set(
            "prop-density",
            `ρ ${(info.density / 1000).toFixed(2)} g/cm³${info.assumed ? " · assumed" : ""}`,
        );

        const swatch = document.getElementById("prop-material-swatch");
        if (swatch) {
            const hex = firstMat && firstMat.color ? `#${firstMat.color.getHexString()}` : "transparent";
            swatch.style.backgroundColor = hex;
        }

        // Face row — only when a specific face was clicked.
        const faceRow = document.getElementById("prop-face");
        if (faceRow) {
            if (faceInfo) {
                const mm2 = faceInfo.areaMm2;
                const areaText = mm2 >= 100 ? `${fmtVolume(mm2 / 100)} cm²` : `${fmtVolume(mm2)} mm²`;
                const n = faceInfo.worldNormal;
                const ax = Math.abs(n.x);
                const ay = Math.abs(n.y);
                const az = Math.abs(n.z);
                const axis = ax >= ay && ax >= az ? "X" : ay >= az ? "Y" : "Z";
                set("prop-face-area", areaText);
                set("prop-face-axis", `⟂ ${axis}`);
                faceRow.style.display = "block";
            } else {
                faceRow.style.display = "none";
            }
        }

        const card = document.getElementById("properties-card");
        if (card) card.style.display = "block";
    }

    hideProperties() {
        const card = document.getElementById("properties-card");
        if (card) card.style.display = "none";
    }

    // ----- View cube -----------------------------------------------------

    onViewCubeClick(event) {
        if (!this.model || !this.viewCube) return;
        const hit = document.getElementById("view-cube-hit");
        if (!hit) return;
        const view = this.viewCube.pick(event, hit.getBoundingClientRect());
        if (view) this.setStandardView(view);
    }

    // Snap to a named view at the current distance (doesn't re-frame/zoom).
    setStandardView(view) {
        if (!this.model) return;
        const dir = VIEW_DIRS[view];
        if (!dir) return;
        const target = this.controls.target;
        const dist = this.camera.position.distanceTo(target) || 1;
        const up = VIEW_UPS[view] || [0, 1, 0];

        this.camera.up.set(up[0], up[1], up[2]);
        this.camera.position.set(
            target.x + dir[0] * dist,
            target.y + dir[1] * dist,
            target.z + dir[2] * dist,
        );
        this.camera.lookAt(target);
        this.controls.update();
    }

    // ----- Explode -------------------------------------------------------

    toggleExplode() {
        if (this.exploded) this.exitExplode();
        else this.enterExplode();
    }

    // Capture each top-level component's radial offset from the model centre,
    // then let the slider scale it live. Descends through single-wrapper groups,
    // and falls back to individual meshes if there's no separable part level.
    enterExplode() {
        if (!this.model) return;
        this.model.updateMatrixWorld(true);

        // Group meshes by their named part (same resolution isolate uses), so each
        // real component moves as a unit regardless of how the top of the scene
        // graph is wrapped. Falls back to individual meshes if nothing is grouped.
        const seen = new Set();
        let parts = [];
        this.allParts.forEach((mesh) => {
            if (mesh.userData.isEdgeHelper) return;
            const node = this.resolvePartNode(mesh);
            if (!seen.has(node)) {
                seen.add(node);
                parts.push(node);
            }
        });
        if (parts.length <= 1) parts = this.allParts.filter((p) => !p.userData.isEdgeHelper);

        const center = new THREE.Box3().setFromObject(this.model).getCenter(new THREE.Vector3());
        const inv = new THREE.Matrix4();
        const localOrigin = new THREE.Vector3();
        this.explodeData = [];
        parts.forEach((part) => {
            const box = new THREE.Box3().setFromObject(part);
            if (box.isEmpty() || !part.parent) return;
            // Radial offset in WORLD space, then mapped into the part's parent-
            // local space so it's correct even under a CAD unit scale/rotation.
            const worldDir = box.getCenter(new THREE.Vector3()).sub(center);
            inv.copy(part.parent.matrixWorld).invert();
            localOrigin.set(0, 0, 0).applyMatrix4(inv);
            const dir = worldDir.applyMatrix4(inv).sub(localOrigin);
            this.explodeData.push({ object: part, base: part.position.clone(), dir });
        });

        this.exploded = true;
        this.setToolActive(document.getElementById("toggle-explode"), true);
        const banner = document.getElementById("explode-banner");
        if (banner) banner.style.display = "block";
        const slider = document.getElementById("explode-slider");
        const pct = slider ? parseFloat(slider.value) / 100 : 0;
        this.setExplodeFactor(pct * EXPLODE_MAX);
    }

    setExplodeFactor(factor) {
        this.explodeFactor = factor;
        this.explodeData.forEach(({ object, base, dir }) => {
            object.position.set(
                base.x + dir.x * factor,
                base.y + dir.y * factor,
                base.z + dir.z * factor,
            );
        });
    }

    exitExplode() {
        this.setExplodeFactor(0); // restore original positions
        this.explodeData = [];
        this.exploded = false;
        this.setToolActive(document.getElementById("toggle-explode"), false);
        const banner = document.getElementById("explode-banner");
        if (banner) banner.style.display = "none";
    }

    // ----- Section view (clipping plane) ---------------------------------

    toggleSection() {
        if (this.sectionActive) this.exitSection();
        else this.enterSection();
    }

    enterSection() {
        this.sectionActive = true;
        this.setToolActive(document.getElementById("toggle-section"), true);
        const banner = document.getElementById("section-banner");
        if (banner) banner.style.display = "block";
        this.applySectionToMaterials(true);
        // Start the cut from the selected face if there is one, else axis X.
        if (this.selectedFacePoint && this.selectedFaceNormal) {
            this.setSectionFromFace(this.selectedFacePoint.clone(), this.selectedFaceNormal.clone());
        } else {
            this.sectionPct = 50;
            const slider = document.getElementById("section-slider");
            if (slider) slider.value = "50";
            this.setSectionAxis("X");
        }
    }

    exitSection() {
        this.sectionActive = false;
        this.disarmSectionFacePick();
        this.setToolActive(document.getElementById("toggle-section"), false);
        const banner = document.getElementById("section-banner");
        if (banner) banner.style.display = "none";
        this.applySectionToMaterials(false);
    }

    // Clip only the model's (and its edges') materials, so the cube/markers stay.
    applySectionToMaterials(on) {
        const planes = on ? [this.sectionPlane] : null;
        this.allParts.forEach((mesh) => {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
                if (!m) return;
                m.clippingPlanes = planes;
                m.needsUpdate = true;
            });
        });
        this.edgeLines.forEach((l) => {
            l.material.clippingPlanes = planes;
            l.material.needsUpdate = true;
        });
    }

    setSectionAxis(axis) {
        const map = { X: [1, 0, 0], Y: [0, 1, 0], Z: [0, 0, 1] };
        const v = map[axis] || map.X;
        this.sectionNormal.set(v[0], v[1], v[2]);
        ["x", "y", "z"].forEach((a) =>
            this.setToolActive(document.getElementById(`section-axis-${a}`), a === axis.toLowerCase()),
        );
        this.updateSectionPlane();
    }

    // Flip the kept side WITHOUT moving the plane: negating both the normal and
    // the constant leaves the plane in place (so a face-aligned cut stays on that
    // face) and just reverses which half is clipped away.
    flipSection() {
        this.sectionNormal.negate();
        this.sectionPlane.normal.copy(this.sectionNormal);
        this.sectionPlane.constant = -this.sectionPlane.constant;
        this.syncSliderToPlane();
    }

    // Re-derive the slider % from the plane's current position along the normal,
    // so dragging stays continuous after a flip or a face pick.
    syncSliderToPlane() {
        const { dMin, dMax } = this.sectionRange();
        const d = -this.sectionPlane.constant;
        this.sectionPct = dMax > dMin ? ((d - dMin) / (dMax - dMin)) * 100 : 50;
        const slider = document.getElementById("section-slider");
        if (slider) slider.value = String(Math.round(this.sectionPct));
    }

    // Projection range of the model's bounding box along the current normal.
    sectionRange() {
        const box = new THREE.Box3().setFromObject(this.model);
        const { min, max } = box;
        const n = this.sectionNormal;
        let dMin = Infinity;
        let dMax = -Infinity;
        [min.x, max.x].forEach((x) =>
            [min.y, max.y].forEach((y) =>
                [min.z, max.z].forEach((z) => {
                    const d = n.x * x + n.y * y + n.z * z;
                    if (d < dMin) dMin = d;
                    if (d > dMax) dMax = d;
                }),
            ),
        );
        return { dMin, dMax };
    }

    updateSectionPlane() {
        if (!this.model) return;
        const { dMin, dMax } = this.sectionRange();
        const d = dMin + (dMax - dMin) * (this.sectionPct / 100);
        this.sectionPlane.normal.copy(this.sectionNormal);
        this.sectionPlane.constant = -d;
    }

    armSectionFacePick() {
        this.sectionFacePick = true;
        if (this.renderer?.domElement) this.renderer.domElement.style.cursor = "crosshair";
        this.setToolActive(document.getElementById("section-face"), true);
    }

    disarmSectionFacePick() {
        this.sectionFacePick = false;
        if (this.renderer?.domElement) this.renderer.domElement.style.cursor = "auto";
        this.setToolActive(document.getElementById("section-face"), false);
    }

    // Align the cut to a clicked face: plane normal = face normal, through the hit.
    setSectionFromFace(point, worldNormal) {
        const n = worldNormal.clone().normalize();
        // Orient the normal toward the model centre so the bulk of the part stays
        // visible — then sliding cuts inward FROM the face instead of erasing it.
        const center = new THREE.Box3().setFromObject(this.model).getCenter(new THREE.Vector3());
        if (n.dot(center.clone().sub(point)) < 0) n.negate();
        this.sectionNormal.copy(n);
        ["x", "y", "z"].forEach((a) =>
            this.setToolActive(document.getElementById(`section-axis-${a}`), false),
        );
        this.sectionPlane.normal.copy(this.sectionNormal);
        this.sectionPlane.constant = -this.sectionNormal.dot(point);
        this.syncSliderToPlane();
    }

    // ----- STL export ----------------------------------------------------

    async exportSTL() {
        if (!this.model) return;

        // Clear face overlays so they are not included in the output.
        this.faceSelector.clearSelect();
        this.faceSelector.clearHover();

        const { STLExporter } = await import(
            "three/examples/jsm/exporters/STLExporter.js"
        );

        // Build a temporary group: one cloned geometry per visible mesh with its
        // world transform already baked in. This gives a single merged binary STL
        // at full tessellation quality — no decimation, no LOD reduction.
        this.model.updateMatrixWorld(true);
        const exportGroup = new THREE.Group();

        this.allParts.forEach((mesh) => {
            if (!mesh.visible || mesh.userData.isEdgeHelper) return;
            const geom = mesh.geometry.clone();
            geom.applyMatrix4(mesh.matrixWorld); // bake world transform into vertex positions
            exportGroup.add(new THREE.Mesh(geom));
        });

        if (exportGroup.children.length === 0) return;

        const exporter = new STLExporter();
        const buffer = exporter.parse(exportGroup, { binary: true });

        // Dispose temporary geometries
        exportGroup.children.forEach((m) => m.geometry.dispose());

        const blob = new Blob([buffer], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "export.stl";
        a.click();
        URL.revokeObjectURL(url);
    }

    // ----- Measure -------------------------------------------------------

    exitMeasureMode() {
        if (!this.measureTool.active) return;
        this.measureTool.disable();
        this.setToolActive(document.getElementById("measure-mode"), false);
    }

    resetCamera() {
        if (this.model) this.fitToObject(this.model);
    }

    handleKeyDown(e) {
        if (e.key !== "Escape") return;
        const menu = document.getElementById("viewer-context-menu");
        if (menu && menu.style.display !== "none") {
            this.hideContextMenu();
            return;
        }
        if (this.sectionFacePick) {
            this.disarmSectionFacePick();
            return;
        }
        if (!this.model) return;
        if (this.measureTool.active) this.exitMeasureMode();
        else if (this.isolateMode) this.disableIsolateMode();
        else if (this.isolatedObject) this.showAll();
        else if (this.sectionActive) this.exitSection();
        else if (this.exploded) this.exitExplode();
    }

    // ----- Materials / framing ------------------------------------------

    sanitizeMaterial(mat) {
        mat.side = THREE.DoubleSide;

        if (mat.opacity === undefined || mat.opacity < 0.2) {
            mat.opacity = 1;
            mat.transparent = false;
        }

        TEXTURE_SLOTS.forEach((slot) => {
            if (mat[slot] && !mat[slot].image) mat[slot] = null;
        });

        if ("envMapIntensity" in mat) mat.envMapIntensity = 1;

        mat.needsUpdate = true;
    }

    recenter() {
        this.model.updateWorldMatrix(true, true);
        const box = new THREE.Box3().setFromObject(this.model);
        if (box.isEmpty()) return;
        const center = box.getCenter(new THREE.Vector3());
        if (![center.x, center.y, center.z].every(Number.isFinite)) return;
        this.model.position.sub(center);
        this.model.updateMatrixWorld(true);
    }

    // Frame any object (whole model or a single part). Clip planes + zoom limits
    // adapt to the model's overall scale so framing a part never clips.
    fitToObject(object) {
        const box = new THREE.Box3().setFromObject(object);
        if (box.isEmpty()) return;
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (!Number.isFinite(maxDim) || maxDim <= 0) return;

        const modelDim = this.model
            ? Math.max(
                  ...new THREE.Box3().setFromObject(this.model).getSize(new THREE.Vector3()).toArray(),
              )
            : maxDim;

        const fov = this.camera.fov * (Math.PI / 180);
        const dist = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 2.2;

        this.camera.near = Math.max(modelDim / 1000, 0.01);
        this.camera.far = Math.max(modelDim * 100, 1000);
        this.camera.updateProjectionMatrix();

        // Trackball lets the camera roll freely; reset up so framing is upright.
        this.camera.up.set(0, 1, 0);
        this.camera.position.set(
            center.x + dist * 0.7,
            center.y + dist * 0.5,
            center.z + dist * 0.7,
        );
        this.camera.lookAt(center);

        this.controls.target.copy(center);
        this.controls.minDistance = modelDim * 0.02;
        this.controls.maxDistance = modelDim * 12;
        this.controls.update();
    }

    clearModel() {
        this.faceSelector.clearHover();
        this.faceSelector.clearSelect();
        this.selectedFacePoint = null;
        this.selectedFaceNormal = null;
        this.disableEdges();
        this.setToolActive(document.getElementById("toggle-edges"), false);
        this.exploded = false;
        this.explodeData = [];
        this.setToolActive(document.getElementById("toggle-explode"), false);
        const explodeBanner = document.getElementById("explode-banner");
        if (explodeBanner) explodeBanner.style.display = "none";
        const explodeSlider = document.getElementById("explode-slider");
        if (explodeSlider) explodeSlider.value = "0";
        this.sectionActive = false;
        this.disarmSectionFacePick();
        this.setToolActive(document.getElementById("toggle-section"), false);
        const sectionBanner = document.getElementById("section-banner");
        if (sectionBanner) sectionBanner.style.display = "none";
        const volumePanel = document.getElementById("volume-result");
        if (volumePanel) volumePanel.style.display = "none";
        const cubeHit = document.getElementById("view-cube-hit");
        if (cubeHit) cubeHit.style.display = "none";
        this.hideProperties();
        this.selectedObject = null;
        this.isolatedObject = null;
        this.allParts = [];
        if (!this.model) return;
        this.model.traverse((child) => {
            if (!child.isMesh) return;
            if (child.geometry) child.geometry.dispose();
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((m) => {
                if (m && m !== this.defaultMaterial) m.dispose();
            });
        });
        this.scene.remove(this.model);
        this.model = null;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.loop();
    }

    loop() {
        if (!this.running) return;
        this.animationId = requestAnimationFrame(() => this.loop());
        if (this.controls) this.controls.update();
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
            // Drawn AFTER the main scene so it overlays the corner (no re-frame).
            if (this.model && this.viewCube) {
                this.viewCube.render(this.renderer, this.camera, this.controls.target);
            }
        }
    }

    stop() {
        this.running = false;
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    handleVisibility() {
        if (document.hidden) this.stop();
        else this.start();
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        const w = this.mount.clientWidth;
        const h = this.mount.clientHeight;
        if (w === 0 || h === 0) return;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        // TrackballControls needs the on-screen bounds to do its trackball math.
        if (this.controls) this.controls.handleResize();
    }

    dispose() {
        this.stop();
        const dom = this.renderer?.domElement;
        if (dom) {
            dom.removeEventListener("mousemove", this.onMouseMoveBound);
            dom.removeEventListener("contextmenu", this.onContextMenuBound);
            dom.removeEventListener("pointerdown", this.onPointerDownBound);
            dom.removeEventListener("pointerup", this.onSelectUpBound);
            dom.removeEventListener("wheel", this.onWheelHideBound);
        }
        document.removeEventListener("click", this.onDocClickBound);
        window.removeEventListener("resize", this.onResize);
        window.removeEventListener("keydown", this.onKeyDown);
        document.removeEventListener("visibilitychange", this.onVisibility);
        this.boundListeners.forEach(({ el, event, handler }) => {
            el.removeEventListener(event, handler);
        });
        this.boundListeners = [];

        this.disableIsolateMode();
        this.measureTool.dispose();
        this.faceSelector.dispose();
        this.clearModel();
        if (this.viewCube) {
            this.viewCube.dispose();
            this.viewCube = null;
        }
        if (this.controls) this.controls.dispose();
        if (this.dracoLoader) {
            this.dracoLoader.dispose();
            this.dracoLoader = null;
        }
        if (this.environmentTexture) {
            this.environmentTexture.dispose();
            this.environmentTexture = null;
        }
        if (this.scene) this.scene.environment = null;
        if (this.defaultMaterial) this.defaultMaterial.dispose();

        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.forceContextLoss();
            const el = this.renderer.domElement;
            if (el && el.parentNode) el.parentNode.removeChild(el);
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
    }
}
