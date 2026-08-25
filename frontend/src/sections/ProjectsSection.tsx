import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ProjectCard } from "@/components/ProjectCard";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/cn";

import type { SectionProps } from "./types";

export function ProjectsSection({ data, id, title, eyebrow }: SectionProps) {
  const { t } = useTranslation();
  const [activeTag, setActiveTag] = useState<string | null>(null);

  /** Every tech that appears on at least one project, most-used first. */
  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of data.projects) {
      for (const skill of project.skills) {
        counts.set(skill.name, (counts.get(skill.name) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name]) => name);
  }, [data.projects]);

  const visible = useMemo(
    () =>
      activeTag === null
        ? data.projects
        : data.projects.filter((project) =>
            project.skills.some((skill) => skill.name === activeTag),
          ),
    [data.projects, activeTag],
  );

  if (data.projects.length === 0) return null;

  return (
    <Section id={id} title={title} eyebrow={eyebrow}>
      {tags.length > 1 ? (
        <div
          className="no-print mb-6 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter projects by technology"
        >
          <FilterButton active={activeTag === null} onClick={() => setActiveTag(null)}>
            {t("common.all")}
          </FilterButton>
          {tags.map((tag) => (
            <FilterButton
              key={tag}
              active={activeTag === tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              {tag}
            </FilterButton>
          ))}
        </div>
      ) : null}

      <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((project, index) => (
            <ProjectCard key={project.id} project={project} eager={index < 3} />
          ))}
        </AnimatePresence>
      </motion.div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-muted">{t("palette.empty")}</p>
      ) : null}
    </Section>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 font-mono text-[11px] tracking-wide transition-colors",
        active
          ? "border-brand bg-brand text-white"
          : "border-rule bg-surface text-muted hover:border-brand hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
