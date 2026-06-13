// Central Three.js import hub for the GLB viewer engine.
//
// The viewer engine was authored as standalone modules that relied on
// CDN globals (window.THREE / GLTFLoader / OrbitControls). In this app
// Three.js is a bundled dependency, so every engine module imports what
// it needs from here instead of reaching for globals.

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

export { THREE, OrbitControls, GLTFLoader, DRACOLoader };
