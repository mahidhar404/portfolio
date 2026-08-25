/**
 * Bake a snapshot of the live API into the bundle at build time.
 *
 * Run automatically before `vite build`. If the API is unreachable — which is
 * exactly what happens when the free-tier backend is asleep — the build still
 * succeeds and simply keeps whatever snapshot is already committed, or none.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const API_URL = process.env["VITE_API_URL"] ?? "http://127.0.0.1:8000";
const OUTPUT = resolve(import.meta.dirname, "../src/api/fallback.json");
const SITEMAP = resolve(import.meta.dirname, "../public/sitemap.xml");
const ROBOTS = resolve(import.meta.dirname, "../public/robots.txt");
const TIMEOUT_MS = 90_000; // generous: a cold Render instance can take ~50s

/**
 * The public origin, for absolute URLs in the sitemap. Vercel sets
 * VERCEL_PROJECT_PRODUCTION_URL on production builds; SITE_URL overrides it if
 * you have a custom domain.
 */
function siteOrigin(): string {
  const explicit = process.env["SITE_URL"];
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env["VERCEL_PROJECT_PRODUCTION_URL"];
  if (vercel) return `https://${vercel}`;
  return "http://localhost:5173";
}

interface ProjectLike {
  slug?: unknown;
}

/** A sitemap of the real routes, including one entry per project. */
async function writeSitemap(payload: unknown): Promise<void> {
  const origin = siteOrigin();
  const today = new Date().toISOString().slice(0, 10);

  const staticPaths = ["/", "/projects", "/resume"];
  const projects = (payload as { projects?: ProjectLike[] } | null)?.projects ?? [];
  const projectPaths = projects
    .map((project) => project.slug)
    .filter((slug): slug is string => typeof slug === "string" && slug.length > 0)
    .map((slug) => `/projects/${slug}`);

  const urls = [...staticPaths, ...projectPaths]
    .map(
      (path) =>
        `  <url>\n    <loc>${origin}${path}</loc>\n` +
        `    <lastmod>${today}</lastmod>\n` +
        `    <changefreq>${path === "/" ? "weekly" : "monthly"}</changefreq>\n` +
        `    <priority>${path === "/" ? "1.0" : "0.7"}</priority>\n  </url>`,
    )
    .join("\n");

  await writeFile(
    SITEMAP,
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    "utf8",
  );

  // robots.txt needs the absolute sitemap URL, which is only known at build time.
  await writeFile(
    ROBOTS,
    `# Recruiters and search engines are the whole audience — let everything in.\n` +
      `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
    "utf8",
  );

  process.stdout.write(
    `✓ sitemap.xml written (${staticPaths.length + projectPaths.length} URLs) for ${origin}\n`,
  );
}

async function main(): Promise<void> {
  const url = `${API_URL.replace(/\/$/, "")}/api/v1/portfolio/`;
  process.stdout.write(`→ fetching build-time snapshot from ${url}\n`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    const data: unknown = await response.json();
    await mkdir(dirname(OUTPUT), { recursive: true });
    await writeFile(OUTPUT, JSON.stringify(data), "utf8");
    process.stdout.write(`✓ snapshot written (${JSON.stringify(data).length} bytes)\n`);
    await writeSitemap(data);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    process.stdout.write(
      `! could not reach the API (${reason}).\n` +
        `  Building without a fresh snapshot — the app will fetch at runtime.\n`,
    );
    // Still emit a sitemap for the static routes so SEO does not depend on the
    // backend being awake at build time.
    await writeSitemap(null);
  } finally {
    clearTimeout(timer);
  }
}

await main();
