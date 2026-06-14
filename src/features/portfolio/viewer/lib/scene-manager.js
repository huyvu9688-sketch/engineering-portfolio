// Scene, camera, renderer, lighting and the orbit controls.

import { THREE, OrbitControls, ViewHelper } from "./three.js";

export class SceneManager {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.gridHelper = null;
        this.axesHelper = null;
        this.viewHelper = null; // navigation "view cube" gizmo (bottom-left)
        this.clock = new THREE.Clock();
        this.animationId = null;
        this.running = false;
        this.onResize = () => this.onWindowResize();
        this.onVisibility = () => this.handleVisibility();
        this.onPointerUp = (e) => this.handlePointerUp(e);
    }

    init() {
        this.scene = new THREE.Scene();
        // Dark "viewport screen" framed by the light Swiss chrome around it.
        this.scene.background = new THREE.Color(0x111111);

        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(5, 5, 5);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        // Cap device-pixel-ratio: 2x on a hi-DPI laptop quadruples the pixels
        // the GPU has to shade every frame, which is rough on weak hardware.
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        this.container.innerHTML = "";
        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 100;
        this.controls.maxPolarAngle = Math.PI / 2;

        this.setupLighting();
        this.setupHelpers();
        this.setupViewHelper();
        window.addEventListener("resize", this.onResize);
        document.addEventListener("visibilitychange", this.onVisibility);
    }

    setupViewHelper() {
        // A clickable axis gizmo (view cube): click an axis to snap the camera
        // to that orthographic-style view. Placed bottom-left so it never sits
        // under the component-list panel on the right.
        this.viewHelper = new ViewHelper(this.camera, this.renderer.domElement);
        this.viewHelper.setLabels("X", "Y", "Z");
        this.viewHelper.location = { top: null, right: 0, bottom: 12, left: 12 };
        this.renderer.domElement.addEventListener("pointerup", this.onPointerUp);
    }

    handlePointerUp(event) {
        // Let the gizmo claim the click if it was on an axis; otherwise it's a
        // no-op and OrbitControls keeps working as normal. Sync the orbit centre
        // first so it snaps around the current target, not the world origin.
        if (!this.viewHelper) return;
        if (this.controls) this.viewHelper.center.copy(this.controls.target);
        this.viewHelper.handleClick(event);
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
        mainLight.position.set(10, 15, 10);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        this.scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0x4488ff, 0.8);
        fillLight.position.set(-10, 10, -10);
        this.scene.add(fillLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.6);
        backLight.position.set(0, 5, -10);
        this.scene.add(backLight);

        const bottomLight = new THREE.DirectionalLight(0xffffff, 0.5);
        bottomLight.position.set(0, -10, 0);
        this.scene.add(bottomLight);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);
    }

    setupHelpers() {
        this.gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
        this.scene.add(this.gridHelper);

        this.axesHelper = new THREE.AxesHelper(5);
        this.scene.add(this.axesHelper);
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

    // Pause the render loop while the tab is hidden so it can't peg the GPU in
    // the background (and to play nice with dev hot-reload).
    handleVisibility() {
        if (document.hidden) {
            this.stop();
        } else {
            this.start();
        }
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

        // Drive the view-cube animation first (it moves the camera around the
        // controls target); OrbitControls then reconciles from the new pose.
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
        if (this.gridHelper) {
            this.gridHelper.visible = !this.gridHelper.visible;
            return this.gridHelper.visible;
        }
        return false;
    }

    toggleAxes() {
        if (this.axesHelper) {
            this.axesHelper.visible = !this.axesHelper.visible;
            return this.axesHelper.visible;
        }
        return false;
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
        this.disposeHelper(this.gridHelper);
        this.disposeHelper(this.axesHelper);

        if (this.renderer) {
            this.renderer.dispose();
            // Release the WebGL context immediately so it does not linger and
            // accumulate across hot-reloads / remounts (the usual cause of the
            // browser running out of contexts and freezing).
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
