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