// Central Three.js import hub for the CAD viewer engine.
//
// The engine is authored as plain JS modules wrapped behind a typed React
// component. Bundling everything from one hub keeps the `three` imports in a
// single place and lets tsconfig skip parsing three's large type defs.

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { ViewHelper } from "three/examples/jsm/helpers/ViewHelper.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export {
    THREE,
    OrbitControls,
    GLTFLoader,
    DRACOLoader,
    KTX2Loader,
    MeshoptDecoder,
    ViewHelper,
    RoomEnvironment,
};
