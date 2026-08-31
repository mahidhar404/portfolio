import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

/**
 * E2E runs against a production build served by `vite preview`, with the real
 * Django API behind it — the same shape as production, not a mocked stand-in.
 * Start the backend first: `make dev-backend` (or uv run manage.py runserver).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env["CI"] ? 2 : 0,
  workers: process.env["CI"] ? 1 : undefined,
  reporter: process.env["CI"] ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 30_000,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Serves an already-built dist/. Building here instead would hide compiler
    // output behind Playwright's server-start timeout, which is exactly how a
    // slow build looks identical to a hung one. `make e2e` and CI both build first.
    command: `pnpm exec vite preview --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env["CI"],
    stdout: "pipe",
    stderr: "pipe",
    timeout: 120_000,
  },
});
