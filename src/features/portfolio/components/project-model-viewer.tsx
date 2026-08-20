"use client";

import type { ModelViewerElement } from "@google/model-viewer";
import { createElement, useEffect } from "react";
import type { HTMLAttributes } from "react";

interface ProjectModelViewerProps {
  src: string;
  alt: string;
}

type ModelViewerProps = HTMLAttributes<ModelViewerElement> & {
  src: string;
  alt: string;
  "camera-controls": boolean;
  "auto-rotate": boolean;
  "shadow-intensity": string;
};

export function ProjectModelViewer({ src, alt }: ProjectModelViewerProps) {
  useEffect(() => {
    void import("@google/model-viewer");
  }, []);
  const modelViewerProps: ModelViewerProps = {
    src,
    alt,
    "camera-controls": true,
    "auto-rotate": true,
    "shadow-intensity": "1",
    className: "h-full w-full",
  };

  return (
    <div className="mt-10 aspect-video max-w-3xl overflow-hidden rounded-sm border border-hairline bg-surface">
      {createElement("model-viewer", modelViewerProps)}
    </div>
  );
}