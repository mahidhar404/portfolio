import { motion, useReducedMotion } from "framer-motion";

import { Section } from "@/components/ui/Section";

import type { SectionProps } from "./types";

/** Proficiency 1–5 rendered as a five-segment meter — readable without colour. */
function ProficiencyMeter({ value, label }: { value: number; label: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <span className="inline-flex gap-[3px]" role="img" aria-label={`${label}: ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((step) => (
        <motion.span
          key={step}
          aria-hidden="true"
          className={
            step <= value ? "h-1.5 w-4 rounded-full bg-brand" : "h-1.5 w-4 rounded-full bg-rule"
          }
          initial={reduceMotion ? false : { scaleX: 0, originX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: step * 0.04 }}
        />
      ))}
    </span>
  );
}

export function SkillsSection({ data, id, title, eyebrow }: SectionProps) {
  const categories = data.skill_categories.filter((category) => category.skills.length > 0);
  if (categories.length === 0) return null;

  return (
    <Section id={id} title={title} eyebrow={eyebrow}>
      <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div key={category.id} className="print-break-inside-avoid">
            <h3 className="mb-3 font-mono text-[11px] tracking-[0.14em] text-brand uppercase">
              {category.name}
            </h3>
            <ul className="space-y-2">
              {category.skills.map((skill) => (
                <li key={skill.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-ink">{skill.name}</span>
                  <ProficiencyMeter value={skill.proficiency} label={skill.name} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
