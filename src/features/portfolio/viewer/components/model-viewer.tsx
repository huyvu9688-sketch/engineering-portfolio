"use client";

import { useEffect, useRef, useState } from "react";
import {
  Axis3d,
  Crosshair,
  Eye,
  Frame,
  Grid3x3,
  ListTree,
  LoaderCircle,
  Redo2,
  RotateCcw,
  TriangleAlert,
  Undo2,
  X,
} from "lucide-react";

/** Minimal view of the JS engine class we drive from React. */
interface ViewerCoreInstance {
  init(): void;
  loadModel(
    url: string,
    callbacks?: {
      onProgress?: (pct: number) => void;
      onLoaded?: () => void;
      onError?: (err: Error) => void;
    },
  ): void;
  dispose(): void;
}

interface ModelViewerProps {
  /** GLB/GLTF model URL (path under /public or absolute URL). */
  src: string;
}

const TOOL_BTN =
  "flex h-8 w-8 items-center justify-center rounded-full text-on-dark-muted transition-colors hover:bg-white/10 hover:text-on-dark";

/**
 * Embeds the imperative Three.js viewer engine inside React. All WebGL work
 * happens in the effect (client only); React owns the restyled chrome and the
 * load/error overlay state.
 */
export function ModelViewer({ src }: ModelViewerProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<ViewerCoreInstance | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const mount = canvasRef.current;
    if (!mount) return;

    let cancelled = false;

    // Tear down any instance left over from a hot-reload / Strict Mode
    // double-mount before creating a new one, so only one WebGL context and
    // one render loop ever exist for this mount.
    coreRef.current?.dispose();
    coreRef.current = null;

    setStatus("loading");
    setProgress(0);

    import("../lib/viewer-core.js")
      .then((mod) => {
        if (cancelled) return;
        const core = new mod.ViewerCore(mount);
        coreRef.current = core;
        try {
          core.init();
          core.loadModel(src, {
            onProgress: (pct) => !cancelled && setProgress(pct),
            onLoaded: () => !cancelled && setStatus("ready"),
            onError: (err) => {
              if (cancelled) return;
              setErrorMessage(err?.message ?? "Failed to load model");
              setStatus("error");
            },
          });
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
  }, [src]);

  return (
    <div className="relative h-[60vh] min-h-[420px] w-full overflow-hidden rounded-lg border border-hairline bg-surface-dark">
      {/* Renderer canvas mounts here */}
      <div ref={canvasRef} className="absolute inset-0" />

      {/* Toolbar */}
      <div className="absolute left-3 top-3 z-20 flex items-center gap-0.5 rounded-full border border-hairline-dark bg-surface-dark/80 p-1 backdrop-blur">
        <button type="button" id="reset-camera" className={TOOL_BTN} title="Reset view" aria-label="Reset view">
          <RotateCcw className="h-4 w-4 stroke-[1.5]" />
        </button>
        <button type="button" id="isolate-mode" className={TOOL_BTN} title="Isolate a part" aria-label="Isolate a part">
          <Crosshair className="h-4 w-4 stroke-[1.5]" />
        </button>
        <button type="button" id="show-all-parts" className={TOOL_BTN} title="Show all parts" aria-label="Show all parts">
          <Eye className="h-4 w-4 stroke-[1.5]" />
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
      </div>

      {/* Component list toggle */}
      <button
        type="button"
        id="toggle-list"
        className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-hairline-dark bg-surface-dark/80 text-on-dark-muted backdrop-blur transition-colors hover:bg-white/10 hover:text-on-dark"
        title="Toggle component list"
        aria-label="Toggle component list"
      >
        <ListTree className="h-4 w-4 stroke-[1.5]" />
      </button>

      {/* Component list panel — revealed by the engine after a model loads */}
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

      {/* Isolate-mode banner */}
      <div
        id="isolate-banner"
        style={{ display: "none" }}
        className="absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-full border border-hairline-dark bg-surface-dark/90 px-4 py-2 backdrop-blur"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-on-dark">
            Click a part to isolate
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

      {/* Hover read-out */}
      <div
        id="hover-info"
        style={{ display: "none" }}
        className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-full border border-hairline-dark bg-surface-dark/80 px-3 py-1.5 backdrop-blur"
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-on-dark-muted">
          Hover{" "}
        </span>
        <span id="hover-part-name" className="font-mono text-[10px] text-on-dark" />
      </div>

      {/* Isolated read-out */}
      <div
        id="isolated-info"
        style={{ display: "none" }}
        className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-accent/40 bg-surface-dark/80 px-3 py-1.5 backdrop-blur"
      >
        <span id="isolated-part-name" className="font-mono text-[10px] uppercase tracking-widest text-accent" />
      </div>

      {/* Loading overlay */}
      {status === "loading" && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-surface-dark">
          <LoaderCircle className="h-6 w-6 animate-spin stroke-[1.5] text-on-dark-muted" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-on-dark-muted">
            Loading model {progress > 0 ? `${progress}%` : ""}
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
        </div>
      )}
    </div>
  );
}
