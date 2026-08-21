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
    loader.load(src, (gltf) => {
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
    }, undefined, () => {
      if (!disposed) setLoadState("error");
    });
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