// Hand-written types for the JS viewer engine.
//
// The engine (and its `three` imports) is excluded from the TypeScript program
// via tsconfig — this declaration is what the React component types against, so
// the TS server never parses three's large type definitions. Keep in sync with
// viewer-core.js.

export interface ModelViewerCallbacks {
  onLoaded?: () => void;
  onError?: (err: Error) => void;
}

export class ViewerCore {
  constructor(mount: HTMLElement);
  init(): void;
  loadModel(file: File, callbacks?: ModelViewerCallbacks): void;
  dispose(): void;
}
