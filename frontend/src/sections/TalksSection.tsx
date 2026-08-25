import { useTranslation } from "react-i18next";

import { Section } from "@/components/ui/Section";
import { formatMonthYear } from "@/lib/format";

import type { SectionProps } from "./types";

export function TalksSection({ data, id, title, eyebrow }: SectionProps) {
  const { t, i18n } = useTranslation();
  if (data.talks.length === 0) return null;

  return (
    <Section id={id} title={title} eyebrow={eyebrow}>
      <ul className="divide-y divide-rule border-y border-rule">
        {data.talks.map((talk) => (
          <li
            key={talk.id}
            className="print-break-inside-avoid flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4"
          >
            <div className="min-w-0">
              <h3 className="font-medium">{talk.title}</h3>
              <p className="text-sm text-muted">
                {[talk.event, formatMonthYear(talk.date, i18n.language)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              {talk.url ? (
                <a
                  href={talk.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-brand hover:underline"
                >
                  {t("common.watch")}
                </a>
              ) : null}
              {talk.slides_url ? (
                <a
                  href={talk.slides_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-muted hover:text-ink hover:underline"
                >
                  {t("common.slides")}
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
