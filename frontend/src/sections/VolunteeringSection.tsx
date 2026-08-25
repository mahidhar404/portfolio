import { useTranslation } from "react-i18next";

import { Section } from "@/components/ui/Section";
import { formatRange } from "@/lib/format";

import type { SectionProps } from "./types";

export function VolunteeringSection({ data, id, title, eyebrow }: SectionProps) {
  const { t, i18n } = useTranslation();
  if (data.volunteering.length === 0) return null;

  return (
    <Section id={id} title={title} eyebrow={eyebrow}>
      <ul className="space-y-6">
        {data.volunteering.map((entry) => (
          <li key={entry.id} className="print-break-inside-avoid border-l-2 border-rule pl-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="font-display text-lg font-semibold">
                {entry.role ? `${entry.role} · ` : ""}
                <span className="font-normal text-muted">{entry.organisation}</span>
              </h3>
              <span className="tabular font-mono text-xs text-faint">
                {formatRange(entry.start_date, entry.end_date, t("common.present"), i18n.language)}
              </span>
            </div>
            {entry.description ? (
              <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-muted">
                {entry.description}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}
