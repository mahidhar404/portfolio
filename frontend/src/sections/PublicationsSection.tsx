import { useTranslation } from "react-i18next";

import { Section } from "@/components/ui/Section";
import { formatYear } from "@/lib/format";

import type { SectionProps } from "./types";

export function PublicationsSection({ data, id, title, eyebrow }: SectionProps) {
  const { t } = useTranslation();
  if (data.publications.length === 0) return null;

  return (
    <Section id={id} title={title} eyebrow={eyebrow}>
      <ol className="space-y-6">
        {data.publications.map((paper) => (
          <li
            key={paper.id}
            className="print-break-inside-avoid border-l-2 border-rule pl-5 hover:border-brand"
          >
            <h3 className="font-display text-lg leading-snug font-semibold">{paper.title}</h3>
            {paper.authors ? <p className="mt-1 text-sm text-muted">{paper.authors}</p> : null}
            <p className="tabular mt-1 font-mono text-xs text-faint">
              {[paper.venue, formatYear(paper.date)].filter(Boolean).join(" · ")}
            </p>
            {paper.abstract ? (
              <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-muted">
                {paper.abstract}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              {paper.url ? (
                <a
                  href={paper.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-brand hover:underline"
                >
                  {t("common.readPaper")} →
                </a>
              ) : null}
              {paper.doi ? (
                <span className="font-mono text-xs text-faint">DOI: {paper.doi}</span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
