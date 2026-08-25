import { useState } from "react";
import { useTranslation } from "react-i18next";

import { setLocale, SUPPORTED_LOCALES, type Locale } from "@/i18n";
import { cn } from "@/lib/cn";

export function LocaleToggle() {
  const { i18n } = useTranslation();
  const [current, setCurrent] = useState<Locale>((i18n.language.slice(0, 2) as Locale) ?? "en");

  function choose(locale: Locale): void {
    setCurrent(locale);
    setLocale(locale);
  }

  return (
    <div
      role="radiogroup"
      aria-label="Language"
      className="no-print flex rounded-full border border-rule bg-surface p-0.5"
    >
      {SUPPORTED_LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          role="radio"
          aria-checked={current === locale}
          onClick={() => choose(locale)}
          className={cn(
            "rounded-full px-2.5 py-1 font-mono text-[11px] uppercase transition-colors",
            current === locale ? "bg-brand text-white" : "text-muted hover:text-ink",
          )}
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
