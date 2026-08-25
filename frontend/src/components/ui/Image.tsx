import { useState } from "react";

import { cn } from "@/lib/cn";
import { mediaUrl, responsiveSrcSet } from "@/lib/format";

interface ImageProps {
  src: string | null | undefined;
  alt: string;
  width: number;
  height: number;
  className?: string;
  /** Shown while loading and if the image is missing entirely. */
  fallback?: string;
  /** Load immediately and at high priority — for above-the-fold images only. */
  eager?: boolean;
  /** The `sizes` hint, so the browser can pick the right srcset candidate. */
  sizes?: string;
}

/**
 * Explicit dimensions and a reserved aspect box, so images never cause layout
 * shift while they load.
 */
export function Image({
  src,
  alt,
  width,
  height,
  className,
  fallback,
  eager = false,
  sizes,
}: ImageProps) {
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
        srcSet={responsiveSrcSet(url)}
        sizes={sizes ?? (responsiveSrcSet(url) ? "(max-width: 640px) 100vw, 33vw" : undefined)}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? "eager" : "lazy"}
        // The hero portrait is the LCP element; telling the browser early is
        // worth several hundred milliseconds.
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          "h-full w-full object-cover",
          // Above-the-fold images paint the instant they arrive. Fading them in
          // would gate the Largest Contentful Paint behind a React state update
          // and a CSS transition — measured at 3.7s of render delay before this
          // was removed. Below-the-fold images keep the fade; it costs nothing
          // there because they are never the LCP element.
          eager ? "" : "transition-opacity duration-300",
          eager || loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
