import { useTranslation } from "react-i18next";

import { usePortfolio } from "@/api/hooks";
import { SectionSkeleton } from "@/components/ui/Skeleton";
import { formatFullDate, formatRange, formatYear, mediaUrl } from "@/lib/format";
import { useDocumentHead } from "@/lib/useDocumentHead";

import { LoadFailure } from "./LoadFailure";

/**
 * A dense, single-column CV built for paper.
 *
 * Deliberately plainer than the rest of the site: no cards, no animation, tight
 * leading, and `@media print` rules in index.css strip the chrome entirely.
 */
export function ResumePage() {
  const { t, i18n } = useTranslation();
  const { data, isPending, isError, error, refetch } = usePortfolio();

  useDocumentHead({
    title: data ? `${t("resume.title")} — ${data.profile.full_name}` : t("common.loading"),
    description: data?.settings.meta_description,
  });

  if (isPending) return <SectionSkeleton />;
  if (isError) return <LoadFailure error={error} onRetry={() => void refetch()} />;

  const { profile, settings } = data;
  const resumeFile = i18n.language.startsWith("de")
    ? (profile.resume_pdf_de ?? profile.resume_pdf_en)
    : (profile.resume_pdf_en ?? profile.resume_pdf_de);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 print:px-0 print:py-0">
      <div className="no-print mb-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
        >
          {t("resume.print")}
        </button>
        {resumeFile ? (
          <a
            href={mediaUrl(resumeFile)}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-md border border-rule px-4 py-2 text-sm text-muted hover:text-ink"
          >
            {t("common.downloadResume")}
          </a>
        ) : null}
      </div>

      <header className="border-b border-rule pb-4">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{profile.full_name}</h1>
        {profile.headline ? <p className="mt-1 text-muted">{profile.headline}</p> : null}
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          {profile.email ? <span>{profile.email}</span> : null}
          {profile.phone ? <span className="tabular">{profile.phone}</span> : null}
          {profile.current_city ? (
            <span>{[profile.current_city, profile.country].filter(Boolean).join(", ")}</span>
          ) : null}
          {data.social_links.map((link) => (
            <span key={link.id}>{link.url.replace(/^https?:\/\//, "")}</span>
          ))}
        </p>
      </header>

      {settings.show_personal_details ? (
        <ResumeBlock title={t("resume.personalDetails")}>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            {(
              [
                ["Date of birth", formatFullDate(profile.date_of_birth, i18n.language)],
                ["Place of birth", profile.place_of_birth],
                ["Nationality", profile.nationality],
                ["Marital status", profile.marital_status],
              ] as const
            )
              .filter(([, value]) => Boolean(value))
              .map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <dt className="text-faint">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
        </ResumeBlock>
      ) : null}

      {profile.summary_short ? (
        <ResumeBlock title={t("sections.about")}>
          <p className="text-sm leading-relaxed text-muted">{profile.summary_short}</p>
        </ResumeBlock>
      ) : null}

      {data.experience.length > 0 ? (
        <ResumeBlock title={t("sections.experience")}>
          <div className="space-y-4">
            {data.experience.map((role) => (
              <div key={role.id} className="print-break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <h3 className="font-semibold">
                    {role.role} <span className="font-normal text-muted">· {role.company}</span>
                  </h3>
                  <span className="tabular font-mono text-xs text-faint">
                    {formatRange(
                      role.start_date,
                      role.end_date,
                      t("common.present"),
                      i18n.language,
                    )}
                  </span>
                </div>
                {role.location ? (
                  <p className="text-xs text-faint">
                    {role.location}
                    {role.is_remote ? ` · ${t("common.remote")}` : ""}
                  </p>
                ) : null}
                {role.highlights.length > 0 ? (
                  <ul className="mt-1.5 ml-4 list-disc space-y-1 text-sm text-muted">
                    {role.highlights.map((highlight) => (
                      <li key={highlight.id}>{highlight.text}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </ResumeBlock>
      ) : null}

      {data.education.length > 0 ? (
        <ResumeBlock title={t("sections.education")}>
          <div className="space-y-3">
            {data.education.map((entry) => (
              <div key={entry.id} className="print-break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <h3 className="font-semibold">
                    {entry.degree}{" "}
                    <span className="font-normal text-muted">· {entry.institution}</span>
                  </h3>
                  <span className="tabular font-mono text-xs text-faint">
                    {formatRange(
                      entry.start_date,
                      entry.end_date,
                      t("common.present"),
                      i18n.language,
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted">
                  {[
                    entry.field_of_study,
                    entry.grade_value
                      ? `${t("common.grade")} ${entry.grade_value}${
                          entry.grade_scale_display ? ` (${entry.grade_scale_display})` : ""
                        }`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {entry.thesis_title ? (
                  <p className="text-sm text-faint">
                    {t("common.thesis")}: {entry.thesis_title}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </ResumeBlock>
      ) : null}

      {data.skill_categories.length > 0 ? (
        <ResumeBlock title={t("sections.skills")}>
          <dl className="space-y-1.5 text-sm">
            {data.skill_categories.map((category) => (
              <div key={category.id} className="flex gap-3">
                <dt className="w-40 shrink-0 font-medium">{category.name}</dt>
                <dd className="text-muted">
                  {category.skills.map((skill) => skill.name).join(", ")}
                </dd>
              </div>
            ))}
          </dl>
        </ResumeBlock>
      ) : null}

      {data.languages.length > 0 ? (
        <ResumeBlock title={t("sections.languages")}>
          <p className="text-sm text-muted">
            {data.languages
              .map((language) => `${language.name} (${language.level_display})`)
              .join(" · ")}
          </p>
        </ResumeBlock>
      ) : null}

      {data.certifications.length > 0 ? (
        <ResumeBlock title={t("sections.certifications")}>
          <ul className="space-y-1 text-sm text-muted">
            {data.certifications.map((cert) => (
              <li key={cert.id} className="flex justify-between gap-4">
                <span>
                  {cert.name} <span className="text-faint">· {cert.issuer}</span>
                </span>
                <span className="tabular font-mono text-xs text-faint">
                  {formatYear(cert.issue_date)}
                </span>
              </li>
            ))}
          </ul>
        </ResumeBlock>
      ) : null}

      {data.publications.length > 0 ? (
        <ResumeBlock title={t("sections.publications")}>
          <ul className="space-y-1.5 text-sm text-muted">
            {data.publications.map((paper) => (
              <li key={paper.id}>
                {paper.title}
                {paper.venue ? <span className="text-faint"> · {paper.venue}</span> : null}
                {paper.date ? (
                  <span className="tabular text-faint"> · {formatYear(paper.date)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </ResumeBlock>
      ) : null}

      {data.awards.length > 0 ? (
        <ResumeBlock title={t("sections.awards")}>
          <ul className="space-y-1 text-sm text-muted">
            {data.awards.map((award) => (
              <li key={award.id} className="flex justify-between gap-4">
                <span>
                  {award.title}
                  {award.issuer ? <span className="text-faint"> · {award.issuer}</span> : null}
                </span>
                <span className="tabular font-mono text-xs text-faint">
                  {formatYear(award.date)}
                </span>
              </li>
            ))}
          </ul>
        </ResumeBlock>
      ) : null}

      {settings.show_hobbies && data.interests.length > 0 ? (
        <ResumeBlock title={t("sections.interests")}>
          <p className="text-sm text-muted">
            {data.interests.map((interest) => interest.name).join(" · ")}
          </p>
        </ResumeBlock>
      ) : null}
    </div>
  );
}

function ResumeBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="print-break-inside-avoid mt-6">
      <h2 className="mb-2 border-b border-rule pb-1 font-mono text-[11px] tracking-[0.14em] text-brand uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}
