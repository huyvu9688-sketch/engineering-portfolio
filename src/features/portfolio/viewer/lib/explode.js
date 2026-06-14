// Exploded-view tool: pushes every mesh outward from the model centre so the
// individual parts of an assembly separate. Factor 0 = assembled.

import { THREE } from "./three.js";

export class ExplodeTool {
    constructor(modelLoader) {
        this.modelLoader = modelLoader;
        this.data = [];
        this.factor = 0;
        this.maxFactor = 1.5; // slider 100% spreads parts by ~1.5x their radius
    }

    /** Snapshot each mesh's origin + outward direction. Call after a model loads. */
    prepare() {
        this.data = [];
        this.factor = 0;

        const model = this.modelLoader.model;
        if (!model) return;
        model.updateWorldMatrix(true, true);

        const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());

        this.modelLoader.allParts.forEach((mesh) => {
            const meshCenter = new THREE.Box3()
                .setFromObject(mesh)
                .getCenter(new THREE.Vector3());
            const dir = meshCenter.sub(center); // world-space outward offset
            const originWorld = mesh.getWorldPosition(new THREE.Vector3());
            this.data.push({
                mesh,
                parent: mesh.parent,
                origLocalPos: mesh.position.clone(),
                originWorld,
                dir,
            });
        });
    }

    /**
     * @param {number} factor 0 (assembled) .. maxFactor
     */
    setFactor(factor) {
        if (this.data.length === 0) this.prepare();
        this.factor = factor;

        this.data.forEach((d) => {
            if (factor === 0) {
                d.mesh.position.copy(d.origLocalPos);
                return;
            }
            // Move the mesh origin outward by dir*factor in world space, then
            // express that world point back in the parent's local space.
            const targetWorld = d.originWorld.clone().add(d.dir.clone().multiplyScalar(factor));
            d.mesh.position.copy(d.parent.worldToLocal(targetWorld));
        });
    }

    /** Map a 0..1 slider value to the configured factor range. */
    setFromSlider(value01) {
        this.setFactor(value01 * this.maxFactor);
    }

    reset() {
        this.setFactor(0);
    }
}
