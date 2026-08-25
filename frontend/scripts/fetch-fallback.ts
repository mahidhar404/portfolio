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
const TIMEOUT_MS = 90_000; // generous: a cold Render instance can take ~50s

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
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    process.stdout.write(
      `! could not reach the API (${reason}).\n` +
        `  Building without a fresh snapshot — the app will fetch at runtime.\n`,
    );
  } finally {
    clearTimeout(timer);
  }
}

await main();
