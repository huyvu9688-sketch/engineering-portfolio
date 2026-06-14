// Loads a GLB/GLTF model from a URL and prepares its meshes.

import { THREE, GLTFLoader, DRACOLoader } from "./three.js";
import { computeRobustBox, hasFiniteGeometry } from "./bounds.js";

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

                // Degenerate geometry (NaN/Inf vertices) is common in CAD
                // exports. It can't render meaningfully and poisons whole-model
                // bounds, so hide it and keep it out of the interactive part
                // list (hover / isolate / explode / measure) while leaving it in
                // the component tree for completeness.
                if (!hasFiniteGeometry(child)) {
                    child.userData.degenerate = true;
                    child.visible = false;
                    return;
                }

                child.userData.isPart = true;
                this.allParts.push(child);
                child.castShadow = true;
                child.receiveShadow = true;
                child.visible = true;
                // Some CAD tessellations produce bad bounding spheres, which the
                // renderer frustum-culls (draws nothing) even though raycasting
                // still hits them — i.e. an invisible model you can still hover.
                child.frustumCulled = false;

                this.optimizeMaterial(child);
                this.computeNormals(child);
            }
        });

        this.sceneManager.scene.add(this.model);
        this.recenterModel();
    }

    // Move the model so its bounding-box centre sits at the world origin.
    // Real CAD assemblies are often exported far from origin (assembly
    // coordinates), which leaves them off-screen, makes the grid/axes look
    // absent, and causes float-precision artefacts. Translating only — never
    // scaling — keeps measurements true to the model's units.
    recenterModel() {
        if (!this.model) return;
        const box = computeRobustBox(this.model);
        if (!box) return; // no finite geometry to centre on
        const center = box.getCenter(new THREE.Vector3());
        this.model.position.sub(center);
        this.model.updateMatrixWorld(true);
    }

    optimizeMaterial(mesh) {
        if (!mesh.material) return;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const TEXTURE_SLOTS = ["map", "emissiveMap", "metalnessMap", "roughnessMap", "aoMap", "normalMap"];

        materials.forEach((mat) => {
            // A material flagged invisible / not writing colour renders nothing
            // but is still raycast-hittable.
            mat.visible = true;
            mat.colorWrite = true;

            // Textures that fail to decode (see the console "Couldn't load
            // texture" errors) leave a map whose image never arrived; sampling
            // it renders the surface black/blank. Drop any such broken map so
            // the base colour shows instead.
            TEXTURE_SLOTS.forEach((slot) => {
                if (mat[slot] && !mat[slot].image) mat[slot] = null;
            });

            // CAD exporters often ship parts as fully transparent (opacity 0) or
            // flagged transparent with no real alpha — renders nothing while the
            // geometry is still there. Force anything ~invisible back to opaque.
            if (mat.opacity === undefined || mat.opacity < 0.2) {
                mat.opacity = 1;
                mat.transparent = false;
            }

            // Very dark base colour has little/no diffuse response → lift it to
            // mid grey so the part is at least shaded and visible.
            if (mat.color) {
                const lum = 0.299 * mat.color.r + 0.587 * mat.color.g + 0.114 * mat.color.b;
                if (lum < 0.05) mat.color.setHex(0x808080);
            }

            if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
                mat.metalness = Math.min(mat.metalness, 0.5);
                mat.roughness = Math.max(mat.roughness, 0.4);
                // Ensure the part actually picks up the scene environment map
                // (some exports zero this out, leaving metals pitch black).
                mat.envMapIntensity = 1;
            }

            // Draw both faces so parts with inverted/one-sided normals (very
            // common from CAD tessellation) aren't invisible from the outside.
            mat.side = THREE.DoubleSide;
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
