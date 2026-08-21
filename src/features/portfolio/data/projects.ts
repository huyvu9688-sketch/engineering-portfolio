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
  /** Path under /public, or a full URL (e.g. Vercel Blob) for files over the 100MB deploy limit. */
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
    role: "Concept & Design Engineer",
    timeframe: "2 months",
    overview: [
      "Participated in an automation project for the foam assembly process, designing and implementing a system to handle and assemble large foam components — up to 63 × 63 × 8 inches and 18–20 kg each.",
      "Manual handling of parts this size and weight was the core problem: it created ergonomic strain on operators, and inconsistent handling was directly hurting assembly quality — panels this large are easy to misalign or damage by hand, and that inconsistency carried through to the finished product.",
      "Results: reduced headcount by 5, with a 1-year ROI. Assembly quality and process consistency improved as well, with fewer defects tied to handling variation.",
      "The system also removed manual lifting of 18–20 kg oversized parts from the process entirely — a direct ergonomic and safety improvement.",
    ],
  },
  {
    slug: "project-two",
    title: "Auto Router Cell",
    image: "/2.png",
    images: ["/2.png", "/2.1.png"],
    video: "/2.mp4",
    category: "Robotics & Material Handling",
    summary:
      "[One or two sentence summary: the problem, your approach, and the outcome.]",
    tags: ["[Tool / Tech]", "[Tool / Tech]"],
    role: "Concept & Design Engineer",
    timeframe: "2 months",
    overview: [
      "Supported system upgrades and cost reduction on the router line, and led the concept development for an automated unloading mechanism to remove wooden panels from the CNC after cutting — previously a manual step.",
      "The core challenge was variation: the router ran hundreds of different nesting layouts, each with a different part arrangement, so there was no fixed pick sequence for a robot to learn — a moving target instead of a repeatable motion.",
      "I proposed a two-track solution. Reduce layout variation at the source — worked with the nesting design team to cut down the number of distinct layouts, while holding material utilization and scrap rate at the same level as the existing process (no trade-off on wood yield to gain automation).",
      "Offline robot programming — instead of teaching every pick position on-site for each new layout, drove the robot from pre-mapped CSV files of pick-and-place coordinates generated from the nesting data, so new layouts could be deployed without re-teaching.",
      "This turned a line that looked too variable for automation into a feasible target — cutting labor dependency, shortening deployment time per new layout, and improving throughput without sacrificing yield.",
    ],
  },
  {
    slug: "project-three",
    title: "Verona Expansion",
    image: "/3.png",
    images: ["/3.png", "/3.1.png"],
    model:
      "https://rcbdu7ailn7momwa.public.blob.vercel-storage.com/12400_10000.web.glb",
    category: "Conveyor & Robotic Integration",
    summary:
      "[One or two sentence summary: the problem, your approach, and the outcome.]",
    tags: ["[Tool / Tech]", "[Tool / Tech]", "[Tool / Tech]"],
    role: "Concept & Design Engineer",
    timeframe: "2 months",
    overview: [
      "Collaborated with other members to design a conveyor and robotic pick-and-place system that transports large foam panels from 5 production lines and consolidates them at a central staging point, replacing manual transport by operators and forklifts.",
      "Built a custom alignment conveyor to correct panel position after the robot places it down — panels come off the robot slightly skewed, so this stage squares them up before the next process, keeping output positioning within ±1/8 in tolerance.",
      "Result: eliminated 2 forklift trips per shift and 3 operators previously needed for manual handling, and removed forklift traffic from the walkway — a safety win the plant flagged directly.",
    ],
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}
