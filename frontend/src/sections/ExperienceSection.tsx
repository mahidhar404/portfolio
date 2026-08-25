import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { Image } from "@/components/ui/Image";
import { Markdown } from "@/components/ui/Markdown";
import { Section } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { formatDuration, formatRange, initials } from "@/lib/format";

import type { SectionProps } from "./types";

export function ExperienceSection({ data, id, title, eyebrow }: SectionProps) {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  if (data.experience.length === 0) return null;

  return (
    <Section id={id} title={title} eyebrow={eyebrow}>
      <ol className="relative space-y-8 border-l border-rule pl-6 md:pl-8">
        {data.experience.map((role, index) => (
          <motion.li
            key={role.id}
            className="print-break-inside-avoid relative"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.3) }}
          >
            <span
              aria-hidden="true"
              className="absolute top-2 -left-[27px] size-3 rounded-full border-2 border-canvas bg-brand md:-left-[35px]"
            />

            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="font-display text-xl font-semibold">{role.role}</h3>
              <p className="tabular font-mono text-xs text-muted">
                {formatRange(role.start_date, role.end_date, t("common.present"), i18n.language)}
                {(() => {
                  const duration = formatDuration(role.start_date, role.end_date, {
                    year: t("common.year"),
                    years: t("common.years"),
                    month: t("common.month"),
                    months: t("common.months"),
                  });
                  return duration ? ` · ${duration}` : "";
                })()}
              </p>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              {role.company_logo ? (
                <Image
                  src={role.company_logo}
                  alt=""
                  width={28}
                  height={28}
                  fallback={initials(role.company)}
                  className="size-7 shrink-0 rounded"
                />
              ) : null}
              {role.company_url ? (
                <a
                  href={role.company_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-medium text-ink underline-offset-2 hover:underline"
                >
                  {role.company}
                </a>
              ) : (
                <span className="font-medium text-ink">{role.company}</span>
              )}
              {role.employment_type_display ? <span>· {role.employment_type_display}</span> : null}
              {role.location ? <span>· {role.location}</span> : null}
              {role.is_remote ? <span>· {t("common.remote")}</span> : null}
            </div>

            {role.description ? (
              <Markdown className="mt-3 text-sm">{role.description}</Markdown>
            ) : null}

            {role.highlights.length > 0 ? (
              <ul className="mt-3 ml-5 list-disc space-y-1.5 text-sm text-muted">
                {role.highlights.map((highlight) => (
                  <li key={highlight.id} className="max-w-[70ch]">
                    {highlight.text}
                  </li>
                ))}
              </ul>
            ) : null}

            {role.skills.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {role.skills.map((skill) => (
                  <Tag key={skill.id}>{skill.name}</Tag>
                ))}
              </div>
            ) : null}
          </motion.li>
        ))}
      </ol>
    </Section>
  );
}
