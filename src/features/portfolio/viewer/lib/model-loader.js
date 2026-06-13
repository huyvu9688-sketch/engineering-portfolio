// Loads a GLB/GLTF model from a URL and prepares its meshes.

import { THREE, GLTFLoader, DRACOLoader } from "./three.js";

const DRACO_DECODER_PATH =
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/";

export class ModelLoader {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.model = null;
        this.allParts = [];
        this.partMap = {};
        this.dracoLoader = null;
    }

    /**
     * Load a model from a URL (a path under /public or an absolute URL).
     * @param {string} url
     * @param {(percent: number) => void} onProgress
     * @param {(model, allParts, partMap) => void} onComplete
     * @param {(error: Error) => void} onError
     */
    loadModel(url, onProgress, onComplete, onError) {
        this.clearCurrentModel();

        const loader = new GLTFLoader();
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
        loader.setDRACOLoader(this.dracoLoader);

        loader.load(
            url,
            (gltf) => {
                this.processModel(gltf.scene);
                if (onComplete) onComplete(this.model, this.allParts, this.partMap);
            },
            (xhr) => {
                if (xhr.total > 0 && onProgress) {
                    onProgress(Math.round((xhr.loaded / xhr.total) * 100));
                }
            },
            (err) => {
                if (onError) onError(err);
            },
        );
    }

    processModel(scene) {
        this.model = scene;
        let partIndex = 0;

        this.model.traverse((child) => {
            if (child.name && child.name !== "") {
                this.partMap[child.name] = child;
            }

            if (child.isMesh) {
                if (!child.name || child.name === "") {
                    child.name = `Part_${partIndex++}`;
                    this.partMap[child.name] = child;
                }

                child.userData.isPart = true;
                this.allParts.push(child);
                child.castShadow = true;
                child.receiveShadow = true;

                this.optimizeMaterial(child);
                this.computeNormals(child);
            }
        });

        this.sceneManager.scene.add(this.model);
    }

    optimizeMaterial(mesh) {
        if (!mesh.material) return;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat) => {
            if (mat.color && mat.color.r === 0 && mat.color.g === 0 && mat.color.b === 0) {
                mat.color.setHex(0x808080);
            }
            if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
                mat.metalness = Math.min(mat.metalness, 0.5);
                mat.roughness = Math.max(mat.roughness, 0.4);
            }
            mat.needsUpdate = true;
        });
    }

    computeNormals(mesh) {
        if (mesh.geometry && !mesh.geometry.attributes.normal) {
            mesh.geometry.computeVertexNormals();
        }
    }

    clearCurrentModel() {
        if (this.model) {
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach((m) => m.dispose());
                }
            });
            this.sceneManager.scene.remove(this.model);
        }
        this.model = null;
        this.allParts = [];
        this.partMap = {};
    }

    createEdges() {
        if (!this.model) return;

        this.model.traverse((child) => {
            if (child.isMesh && child.geometry) {
                try {
                    const edges = new THREE.EdgesGeometry(child.geometry, 35);
                    const edgeLine = new THREE.LineSegments(
                        edges,
                        new THREE.LineBasicMaterial({
                            color: 0x000000,
                            transparent: false,
                            depthTest: true,
                            depthWrite: false,
                            polygonOffset: true,
                            polygonOffsetFactor: -1,
                            polygonOffsetUnits: -1,
                        }),
                    );
                    edgeLine.userData.isEdgeHelper = true;
                    edgeLine.visible = false;
                    child.add(edgeLine);
                } catch {
                    // Some geometries can't produce edges; skip them silently.
                }
            }
        });
    }

    toggleEdges() {
        if (!this.model) return false;

        let edgesExist = false;
        this.model.traverse((child) => {
            if (child.userData.isEdgeHelper) edgesExist = true;
        });

        if (!edgesExist) this.createEdges();

        let newState = false;
        this.model.traverse((child) => {
            if (child.userData.isEdgeHelper) {
                child.visible = !child.visible;
                newState = child.visible;
            }
        });

        return newState;
    }

    dispose() {
        this.clearCurrentModel();
        if (this.dracoLoader) {
            this.dracoLoader.dispose();
            this.dracoLoader = null;
        }
    }
}
