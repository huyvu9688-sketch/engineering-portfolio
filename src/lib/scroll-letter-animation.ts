export interface ScrollLetter {
  style: Pick<CSSStyleDeclaration, "transform">;
}

interface ScrollLetterProgressOptions {
  progress: number;
  center: number;
  maxDistance: number;
  phase: number;
  baseY: number;
  ringY: number;
}

/** Applies the current reveal state while safely ignoring refs React detached. */
export function applyScrollLetterProgress(
  letters: readonly (ScrollLetter | null)[],
  { progress, center, maxDistance, phase, baseY, ringY }: ScrollLetterProgressOptions,
) {
  letters.forEach((letter, index) => {
    if (!letter) return;

    const distance = Math.abs(index - center);
    const normalized = maxDistance > 0 ? distance / maxDistance : 0;
    const phaseStart = (1 - normalized) * (1 - phase);
    const letterProgress = Math.max(0, Math.min((progress - phaseStart) / phase, 1));
    const eased = Math.sin((letterProgress * Math.PI) / 2);

    letter.style.transform = `translateY(${(baseY + distance * ringY) * (1 - eased)}%)`;
  });
}
