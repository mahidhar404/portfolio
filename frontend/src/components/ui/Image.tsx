import { useState } from "react";

import { cn } from "@/lib/cn";
import { mediaUrl } from "@/lib/format";

interface ImageProps {
  src: string | null | undefined;
  alt: string;
  width: number;
  height: number;
  className?: string;
  /** Shown while loading and if the image is missing entirely. */
  fallback?: string;
  eager?: boolean;
}

/**
 * Explicit dimensions and a reserved aspect box, so images never cause layout
 * shift while they load.
 */
export function Image({ src, alt, width, height, className, fallback, eager = false }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const url = mediaUrl(src);

  if (!url || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-raised font-mono text-xs text-faint",
          className,
        )}
        style={{ aspectRatio: `${width} / ${height}` }}
        role="img"
        aria-label={alt}
      >
        {fallback ?? ""}
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden bg-raised", className)}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <img
        src={url}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
