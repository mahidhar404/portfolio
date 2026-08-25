/**
 * The cold-start path.
 *
 * When Vercel bakes a snapshot into the bundle, the page must paint from it
 * immediately — no spinner — and then quietly replace it with live data.
 */
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makePortfolio } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/server";

const SNAPSHOT = makePortfolio({
  profile: { full_name: "Snapshot Person", headline: "From the build" },
});

vi.mock("@/api/fallback", () => ({
  get fallbackPortfolio() {
    return SNAPSHOT;
  },
  hasFallback: () => true,
}));

describe("cold-start fallback", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("paints from the snapshot before the API has answered", async () => {
    // A slow backend, exactly like a Render instance waking from sleep.
    server.use(
      http.get("*/api/v1/portfolio/", async () => {
        await delay(3000);
        return HttpResponse.json(makePortfolio());
      }),
    );

    const { HomePage } = await import("@/routes/HomePage");
    renderWithProviders(<HomePage />);

    // Synchronously present — no waitFor, because there is nothing to wait for.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Snapshot Person");
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });

  it("replaces the snapshot with live content once it arrives", async () => {
    server.use(
      http.get("*/api/v1/portfolio/", () =>
        HttpResponse.json(
          makePortfolio({ profile: { full_name: "Live Person", headline: "From the API" } }),
        ),
      ),
    );

    const { HomePage } = await import("@/routes/HomePage");
    renderWithProviders(<HomePage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Snapshot Person");
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Live Person"),
    );
  });

  it("keeps showing the snapshot when the API is unreachable", async () => {
    server.use(http.get("*/api/v1/portfolio/", () => HttpResponse.error()));

    const { HomePage } = await import("@/routes/HomePage");
    renderWithProviders(<HomePage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Snapshot Person");
    // A failed revalidation must never blank a page that already has content.
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Snapshot Person");
  });
});
