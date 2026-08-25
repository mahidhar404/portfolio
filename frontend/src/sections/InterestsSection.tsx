import { Section } from "@/components/ui/Section";

import type { SectionProps } from "./types";

export function InterestsSection({ data, id, title, eyebrow }: SectionProps) {
  if (!data.settings.show_hobbies || data.interests.length === 0) return null;

  return (
    <Section id={id} title={title} eyebrow={eyebrow}>
      <ul className="flex flex-wrap gap-2.5">
        {data.interests.map((interest) => (
          <li
            key={interest.id}
            className="rounded-full border border-rule bg-surface px-4 py-1.5 text-sm text-muted"
          >
            {interest.name}
          </li>
        ))}
      </ul>
    </Section>
  );
}
