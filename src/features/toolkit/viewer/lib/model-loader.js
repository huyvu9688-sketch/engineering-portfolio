// Loads a GLB/GLTF from an uploaded File and prepares its meshes.
//
// Materials are KEPT (real component colours) and only sanitised for the known
// invisible-import causes — never overridden.

import { THREE, GLTFLoader, DRACOLoader, KTX2Loader, MeshoptDecoder } from "./three.js";

const DRACO_DECODER_PATH = "https://www.gstatic.com/draco/versioned/decoders/1.5.6/";
const KTX2_TRANSCODER_PATH =
    "https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/libs/basis/";
const TEXTURE_SLOTS = ["map", "emissiveMap", "metalnessMap", "roughnessMap", "aoMap", "normalMap"];

export class ModelLoader {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.model = null;
        this.allParts = [];
        this.partMap = {};
        this.dracoLoader = null;
        this.ktx2Loader = null;
    }

    /**
     * @param {File} file
     * @param {(percent: number) => void} onProgress
     * @param {(model, allParts, partMap) => void} onComplete
     * @param {(error: Error) => void} onError
     */
    loadModel(file, onProgress, onComplete, onError) {
        this.clearCurrentModel();
        const objectUrl = URL.createObjectURL(file);

        const loader = new GLTFLoader();

        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
        loader.setDRACOLoader(this.dracoLoader);

        this.ktx2Loader = new KTX2Loader()
            .setTranscoderPath(KTX2_TRANSCODER_PATH)
            .detectSupport(this.sceneManager.renderer);
        loader.setKTX2Loader(this.ktx2Loader);
        loader.setMeshoptDecoder(MeshoptDecoder);

        loader.load(
            objectUrl,
            (gltf) => {
                URL.revokeObjectURL(objectUrl);
                try {
                    this.processModel(gltf.scene);
                    if (onComplete) onComplete(this.model, this.allParts, this.partMap);
                } catch (err) {
                    if (onError) onError(err);
                }
            },
            (xhr) => {
                if (xhr.total > 0 && onProgress) {
                    onProgress(Math.round((xhr.loaded / xhr.total) * 100));
                }
            },
            (err) => {
                URL.revokeObjectURL(objectUrl);
                if (onError) onError(err);
            },
        );
    }

    processModel(scene) {
        this.model = scene;
        let partIndex = 0;

        this.model.traverse((child) => {
            if (child.name && child.name !== "") this.partMap[child.name] = child;

            if (child.isMesh) {
                if (!child.name || child.name === "") {
                    child.name = `Part_${partIndex++}`;
                    this.partMap[child.name] = child;
                }

                child.userData.isPart = true;
                this.allParts.push(child);
                child.castShadow = true;
                child.receiveShadow = true;
                child.visible = true;
                // Bad CAD bounding spheres can frustum-cull a visible mesh.
                child.frustumCulled = false;

                this.optimizeMaterial(child);
                this.computeNormals(child);
            }
        });

        this.sceneManager.scene.add(this.model);
        this.recenterModel();
    }

    // Move the model so its bounding-box centre sits at the world origin (CAD
    // assemblies are often exported far from origin). Translate only — never
    // scale — so measurements stay true to the model's units.
    recenterModel() {
        if (!this.model) return;
        this.model.updateWorldMatrix(true, true);
        const box = new THREE.Box3().setFromObject(this.model);
        if (box.isEmpty()) return;
        const center = box.getCenter(new THREE.Vector3());
        if (![center.x, center.y, center.z].every(Number.isFinite)) return;
        this.model.position.sub(center);
        this.model.updateMatrixWorld(true);
    }

    // Keep the material's real colour/metalness/roughness; only neutralise the
    // things that render a part invisible or black.
    optimizeMaterial(mesh) {
        if (!mesh.material) return;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat) => {
            mat.visible = true;
            mat.colorWrite = true;

            // Draw both faces so inverted/one-sided CAD normals still show.
            mat.side = THREE.DoubleSide;

            // A texture whose image failed to decode samples black — drop it so
            // the material's base colour shows instead.
            TEXTURE_SLOTS.forEach((slot) => {
                if (mat[slot] && !mat[slot].image) mat[slot] = null;
            });

            // Fully (or near-) transparent parts are usually an export artefact —
            // force them opaque. Genuine glass (opacity >= 0.2) is left alone.
            if (mat.opacity === undefined || mat.opacity < 0.2) {
                mat.opacity = 1;
                mat.transparent = false;
            }

            // Make sure PBR materials actually pick up the environment map.
            if ("envMapIntensity" in mat) mat.envMapIntensity = 1;

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
                    mats.forEach((m) => m && m.dispose());
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
                            color: 0x333333,
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
                    // Some geometries can't produce edges; skip silently.
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
        if (this.ktx2Loader) {
            this.ktx2Loader.dispose();
            this.ktx2Loader = null;
        }
    }
}
