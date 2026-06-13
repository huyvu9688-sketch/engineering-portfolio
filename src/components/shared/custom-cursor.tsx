"use client";

import { useEffect, useRef } from "react";

/**
 * Dot + elastic trailing circle cursor for marketing pages only.
 * The dot tracks the pointer instantly; the circle eases (lerps)
 * behind it and expands with a translucent fill over links and
 * buttons. The elements default to hidden and are only revealed
 * on fine-pointer devices, so touch devices never show them.
 * Mount this per page — never in a shared layout — so utility
 * pages (calculators, database) stay calm.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fine pointer only — never on touch. The elastic trailing is
    // a core brand effect, so it runs regardless of reduced-motion.
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const dot = dotRef.current;
    const circle = circleRef.current;
    if (!dot || !circle) return;

    // Reveal the custom cursor and hide the native one
    dot.style.opacity = "1";
    circle.style.opacity = "1";
    document.body.classList.add("custom-cursor-active");

    let mouseX = 0;
    let mouseY = 0;
    let circleX = 0;
    let circleY = 0;
    let scale = 1;
    let hovering = false;
    let frameId = 0;

    const handleMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      const target = event.target as HTMLElement | null;
      hovering = Boolean(target?.closest("a, button, .magnetic-btn"));
    };

    const animate = () => {
      // Circle eases behind the dot; scale eases toward its target
      circleX += (mouseX - circleX) * 0.2;
      circleY += (mouseY - circleY) * 0.2;
      scale += ((hovering ? 2 : 1) - scale) * 0.2;

      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
      circle.style.transform = `translate(${circleX}px, ${circleY}px) translate(-50%, -50%) scale(${scale})`;
      circle.style.backgroundColor = hovering
        ? "rgba(255, 255, 255, 0.1)"
        : "transparent";
      circle.style.borderColor = hovering
        ? "transparent"
        : "rgba(255, 255, 255, 1)";
      frameId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMove);
    frameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(frameId);
      document.body.classList.remove("custom-cursor-active");
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-white opacity-0 mix-blend-exclusion"
      />
      <div
        ref={circleRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-8 w-8 rounded-full border border-white opacity-0 mix-blend-exclusion transition-colors duration-200"
      />
    </>
  );
}
