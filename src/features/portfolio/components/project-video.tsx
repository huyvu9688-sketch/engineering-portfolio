"use client";

import { useEffect, useRef, useState } from "react";

interface ProjectVideoProps {
  src: string;
  /** Number of playthroughs before the video stops on its final frame. */
  maxLoops?: number;
}

export function ProjectVideo({ src, maxLoops = 3 }: ProjectVideoProps) {
  const playCountRef = useRef(0);
  // Fetched as a blob: URL rather than set directly as the <video> src.
  // A direct src is a plain network URL — right-click "Copy video address"
  // or a paste into a new tab hands out a permanent link to the file. A
  // blob: URL is only valid in this tab's memory for this page load, so
  // there's nothing shareable to copy.
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;

    fetch(src)
      .then((res) => res.blob())
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setObjectUrl(url);
      })
      .catch(() => {
        // Leave objectUrl null; nothing renders rather than a broken player.
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [src]);

  if (!objectUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface">
        <span
          className="h-7 w-7 animate-spin rounded-full border-2 border-ink-faint border-t-accent"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <video
      src={objectUrl}
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
