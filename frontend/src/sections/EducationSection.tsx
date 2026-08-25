import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/Card";
import { Image } from "@/components/ui/Image";
import { Markdown } from "@/components/ui/Markdown";
import { Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { formatRange, initials } from "@/lib/format";

import type { SectionProps } from "./types";

export function EducationSection({ data, id, title, eyebrow }: SectionProps) {
  const { t, i18n } = useTranslation();
  if (data.education.length === 0) return null;

  return (
    <Section id={id} title={title} eyebrow={eyebrow}>
      <div className="grid gap-4 md:grid-cols-2">
        {data.education.map((entry) => (
          <Card key={entry.id} className="print-break-inside-avoid flex flex-col gap-3">
            <div className="flex items-start gap-3">
              {entry.logo ? (
                <Image
                  src={entry.logo}
                  alt=""
                  width={40}
                  height={40}
                  fallback={initials(entry.institution)}
                  className="size-10 shrink-0 rounded"
                />
              ) : null}
              <div className="min-w-0">
                <h3 className="font-display text-lg leading-snug font-semibold">{entry.degree}</h3>
                <p className="text-sm text-muted">{entry.institution}</p>
              </div>
            </div>

            <p className="tabular font-mono text-xs text-faint">
              {formatRange(entry.start_date, entry.end_date, t("common.present"), i18n.language)}
              {entry.location ? ` · ${entry.location}` : ""}
            </p>

            {entry.field_of_study ? (
              <p className="text-sm text-muted">{entry.field_of_study}</p>
            ) : null}

            {entry.grade_value ? (
              <p className="text-sm">
                <span className="text-faint">{t("common.grade")}: </span>
                <span className="tabular font-medium text-ink">{entry.grade_value}</span>
                {entry.grade_scale_display ? (
                  <span className="text-faint"> ({entry.grade_scale_display})</span>
                ) : null}
              </p>
            ) : null}

            {entry.thesis_title ? (
              <p className="text-sm">
                <span className="text-faint">{t("common.thesis")}: </span>
                {entry.thesis_url ? (
                  <a
                    href={entry.thesis_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-brand underline underline-offset-2"
                  >
                    {entry.thesis_title}
                  </a>
                ) : (
                  <span className="text-ink">{entry.thesis_title}</span>
                )}
              </p>
            ) : null}

            {entry.description ? (
              <Markdown className="text-sm">{entry.description}</Markdown>
            ) : null}

            {entry.coursework && entry.coursework.length > 0 ? (
              <div>
                <p className="mb-1.5 font-mono text-[11px] tracking-[0.12em] text-faint uppercase">
                  {t("common.coursework")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {entry.coursework.map((course) => (
                    <Tag key={course}>{course}</Tag>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </Section>
  );
}
