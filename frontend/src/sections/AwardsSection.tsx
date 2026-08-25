import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { formatMonthYear } from "@/lib/format";

import type { SectionProps } from "./types";

export function AwardsSection({ data, id, title, eyebrow }: SectionProps) {
  const { i18n } = useTranslation();
  if (data.awards.length === 0) return null;

  return (
    <Section id={id} title={title} eyebrow={eyebrow}>
      <div className="grid gap-4 md:grid-cols-2">
        {data.awards.map((award) => (
          <Card key={award.id} className="print-break-inside-avoid space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-lg leading-snug font-semibold">{award.title}</h3>
              <span className="tabular shrink-0 font-mono text-xs text-faint">
                {formatMonthYear(award.date, i18n.language)}
              </span>
            </div>
            {award.issuer ? <p className="text-sm text-muted">{award.issuer}</p> : null}
            {award.description ? (
              <p className="text-sm leading-relaxed text-muted">{award.description}</p>
            ) : null}
          </Card>
        ))}
      </div>
    </Section>
  );
}
