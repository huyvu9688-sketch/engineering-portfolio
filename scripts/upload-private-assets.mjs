import { put } from "@vercel/blob";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const files = [
  { local: "public/1.mp4", key: "assets/1.mp4", contentType: "video/mp4" },
  { local: "public/2.mp4", key: "assets/2.mp4", contentType: "video/mp4" },
  { local: "public/4.glb", key: "assets/4.glb", contentType: "model/gltf-binary" },
  { local: "public/5.glb", key: "assets/5.glb", contentType: "model/gltf-binary" },
];
// Note: the Verona model (12400_10000.web.glb) is NOT re-uploaded here — it
// already lives on Blob at its original pathname from a previous migration
// (see commit b229d1e) and is proxied directly from there in the API route.
// Do not upload public/12400_10000.glb; that's a stale, different local
// file left over from before that migration.

for (const file of files) {
  const path = resolve(projectRoot, file.local);
  const data = readFileSync(path);
  // The store only supports public access, so the underlying Blob URL is
  // technically reachable if someone has it — but the app never sends that
  // URL to the browser. All requests go through /api/asset/[key], which
  // fetches from Blob server-side and streams the bytes back under our own
  // domain, so casual visitors never see (or can bookmark/share) the real
  // Blob location.
  const result = await put(file.key, data, {
    access: "public",
    contentType: file.contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    allowOverwrite: true,
  });
  console.log(file.key, "->", result.url, `(${(data.length / 1024 / 1024).toFixed(1)} MB)`);
}
