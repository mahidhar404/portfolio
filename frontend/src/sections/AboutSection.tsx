import { useTranslation } from "react-i18next";

import type { Portfolio } from "@/api/types";
import { Markdown } from "@/components/ui/Markdown";
import { Section } from "@/components/ui/Section";
import { formatFullDate } from "@/lib/format";

import type { SectionProps } from "./types";

export function AboutSection({ data, id, title, eyebrow }: SectionProps) {
  const { profile, settings } = data;
  const body = profile.summary_long || profile.summary_short || "";

  if (!body && !settings.show_personal_details) return null;

  // The portrait lives in the hero; repeating it here would just be noise.
  return (
    <Section id={id} title={title} eyebrow={eyebrow}>
      {body ? <Markdown className="text-[1.02rem]">{body}</Markdown> : null}
      {settings.show_personal_details ? <PersonalDetails profile={profile} /> : null}
    </Section>
  );
}

/** The German-CV personal-details block. Only rendered when the flag is on. */
function PersonalDetails({ profile }: { profile: Portfolio["profile"] }) {
  const { t, i18n } = useTranslation();
  const rows: Array<[string, string | null | undefined]> = [
    ["Date of birth", formatFullDate(profile.date_of_birth, i18n.language)],
    ["Place of birth", profile.place_of_birth],
    ["Nationality", profile.nationality],
    ["Marital status", profile.marital_status],
    ["Work authorisation", profile.work_authorisation],
  ];
  const present = rows.filter(([, value]) => Boolean(value));
  if (present.length === 0) return null;

  return (
    <div className="mt-6 rounded-lg border border-rule bg-surface p-5">
      <h3 className="mb-3 font-mono text-[11px] tracking-[0.14em] text-brand uppercase">
        {t("resume.personalDetails")}
      </h3>
      <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
        {present.map(([label, value]) => (
          <div key={label} className="flex gap-2">
            <dt className="text-faint">{label}</dt>
            <dd className="text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
