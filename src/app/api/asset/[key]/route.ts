import { get } from "@vercel/blob";
import { NextRequest } from "next/server";

/**
 * Opaque key -> Blob pathname. The mapping lives only on the server, so the
 * real Blob URL is never sent to the browser: visitors only ever see and
 * can bookmark/share this route's URL, not a permanent direct link to the
 * file. This is a casual-download deterrent, not real access control — the
 * store itself is public, so someone who already has the Blob URL (or
 * inspects network requests while the page runs) can still fetch the file.
 * See src/features/portfolio/data/projects.ts for where these keys are used.
 */
const ASSETS: Record<string, { pathname: string; contentType: string }> = {
  "rgasjxbqqJex": { pathname: "assets/1.mp4", contentType: "video/mp4" },
  "j6Ciac14rRb9": { pathname: "assets/2.mp4", contentType: "video/mp4" },
  "BN5p7N7K3l1k": { pathname: "assets/4.glb", contentType: "model/gltf-binary" },
  "5RntW7w_eU1i": { pathname: "assets/5.glb", contentType: "model/gltf-binary" },
  // Pre-existing Blob object from an earlier migration (see commit
  // b229d1e) — not one of the assets/* uploads in scripts/upload-private-assets.mjs.
  "Ut3FhIPX_16r": { pathname: "12400_10000.web.glb", contentType: "model/gltf-binary" },
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const asset = ASSETS[key];
  if (!asset) {
    return new Response("Not found", { status: 404 });
  }

  const range = request.headers.get("range");
  const result = await get(asset.pathname, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
    headers: range ? { range } : undefined,
  });

  if (!result) {
    return new Response("Not found", { status: 404 });
  }
  if (result.statusCode !== 200) {
    return new Response(null, { status: 304 });
  }

  // Stream straight through rather than buffering — these files run up to
  // ~56MB, and buffering the whole thing in the function would hold that
  // much in memory per concurrent request.
  //
  // Deliberately no content-length header: Blob serves these compressed
  // (content-encoding: br) over chunked transfer, so there's no fixed
  // length to report up front — `result.blob.size` looked like it should
  // supply one, but came back 0 here (compressed/chunked responses don't
  // populate it), and setting content-length to a wrong value makes fetch
  // truncate the body to that many bytes. Omitting it lets the response
  // stay chunked, which every browser and video/glTF loader handles fine.
  return new Response(result.stream, {
    status: result.headers.get("content-range") ? 206 : 200,
    headers: {
      "content-type": asset.contentType,
      "accept-ranges": "bytes",
      ...(result.headers.has("content-range")
        ? { "content-range": result.headers.get("content-range")! }
        : {}),
      // Not cached by intermediate/browser caches: each request re-checks
      // that the requester is actually hitting our route, not a stale copy.
      "cache-control": "private, no-store",
    },
  });
}
