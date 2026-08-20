"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface ProjectMediaRotatorProps {
  images: string[];
  title: string;
}

export function ProjectMediaRotator({
  images,
  title,
}: ProjectMediaRotatorProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;

    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % images.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative mx-auto aspect-16/10 max-w-[1500px] overflow-hidden rounded-sm border border-hairline bg-surface">
      {images.map((image, index) => (
        <Image
          key={image}
          src={image}
          alt={`${title} — view ${index + 1} of ${images.length}`}
          fill
          sizes="(max-width: 1500px) 100vw, 1500px"
          className={`object-contain p-4 transition-opacity duration-700 ${
            index === activeIndex ? "opacity-100" : "opacity-0"
          }`}
          priority={index === 0}
        />
      ))}
    </div>
  );
}
