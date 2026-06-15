import type { ReactNode } from "react";

// Simple line-art schematics for each drive mechanism, in the project's
// lucide/Swiss style (stroke-based, currentColor, 24×24).

interface IconProps {
  className?: string;
}

function Icon({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

/** Lead / ball screw: carriage on a threaded shaft, with a linear-motion arrow. */
export function BallScrewIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <rect x="7" y="5" width="9" height="5" rx="1" />
      <line x1="11.5" y1="10" x2="11.5" y2="14" />
      <line x1="2" y1="14" x2="22" y2="14" />
      <path d="M5 12.5 7 15.5M8 12.5 10 15.5M11 12.5 13 15.5M14 12.5 16 15.5M17 12.5 19 15.5" />
      <path d="M18 6h3M19.5 4.5 21 6 19.5 7.5" />
    </Icon>
  );
}

/** Belt conveyor: two rollers, a belt, and a box riding on top. */
export function BeltConveyorIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="5" cy="15" r="3" />
      <circle cx="19" cy="15" r="3" />
      <line x1="5" y1="12" x2="19" y2="12" />
      <line x1="5" y1="18" x2="19" y2="18" />
      <rect x="9" y="7" width="6" height="5" rx="0.5" />
    </Icon>
  );
}

/** Rack and pinion: a pinion gear meshing with a toothed rack. */
export function RackPinionIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="11" r="4" />
      <circle cx="12" cy="11" r="1" />
      <path d="M12 7V5M16 11h2M12 15v2M8 11H6" />
      <line x1="2" y1="20" x2="22" y2="20" />
      <path d="M5 20v-3M8 20v-3M11 20v-3M14 20v-3M17 20v-3" />
    </Icon>
  );
}

/** Index table: a rotary disc (top view) with workpieces around the rim. */
export function IndexTableIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="1" />
      <rect x="10.5" y="3.6" width="3" height="3" rx="0.4" />
      <rect x="17.4" y="10.5" width="3" height="3" rx="0.4" />
      <rect x="10.5" y="17.4" width="3" height="3" rx="0.4" />
      <rect x="3.6" y="10.5" width="3" height="3" rx="0.4" />
    </Icon>
  );
}

/** Direct drive: a motor coupled straight to a rotating load disc. */
export function DirectDriveIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="8" cy="12" r="5" />
      <circle cx="8" cy="12" r="1" />
      <line x1="13" y1="12" x2="16" y2="12" />
      <rect x="16" y="9" width="5" height="6" rx="1" />
    </Icon>
  );
}
