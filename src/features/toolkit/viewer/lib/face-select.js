// Face-level picking on a triangulated mesh.
//
// Strategy: BFS flood-fill from the clicked triangle along shared edges.
// A neighbour is accepted if the dihedral angle to its BFS parent is below the
// feature-edge threshold (~40°). This captures entire CAD faces regardless of
// curvature — flat, cylindrical, spherical, toroidal — while stopping at sharp
// edges (fillets, chamfers, face boundaries).
//
// Per-triangle normals and edge-adjacency are built once per geometry and
// cached on geometry.userData, so hover events after the first are cheap.

import * as THREE from "three";

const HOVER_COLOR = 0x66aaff; // soft blue under the cursor
const SELECT_COLOR = 0xeb3a14; // accent on click
const FEATURE_COS = Math.cos(THREE.MathUtils.degToRad(40)); // stop BFS at feature edges
const MAX_TRIS = 200000; // skip on very heavy meshes to stay responsive

// ---------------------------------------------------------------------------
// Cache builders — stored on geometry.userData so they survive across calls
// ---------------------------------------------------------------------------

// Float32Array of per-triangle face normals (3 floats per triangle, normalised).
function buildTriNormals(geom) {
    if (geom.userData._triNormals) return geom.userData._triNormals;

    const pos = geom.attributes.position;
    const index = geom.index;
    const triCount = (index ? index.count : pos.count) / 3;
    const vi = (t, k) => (index ? index.getX(t * 3 + k) : t * 3 + k);

    const arr = new Float32Array(triCount * 3);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const e1 = new THREE.Vector3();
    const e2 = new THREE.Vector3();
    const n = new THREE.Vector3();

    for (let t = 0; t < triCount; t++) {
        a.fromBufferAttribute(pos, vi(t, 0));
        b.fromBufferAttribute(pos, vi(t, 1));
        c.fromBufferAttribute(pos, vi(t, 2));
        n.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a));
        if (n.lengthSq() > 0) n.normalize();
        arr[t * 3] = n.x;
        arr[t * 3 + 1] = n.y;
        arr[t * 3 + 2] = n.z;
    }

    geom.userData._triNormals = arr;
    return arr;
}

// Array<number[]> adjacency: adj[t] = list of triangle indices sharing an edge with t.
function buildAdjacency(geom) {
    if (geom.userData._triAdj) return geom.userData._triAdj;

    const pos = geom.attributes.position;
    const index = geom.index;
    const triCount = (index ? index.count : pos.count) / 3;
    const vi = (t, k) => (index ? index.getX(t * 3 + k) : t * 3 + k);

    const edgeMap = new Map();
    for (let t = 0; t < triCount; t++) {
        for (let e = 0; e < 3; e++) {
            const a = vi(t, e);
            const b = vi(t, (e + 1) % 3);
            const key = a < b ? `${a}_${b}` : `${b}_${a}`;
            const bucket = edgeMap.get(key);
            if (bucket) bucket.push(t);
            else edgeMap.set(key, [t]);
        }
    }

    const adj = new Array(triCount);
    for (let i = 0; i < triCount; i++) adj[i] = [];
    edgeMap.forEach((tris) => {
        if (tris.length === 2) {
            adj[tris[0]].push(tris[1]);
            adj[tris[1]].push(tris[0]);
        }
    });

    geom.userData._triAdj = adj;
    return adj;
}

// ---------------------------------------------------------------------------

export class FaceSelector {
    constructor(core) {
        this.core = core;
        this.hover = { mesh: null, tris: null, overlay: null };
        this.select = { mesh: null, tris: null, overlay: null };
    }

    // BFS flood-fill from `faceIndex`. Each expansion step tests the dihedral
    // angle between a candidate triangle and its BFS parent — stops at feature
    // edges. Returns { tris: number[], worldNormal: Vector3 } or null.
    computeFace(mesh, faceIndex) {
        const geom = mesh.geometry;
        const pos = geom?.attributes.position;
        if (!pos || faceIndex == null) return null;

        const index = geom.index;
        const triCount = (index ? index.count : pos.count) / 3;
        if (triCount > MAX_TRIS) return null;

        const ns = buildTriNormals(geom);
        const adj = buildAdjacency(geom);

        // Dot product of two stored normals (float inline — no Vector3 allocation).
        const dot = (i, j) =>
            ns[i * 3] * ns[j * 3] +
            ns[i * 3 + 1] * ns[j * 3 + 1] +
            ns[i * 3 + 2] * ns[j * 3 + 2];

        // Seed normal must be non-degenerate.
        const seedLenSq =
            ns[faceIndex * 3] ** 2 +
            ns[faceIndex * 3 + 1] ** 2 +
            ns[faceIndex * 3 + 2] ** 2;
        if (seedLenSq < 0.5) return null;

        const visited = new Uint8Array(triCount);
        visited[faceIndex] = 1;
        const queue = [faceIndex];
        const tris = [];

        while (queue.length > 0) {
            const t = queue.pop();
            tris.push(t);
            for (const nb of adj[t]) {
                if (visited[nb]) continue;
                visited[nb] = 1;
                // Compare neighbour against its BFS parent (not the seed) so the
                // fill can traverse gradually-curving surfaces like cylinders and
                // spheres without leaking across sharp feature edges.
                if (dot(t, nb) >= FEATURE_COS) queue.push(nb);
            }
        }

        // World normal at the clicked point = seed triangle's normal transformed.
        const seedN = new THREE.Vector3(ns[faceIndex * 3], ns[faceIndex * 3 + 1], ns[faceIndex * 3 + 2]);
        const worldNormal = seedN
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
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
        });
        if (this.core.sectionActive) mat.clippingPlanes = [this.core.sectionPlane];

        const overlay = new THREE.Mesh(g, mat);
        overlay.userData.isEdgeHelper = true;
        overlay.renderOrder = 2;
        mesh.add(overlay);
        return overlay;
    }

    showHover(mesh, faceIndex) {
        if (this.hover.mesh === mesh && this.hover.tris && this.hover.tris.has(faceIndex)) {
            return; // cursor still inside the same face — nothing to rebuild
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

    // Analyse a picked face and return cylinder geometry if it's a curved surface.
    // Returns { type: 'planar'|'cylindrical', worldNormal, cylinderCenter?, cylinderAxis? }
    // Called on click (not hover) so a heavier computation is acceptable.
    analyzeFace(mesh, faceIndex) {
        const face = this.computeFace(mesh, faceIndex);
        const fallback = { type: "planar", worldNormal: face?.worldNormal ?? null };
        if (!face || face.tris.length < 6) return fallback;

        const { tris, worldNormal } = face;
        const geom = mesh.geometry;
        const ns = buildTriNormals(geom);

        // --- Flatness check ---
        // Mean of unit normals: length ≈ 1 → all parallel → flat face.
        let mx = 0, my = 0, mz = 0;
        for (const t of tris) { mx += ns[t * 3]; my += ns[t * 3 + 1]; mz += ns[t * 3 + 2]; }
        mx /= tris.length; my /= tris.length; mz /= tris.length;
        if (mx * mx + my * my + mz * mz > 0.94) return fallback; // flat (normals < ~15° spread)

        // --- Find cylinder axis from cross-products of sampled normal pairs ---
        let ax = 0, ay = 0, az = 0, count = 0;
        const step = Math.max(1, Math.floor(tris.length / 60));
        for (let i = 0; i + step < tris.length; i += step) {
            const t1 = tris[i], t2 = tris[i + step];
            const n1x = ns[t1 * 3], n1y = ns[t1 * 3 + 1], n1z = ns[t1 * 3 + 2];
            const n2x = ns[t2 * 3], n2y = ns[t2 * 3 + 1], n2z = ns[t2 * 3 + 2];
            let cx = n1y * n2z - n1z * n2y;
            let cy = n1z * n2x - n1x * n2z;
            let cz = n1x * n2y - n1y * n2x;
            const cLen = Math.sqrt(cx * cx + cy * cy + cz * cz);
            if (cLen < 0.02) continue;
            cx /= cLen; cy /= cLen; cz /= cLen;
            if (count > 0 && ax * cx + ay * cy + az * cz < 0) { cx = -cx; cy = -cy; cz = -cz; }
            ax += cx; ay += cy; az += cz;
            count++;
        }
        if (count === 0) return { type: "cylindrical", worldNormal, cylinderCenter: null, cylinderAxis: null };
        const aLen = Math.sqrt(ax * ax + ay * ay + az * az);
        ax /= aLen; ay /= aLen; az /= aLen; // normalised local-space axis

        // --- Build 2D cross-section basis (u, v perpendicular to axis) ---
        const tmpx = Math.abs(ax) < 0.9 ? 1 : 0, tmpy = Math.abs(ax) < 0.9 ? 0 : 1;
        let ux = ay * 0 - az * tmpy, uy = az * tmpx - ax * 0, uz = ax * tmpy - ay * tmpx;
        const uLen = Math.sqrt(ux * ux + uy * uy + uz * uz);
        ux /= uLen; uy /= uLen; uz /= uLen;
        const vx = ay * uz - az * uy, vy = az * ux - ax * uz, vz = ax * uy - ay * ux;

        // --- Collect triangle centroid projections onto cross-section ---
        const pos = geom.attributes.position;
        const index = geom.index;
        const vi = (t, k) => (index ? index.getX(t * 3 + k) : t * 3 + k);

        // Mean centroid (numerical stability)
        let pcx = 0, pcy = 0, pcz = 0;
        for (const t of tris) {
            pcx += (pos.getX(vi(t, 0)) + pos.getX(vi(t, 1)) + pos.getX(vi(t, 2))) / 3;
            pcy += (pos.getY(vi(t, 0)) + pos.getY(vi(t, 1)) + pos.getY(vi(t, 2))) / 3;
            pcz += (pos.getZ(vi(t, 0)) + pos.getZ(vi(t, 1)) + pos.getZ(vi(t, 2))) / 3;
        }
        pcx /= tris.length; pcy /= tris.length; pcz /= tris.length;

        // Algebraic circle fit: -2cu·u - 2cv·v + (r²-cu²-cv²) = -(u²+v²)
        // Normal equations (3×3 symmetric): A·x = b, x = [cu, cv, β]
        let su = 0, sv = 0, suu = 0, svv = 0, suv = 0, su3 = 0, sv3 = 0, su2v = 0, suv2 = 0;
        for (const t of tris) {
            const px = (pos.getX(vi(t, 0)) + pos.getX(vi(t, 1)) + pos.getX(vi(t, 2))) / 3 - pcx;
            const py = (pos.getY(vi(t, 0)) + pos.getY(vi(t, 1)) + pos.getY(vi(t, 2))) / 3 - pcy;
            const pz = (pos.getZ(vi(t, 0)) + pos.getZ(vi(t, 1)) + pos.getZ(vi(t, 2))) / 3 - pcz;
            const da = px * ax + py * ay + pz * az;
            const qx = px - da * ax, qy = py - da * ay, qz = pz - da * az;
            const u = qx * ux + qy * uy + qz * uz;
            const v = qx * vx + qy * vy + qz * vz;
            su += u; sv += v; suu += u * u; svv += v * v; suv += u * v;
            su3 += u * u * u; sv3 += v * v * v; su2v += u * u * v; suv2 += u * v * v;
        }
        const n = tris.length;
        const A00 = 4 * suu, A01 = 4 * suv, A02 = 2 * su;
        const A11 = 4 * svv, A12 = 2 * sv, A22 = n;
        const b0 = 2 * (su3 + suv2), b1 = 2 * (su2v + sv3), b2 = suu + svv;
        const det = A00 * (A11 * A22 - A12 * A12) - A01 * (A01 * A22 - A12 * A02) + A02 * (A01 * A12 - A11 * A02);
        if (Math.abs(det) < 1e-10) return { type: "cylindrical", worldNormal, cylinderCenter: null, cylinderAxis: null };

        const cu = (b0 * (A11 * A22 - A12 * A12) - A01 * (b1 * A22 - A12 * b2) + A02 * (b1 * A12 - A11 * b2)) / det;
        const cv = (A00 * (b1 * A22 - A12 * b2) - b0 * (A01 * A22 - A12 * A02) + A02 * (A01 * b2 - b1 * A02)) / det;

        // Reconstruct 3D center in local mesh space, then transform to world
        const center3d = new THREE.Vector3(pcx + cu * ux + cv * vx, pcy + cu * uy + cv * vy, pcz + cu * uz + cv * vz);
        mesh.updateWorldMatrix(true, false);
        const cylinderCenter = center3d.applyMatrix4(mesh.matrixWorld);
        const cylinderAxis = new THREE.Vector3(ax, ay, az)
            .applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld))
            .normalize();

        return { type: "cylindrical", worldNormal, cylinderCenter, cylinderAxis };
    }

    dispose() {
        this.clearHover();
        this.clearSelect();
    }
}
