import { useEffect, useState } from "react";

/**
 * Track which section is currently in view.
 *
 * Uses IntersectionObserver rather than scroll maths so it stays cheap and
 * doesn't fight the browser's own smooth scrolling.
 */
export function useScrollSpy(ids: string[], offset = "-20% 0px -70% 0px"): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);

  useEffect(() => {
    if (ids.length === 0 || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: offset, threshold: 0 },
    );

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [ids, offset]);

  return active;
}
