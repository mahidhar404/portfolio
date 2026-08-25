import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CommandPalette } from "@/components/CommandPalette";
import { Header } from "@/components/Header";
import { ThemeToggle } from "@/components/ThemeToggle";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { makePortfolio } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";

describe("ThemeToggle", () => {
  it("defaults to following the system", () => {
    renderWithProviders(<ThemeToggle />);
    expect(screen.getByRole("radio", { name: /system/i })).toBeChecked();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("stamps the root element when an explicit theme is chosen", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />);

    await user.click(screen.getByRole("radio", { name: /dark/i }));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("persists the choice so it survives a reload", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />);

    await user.click(screen.getByRole("radio", { name: /light/i }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("clears the stored choice when handed back to the system", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />);

    await user.click(screen.getByRole("radio", { name: /dark/i }));
    await user.click(screen.getByRole("radio", { name: /system/i }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});

describe("CommandPalette", () => {
  const data = makePortfolio();

  it("opens on ⌘K", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette data={data} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.keyboard("{Meta>}k{/Meta}");
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette data={data} />);

    await user.keyboard("{Meta>}k{/Meta}");
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("lists both sections and projects", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette data={data} />);

    await user.keyboard("{Meta>}k{/Meta}");
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    const options = screen.getAllByRole("option");
    const labels = options.map((option) => option.textContent ?? "");
    expect(labels.some((label) => label.includes("Alpha Project"))).toBe(true);
    expect(labels.some((label) => label.includes("Experience"))).toBe(true);
  });

  it("filters as you type", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette data={data} />);

    await user.keyboard("{Meta>}k{/Meta}");
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    await user.type(screen.getByRole("combobox"), "alpha");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Alpha Project");
  });

  it("says so when nothing matches", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette data={data} />);

    await user.keyboard("{Meta>}k{/Meta}");
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    await user.type(screen.getByRole("combobox"), "zzzzz");

    expect(screen.getByText(/nothing matches/i)).toBeInTheDocument();
  });
});

describe("Header", () => {
  it("links to the sections the API returned", () => {
    renderWithProviders(<Header data={makePortfolio()} />);
    const nav = screen.getAllByRole("navigation")[0];
    expect(nav).toBeDefined();
    expect(screen.getAllByRole("link", { name: "Experience" }).length).toBeGreaterThan(0);
  });

  it("shows the site title from the database", () => {
    const data = makePortfolio({ settings: { site_title: "Some Other Name" } });
    renderWithProviders(<Header data={data} />);
    expect(screen.getByRole("link", { name: "Some Other Name" })).toBeInTheDocument();
  });
});
