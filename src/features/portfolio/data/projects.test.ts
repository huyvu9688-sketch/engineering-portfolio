import assert from "node:assert/strict";
import test from "node:test";

import { getProjectBySlug } from "./projects.ts";

test("Works projects retain their approved titles and cover images", () => {
  assert.deepEqual(
    Object.fromEntries(
      ["project-one", "project-two", "project-three"].map((slug) => {
        const project = getProjectBySlug(slug);
        return [slug, { title: project?.title, image: project?.image }];
      }),
    ),
    {
      "project-one": { title: "Foam Cell Automation", image: "/1.png" },
      "project-two": { title: "Auto Router Cell", image: "/2.png" },
      "project-three": { title: "Verona Expansion", image: "/3.png" },
    },
  );
});

test("Works projects expose their approved media", () => {
  assert.deepEqual(
    Object.fromEntries(
      ["project-one", "project-two", "project-three"].map((slug) => {
        const project = getProjectBySlug(slug);
        return [slug, {
          images: project?.images,
          video: project?.video,
          model: project?.model,
        }];
      }),
    ),
    {
      "project-one": {
        images: ["/1.png", "/1.1.png"],
        video: "/1.mp4",
        model: undefined,
      },
      "project-two": {
        images: ["/2.png", "/2.1.png", "/2.2.jpg", "/2.3.jpg", "/2.4.png"],
        video: "/2.mp4",
        model: undefined,
      },
      "project-three": {
        images: ["/3.png", "/3.1.png"],
        video: undefined,
        model: "/12400_10000.web.glb",
      },
    },
  );

  assert.equal(Object.hasOwn(getProjectBySlug("project-three")!, "video"), false);
});
