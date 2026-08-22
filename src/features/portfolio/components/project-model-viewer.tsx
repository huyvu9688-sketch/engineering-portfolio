"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

interface ProjectModelViewerProps {
  src: string;
  alt: string;
}

type LoadState = "loading" | "ready" | "error";

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK_TYPE = 0x4e4f534a;
const BIN_CHUNK_TYPE = 0x004e4942;
const DDS_MAGIC = [0x44, 0x44, 0x53, 0x20];

/**
 * Some exported .glb files embed DDS-compressed textures mislabeled as
 * image/png — browsers can't decode DDS, so GLTFLoader logs a texture load
 * error per occurrence (harmless: the model still loads, just without that
 * texture). Strip references to those textures up front so the load is
 * clean, falling back to each material's base color.
 */
function stripUndecodableTextures(buffer: ArrayBuffer): ArrayBuffer {
  const dv = new DataView(buffer);
  if (buffer.byteLength < 12 || dv.getUint32(0, true) !== GLB_MAGIC) return buffer;

  let offset = 12;
  let jsonChunk: { start: number; length: number } | null = null;
  let binChunk: { start: number; length: number } | null = null;
  while (offset + 8 <= buffer.byteLength) {
    const chunkLength = dv.getUint32(offset, true);
    const chunkType = dv.getUint32(offset + 4, true);
    const dataStart = offset + 8;
    if (chunkType === JSON_CHUNK_TYPE) jsonChunk = { start: dataStart, length: chunkLength };
    else if (chunkType === BIN_CHUNK_TYPE) binChunk = { start: dataStart, length: chunkLength };
    offset = dataStart + chunkLength;
  }
  if (!jsonChunk || !binChunk) return buffer;

  const json = JSON.parse(
    new TextDecoder().decode(new Uint8Array(buffer, jsonChunk.start, jsonChunk.length)),
  );
  if (!Array.isArray(json.images) || !Array.isArray(json.bufferViews)) return buffer;

  const bin = new Uint8Array(buffer, binChunk.start, binChunk.length);
  const brokenImages = new Set<number>();
  json.images.forEach((image: { bufferView?: number }, i: number) => {
    if (image.bufferView == null) return;
    const bv = json.bufferViews[image.bufferView];
    if (!bv) return;
    const off = bv.byteOffset ?? 0;
    if (DDS_MAGIC.every((byte, j) => bin[off + j] === byte)) brokenImages.add(i);
  });
  if (brokenImages.size === 0) return buffer;

  const brokenTextures = new Set<number>();
  (json.textures ?? []).forEach((tex: { source?: number }, i: number) => {
    if (tex.source != null && brokenImages.has(tex.source)) brokenTextures.add(i);
  });

  type TexRef = { index: number };
  const strip = (obj: Record<string, TexRef | undefined> | undefined, key: string) => {
    const ref = obj?.[key];
    if (ref && brokenTextures.has(ref.index)) delete obj![key];
  };
  (json.materials ?? []).forEach((mat: Record<string, unknown>) => {
    const pbr = mat.pbrMetallicRoughness as Record<string, TexRef> | undefined;
    strip(pbr, "baseColorTexture");
    strip(pbr, "metallicRoughnessTexture");
    strip(mat as Record<string, TexRef>, "normalTexture");
    strip(mat as Record<string, TexRef>, "occlusionTexture");
    strip(mat as Record<string, TexRef>, "emissiveTexture");
    const specGloss = (mat.extensions as Record<string, Record<string, TexRef>> | undefined)
      ?.KHR_materials_pbrSpecularGlossiness;
    strip(specGloss, "diffuseTexture");
    strip(specGloss, "specularGlossinessTexture");
  });

  let jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const pad = (4 - (jsonBytes.length % 4)) % 4;
  if (pad) {
    const padded = new Uint8Array(jsonBytes.length + pad).fill(0x20);
    padded.set(jsonBytes);
    jsonBytes = padded;
  }

  const totalLength = 12 + 8 + jsonBytes.length + 8 + binChunk.length;
  const out = new ArrayBuffer(totalLength);
  const outDv = new DataView(out);
  outDv.setUint32(0, GLB_MAGIC, true);
  outDv.setUint32(4, 2, true);
  outDv.setUint32(8, totalLength, true);
  outDv.setUint32(12, jsonBytes.length, true);
  outDv.setUint32(16, JSON_CHUNK_TYPE, true);
  new Uint8Array(out, 20, jsonBytes.length).set(jsonBytes);
  const binHeaderOffset = 20 + jsonBytes.length;
  outDv.setUint32(binHeaderOffset, binChunk.length, true);
  outDv.setUint32(binHeaderOffset + 4, BIN_CHUNK_TYPE, true);
  new Uint8Array(out, binHeaderOffset + 8, binChunk.length).set(
    new Uint8Array(buffer, binChunk.start, binChunk.length),
  );

  return out;
}

export function ProjectModelViewer({ src, alt }: ProjectModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setLoadState("loading");

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 10_000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const controls = new OrbitControls(camera, renderer.domElement);
    const dracoLoader = new DRACOLoader();
    let animationFrame = 0;
    let disposed = false;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x3a3a3e, 1);
    renderer.domElement.className = "h-full w-full";
    renderer.domElement.setAttribute("aria-label", alt);
    container.appendChild(renderer.domElement);

    // Metallic PBR materials mostly reflect their environment rather than
    // direct light, so without an env map they render near-black regardless
    // of light intensity. A generated room environment fixes that.
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04,
    ).texture;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x606060, 1.4));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.9);
    fillLight.position.set(-6, 4, -4);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.0);
    rimLight.position.set(0, 6, -8);
    scene.add(rimLight);

    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    dracoLoader.setDecoderPath("/draco/");
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    const onModelLoaded = (gltf: { scene: THREE.Object3D }) => {
      if (disposed) return;

      const model = gltf.scene;
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x1a1a1a,
        transparent: true,
        opacity: 0.6,
      });
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const edges = new THREE.EdgesGeometry(child.geometry, 30);
          const line = new THREE.LineSegments(edges, edgeMaterial);
          child.add(line);
        }
      });
      const bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      const largestDimension = Math.max(size.x, size.y, size.z, 1);

      model.position.sub(center);
      scene.add(model);
      camera.position.set(largestDimension * 1.25, largestDimension * 0.85, largestDimension * 1.25);
      camera.near = largestDimension / 1_000;
      camera.far = largestDimension * 100;
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.update();
      setLoadState("ready");
    };
    const onModelError = () => {
      if (!disposed) setLoadState("error");
    };

    fetch(src)
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        if (disposed) return;
        loader.parse(stripUndecodableTextures(buffer), "", onModelLoaded, onModelError);
      })
      .catch(onModelError);
    render();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      controls.dispose();
      dracoLoader.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [alt, src]);

  return (
    <div
      className="relative aspect-video overflow-hidden rounded-sm border border-hairline bg-surface"
      role="img"
      aria-label={alt}
    >
      <div ref={containerRef} className="h-full w-full" />
      {loadState !== "ready" ? (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/90 text-ink-muted"
          aria-live="polite"
          aria-atomic="true"
        >
          {loadState === "loading" ? (
            <>
              <span
                className="h-7 w-7 animate-spin rounded-full border-2 border-ink-faint border-t-accent"
                aria-hidden="true"
              />
              <span className="font-mono text-[10px] uppercase tracking-widest">
                Loading 3D model
              </span>
            </>
          ) : (
            <span className="max-w-xs text-center font-mono text-[10px] uppercase tracking-widest">
              Unable to load 3D model
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}