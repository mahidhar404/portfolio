import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function Tag({
  children,
  active = false,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] tracking-wide",
        active ? "border-brand bg-brand/10 text-brand" : "border-rule bg-raised text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
