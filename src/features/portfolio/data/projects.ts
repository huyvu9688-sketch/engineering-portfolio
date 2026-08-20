export interface Project {
  slug: string;
  title: string;
  category: string;
  summary: string;
  tags: string[];
  /** Path under /public, e.g. "/portfolio/project-one.jpg". Omitted for a placeholder visual. */
  image?: string;
  images?: string[];
  video?: string;
  model?: string;
  /** Your role on the project, shown on the detail page. */
  role?: string;
  /** When the work happened, e.g. "2024" or "2023 – 2024". */
  timeframe?: string;
  /** Detail-page body paragraphs. */
  overview?: string[];
}

export const PROJECTS: Project[] = [
  {
    slug: "project-one",
    title: "Foam Cell Automation",
    image: "/1.png",
    images: ["/1.png", "/1.1.png"],
    video: "/1.mp4",
    category: "[Category — e.g. Automation]",
    summary:
      "[One or two sentence summary: the problem, your approach, and the outcome.]",
    tags: ["[Tool / Tech]", "[Tool / Tech]", "[Tool / Tech]"],
    role: "[Your role — e.g. Lead Design Engineer]",
    timeframe: "[Year]",
    overview: [
      "[Describe the problem or brief: what was needed and why.]",
      "[Describe your approach: the design, the calculations, the tools, and any constraints you worked within.]",
      "[Describe the outcome: what shipped, measurable results, and what you'd do next.]",
    ],
  },
  {
    slug: "project-two",
    title: "Auto Router Cell",
    image: "/2.png",
    images: ["/2.png", "/2.1.png"],
    video: "/2.mp4",
    category: "[Category — e.g. Pneumatics]",
    summary:
      "[One or two sentence summary: the problem, your approach, and the outcome.]",
    tags: ["[Tool / Tech]", "[Tool / Tech]"],
    role: "[Your role]",
    timeframe: "[Year]",
    overview: [
      "[Describe the problem or brief: what was needed and why.]",
      "[Describe your approach: the design, the calculations, the tools, and any constraints you worked within.]",
      "[Describe the outcome: what shipped, measurable results, and what you'd do next.]",
    ],
  },
  {
    slug: "project-three",
    title: "Verona Expansion",
    image: "/3.png",
    images: ["/3.png", "/3.1.png"],
    model: "/12400_10000.glb",
    category: "[Category — e.g. SolidWorks]",
    summary:
      "[One or two sentence summary: the problem, your approach, and the outcome.]",
    tags: ["[Tool / Tech]", "[Tool / Tech]", "[Tool / Tech]"],
    role: "[Your role]",
    timeframe: "[Year]",
    overview: [
      "[Describe the problem or brief: what was needed and why.]",
      "[Describe your approach: the design, the calculations, the tools, and any constraints you worked within.]",
      "[Describe the outcome: what shipped, measurable results, and what you'd do next.]",
    ],
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}
