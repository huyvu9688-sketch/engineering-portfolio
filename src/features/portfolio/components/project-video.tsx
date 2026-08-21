"use client";

import { useRef } from "react";

interface ProjectVideoProps {
  src: string;
  /** Number of playthroughs before the video stops on its final frame. */
  maxLoops?: number;
}

export function ProjectVideo({ src, maxLoops = 3 }: ProjectVideoProps) {
  const playCountRef = useRef(0);

  return (
    <video
      src={src}
      autoPlay
      muted
      playsInline
      preload="metadata"
      controlsList="nodownload noplaybackrate nofullscreen"
      disablePictureInPicture
      onContextMenu={(event) => event.preventDefault()}
      onEnded={(event) => {
        playCountRef.current += 1;
        if (playCountRef.current < maxLoops) {
          event.currentTarget.currentTime = 0;
          event.currentTarget.play();
        }
      }}
      className="h-full w-full object-contain"
    />
  );
}
