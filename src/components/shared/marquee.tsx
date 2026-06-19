const MARQUEE_ITEMS = [
  "SolidWorks",
  "Automation",
  "Pneumatics",
  "Motor Sizing",
  "PLC Control",
  "3D Modeling",
  "Three.js",
  "Production Eng",
  "Robotics",
  "Unit Systems",
];

function MarqueeContent({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div
      aria-hidden={ariaHidden}
      className="flex shrink-0 items-center"
    >
      {MARQUEE_ITEMS.map((item) => (
        <span key={item} className="flex items-center">
          <span className="px-8 font-mono text-sm uppercase tracking-widest text-ink">
            {item}
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <div className="overflow-hidden bg-canvas py-6">
      <div className="marquee-track">
        <MarqueeContent />
        <MarqueeContent ariaHidden />
      </div>
    </div>
  );
}
