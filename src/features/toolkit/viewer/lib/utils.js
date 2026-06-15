// Shared helpers for the CAD viewer engine.

import { THREE } from "./three.js";

// Inline SVG inner-markup per component type, rendered into the component-list
// panel. Shape encodes the type; colour comes from the design tokens at the
// call site (single-accent system — no rainbow type colours).
export function getComponentIcon(type) {
    switch (type) {
        case "Assembly":
            return '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>';
        case "Sub-Assembly":
            return '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="8" x2="12" y2="16"></line>';
        case "Part":
            return '<rect x="3" y="3" width="18" height="18" rx="2"></rect>';
        case "Body":
            return '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>';
        default:
            return '<circle cx="12" cy="12" r="10"></circle>';
    }
}

// Walk up from a clicked mesh to the nearest named group, so picking a face
// selects the whole part rather than one triangle.
export function resolvePartNode(mesh, model) {
    let node = mesh.parent;
    while (node && node !== model) {
        const isNamedGroup =
            (node.isGroup || node.type === "Group") &&
            node.name &&
            node.name.trim() !== "";
        if (isNamedGroup) return node;
        node = node.parent;
    }
    return mesh;
}

// Frame the camera so the given object fully fits. Clip planes + zoom limits
// adapt to the model's scale, so a model of any size (mm to m) is fully visible
// and never clipped or distance-clamped. Guards against empty/NaN boxes.
export function fitCameraToModel(targetObject, camera, controls) {
    const box = new THREE.Box3().setFromObject(targetObject);
    if (box.isEmpty()) return;

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (!Number.isFinite(maxDim) || maxDim <= 0) return;

    const fov = camera.fov * (Math.PI / 180);
    const cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 2.2;

    camera.near = Math.max(maxDim / 1000, 0.01);
    camera.far = Math.max(maxDim * 100, 1000);
    camera.updateProjectionMatrix();

    camera.position.set(
        center.x + cameraDistance * 0.7,
        center.y + cameraDistance * 0.5,
        center.z + cameraDistance * 0.7,
    );
    camera.lookAt(center);

    controls.target.copy(center);
    controls.minDistance = maxDim * 0.02;
    controls.maxDistance = maxDim * 12;
    controls.update();
}

// Set emissive glow on every mesh under a node.
function applyEmissive(node, colorHex, intensity) {
    node.traverse((child) => {
        if (child.isMesh && child.material && !child.userData.isEdgeHelper) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((mat) => {
                mat.emissive = new THREE.Color(colorHex);
                mat.emissiveIntensity = intensity;
            });
        }
    });
}

// Hover glow (cool blue) vs persistent selection glow (accent). resetHighlight
// keeps the accent glow if the node is the current selection.
export function highlightPart(node) {
    applyEmissive(node, 0x4488ff, 0.35);
}

export function selectHighlight(node) {
    applyEmissive(node, 0xeb3a14, 0.5);
}

export function resetHighlight(node) {
    if (node.userData && node.userData.isSelected) {
        applyEmissive(node, 0xeb3a14, 0.5);
    } else {
        applyEmissive(node, 0x000000, 0);
    }
}
