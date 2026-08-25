/**
 * Theme handling.
 *
 * Three states, matching how the OS works: "light", "dark", and "system".
 * The choice is applied to <html data-theme> before React mounts (see the inline
 * script in index.html) so there is never a flash of the wrong theme.
 */
export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "portfolio-theme";

export function readStoredTheme(): Theme {
  if (typeof localStorage === "undefined") return "system";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
  try {
    if (theme === "system") {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  } catch {
    /* private browsing — the theme still applies for this page view */
  }
}

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof matchMedia === "undefined") return "light";
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
