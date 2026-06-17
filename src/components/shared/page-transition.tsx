"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // key changes on every navigation → React remounts the div → animation re-fires
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
