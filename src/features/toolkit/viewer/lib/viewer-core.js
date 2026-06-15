// Minimal GLB/GLTF viewer — dark environment, real model colours, orbit, and a
// searchable component tree.
//
// (A view cube was tried but three's ViewHelper.render re-clears the canvas
// each frame, which blanked the viewport — so it's intentionally left out.)

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ComponentList } from "./component-list.js";

const DRACO_DECODER_PATH = "https://www.gstatic.com/draco/versioned/decoders/1.5.6/";
const TEXTURE_SLOTS = ["map", "emissiveMap", "metalnessMap", "roughnessMap", "aoMap", "normalMap"];
const SELECT_COLOR = 0xeb3a14; // accent glow on the focused part

export class ViewerCore {
    /** @param {HTMLElement} mount element the renderer canvas mounts into */
    constructor(mount) {
        this.mount = mount;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.dracoLoader = null;
        this.environmentTexture = null;
        this.animationId = null;
        this.running = false;

        this.componentList = new ComponentList();
        this.selectedObject = null;
        this.boundListeners = [];

        // Fallback only for meshes that somehow ship with no material at all.
        this.defaultMaterial = new THREE.MeshStandardMaterial({
            color: 0x9a9a9a,
            metalness: 0.0,
            roughness: 0.6,
            side: THREE.DoubleSide,
        });

        this.onResize = () => this.onWindowResize();
        this.onVisibility = () => this.handleVisibility();
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

        this.mount.innerHTML = "";
        this.mount.appendChild(this.renderer.domElement);

        // Neutral image-based lighting so metallic/PBR materials reflect a soft
        // room (and show their colour) instead of rendering black.
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        this.environmentTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        this.scene.environment = this.environmentTexture;
        pmrem.dispose();

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        this.setupLighting();
        this.attachUiListeners();

        window.addEventListener("resize", this.onResize);
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

    attachUiListeners() {
        this.bind("toggle-list", "click", () => this.toggleList());
        this.bind("close-list", "click", () => this.toggleList(false));
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

        // Build + show the component tree.
        const hierarchy = this.componentList.extractHierarchy(this.model);
        if (hierarchy.length > 0) {
            this.componentList.display((component, element) =>
                this.handleComponentClick(component, element),
            );
            this.toggleList(true);
        }
    }

    handleComponentClick(component, element) {
        document.querySelectorAll(".component-item").forEach((el) => {
            el.classList.remove("bg-accent/15");
        });
        if (element) element.classList.add("bg-accent/15");
        if (component.object) this.focusOnPart(component.object);
    }

    focusOnPart(object) {
        this.selectPart(object);
        this.fitToObject(object);
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

    // Keep the material's real colour/metalness/roughness; only neutralise the
    // things that render a part invisible or black.
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
            ? Math.max(...new THREE.Box3().setFromObject(this.model).getSize(new THREE.Vector3()).toArray())
            : maxDim;

        const fov = this.camera.fov * (Math.PI / 180);
        const dist = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 2.2;

        this.camera.near = Math.max(modelDim / 1000, 0.01);
        this.camera.far = Math.max(modelDim * 100, 1000);
        this.camera.updateProjectionMatrix();

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
        this.selectedObject = null;
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
    }

    dispose() {
        this.stop();
        window.removeEventListener("resize", this.onResize);
        document.removeEventListener("visibilitychange", this.onVisibility);
        this.boundListeners.forEach(({ el, event, handler }) => {
            el.removeEventListener(event, handler);
        });
        this.boundListeners = [];

        this.clearModel();
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
