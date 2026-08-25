import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/cn";
import { applyTheme, readStoredTheme, type Theme } from "@/lib/theme";

const OPTIONS: Theme[] = ["light", "system", "dark"];

/** Narrow screens get a glyph; the accessible name still comes from aria-label. */
const GLYPH: Record<Theme, string> = { light: "☀", system: "◐", dark: "☾" };

export function ThemeToggle() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div
      role="radiogroup"
      aria-label={t("theme.label")}
      className="no-print flex rounded-full border border-rule bg-surface p-0.5"
    >
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={theme === option}
          onClick={() => setTheme(option)}
          title={t(`theme.${option}`)}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
            theme === option ? "bg-brand text-white" : "text-muted hover:text-ink",
          )}
        >
          <span className="hidden sm:inline">{t(`theme.${option}`)}</span>
          <span aria-hidden="true" className="sm:hidden">
            {GLYPH[option]}
          </span>
        </button>
      ))}
    </div>
  );
}
