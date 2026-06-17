// Face-level picking on a triangulated mesh.
//
// A CAD "face" is many triangles in a GLB. Given the triangle under the cursor,
// this gathers every triangle on the same plane (same normal direction + same
// offset) to reconstruct that flat face, then overlays a thin translucent
// highlight on just those triangles. Works well for planar faces; a curved face
// (varying normal) highlights only the patch you point at.

import * as THREE from "three";

const HOVER_COLOR = 0x66aaff; // soft blue under the cursor
const SELECT_COLOR = 0xeb3a14; // accent on click
const COS_TOL = Math.cos(THREE.MathUtils.degToRad(2)); // coplanar within ~2°
const DIST_TOL_FRAC = 0.0015; // plane-offset tolerance, fraction of mesh size
const MAX_TRIS = 200000; // skip grouping on very heavy meshes (stay responsive)

export class FaceSelector {
    constructor(core) {
        this.core = core;
        this.hover = { mesh: null, tris: null, overlay: null };
        this.select = { mesh: null, tris: null, overlay: null };
    }

    // The coplanar triangle group containing `faceIndex`, plus its world normal.
    computeFace(mesh, faceIndex) {
        const geom = mesh.geometry;
        const pos = geom?.attributes.position;
        if (!pos || faceIndex == null) return null;
        const index = geom.index;
        const triCount = (index ? index.count : pos.count) / 3;
        if (triCount > MAX_TRIS) return null;
        const vi = (t, k) => (index ? index.getX(t * 3 + k) : t * 3 + k);

        const a = new THREE.Vector3();
        const b = new THREE.Vector3();
        const c = new THREE.Vector3();
        const e1 = new THREE.Vector3();
        const e2 = new THREE.Vector3();
        const n0 = new THREE.Vector3();
        const ni = new THREE.Vector3();

        a.fromBufferAttribute(pos, vi(faceIndex, 0));
        b.fromBufferAttribute(pos, vi(faceIndex, 1));
        c.fromBufferAttribute(pos, vi(faceIndex, 2));
        n0.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a));
        if (n0.lengthSq() === 0) return null;
        n0.normalize();
        const d0 = n0.dot(a);

        geom.computeBoundingBox();
        const size = geom.boundingBox.getSize(new THREE.Vector3());
        const distTol = (Math.max(size.x, size.y, size.z) || 1) * DIST_TOL_FRAC;

        const tris = [];
        for (let t = 0; t < triCount; t++) {
            a.fromBufferAttribute(pos, vi(t, 0));
            b.fromBufferAttribute(pos, vi(t, 1));
            c.fromBufferAttribute(pos, vi(t, 2));
            ni.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a));
            if (ni.lengthSq() === 0) continue;
            ni.normalize();
            if (ni.dot(n0) < COS_TOL) continue; // not same-facing
            if (Math.abs(ni.dot(a) - d0) > distTol) continue; // not same plane
            tris.push(t);
        }

        const worldNormal = n0
            .clone()
            .applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld))
            .normalize();
        return { tris, worldNormal };
    }

    // A thin highlight mesh of `tris`, parented to `mesh` so it follows it.
    buildOverlay(mesh, tris, color) {
        const geom = mesh.geometry;
        const pos = geom.attributes.position;
        const index = geom.index;
        const vi = (t, k) => (index ? index.getX(t * 3 + k) : t * 3 + k);

        const arr = new Float32Array(tris.length * 9);
        const v = new THREE.Vector3();
        let o = 0;
        tris.forEach((t) => {
            for (let k = 0; k < 3; k++) {
                v.fromBufferAttribute(pos, vi(t, k));
                arr[o++] = v.x;
                arr[o++] = v.y;
                arr[o++] = v.z;
            }
        });
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(arr, 3));

        const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.45,
            side: THREE.DoubleSide,
            polygonOffset: true, // sit just in front of the surface, no z-fight
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
        });
        if (this.core.sectionActive) mat.clippingPlanes = [this.core.sectionPlane];

        const overlay = new THREE.Mesh(g, mat);
        overlay.userData.isEdgeHelper = true; // ignored by tree / raycast filters
        overlay.renderOrder = 2;
        mesh.add(overlay);
        return overlay;
    }

    showHover(mesh, faceIndex) {
        if (this.hover.mesh === mesh && this.hover.tris && this.hover.tris.has(faceIndex)) {
            return; // still inside the same face — nothing to rebuild
        }
        this.clearHover();
        const face = this.computeFace(mesh, faceIndex);
        if (!face) return;
        this.hover.mesh = mesh;
        this.hover.tris = new Set(face.tris);
        this.hover.overlay = this.buildOverlay(mesh, face.tris, HOVER_COLOR);
    }

    clearHover() {
        this.disposeOverlay(this.hover.overlay);
        this.hover = { mesh: null, tris: null, overlay: null };
    }

    // Highlight the clicked face and return { worldNormal, areaMm2, triCount }.
    selectFace(mesh, faceIndex) {
        this.clearSelect();
        const face = this.computeFace(mesh, faceIndex);
        if (!face) return null;
        this.select.mesh = mesh;
        this.select.tris = new Set(face.tris);
        this.select.overlay = this.buildOverlay(mesh, face.tris, SELECT_COLOR);
        return {
            worldNormal: face.worldNormal,
            areaMm2: this.faceAreaMm2(mesh, face.tris),
            triCount: face.tris.length,
        };
    }

    clearSelect() {
        this.disposeOverlay(this.select.overlay);
        this.select = { mesh: null, tris: null, overlay: null };
    }

    faceAreaMm2(mesh, tris) {
        const geom = mesh.geometry;
        const pos = geom.attributes.position;
        const index = geom.index;
        const vi = (t, k) => (index ? index.getX(t * 3 + k) : t * 3 + k);
        const a = new THREE.Vector3();
        const b = new THREE.Vector3();
        const c = new THREE.Vector3();
        const e1 = new THREE.Vector3();
        const e2 = new THREE.Vector3();
        const cr = new THREE.Vector3();
        mesh.updateWorldMatrix(true, false);
        const m = mesh.matrixWorld;
        let area = 0;
        tris.forEach((t) => {
            a.fromBufferAttribute(pos, vi(t, 0)).applyMatrix4(m);
            b.fromBufferAttribute(pos, vi(t, 1)).applyMatrix4(m);
            c.fromBufferAttribute(pos, vi(t, 2)).applyMatrix4(m);
            area += cr.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a)).length() * 0.5;
        });
        const scale = this.core.unitToMm || 1;
        return area * scale * scale;
    }

    disposeOverlay(overlay) {
        if (!overlay) return;
        overlay.parent?.remove(overlay);
        overlay.geometry.dispose();
        overlay.material.dispose();
    }

    dispose() {
        this.clearHover();
        this.clearSelect();
    }
}
