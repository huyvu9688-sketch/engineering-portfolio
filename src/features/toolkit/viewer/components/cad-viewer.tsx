"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  Box,
  Crosshair,
  Eye,
  ListTree,
  LoaderCircle,
  RotateCcw,
  Ruler,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";

/** Minimal view of the JS engine class we drive from React. */
interface ViewerCoreInstance {
  init(): void;
  loadModel(
    file: File,
    callbacks?: { onLoaded?: () => void; onError?: (err: Error) => void },
  ): void;
  dispose(): void;
}

type Status = "empty" | "loading" | "ready" | "error";

const ACCEPT = ".glb,.gltf,model/gltf-binary,model/gltf+json";

const TOOL_BTN =
  "flex h-8 w-8 items-center justify-center rounded-full text-on-dark-muted transition-colors hover:bg-white/10 hover:text-on-dark";

/**
 * Minimal model viewer: a dark 3D window, import, a component tree, isolate, and
 * measure. All WebGL work happens in the effect; one context per mount, fully
 * disposed on unmount.
 */
export function CadViewer() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<ViewerCoreInstance | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("empty");
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
    coreRef.current.loadModel(file, {
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
      className="relative h-[75vh] min-h-130 w-full overflow-hidden rounded-lg border border-hairline bg-surface-dark"
      onDragOver={(e) => {
        e.preventDefault();
        if (!dragging) setDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={handleDrop}
    >
      {/* Renderer canvas mounts here (dark scene) */}
      <div ref={canvasRef} className="absolute inset-0" />

      {/* Hidden file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleInput}
        className="hidden"
      />

      {/* Toolbar (always in the DOM so the engine can bind its controls) */}
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

      {/* Component-list toggle */}
      <button
        type="button"
        id="toggle-list"
        className={`absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-hairline-dark bg-surface-dark/80 text-on-dark-muted backdrop-blur transition-all hover:bg-white/10 hover:text-on-dark ${chromeReady}`}
        title="Toggle component list"
        aria-label="Toggle component list"
      >
        <ListTree className="h-4 w-4 stroke-[1.5]" />
      </button>

      {/* Component-list panel — overlay, revealed by the engine after load */}
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
            Click a point on two component faces · Esc to exit
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

      {/* Measure result */}
      <div
        id="measure-result"
        style={{ display: "none" }}
        className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-lg border border-accent/40 bg-surface-dark/85 px-3 py-2 text-center backdrop-blur"
      >
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-on-dark-muted">Distance </span>
          <span id="measure-value" className="font-mono text-[10px] tabular-nums text-accent" />
        </div>
        <div id="measure-deltas" className="mt-0.5 font-mono text-[9px] tabular-nums text-on-dark-muted" />
      </div>

      {/* Empty / upload state */}
      {status === "empty" && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-surface-dark px-6 text-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-lg border transition-colors ${
              dragging ? "border-accent bg-accent/10" : "border-hairline-dark"
            }`}
          >
            <Box className="h-7 w-7 stroke-[1.25] text-on-dark-muted" />
          </div>
          <div className="space-y-1.5">
            <p className="font-mono text-xs uppercase tracking-widest text-on-dark">
              {dragging ? "Drop to load" : "Drop a 3D model here"}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-on-dark-muted">
              GLB or GLTF · read in your browser, never uploaded
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full bg-on-dark px-5 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-surface-dark transition-colors hover:bg-accent hover:text-on-dark"
          >
            Choose file
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {status === "loading" && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-surface-dark">
          <LoaderCircle className="h-6 w-6 animate-spin stroke-[1.5] text-on-dark-muted" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-on-dark-muted">
            Loading {fileName}
          </span>
        </div>
      )}

      {/* Error overlay */}
      {status === "error" && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-surface-dark px-6 text-center">
          <TriangleAlert className="h-6 w-6 stroke-[1.5] text-accent" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-on-dark-muted">
            {errorMessage || "Failed to load model"}
          </span>
          <button
            type="button"
            onClick={() => setStatus("empty")}
            className="rounded-full border border-hairline-dark px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-on-dark-muted transition-colors hover:text-accent"
          >
            Try another file
          </button>
        </div>
      )}
    </div>
  );
}
