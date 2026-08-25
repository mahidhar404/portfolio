/**
 * Cold-start insurance.
 *
 * The backend runs on a free tier that sleeps after inactivity and can take the
 * better part of a minute to wake. A recruiter opening the link must never see a
 * spinner, so the Vercel build bakes a snapshot of `/api/v1/portfolio/` into the
 * bundle (see scripts/fetch-fallback.ts). The app renders that immediately and
 * revalidates against the live API in the background.
 *
 * `import.meta.glob` is used rather than a plain import because the snapshot is
 * generated, gitignored, and legitimately absent on a fresh clone — glob resolves
 * to an empty record in that case instead of failing the build.
 */
import type { Portfolio } from "./types";

const modules = import.meta.glob<{ default: unknown }>("./fallback.json", { eager: true });

const snapshot = (modules["./fallback.json"]?.default ?? null) as Portfolio | null;

export const fallbackPortfolio: Portfolio | null = snapshot;

export function hasFallback(): boolean {
  return fallbackPortfolio !== null;
}
