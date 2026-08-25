import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ErrorBoundary } from "./ErrorBoundary";

/** Section-scoped failure notice — deliberately small and non-alarming. */
export function SectionBoundary({ children, name }: { children: ReactNode; name: string }) {
  const { t } = useTranslation();
  return (
    <ErrorBoundary
      resetKey={name}
      fallback={(_error, reset) => (
        <div className="my-8 rounded-lg border border-rule bg-surface p-5">
          <p className="font-medium text-ink">{t("error.sectionTitle")}</p>
          <p className="mt-1 text-sm text-muted">{t("error.sectionBody")}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-3 text-sm font-medium text-brand hover:underline"
          >
            {t("error.retry")}
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
