import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { usePortfolio } from "@/api/hooks";
import { Header } from "@/components/Header";
import { SectionSkeleton } from "@/components/ui/Skeleton";
import { useBrandColors } from "@/lib/useBrandColors";
import { HomePage } from "@/routes/HomePage";

// Route-level code splitting: the homepage ships in the initial bundle, the
// rest arrives only if the visitor navigates there.
const ProjectsPage = lazy(() =>
  import("@/routes/ProjectsPage").then((m) => ({ default: m.ProjectsPage })),
);
const ProjectDetailPage = lazy(() =>
  import("@/routes/ProjectDetailPage").then((m) => ({ default: m.ProjectDetailPage })),
);
const ResumePage = lazy(() =>
  import("@/routes/ResumePage").then((m) => ({ default: m.ResumePage })),
);
const NotFoundPage = lazy(() =>
  import("@/routes/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);

/** Anchor links from another route need a scroll once the target exists. */
function useHashScroll(): void {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      return;
    }
    const id = hash.slice(1);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [hash, pathname]);
}

export function App() {
  const { t } = useTranslation();
  const { data } = usePortfolio();
  useHashScroll();
  useBrandColors(data?.settings.primary_color, data?.settings.accent_color);

  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-md bg-brand px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to content
      </a>

      {data ? <Header data={data} /> : null}

      <main id="main">
        <Suspense
          fallback={
            <div className="mx-auto max-w-6xl px-5">
              <SectionSkeleton />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:slug" element={<ProjectDetailPage />} />
            <Route path="/resume" element={<ResumePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      {data ? (
        <footer className="no-print mt-16 border-t border-rule py-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 text-sm text-faint">
            <p>
              © {new Date().getFullYear()} {data.profile.full_name}
            </p>
            <p className="font-mono text-xs">
              {t("nav.resume")} · {data.social_links.map((link) => link.platform).join(" · ")}
            </p>
          </div>
        </footer>
      ) : null}
    </>
  );
}
