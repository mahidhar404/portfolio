import { expect, test } from "@playwright/test";

/**
 * End-to-end against a production build and the real API.
 *
 * These assume the backend is running on :8000 with `seed_demo` data — the
 * Makefile's `make e2e` target does both.
 */

test.describe("homepage", () => {
  test("renders every section the API returns", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const sections = page.locator("main section[id]");
    await expect(sections.first()).toBeVisible();
    expect(await sections.count()).toBeGreaterThan(5);

    for (const id of ["experience", "projects", "skills", "education"]) {
      await expect(page.locator(`section#${id}`)).toHaveCount(1);
    }
  });

  test("never scrolls sideways", async ({ page }) => {
    await page.goto("/");
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflows, "the page body must not scroll horizontally").toBe(false);
  });

  test("has no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });

  test("exposes Person structured data for search engines", async ({ page }) => {
    await page.goto("/");
    const jsonLd = await page.locator("#structured-data").textContent();
    expect(jsonLd).toBeTruthy();
    expect(JSON.parse(jsonLd ?? "{}")["@type"]).toBe("Person");
  });
});

test.describe("navigation", () => {
  test("opens a project case study", async ({ page }) => {
    await page.goto("/");
    await page.locator("section#projects a").first().click();
    await expect(page).toHaveURL(/\/projects\/[\w-]+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("a deep link to a project works on a cold load", async ({ page }) => {
    await page.goto("/");
    const href = await page.locator("section#projects a").first().getAttribute("href");
    expect(href).toBeTruthy();

    await page.goto(href ?? "/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /all projects/i })).toBeVisible();
  });

  test("shows a 404 page for an unknown route", async ({ page }) => {
    await page.goto("/definitely-not-a-page");
    await expect(page.getByText("404")).toBeVisible();
  });

  test("the resume page renders and offers printing", async ({ page }) => {
    await page.goto("/resume");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /print/i })).toBeVisible();
  });
});

test.describe("preferences", () => {
  test("theme choice applies and survives a reload", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("radio", { name: /dark/i }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("switching to German translates the chrome", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("radio", { name: "de" }).click();
    await expect(page.getByRole("heading", { name: "Berufserfahrung" })).toBeVisible();
  });
});

test.describe("contact form", () => {
  test("accepts a message and confirms it arrived", async ({ page }) => {
    await page.goto("/");
    await page.locator("section#contact").scrollIntoViewIfNeeded();

    const unique = `Playwright run ${Date.now()}`;
    await page.getByLabel(/your name/i).fill("E2E Recruiter");
    await page.getByLabel(/your email/i).fill("e2e@example.com");
    await page.getByLabel(/subject/i).fill(unique);
    await page.getByLabel(/message/i).fill("This message came from the end-to-end suite.");
    await page.getByRole("button", { name: /send message/i }).click();

    await expect(page.getByText(/your message has arrived/i)).toBeVisible({ timeout: 15_000 });
  });

  test("rejects an invalid email", async ({ page }) => {
    await page.goto("/");
    await page.locator("section#contact").scrollIntoViewIfNeeded();

    await page.getByLabel(/your name/i).fill("E2E");
    await page.getByLabel(/your email/i).fill("nope");
    await page.getByLabel(/message/i).fill("Long enough message body here.");
    await page.getByRole("button", { name: /send message/i }).click();

    await expect(page.getByText(/your message has arrived/i)).toHaveCount(0);
  });
});

test.describe("command palette", () => {
  test("opens with the keyboard and navigates to a project", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "the ⌘K shortcut is a desktop affordance");

    await page.goto("/");
    // The header (and with it the palette's key listener) mounts only once the
    // portfolio payload has arrived — wait for it before sending the shortcut.
    await expect(page.getByRole("button", { name: /search/i })).toBeVisible();

    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByRole("combobox").fill("Ledger");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/projects\//);

    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
