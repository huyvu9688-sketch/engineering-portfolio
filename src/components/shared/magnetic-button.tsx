"use client";

import { useRef, type ReactNode } from "react";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper that nudges its content toward the cursor on hover.
 * Marketing pages only. The effect is a slight translate — the
 * wrapped element keeps its own styling and behavior.
 */
export function MagneticButton({ children, className }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const offsetX = event.clientX - (rect.left + rect.width / 2);
    const offsetY = event.clientY - (rect.top + rect.height / 2);
    element.style.transform = `translate(${offsetX * 0.2}px, ${offsetY * 0.2}px)`;
  };

  const handleLeave = () => {
    const element = ref.current;
    if (!element) return;
    element.style.transform = "translate(0, 0)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`inline-block transition-transform duration-300 ease-out ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
