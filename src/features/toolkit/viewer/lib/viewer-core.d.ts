// Hand-written types for the JS viewer engine.
//
// The engine modules (and their `three` imports) are excluded from the
// TypeScript program via tsconfig — this declaration is what the React
// component types against, so the TS server never parses three's large type
// definitions. Keep in sync with viewer-core.js.

export interface ModelViewerCallbacks {
  onProgress?: (pct: number) => void;
  onLoaded?: () => void;
  onError?: (err: Error) => void;
}

export class ViewerCore {
  constructor(canvasMount: HTMLElement);
  init(): void;
  loadModel(file: File, callbacks?: ModelViewerCallbacks): void;
  dispose(): void;
}
