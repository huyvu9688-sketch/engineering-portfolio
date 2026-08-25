export interface ProjectSubproject {
  title: string;
  image: string;
  summary: string;
  result: string;
}

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
  /** Individual projects displayed within a grouped portfolio entry. */
  subprojects?: ProjectSubproject[];
}

export const PROJECTS: Project[] = [
  {
    slug: "project-one",
    title: "Foam Cell Automation",
    image: "/1.png",
    images: ["/1.png", "/1.1.png"],
    video: "/api/asset/rgasjxbqqJex",
    category: "Full-Cycle Design & Implementation",
    summary:
      "Designed and implemented a handling system for oversized foam panels, removing manual lifting and cutting headcount by 5 with a 1-year ROI.",
    tags: ["[Tool / Tech]", "[Tool / Tech]", "[Tool / Tech]"],
    role: "Full-Cycle Design & Implementation",
    timeframe: "5 months",
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
    video: "/api/asset/j6Ciac14rRb9",
    category: "Robotics & Material Handling",
    summary:
      "Led the concept for an automated panel-unloading system for a router line running hundreds of variable nesting layouts, using offline robot programming to deploy without re-teaching.",
    tags: ["[Tool / Tech]", "[Tool / Tech]"],
    role: "Concept & Design Engineer",
    timeframe: "1 month",
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
    model: "/api/asset/Ut3FhIPX_16r",
    category: "Conveyor & Robotic Integration",
    summary:
      "Designed a conveyor and robotic pick-and-place system consolidating panels from 5 production lines, eliminating 3 operators and forklift traffic from the walkway.",
    tags: ["[Tool / Tech]", "[Tool / Tech]", "[Tool / Tech]"],
    role: "Concept & Design Engineer",
    timeframe: "2 months",
    overview: [
      "Collaborated with other members to design a conveyor and robotic pick-and-place system that transports large foam panels from 5 production lines and consolidates them at a central staging point, replacing manual transport by operators and forklifts.",
      "Built a custom alignment conveyor to correct panel position after the robot places it down — panels come off the robot slightly skewed, so this stage squares them up before the next process, keeping output positioning within ±1/8 in tolerance.",
      "Result: eliminated 2 forklift trips per shift and 3 operators previously needed for manual handling, and removed forklift traffic from the walkway — a safety win the plant flagged directly.",
    ],
  },
  {
    slug: "project-four",
    title: "Automatic Reverse-Feed Module",
    image: "/4.png",
    images: ["/4.png", "/4.1.png"],
    model: "/api/asset/BN5p7N7K3l1k",
    category: "Material Handling & Automation",
    summary:
      "Designed an automatic reverse-feed module that eliminates manual stack-and-transfer between machine passes, cutting headcount by 1 with a 0.8-year ROI.",
    tags: ["[Tool / Tech]", "[Tool / Tech]", "[Tool / Tech]"],
    role: "Full-Cycle Design & Implementation",
    timeframe: "2 months",
    overview: [
      "The existing process for messaging Cushion required two passes through the machine — one for each side. Between passes, an operator had to manually stack the bags on a cart and transfer them back to the machine's feed end, creating a large time gap between the first and second pass and adding non-value-added labor to the line.",
      "I designed an automatic module mounted behind the machine that rotates and reverses the Cushion in place, feeding it back through for the second pass without manual stacking or transfer.",
      "Result: eliminated the manual stack-and-transfer step and cut the gap between first and second pass, reducing headcount by 1. Investment cost of $8k with a 0.8-year ROI.",
    ],
  },
  {
    slug: "project-five",
    title: "T-nut Insert Machine",
    image: "/5.png",
    images: ["/5.png", "/5.1.png"],
    model: "/api/asset/5RntW7w_eU1i",
    category: "Process Optimization & Automation",
    summary:
      "Proposed a one-operator, two-machine concept for T-nut insertion that uses auto-cycle time to eliminate idle wait, cutting headcount by 2 across 2 shifts.",
    tags: ["[Tool / Tech]", "[Tool / Tech]", "[Tool / Tech]"],
    role: "Full-Cycle Design & Implementation",
    timeframe: "3 months",
    overview: [
      "Currently, each T-nut insert machine runs with one operator per machine — a labor-intensive setup that depends entirely on a skilled operator's pace. The cycle: load workpiece into jig, machine auto-installs the T-nut, operator unloads and reloads for the next cycle.",
      "I proposed a concept where a single operator runs two T-nut machines simultaneously, using the machine's auto-cycle time as the window to load/unload the second machine instead of standing idle waiting on one.",
      "Result: reduced headcount by 2 across 2 shifts. Investment cost of $13k with a 1-year ROI.",
    ],
  },
  {
    slug: "project-six",
    title: "Panasonic Projects",
    image: "/6.jpg",
    images: ["/6.jpg", "/6.3.jpg", "/6.1.jpg", "/6.2.jpg"],
    category: "Automation Machines & Process Improvement",
    summary:
      "A selection of automation machines designed and commissioned for Panasonic Electric Works Vietnam.",
    tags: ["SOLIDWORKS", "Automation", "Kaizen", "TPM"],
    role: "Automation Engineer & Production Foreman",
    timeframe: "2022 – 2025",
    overview: [
      "At Panasonic Electric Works Vietnam, I owned automation equipment from requirements and design through assembly, commissioning, maintenance, and continuous improvement on live production lines.",
      "The four selected machines below show how process automation reduced takt time, handling, floor space, and quality risk across assembly operations.",
    ],
    subprojects: [
      {
        title: "Motor-Cover Cleaning Machine",
        image: "/6.jpg",
        summary: "Converted motor-cover cleaning from a manual task to a fully automatic machine.",
        result: "Takt time reduced from 10 seconds to 4 seconds, freeing 1–2 operators per line and eliminating cleaning-rag consumables.",
      },
      {
        title: "Accessory Pressing Machine",
        image: "/6.3.jpg",
        summary: "Replaced 2–3 separate accessory-pressing jigs with one compact automated machine.",
        result: "Designed and delivered in three weeks; takt time cut roughly in half with a smaller floor footprint.",
      },
      {
        title: "Rotor E-Ring Insert & Paint Machine",
        image: "/6.1.jpg",
        summary: "Combined E-ring insertion, painting, and packing in one automated machine with an integrated pick-and-place arm.",
        result: "Removed intermediate handling steps and consolidated three processes into one equipment footprint.",
      },
      {
        title: "Hex Nut Insertion Machine",
        image: "/6.2.jpg",
        summary: "Automated hex-nut insertion with presence control before each workpiece advances.",
        result: "Reduced takt time and achieved zero missing-part defects with a 100% quality pass rate.",
      },
    ],
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}
