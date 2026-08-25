import { lazy, Suspense } from "react";

import { cn } from "@/lib/cn";

const MarkdownRenderer = lazy(() => import("./MarkdownRenderer"));

/**
 * Markdown from the database.
 *
 * While the renderer loads, the raw text is shown with `white-space: pre-line`.
 * That is deliberate: prose stays readable and the box keeps roughly its final
 * height, so swapping in the rendered version causes no visible layout jump.
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("space-y-3 leading-relaxed text-muted", className)}>
      <Suspense
        fallback={<div className="max-w-[68ch] whitespace-pre-line">{children}</div>}
      >
        <MarkdownRenderer>{children}</MarkdownRenderer>
      </Suspense>
    </div>
  );
}
