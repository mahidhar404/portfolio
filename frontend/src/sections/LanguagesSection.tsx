import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/cn";

import type { SectionProps } from "./types";

/** CEFR ladder. "native" sits above C2. */
const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2", "native"] as const;

function CefrScale({ level, name }: { level: string; name: string }) {
  const index = CEFR_ORDER.indexOf(level as (typeof CEFR_ORDER)[number]);
  return (
    <div
      className="flex gap-1"
      role="img"
      aria-label={`${name}: level ${level} of ${CEFR_ORDER.length} on the CEFR scale`}
    >
      {CEFR_ORDER.map((step, stepIndex) => (
        <span
          key={step}
          aria-hidden="true"
          className={cn(
            "flex h-6 w-8 items-center justify-center rounded border font-mono text-[10px]",
            stepIndex <= index
              ? "border-brand bg-brand/12 text-brand"
              : "border-rule bg-raised text-faint",
          )}
        >
          {step === "native" ? "N" : step}
        </span>
      ))}
    </div>
  );
}

export function LanguagesSection({ data, id, title, eyebrow }: SectionProps) {
  if (data.languages.length === 0) return null;

  return (
    <Section id={id} title={title} eyebrow={eyebrow}>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data.languages.map((language) => (
          <li key={language.id} className="print-break-inside-avoid space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-semibold">{language.name}</h3>
              <span className="font-mono text-xs text-muted">{language.level_display}</span>
            </div>
            <CefrScale level={language.level} name={language.name} />
            {language.notes ? <p className="text-sm text-faint">{language.notes}</p> : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}
