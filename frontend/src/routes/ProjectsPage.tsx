import { useTranslation } from "react-i18next";

import { usePortfolio } from "@/api/hooks";
import { ProjectCard } from "@/components/ProjectCard";
import { SectionSkeleton } from "@/components/ui/Skeleton";
import { useDocumentHead } from "@/lib/useDocumentHead";

import { LoadFailure } from "./LoadFailure";

export function ProjectsPage() {
  const { t } = useTranslation();
  const { data, isPending, isError, error, refetch } = usePortfolio();

  useDocumentHead({
    title: data ? `${t("sections.projects")} — ${data.profile.full_name}` : t("common.loading"),
    description: data?.settings.meta_description,
  });

  if (isPending) return <SectionSkeleton />;
  if (isError) return <LoadFailure error={error} onRetry={() => void refetch()} />;

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="font-display mb-8 text-4xl font-semibold tracking-tight">
        {t("sections.projects")}
      </h1>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data.projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} eager={index < 3} />
        ))}
      </div>
    </div>
  );
}
