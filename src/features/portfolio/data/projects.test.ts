import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { getProjectBySlug } from "./projects.ts";
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../");

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
        video: "/api/asset/rgasjxbqqJex",
        model: undefined,
      },
      "project-two": {
        images: ["/2.png", "/2.1.png", "/2.2.jpg", "/2.3.jpg", "/2.4.png"],
        video: "/api/asset/j6Ciac14rRb9",
        model: undefined,
      },
      "project-three": {
        images: ["/3.png", "/3.1.png"],
        video: undefined,
        model: "/api/asset/Ut3FhIPX_16r",
      },
    },
  );

  // Video/model URLs must go through our own /api/asset proxy, not a
  // direct public Blob (or /public) URL — see src/app/api/asset/[key]/route.ts
  // for why: it keeps the real file location out of anything a visitor
  // can see, bookmark, or share.
  for (const slug of ["project-one", "project-two", "project-three"] as const) {
    const project = getProjectBySlug(slug)!;
    for (const url of [project.video, project.model].filter(Boolean)) {
      assert.match(
        url!,
        /^\/api\/asset\/[A-Za-z0-9_-]+$/,
        `${slug} media must be served via /api/asset, not a direct Blob or public/ URL`,
      );
    }
  }

  assert.equal(Object.hasOwn(getProjectBySlug("project-three")!, "video"), false);
});

test("Auto Router project stills are available as public assets", () => {
  for (const asset of ["2.2.jpg", "2.3.jpg", "2.4.png"]) {
    assert.equal(
      existsSync(resolve(projectRoot, "public", asset)),
      true,
      `Expected public/${asset} to exist`,
    );
  }
});

test("Panasonic Projects groups four machine projects under project six", () => {
  const project = getProjectBySlug("project-six");

  assert.deepEqual(
    project && {
      title: project.title,
      image: project.image,
      images: project.images,
      subprojects: project.subprojects?.map((entry) => ({ title: entry.title, image: entry.image })),
    },
    {
      title: "Panasonic Projects",
      image: "/6.jpg",
      images: ["/6.jpg", "/6.3.jpg", "/6.1.jpg", "/6.2.jpg"],
      subprojects: [
        { title: "Motor-Cover Cleaning Machine", image: "/6.jpg" },
        { title: "Accessory Pressing Machine", image: "/6.3.jpg" },
        { title: "Rotor E-Ring Insert & Paint Machine", image: "/6.1.jpg" },
        { title: "Hex Nut Insertion Machine", image: "/6.2.jpg" },
      ],
    },
  );

  assert.equal(getProjectBySlug("project-seven"), undefined);
  assert.equal(getProjectBySlug("project-eight"), undefined);
  assert.equal(getProjectBySlug("project-nine"), undefined);
});