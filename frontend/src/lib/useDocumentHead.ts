import { useEffect } from "react";

interface HeadOptions {
  title: string;
  description?: string | undefined;
  image?: string | undefined;
  url?: string | undefined;
  /** JSON-LD structured data, serialised into a script tag. */
  jsonLd?: Record<string, unknown> | undefined;
}

function setMeta(selector: string, attribute: string, value: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    const [key, val] = selector.replace(/^meta\[|\]$/g, "").split("=");
    if (key && val) element.setAttribute(key, val.replace(/["']/g, ""));
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, value);
}

/**
 * Per-route document head: title, description, Open Graph, and JSON-LD.
 *
 * Written directly against the DOM rather than via a helmet library — this is
 * the only place the app touches <head>, and it keeps a dependency out of the
 * bundle for the sake of about thirty lines.
 */
export function useDocumentHead({ title, description, image, url, jsonLd }: HeadOptions): void {
  useEffect(() => {
    document.title = title;

    if (description) {
      setMeta('meta[name="description"]', "content", description);
      setMeta('meta[property="og:description"]', "content", description);
      setMeta('meta[name="twitter:description"]', "content", description);
    }
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta('meta[name="twitter:card"]', "content", image ? "summary_large_image" : "summary");
    if (image) {
      setMeta('meta[property="og:image"]', "content", image);
      setMeta('meta[name="twitter:image"]', "content", image);
    }

    const canonicalUrl = url ?? window.location.href;
    setMeta('meta[property="og:url"]', "content", canonicalUrl);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    let script = document.head.querySelector<HTMLScriptElement>("#structured-data");
    if (jsonLd) {
      if (!script) {
        script = document.createElement("script");
        script.id = "structured-data";
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }
  }, [title, description, image, url, jsonLd]);
}
