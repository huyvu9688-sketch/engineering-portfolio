// A small navigation cube drawn in the bottom-right corner of the viewport.
//
// It is rendered with the MAIN renderer into a scissored corner with
// autoClear=false + a local clearDepth, so it overlays the model WITHOUT wiping
// it. (three's built-in ViewHelper does a full-canvas clear each frame, which is
// exactly what blanked the viewport before — so this is hand-rolled instead.)
//
// Clicks are captured by a transparent DOM hit-area over the same corner (see
// the viewer chrome), so picking never fights the camera controls for the pointer.

import * as THREE from "three";

// BoxGeometry face/material order is +X, -X, +Y, -Y, +Z, -Z.
const FACES = [
    { label: "RIGHT", view: "right" },
    { label: "LEFT", view: "left" },
    { label: "TOP", view: "top" },
    { label: "BOTTOM", view: "bottom" },
    { label: "FRONT", view: "front" },
    { label: "BACK", view: "back" },
];

export const CUBE_SIZE = 96; // px — must match the hit-area size + corner margin
export const CUBE_MARGIN = 12;

function makeFaceTexture(label) {
    const s = 128;
    const canvas = document.createElement("canvas");
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#232323";
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, s - 6, s - 6);
    ctx.fillStyle = "#f0f0f0";
    ctx.font = "bold 19px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, s / 2, s / 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    return texture;
}

export class ViewCube {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1.1, 1.1, 1.1, -1.1, 0.1, 10);
        this.raycaster = new THREE.Raycaster();
        this.ndc = new THREE.Vector2();

        this.materials = FACES.map((f) => new THREE.MeshBasicMaterial({ map: makeFaceTexture(f.label) }));
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        this.mesh = new THREE.Mesh(geometry, this.materials);
        this.scene.add(this.mesh);

        this.edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            new THREE.LineBasicMaterial({ color: 0x888888 }),
        );
        this.mesh.add(this.edges);
    }

    // Orient the cube to mirror the main camera, then draw it in the corner.
    render(renderer, mainCamera, target) {
        const dir = mainCamera.position.clone().sub(target);
        if (dir.lengthSq() === 0) return;
        dir.normalize();
        this.camera.position.copy(dir.multiplyScalar(3));
        this.camera.up.copy(mainCamera.up);
        this.camera.lookAt(0, 0, 0);

        const size = renderer.getSize(new THREE.Vector2());
        const x = CUBE_MARGIN; // bottom-left corner (clear of the component list)
        const y = CUBE_MARGIN; // GL viewport origin is bottom-left

        const prevAutoClear = renderer.autoClear;
        renderer.autoClear = false;
        renderer.setScissorTest(true);
        renderer.setScissor(x, y, CUBE_SIZE, CUBE_SIZE);
        renderer.setViewport(x, y, CUBE_SIZE, CUBE_SIZE);
        renderer.clearDepth(); // scissored: only the corner's depth is cleared
        renderer.render(this.scene, this.camera);
        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, size.x, size.y);
        renderer.autoClear = prevAutoClear;
    }

    // Which view a click on the hit-area maps to (or null if it missed the cube).
    pick(event, hitRect) {
        this.ndc.x = ((event.clientX - hitRect.left) / hitRect.width) * 2 - 1;
        this.ndc.y = -((event.clientY - hitRect.top) / hitRect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.ndc, this.camera);
        const hits = this.raycaster.intersectObject(this.mesh, false);
        if (hits.length === 0) return null;
        const face = FACES[hits[0].face.materialIndex];
        return face ? face.view : null;
    }

    dispose() {
        this.mesh.geometry.dispose();
        this.materials.forEach((m) => {
            if (m.map) m.map.dispose();
            m.dispose();
        });
        this.edges.geometry.dispose();
        this.edges.material.dispose();
    }
}
