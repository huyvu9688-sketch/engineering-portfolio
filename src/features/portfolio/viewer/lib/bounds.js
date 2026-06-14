// Robust geometry-bounds helpers for the viewer engine.
//
// CAD -> GLB exports frequently ship degenerate geometry: meshes whose vertex
// positions contain NaN / Infinity, or empty meshes. A single such mesh poisons
// THREE.Box3.setFromObject(), which then returns a non-finite box for the WHOLE
// model. Camera framing, re-centring, grid/axes fitting and the explode/measure
// tools all derive their numbers from that box, so one bad part leaves the
// camera pointed at nothing — a black viewport even though the model loaded
// fine (the component list still fills in). These helpers bound only the finite
// geometry and ignore the rest.
//
// Imports three's core directly (rather than the ./three.js hub) on purpose:
// the math here is DOM-free, so it stays unit-testable under plain Node.

import * as THREE from "three";

/** True if every component of a box's min/max is a finite number. */
export function isFiniteBox(box) {
    const { min, max } = box;
    return (
        Number.isFinite(min.x) &&
        Number.isFinite(min.y) &&
        Number.isFinite(min.z) &&
        Number.isFinite(max.x) &&
        Number.isFinite(max.y) &&
        Number.isFinite(max.z)
    );
}

/**
 * True if the mesh has geometry with a finite bounding box (no NaN/Inf
 * vertices). Computes and caches geometry.boundingBox as a side effect, so a
 * later computeRobustBox() reuses it instead of recomputing (and re-warning).
 * @param {THREE.Object3D} mesh
 */
export function hasFiniteGeometry(mesh) {
    const geom = mesh.geometry;
    if (!geom) return false;
    if (!geom.boundingBox) geom.computeBoundingBox();
    return !!geom.boundingBox && isFiniteBox(geom.boundingBox);
}

/**
 * World-space bounding box of an object, unioning only the meshes whose
 * geometry is finite. Returns null when nothing finite is found, so callers can
 * skip gracefully instead of acting on NaN.
 * @param {THREE.Object3D} object
 * @returns {THREE.Box3 | null}
 */
export function computeRobustBox(object) {
    object.updateWorldMatrix(true, true);

    const box = new THREE.Box3();
    const meshBox = new THREE.Box3();
    let found = false;

    object.traverse((child) => {
        if (!child.isMesh || !hasFiniteGeometry(child)) return;
        meshBox.copy(child.geometry.boundingBox).applyMatrix4(child.matrixWorld);
        if (!isFiniteBox(meshBox)) return; // e.g. Inf scale in the world matrix
        box.union(meshBox);
        found = true;
    });

    return found && isFiniteBox(box) ? box : null;
}
