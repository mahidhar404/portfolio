import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { server } from "./server";

// The cold-start snapshot is a generated file that may or may not exist on the
// machine running the tests, which would make every test that renders HomePage
// behave differently depending on whether someone had run a build. Tests get no
// snapshot by default; fallback.test.tsx opts back in explicitly.
vi.mock("@/api/fallback", () => ({
  fallbackPortfolio: null,
  hasFallback: () => false,
}));

// jsdom implements neither of these, and several components depend on them.
beforeAll(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );

  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
      root = null;
      rootMargin = "";
      thresholds = [];
    },
  );

  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn();

  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

afterAll(() => {
  server.close();
});
