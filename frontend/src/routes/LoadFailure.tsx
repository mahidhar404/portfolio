import { useTranslation } from "react-i18next";

/** Shown when the whole payload could not be fetched and there is no snapshot. */
export function LoadFailure({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-5 py-32 text-center">
      <h1 className="font-display text-2xl font-semibold">{t("error.sectionTitle")}</h1>
      <p className="text-muted">{error.message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand"
      >
        {t("error.retry")}
      </button>
    </div>
  );
}
