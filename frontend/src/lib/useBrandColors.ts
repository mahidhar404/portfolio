import { useEffect } from "react";

/**
 * Push the palette chosen in the Django admin into the CSS custom properties.
 * Colours are content too — they should not require a deploy to change.
 */
export function useBrandColors(brand: string | undefined, accent: string | undefined): void {
  useEffect(() => {
    const root = document.documentElement;
    if (brand && /^#[0-9a-f]{3,8}$/i.test(brand)) root.style.setProperty("--brand", brand);
    if (accent && /^#[0-9a-f]{3,8}$/i.test(accent)) root.style.setProperty("--accent", accent);
  }, [brand, accent]);
}
