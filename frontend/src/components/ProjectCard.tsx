import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import type { ProjectList } from "@/api/types";
import { Image } from "@/components/ui/Image";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";

export function ProjectCard({ project, eager = false }: { project: ProjectList; eager?: boolean }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const metrics = Object.entries(project.metrics ?? {}).slice(0, 3);

  return (
    <motion.article
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-rule bg-surface",
        "shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)]",
      )}
    >
      {/* The cover is a convenience target for pointer users. The heading below
          links to the same place, so this one is hidden from assistive tech and
          removed from the tab order rather than duplicating the link. */}
      <Link
        to={`/projects/${project.slug}`}
        aria-hidden="true"
        tabIndex={-1}
        className="block focus-visible:outline-offset-[-2px]"
      >
        <Image
          src={project.cover_image}
          alt=""
          width={1200}
          height={675}
          eager={eager}
          fallback={project.title}
          className="w-full"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg leading-snug font-semibold">
            <Link
              to={`/projects/${project.slug}`}
              className="underline-offset-4 group-hover:underline"
            >
              {project.title}
            </Link>
          </h3>
          {project.is_featured ? (
            <Tag active className="shrink-0">
              {t("common.featured")}
            </Tag>
          ) : null}
        </div>

        <p className="text-sm leading-relaxed text-muted">{project.summary}</p>

        {metrics.length > 0 ? (
          <dl className="flex flex-wrap gap-x-5 gap-y-1 border-t border-rule pt-3">
            {metrics.map(([label, value]) => (
              <div key={label}>
                <dt className="font-mono text-[10px] tracking-[0.12em] text-faint uppercase">
                  {label}
                </dt>
                <dd className="tabular text-sm font-semibold text-brand">{String(value)}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {project.skills.length > 0 ? (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {project.skills.slice(0, 5).map((skill) => (
              <Tag key={skill.id}>{skill.name}</Tag>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-4 pt-1 text-sm">
          <Link to={`/projects/${project.slug}`} className="font-medium text-brand hover:underline">
            {t("common.viewCaseStudy")} →
          </Link>
          {project.repo_url ? (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-muted hover:text-ink hover:underline"
            >
              {t("common.sourceCode")}
            </a>
          ) : null}
          {project.live_url ? (
            <a
              href={project.live_url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-muted hover:text-ink hover:underline"
            >
              {t("common.liveSite")}
            </a>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
