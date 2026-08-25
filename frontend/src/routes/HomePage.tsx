import { useTranslation } from "react-i18next";

import { usePortfolio } from "@/api/hooks";
import { isSectionKey } from "@/api/types";
import { Hero } from "@/components/Hero";
import { SectionBoundary } from "@/components/SectionBoundary";
import { SectionSkeleton } from "@/components/ui/Skeleton";
import { mediaUrl } from "@/lib/format";
import { useDocumentHead } from "@/lib/useDocumentHead";
import { SECTION_REGISTRY } from "@/sections";

import { LoadFailure } from "./LoadFailure";

export function HomePage() {
  const { t } = useTranslation();
  const { data, isPending, isError, error, refetch } = usePortfolio();

  useDocumentHead({
    title: data ? `${data.profile.full_name} — ${data.profile.headline}` : t("common.loading"),
    description: data?.settings.meta_description,
    image: mediaUrl(data?.settings.og_image),
    jsonLd: data
      ? {
          "@context": "https://schema.org",
          "@type": "Person",
          name: data.profile.full_name,
          jobTitle: data.profile.headline,
          description: data.settings.meta_description,
          email: data.profile.email || undefined,
          image: mediaUrl(data.profile.photo),
          address: {
            "@type": "PostalAddress",
            addressLocality: data.profile.current_city,
            addressCountry: data.profile.country,
          },
          sameAs: data.social_links.map((link) => link.url),
          knowsLanguage: data.languages.map((language) => language.name),
        }
      : undefined,
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-6xl px-5">
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    );
  }

  if (isError) {
    return <LoadFailure error={error} onRetry={() => void refetch()} />;
  }

  return (
    <div className="mx-auto max-w-6xl px-5">
      <Hero data={data} />

      {data.section_order.filter(isSectionKey).map((key) => {
        const SectionComponent = SECTION_REGISTRY[key];
        const configured = data.settings.sections.find((entry) => entry.key === key);
        const title = configured?.label ?? t(`sections.${key}`, { defaultValue: key });

        return (
          <SectionBoundary key={key} name={key}>
            <SectionComponent
              data={data}
              id={key}
              title={title}
              eyebrow={t(`eyebrow.${key}`, { defaultValue: "" })}
            />
          </SectionBoundary>
        );
      })}
    </div>
  );
}
