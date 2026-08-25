import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { makePortfolio } from "./fixtures";

export const handlers = [
  http.get("*/api/v1/portfolio/", () => HttpResponse.json(makePortfolio())),
  http.get("*/api/v1/projects/:slug/", ({ params }) => {
    const project = makePortfolio().projects.find((p) => p.slug === params["slug"]);
    if (!project) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({
      ...project,
      description: "Desc",
      case_study: "## Study",
      images: [],
    });
  }),
  http.post("*/api/v1/contact/", () =>
    HttpResponse.json({ detail: "Message received." }, { status: 201 }),
  ),
];

export const server = setupServer(...handlers);
