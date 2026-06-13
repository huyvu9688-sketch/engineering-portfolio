// Scene, camera, renderer, lighting and the orbit controls.

import { THREE, OrbitControls } from "./three.js";

export class SceneManager {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.gridHelper = null;
        this.axesHelper = null;
        this.animationId = null;
        this.running = false;
        this.onResize = () => this.onWindowResize();
        this.onVisibility = () => this.handleVisibility();
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
        window.addEventListener("resize", this.onResize);
        document.addEventListener("visibilitychange", this.onVisibility);
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

        if (this.controls) this.controls.dispose();
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
