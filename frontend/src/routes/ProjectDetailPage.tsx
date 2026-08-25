import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useProject } from "@/api/hooks";
import { Image } from "@/components/ui/Image";
import { Markdown } from "@/components/ui/Markdown";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tag } from "@/components/ui/Tag";
import { formatRange, mediaUrl } from "@/lib/format";
import { useDocumentHead } from "@/lib/useDocumentHead";

export function ProjectDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const { data: project, isPending, isError } = useProject(slug);

  useDocumentHead({
    title: project ? `${project.title} — ${t("sections.projects")}` : t("common.loading"),
    description: project?.summary,
    image: mediaUrl(project?.cover_image),
    jsonLd: project
      ? {
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: project.title,
          description: project.summary,
          url: project.live_url || undefined,
          codeRepository: project.repo_url || undefined,
        }
      : undefined,
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-5 py-14">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-11 w-3/4" />
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="mx-auto max-w-lg px-5 py-32 text-center">
        <h1 className="font-display text-2xl font-semibold">{t("error.projectMissing")}</h1>
        <Link to="/projects" className="mt-4 inline-block text-brand hover:underline">
          ← {t("common.backToProjects")}
        </Link>
      </div>
    );
  }

  const metrics = Object.entries(project.metrics ?? {});

  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <Link
        to="/projects"
        className="mb-6 inline-block font-mono text-xs tracking-wide text-muted hover:text-ink"
      >
        ← {t("common.backToProjects")}
      </Link>

      <header className="space-y-4">
        <h1 className="font-display text-4xl leading-tight font-semibold tracking-tight text-balance">
          {project.title}
        </h1>
        <p className="text-lg text-muted">{project.summary}</p>

        <div className="tabular flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-faint">
          {project.role ? <span>{project.role}</span> : null}
          <span>
            {formatRange(project.start_date, project.end_date, t("common.present"), i18n.language)}
          </span>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          {project.live_url ? (
            <a
              href={project.live_url}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-brand hover:underline"
            >
              {t("common.liveSite")} →
            </a>
          ) : null}
          {project.repo_url ? (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-muted hover:text-ink hover:underline"
            >
              {t("common.sourceCode")} →
            </a>
          ) : null}
        </div>
      </header>

      {project.cover_image ? (
        <Image
          src={project.cover_image}
          alt={project.title}
          width={1200}
          height={675}
          eager
          className="mt-8 w-full rounded-lg border border-rule"
        />
      ) : null}

      {metrics.length > 0 ? (
        <dl className="mt-8 grid grid-cols-2 gap-4 border-y border-rule py-5 sm:grid-cols-3">
          {metrics.map(([label, value]) => (
            <div key={label}>
              <dt className="font-mono text-[10px] tracking-[0.14em] text-faint uppercase">
                {label}
              </dt>
              <dd className="tabular font-display text-2xl font-semibold text-brand">
                {String(value)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {project.skills.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-1.5">
          {project.skills.map((skill) => (
            <Tag key={skill.id}>{skill.name}</Tag>
          ))}
        </div>
      ) : null}

      {project.description ? (
        <Markdown className="mt-8 text-[1.02rem]">{project.description}</Markdown>
      ) : null}

      {project.case_study ? (
        <Markdown className="mt-8 text-[1.02rem]">{project.case_study}</Markdown>
      ) : null}

      {project.images.length > 0 ? (
        <div className="mt-10 space-y-6">
          {project.images.map((shot) => (
            <figure key={shot.id}>
              <Image
                src={shot.image}
                alt={shot.caption ?? ""}
                width={1200}
                height={750}
                className="w-full rounded-lg border border-rule"
              />
              {shot.caption ? (
                <figcaption className="mt-2 text-center text-sm text-faint">
                  {shot.caption}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      ) : null}
    </article>
  );
}
