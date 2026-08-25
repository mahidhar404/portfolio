import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import type { Portfolio } from "@/api/types";
import { CommandPalette } from "@/components/CommandPalette";
import { LocaleToggle } from "@/components/LocaleToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/cn";
import { useScrollSpy } from "@/lib/useScrollSpy";

export function Header({ data }: { data: Portfolio }) {
  const { t } = useTranslation();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const onHome = location.pathname === "/";
  const active = useScrollSpy(onHome ? data.section_order : []);

  return (
    <header className="no-print sticky top-0 z-40 border-b border-rule bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3 lg:flex-nowrap">
        <Link
          to="/"
          className="font-display min-w-0 truncate text-base font-semibold tracking-tight"
        >
          {data.settings.site_title}
        </Link>

        <nav aria-label={t("nav.menu")} className="hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {data.section_order.slice(0, 7).map((key) => (
              <li key={key}>
                <a
                  href={onHome ? `#${key}` : `/#${key}`}
                  aria-current={active === key ? "location" : undefined}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-sm transition-colors",
                    active === key && onHome
                      ? "bg-brand/10 font-medium text-brand"
                      : "text-muted hover:text-ink",
                  )}
                >
                  {t(`sections.${key}`, { defaultValue: key })}
                </a>
              </li>
            ))}
            <li>
              <Link
                to="/resume"
                className="rounded-md px-2.5 py-1.5 text-sm text-muted transition-colors hover:text-ink"
              >
                {t("nav.resume")}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex min-w-0 shrink items-center gap-1.5 sm:gap-2">
          <CommandPalette data={data} />
          <LocaleToggle />
          <ThemeToggle />
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-md border border-rule px-2.5 py-1.5 text-xs text-muted lg:hidden"
          >
            {t("nav.menu")}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav id="mobile-nav" aria-label={t("nav.menu")} className="border-t border-rule lg:hidden">
          <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-1 px-5 py-3 sm:grid-cols-3">
            {data.section_order.map((key) => (
              <li key={key}>
                <a
                  href={onHome ? `#${key}` : `/#${key}`}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-md px-2 py-1.5 text-sm text-muted hover:text-ink"
                >
                  {t(`sections.${key}`, { defaultValue: key })}
                </a>
              </li>
            ))}
            <li>
              <Link
                to="/resume"
                onClick={() => setMenuOpen(false)}
                className="block rounded-md px-2 py-1.5 text-sm text-muted hover:text-ink"
              >
                {t("nav.resume")}
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
