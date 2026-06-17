// The diagonal up-right arrow from the Olha reference. Uses
// currentColor so it inherits text color (and inverts cleanly under
// mix-blend-difference). Rotate it with a utility class where needed.
export function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="21"
      height="21"
      viewBox="0 0 21 21"
      fill="none"
      aria-hidden
    >
      <path
        d="M1.81213 19.1203L19.4395 1.43779M5.76584 1.24781L19.6484 1.2279L19.6922 15.1104"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
