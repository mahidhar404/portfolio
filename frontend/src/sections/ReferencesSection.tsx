import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";

import type { SectionProps } from "./types";

export function ReferencesSection({ data, id, title, eyebrow }: SectionProps) {
  const { t } = useTranslation();
  if (!data.settings.show_references || data.references.length === 0) return null;

  return (
    <Section id={id} title={title} eyebrow={eyebrow}>
      <div className="grid gap-4 md:grid-cols-2">
        {data.references.map((person) => (
          <Card key={person.id} className="print-break-inside-avoid space-y-1.5">
            <h3 className="font-semibold">{person.name}</h3>
            <p className="text-sm text-muted">
              {[person.role, person.company].filter(Boolean).join(" · ")}
            </p>
            {person.relationship ? (
              <p className="text-sm text-faint">{person.relationship}</p>
            ) : null}

            {/* The backend blanks these unless the reference is explicitly public. */}
            {person.email || person.phone ? (
              <p className="space-x-3 pt-1 text-sm">
                {person.email ? (
                  <a href={`mailto:${person.email}`} className="text-brand hover:underline">
                    {person.email}
                  </a>
                ) : null}
                {person.phone ? <span className="tabular text-muted">{person.phone}</span> : null}
              </p>
            ) : (
              <p className="pt-1 text-sm text-faint italic">{t("common.availableOnRequest")}</p>
            )}
          </Card>
        ))}
      </div>
    </Section>
  );
}
