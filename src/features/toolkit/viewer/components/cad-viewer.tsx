"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  Axis3d,
  Box,
  Crosshair,
  Eye,
  Frame,
  Grid3x3,
  ListTree,
  LoaderCircle,
  Redo2,
  RotateCcw,
  Ruler,
  TriangleAlert,
  Undo2,
  Upload,
  X,
} from "lucide-react";

/** Minimal view of the JS engine class we drive from React. */
interface ViewerCoreInstance {
  init(): void;
  loadModel(
    file: File,
    callbacks?: {
      onProgress?: (pct: number) => void;
      onLoaded?: () => void;
      onError?: (err: Error) => void;
    },
  ): void;
  dispose(): void;
}

type Status = "empty" | "loading" | "ready" | "error";

// Floating HUD controls — dark so they read over the white viewport (and still
// work if the background goes dark later).
const TOOL_BTN =
  "flex h-8 w-8 items-center justify-center rounded-full text-on-dark-muted transition-colors hover:bg-white/10 hover:text-on-dark";

const ACCEPT = ".glb,.gltf,model/gltf-binary,model/gltf+json";

/**
 * Embeds the imperative Three.js CAD-viewer engine inside React. One WebGL
 * context per mount, fully disposed on unmount. The 3D environment is white;
 * the floating control chrome is dark for contrast.
 */
export function CadViewer() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<ViewerCoreInstance | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("empty");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const mount = canvasRef.current;
    if (!mount) return;

    let cancelled = false;

    // Tear down any leftover instance (hot-reload / Strict Mode double-mount)
    // before creating a new one — only one WebGL context ever exists per mount.
    coreRef.current?.dispose();
    coreRef.current = null;

    import("../lib/viewer-core.js")
      .then((mod) => {
        if (cancelled) return;
        const core = new mod.ViewerCore(mount);
        coreRef.current = core;
        try {
          core.init();
        } catch (err: unknown) {
          setErrorMessage(err instanceof Error ? err.message : "Viewer failed to start");
          setStatus("error");
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setErrorMessage(err instanceof Error ? err.message : "Failed to load viewer");
        setStatus("error");
      });

    return () => {
      cancelled = true;
      coreRef.current?.dispose();
      coreRef.current = null;
    };
  }, []);

  function loadFile(file: File) {
    if (!coreRef.current) return;
    setFileName(file.name);
    setStatus("loading");
    setProgress(0);
    coreRef.current.loadModel(file, {
      onProgress: (pct) => setProgress(pct),
      onLoaded: () => setStatus("ready"),
      onError: (err) => {
        setErrorMessage(err?.message ?? "Failed to load model");
        setStatus("error");
      },
    });
  }

  function handleInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (file) loadFile(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }

  const chromeReady = status === "ready" ? "opacity-100" : "pointer-events-none opacity-0";

  return (
    <div
      className="relative h-[75vh] min-h-130 w-full overflow-hidden rounded-lg border border-hairline bg-surface"
      onDragOver={(e) => {
        e.preventDefault();
        if (!dragging) setDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={handleDrop}
    >
      {/* Renderer canvas mounts here (white scene) */}
      <div ref={canvasRef} className="absolute inset-0" />

      {/* Hidden file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleInput}
        className="hidden"
      />

      {/* Toolbar */}
      <div
        className={`absolute left-3 top-3 z-20 flex items-center gap-0.5 rounded-full border border-hairline-dark bg-surface-dark/80 p-1 backdrop-blur transition-opacity ${chromeReady}`}
      >
        <button type="button" id="reset-camera" className={TOOL_BTN} title="Reset view" aria-label="Reset view">
          <RotateCcw className="h-4 w-4 stroke-[1.5]" />
        </button>
        <button type="button" id="isolate-mode" className={TOOL_BTN} title="Isolate a part" aria-label="Isolate a part">
          <Crosshair className="h-4 w-4 stroke-[1.5]" />
        </button>
        <button type="button" id="show-all-parts" className={TOOL_BTN} title="Show all parts" aria-label="Show all parts">
          <Eye className="h-4 w-4 stroke-[1.5]" />
        </button>
        <button type="button" id="measure-mode" className={TOOL_BTN} title="Measure distance" aria-label="Measure">
          <Ruler className="h-4 w-4 stroke-[1.5]" />
        </button>
        <span className="mx-0.5 h-5 w-px bg-hairline-dark" />
        <button type="button" id="toggle-edges" className={TOOL_BTN} title="Toggle edges" aria-label="Toggle edges">
          <Frame className="h-4 w-4 stroke-[1.5]" />
        </button>
        <button type="button" id="toggle-grid" className={TOOL_BTN} title="Toggle grid" aria-label="Toggle grid">
          <Grid3x3 className="h-4 w-4 stroke-[1.5]" />
        </button>
        <button type="button" id="toggle-axes" className={TOOL_BTN} title="Toggle axes" aria-label="Toggle axes">
          <Axis3d className="h-4 w-4 stroke-[1.5]" />
        </button>
        <span className="mx-0.5 h-5 w-px bg-hairline-dark" />
        <button type="button" id="undo-action" className={TOOL_BTN} title="Undo" aria-label="Undo">
          <Undo2 className="h-4 w-4 stroke-[1.5]" />
        </button>
        <button type="button" id="redo-action" className={TOOL_BTN} title="Redo" aria-label="Redo">
          <Redo2 className="h-4 w-4 stroke-[1.5]" />
        </button>
        <span className="mx-0.5 h-5 w-px bg-hairline-dark" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={TOOL_BTN}
          title="Load a different model"
          aria-label="Load a different model"
        >
          <Upload className="h-4 w-4 stroke-[1.5]" />
        </button>
      </div>

      {/* Component list toggle */}
      <button
        type="button"
        id="toggle-list"
        className={`absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-hairline-dark bg-surface-dark/80 text-on-dark-muted backdrop-blur transition-all hover:bg-white/10 hover:text-on-dark ${chromeReady}`}
        title="Toggle component list"
        aria-label="Toggle component list"
      >
        <ListTree className="h-4 w-4 stroke-[1.5]" />
      </button>

      {/* Component list panel — overlay, revealed by the engine after load */}
      <div
        id="component-list-container"
        className="absolute bottom-3 right-3 top-16 z-20 hidden w-64"
      >
        <div className="flex h-full flex-col overflow-hidden rounded-lg border border-hairline-dark bg-surface-dark/90 backdrop-blur">
          <div className="flex items-center justify-between border-b border-hairline-dark px-3 py-2.5">
            <span
              id="component-list-header"
              className="font-mono text-[10px] uppercase tracking-widest text-on-dark-muted"
            >
              Components
            </span>
            <button
              type="button"
              id="close-list"
              className="text-on-dark-muted transition-colors hover:text-accent"
              aria-label="Close component list"
            >
              <X className="h-4 w-4 stroke-[1.5]" />
            </button>
          </div>
          <div id="component-list" className="min-h-0 flex-1 overflow-y-auto overscroll-contain" />
        </div>
      </div>

      {/* Isolate pick-mode banner */}
      <div
        id="isolate-banner"
        style={{ display: "none" }}
        className="absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-full border border-hairline-dark bg-surface-dark/90 px-4 py-2 backdrop-blur"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-on-dark">
            Click a part to isolate · Esc to cancel
          </span>
          <button
            type="button"
            id="exit-isolate-mode"
            className="rounded-full border border-hairline-dark px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-on-dark-muted transition-colors hover:text-accent"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Isolated-state banner */}
      <div
        id="isolated-banner"
        style={{ display: "none" }}
        className="absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-full border border-accent/40 bg-surface-dark/90 px-4 py-2 backdrop-blur"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-on-dark-muted">
            Isolated <span id="isolated-banner-name" className="text-accent" />
          </span>
          <button
            type="button"
            id="exit-isolate"
            className="rounded-full border border-hairline-dark px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-on-dark-muted transition-colors hover:text-accent"
          >
            Exit · Esc
          </button>
        </div>
      </div>

      {/* Measure-mode banner */}
      <div
        id="measure-banner"
        style={{ display: "none" }}
        className="absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-full border border-hairline-dark bg-surface-dark/90 px-4 py-2 backdrop-blur"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-on-dark">
            Click two points to measure · Esc to exit
          </span>
          <button
            type="button"
            id="exit-measure"
            className="rounded-full border border-hairline-dark px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-on-dark-muted transition-colors hover:text-accent"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Hover read-out — offset right of the bottom-left view-cube gizmo */}
      <div
        id="hover-info"
        style={{ display: "none" }}
        className="pointer-events-none absolute bottom-3 left-40 z-20 rounded-full border border-hairline-dark bg-surface-dark/85 px-3 py-1.5 backdrop-blur"
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-on-dark-muted">Part </span>
        <span id="hover-part-name" className="font-mono text-[10px] text-on-dark" />
      </div>

      {/* Measure result */}
      <div
        id="measure-result"
        style={{ display: "none" }}
        className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-accent/40 bg-surface-dark/85 px-3 py-1.5 backdrop-blur"
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-on-dark-muted">Distance </span>
        <span id="measure-value" className="font-mono text-[10px] tabular-nums text-accent" />
        <span className="font-mono text-[10px] text-on-dark-muted"> units</span>
      </div>

      {/* Empty / upload state (light, matches the white viewport) */}
      {status === "empty" && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-surface px-6 text-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-lg border transition-colors ${
              dragging ? "border-accent bg-accent/5" : "border-hairline"
            }`}
          >
            <Box className="h-7 w-7 stroke-[1.25] text-ink-faint" />
          </div>
          <div className="space-y-1.5">
            <p className="font-mono text-xs uppercase tracking-widest text-ink">
              {dragging ? "Drop to load" : "Drop a 3D model here"}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
              GLB or GLTF · read in your browser, never uploaded
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full bg-ink px-5 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-on-dark transition-colors hover:bg-accent"
          >
            Choose file
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {status === "loading" && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-surface">
          <LoaderCircle className="h-6 w-6 animate-spin stroke-[1.5] text-ink-faint" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            Loading {fileName} {progress > 0 ? `${progress}%` : ""}
          </span>
        </div>
      )}

      {/* Error overlay */}
      {status === "error" && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-surface px-6 text-center">
          <TriangleAlert className="h-6 w-6 stroke-[1.5] text-accent" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            {errorMessage || "Failed to load model"}
          </span>
          <button
            type="button"
            onClick={() => setStatus("empty")}
            className="rounded-full border border-hairline px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-muted transition-colors hover:text-accent"
          >
            Try another file
          </button>
        </div>
      )}
    </div>
  );
}
