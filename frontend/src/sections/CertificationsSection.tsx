import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/Card";
import { Image } from "@/components/ui/Image";
import { Section } from "@/components/ui/Section";
import { formatMonthYear, initials } from "@/lib/format";

import type { SectionProps } from "./types";

export function CertificationsSection({ data, id, title, eyebrow }: SectionProps) {
  const { t, i18n } = useTranslation();
  if (data.certifications.length === 0) return null;

  return (
    <Section id={id} title={title} eyebrow={eyebrow}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.certifications.map((cert) => (
          <Card key={cert.id} className="print-break-inside-avoid flex gap-3">
            {cert.issuer_logo ? (
              <Image
                src={cert.issuer_logo}
                alt=""
                width={40}
                height={40}
                fallback={initials(cert.issuer)}
                className="size-10 shrink-0 rounded"
              />
            ) : null}
            <div className="min-w-0 space-y-1">
              <h3 className="leading-snug font-semibold">{cert.name}</h3>
              <p className="text-sm text-muted">{cert.issuer}</p>
              <p className="tabular font-mono text-[11px] text-faint">
                {formatMonthYear(cert.issue_date, i18n.language)}
                {cert.expiry_date
                  ? ` · ${t("common.expiresOn")} ${formatMonthYear(cert.expiry_date, i18n.language)}`
                  : ""}
              </p>
              {cert.credential_url ? (
                <a
                  href={cert.credential_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-block text-sm text-brand hover:underline"
                >
                  {t("common.credential")} →
                </a>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}
