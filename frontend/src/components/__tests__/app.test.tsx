/**
 * Integration tests: the real hooks against a mocked HTTP layer, so these
 * exercise fetch -> Zod -> TanStack Query -> render the way the browser does.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { HomePage } from "@/routes/HomePage";
import { makePortfolio } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/server";

describe("HomePage", () => {
  it("renders the sections the API asks for, in the order it asks for them", async () => {
    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Test Person");
    });

    const rendered = [...document.querySelectorAll("section[id]")]
      .map((element) => element.id)
      .filter((id) => id.length > 0);
    expect(rendered).toEqual(["about", "experience", "projects"]);
  });

  it("follows a reordered section list without any code change", async () => {
    const reordered = makePortfolio({
      section_order: ["projects", "about"],
      settings: {
        sections: [
          { key: "projects", enabled: true, label: null },
          { key: "about", enabled: true, label: null },
        ],
      },
    });
    server.use(http.get("*/api/v1/portfolio/", () => HttpResponse.json(reordered)));

    renderWithProviders(<HomePage />);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument());

    const rendered = [...document.querySelectorAll("section[id]")].map((e) => e.id);
    expect(rendered).toEqual(["projects", "about"]);
  });

  it("uses the label the backend supplies instead of the built-in heading", async () => {
    const renamed = makePortfolio({
      section_order: ["projects"],
      settings: { sections: [{ key: "projects", enabled: true, label: "Selected Work" }] },
    });
    server.use(http.get("*/api/v1/portfolio/", () => HttpResponse.json(renamed)));

    renderWithProviders(<HomePage />);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Selected Work" })).toBeInTheDocument(),
    );
    expect(screen.queryByRole("heading", { name: "Projects" })).not.toBeInTheDocument();
  });

  it("shows a retry affordance when the API is unreachable", async () => {
    server.use(http.get("*/api/v1/portfolio/", () => HttpResponse.error()));

    renderWithProviders(<HomePage />);
    await waitFor(
      () => expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument(),
      { timeout: 5000 },
    );
  });

  it("sets the document title and structured data from the API", async () => {
    renderWithProviders(<HomePage />);
    await waitFor(() => expect(document.title).toContain("Test Person"));

    const jsonLd = document.querySelector("#structured-data");
    expect(jsonLd).not.toBeNull();
    const parsed = JSON.parse(jsonLd?.textContent ?? "{}");
    expect(parsed["@type"]).toBe("Person");
    expect(parsed.name).toBe("Test Person");
  });
});

describe("contact form", () => {
  it("submits and confirms", async () => {
    const user = userEvent.setup();
    const withContact = makePortfolio({
      section_order: ["contact"],
      settings: { sections: [{ key: "contact", enabled: true, label: null }] },
    });
    server.use(http.get("*/api/v1/portfolio/", () => HttpResponse.json(withContact)));

    renderWithProviders(<HomePage />);
    await waitFor(() => expect(screen.getByLabelText(/your name/i)).toBeInTheDocument());

    await user.type(screen.getByLabelText(/your name/i), "Recruiter");
    await user.type(screen.getByLabelText(/your email/i), "r@example.com");
    await user.type(screen.getByLabelText(/message/i), "We have a role that may suit you.");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => expect(screen.getByText(/your message has arrived/i)).toBeInTheDocument());
  });

  it("explains a rate-limit rather than showing a generic failure", async () => {
    const user = userEvent.setup();
    const withContact = makePortfolio({
      section_order: ["contact"],
      settings: { sections: [{ key: "contact", enabled: true, label: null }] },
    });
    server.use(
      http.get("*/api/v1/portfolio/", () => HttpResponse.json(withContact)),
      http.post("*/api/v1/contact/", () => new HttpResponse(null, { status: 429 })),
    );

    renderWithProviders(<HomePage />);
    await waitFor(() => expect(screen.getByLabelText(/your name/i)).toBeInTheDocument());

    await user.type(screen.getByLabelText(/your name/i), "Recruiter");
    await user.type(screen.getByLabelText(/your email/i), "r@example.com");
    await user.type(screen.getByLabelText(/message/i), "Another message entirely.");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => expect(screen.getByText(/messages in a short time/i)).toBeInTheDocument());
  });
});
