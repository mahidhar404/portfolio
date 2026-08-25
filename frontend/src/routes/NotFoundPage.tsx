import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useDocumentHead } from "@/lib/useDocumentHead";

export function NotFoundPage() {
  const { t } = useTranslation();
  useDocumentHead({ title: t("error.pageTitle") });

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-5 py-32 text-center">
      <p className="font-mono text-sm tracking-[0.2em] text-brand">404</p>
      <h1 className="font-display text-3xl font-semibold">{t("error.pageTitle")}</h1>
      <p className="text-muted">{t("error.pageBody")}</p>
      <Link
        to="/"
        className="mt-2 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand"
      >
        {t("error.goHome")}
      </Link>
    </div>
  );
}
