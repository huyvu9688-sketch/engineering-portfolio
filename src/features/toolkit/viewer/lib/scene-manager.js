// Scene, camera, renderer, lighting, orbit controls, and the view-cube gizmo.
//
// Hardened for React: one WebGL context per mount, a render loop that can be
// stopped, full dispose() with forceContextLoss(), and a visibility-based
// pause so a backgrounded tab can't keep hammering the GPU.

import { THREE, OrbitControls, ViewHelper, RoomEnvironment } from "./three.js";

export class SceneManager {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.gridHelper = null;
        this.axesHelper = null;
        this.environmentTexture = null;
        this.viewHelper = null;
        this.clock = new THREE.Clock();
        this.animationId = null;
        this.running = false;
        this.onResize = () => this.onWindowResize();
        this.onVisibility = () => this.handleVisibility();
        this.onPointerUp = (e) => this.handlePointerUp(e);
    }

    init() {
        this.scene = new THREE.Scene();
        // White environment (temporary — see progress-tracker). A grey CAD model
        // is invisible on a dark viewport, which is what hid it before.
        this.scene.background = new THREE.Color(0xffffff);

        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(5, 5, 5);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        // Cap DPR: 2x on a hi-DPI laptop quadruples the pixels shaded each frame.
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        // "PBR Neutral" preserves authored material colour (vs ACES, which
        // shifts it) — the right choice for showing real component colour.
        this.renderer.toneMapping = THREE.NeutralToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // Neutral image-based lighting so metallic/PBR materials reflect a soft
        // room (and show their colour) instead of rendering black.
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        this.environmentTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        this.scene.environment = this.environmentTexture;
        pmrem.dispose();

        this.container.innerHTML = "";
        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 0.1;
        this.controls.maxDistance = 1000;

        this.setupLighting();
        this.setupHelpers();
        this.setupViewHelper();

        window.addEventListener("resize", this.onResize);
        document.addEventListener("visibilitychange", this.onVisibility);
    }

    setupLighting() {
        // Env map carries most of the ambient fill; a key + fill directional add
        // shape and keep colours lively on a white background.
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.25));

        const key = new THREE.DirectionalLight(0xffffff, 1.4);
        key.position.set(5, 10, 7.5);
        key.castShadow = true;
        key.shadow.mapSize.width = 1024;
        key.shadow.mapSize.height = 1024;
        this.scene.add(key);

        const fill = new THREE.DirectionalLight(0xffffff, 0.5);
        fill.position.set(-6, -2, -7.5);
        this.scene.add(fill);
    }

    setupHelpers() {
        // Mid-grey grid + axes read on the white background.
        this.gridHelper = new THREE.GridHelper(20, 20, 0x999999, 0xcccccc);
        this.scene.add(this.gridHelper);

        this.axesHelper = new THREE.AxesHelper(5);
        this.scene.add(this.axesHelper);
    }

    // Scale the grid + axes to the loaded model (after it's recentred) so they're
    // visible whether the model is 5 mm or 5 m, and drop the grid to its base.
    fitHelpersToModel(model) {
        if (!model) return;
        const box = new THREE.Box3().setFromObject(model);
        if (box.isEmpty()) return;
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (!Number.isFinite(maxDim) || maxDim <= 0) return;

        const scale = maxDim / 10;
        if (this.gridHelper) {
            this.gridHelper.scale.setScalar(scale);
            this.gridHelper.position.set(0, -size.y / 2, 0);
        }
        if (this.axesHelper) this.axesHelper.scale.setScalar(scale);
    }

    setupViewHelper() {
        // Clickable axis gizmo (the "view cube"): click an axis to snap the
        // camera to that view. Bottom-left so it never sits under the panel.
        this.viewHelper = new ViewHelper(this.camera, this.renderer.domElement);
        this.viewHelper.setLabels("X", "Y", "Z");
        this.viewHelper.location = { top: null, right: 0, bottom: 12, left: 12 };
        this.renderer.domElement.addEventListener("pointerup", this.onPointerUp);
    }

    handlePointerUp(event) {
        if (!this.viewHelper) return;
        if (this.controls) this.viewHelper.center.copy(this.controls.target);
        this.viewHelper.handleClick(event);
    }

    handleVisibility() {
        if (document.hidden) this.stop();
        else this.start();
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.loop();
    }

    loop() {
        if (!this.running) return;
        this.animationId = requestAnimationFrame(() => this.loop());

        const delta = this.clock.getDelta();
        if (this.viewHelper && this.viewHelper.animating) {
            this.viewHelper.center.copy(this.controls.target);
            this.viewHelper.update(delta);
        }
        if (this.controls) this.controls.update();
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
            if (this.viewHelper) this.viewHelper.render(this.renderer);
        }
    }

    stop() {
        this.running = false;
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    toggleGrid() {
        if (!this.gridHelper) return false;
        this.gridHelper.visible = !this.gridHelper.visible;
        return this.gridHelper.visible;
    }

    toggleAxes() {
        if (!this.axesHelper) return false;
        this.axesHelper.visible = !this.axesHelper.visible;
        return this.axesHelper.visible;
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (width === 0 || height === 0) return;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    disposeHelper(helper) {
        if (!helper) return;
        if (helper.geometry) helper.geometry.dispose();
        if (helper.material) {
            const mats = Array.isArray(helper.material) ? helper.material : [helper.material];
            mats.forEach((m) => m.dispose());
        }
    }

    dispose() {
        this.stop();
        window.removeEventListener("resize", this.onResize);
        document.removeEventListener("visibilitychange", this.onVisibility);
        if (this.renderer?.domElement) {
            this.renderer.domElement.removeEventListener("pointerup", this.onPointerUp);
        }

        if (this.controls) this.controls.dispose();
        if (this.viewHelper) {
            this.viewHelper.dispose();
            this.viewHelper = null;
        }
        if (this.environmentTexture) {
            this.environmentTexture.dispose();
            this.environmentTexture = null;
        }
        if (this.scene) this.scene.environment = null;
        this.disposeHelper(this.gridHelper);
        this.disposeHelper(this.axesHelper);

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
        this.gridHelper = null;
        this.axesHelper = null;
    }
}
