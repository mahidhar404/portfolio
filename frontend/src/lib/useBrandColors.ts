import { useEffect } from "react";

import { bestForeground, ensureContrast, parseHex } from "./color";

/** The theme grounds the brand colour has to stay legible against. */
const LIGHT_GROUND = "#f4f6f9";
const DARK_GROUND = "#0b0f15";

/**
 * Deliberately above the 4.5:1 floor. The brand colour is also used as text on
 * tinted `bg-brand/10` chips, whose effective background is lighter (or darker)
 * than the plain ground — the extra headroom keeps those legible too.
 */
const MIN_RATIO = 6;

/**
 * Push the palette chosen in the Django admin into CSS custom properties.
 *
 * Colour is content — changing it should not need a deploy. But a single hex
 * value cannot serve both themes: a blue that reads well on white is unreadable
 * on near-black. So each colour is published as a light and a dark variant, and
 * the stylesheet picks between them. The dark variant is lightened only as far
 * as it needs to be to clear WCAG AA, so it still looks like the chosen colour.
 */
export function useBrandColors(brand: string | undefined, accent: string | undefined): void {
  useEffect(() => {
    const root = document.documentElement;

    const apply = (name: string, value: string | undefined): void => {
      if (!value || !parseHex(value)) return;
      const light = ensureContrast(value, LIGHT_GROUND, MIN_RATIO);
      const dark = ensureContrast(value, DARK_GROUND, MIN_RATIO);
      root.style.setProperty(`--${name}-light`, light);
      root.style.setProperty(`--${name}-dark`, dark);
      // Text placed on top of a filled swatch of this colour.
      root.style.setProperty(`--on-${name}-light`, bestForeground(light));
      root.style.setProperty(`--on-${name}-dark`, bestForeground(dark));
    };

    apply("brand", brand);
    apply("accent", accent);
  }, [brand, accent]);
}
