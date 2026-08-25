import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface SectionProps {
  id: string;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}

/** The shared wrapper every resume section renders inside. */
export function Section({ id, title, eyebrow, children, className }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn("scroll-mt-24 py-14 md:py-20", className)}
    >
      <header className="mb-8 flex flex-col gap-2">
        {eyebrow ? (
          <p className="font-mono text-[11px] tracking-[0.16em] text-brand uppercase">{eyebrow}</p>
        ) : null}
        <h2
          id={`${id}-heading`}
          className="font-display text-3xl leading-tight font-semibold tracking-tight text-balance md:text-4xl"
        >
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}
