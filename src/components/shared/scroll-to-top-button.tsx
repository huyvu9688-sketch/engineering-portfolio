"use client";

import { ArrowUp } from "lucide-react";

export function ScrollToTopButton() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      className="flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-surface transition-colors duration-300 hover:bg-accent hover:text-on-dark"
    >
      <ArrowUp className="h-5 w-5 stroke-[1.5]" />
    </button>
  );
}
