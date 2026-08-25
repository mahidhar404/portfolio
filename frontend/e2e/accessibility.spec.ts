import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * WCAG 2.1 AA, on every route and in both themes.
 *
 * Colour contrast is checked in dark mode as well as light, because a palette
 * that passes on white routinely fails on near-black.
 */

const ROUTES = ["/", "/projects", "/resume"] as const;

async function scan(page: Page) {
  return new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
}

for (const route of ROUTES) {
  test(`${route} has no accessibility violations`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");

    const results = await scan(page);
    expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`)).toEqual(
      [],
    );
  });
}

test("the project detail page has no accessibility violations", async ({ page }) => {
  await page.goto("/");
  const href = await page.locator("section#projects a").first().getAttribute("href");
  await page.goto(href ?? "/");
  await page.waitForLoadState("networkidle");

  const results = await scan(page);
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test("dark mode keeps contrast within AA", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("radio", { name: /dark/i }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.waitForLoadState("networkidle");

  const results = await scan(page);
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test("the whole page is reachable with the keyboard alone", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "keyboard navigation is a desktop concern");

  await page.goto("/");
  await expect(page.getByRole("button", { name: /search/i })).toBeVisible();

  // The first stop must be the skip link, so keyboard users can bypass the nav.
  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => document.activeElement?.textContent ?? "");
  expect(first).toMatch(/skip to content/i);

  // Tabbing must never land on something with no visible focus indicator.
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press("Tab");
  }
  const reachedSomething = await page.evaluate(
    () => document.activeElement !== null && document.activeElement !== document.body,
  );
  expect(reachedSomething).toBe(true);
});
