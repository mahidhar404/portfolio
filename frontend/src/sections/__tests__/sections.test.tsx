import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makePortfolio } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { SECTION_REGISTRY } from "@/sections";
import { SECTION_KEYS } from "@/api/types";

const data = makePortfolio();

function renderSection(key: keyof typeof SECTION_REGISTRY, portfolio = data) {
  const Component = SECTION_REGISTRY[key];
  return renderWithProviders(
    <Component data={portfolio} id={key} title={`Title ${key}`} eyebrow="Eyebrow" />,
  );
}

describe("section registry", () => {
  it("has a component for every section key the backend can send", () => {
    for (const key of SECTION_KEYS) {
      expect(SECTION_REGISTRY[key], `no component registered for "${key}"`).toBeDefined();
    }
  });

  it("registers no components the backend does not know about", () => {
    expect(Object.keys(SECTION_REGISTRY).sort()).toEqual([...SECTION_KEYS].sort());
  });
});

describe("AboutSection", () => {
  it("renders the long summary", () => {
    renderSection("about");
    expect(screen.getByText(/Long summary paragraph/)).toBeInTheDocument();
  });

  it("hides personal details unless the flag is on", () => {
    const portfolio = makePortfolio({ profile: { date_of_birth: "1993-04-18" } });
    renderSection("about", portfolio);
    expect(screen.queryByText(/April/)).not.toBeInTheDocument();
  });

  it("shows personal details when the flag is on", () => {
    const portfolio = makePortfolio({
      settings: { show_personal_details: true },
      profile: { date_of_birth: "1993-04-18", nationality: "German" },
    });
    renderSection("about", portfolio);
    expect(screen.getByText("German")).toBeInTheDocument();
    expect(screen.getByText(/April 18, 1993/)).toBeInTheDocument();
  });
});

describe("ExperienceSection", () => {
  it("renders the role, company and every highlight", () => {
    renderSection("experience");
    expect(screen.getByRole("heading", { name: "Senior Engineer" })).toBeInTheDocument();
    expect(screen.getByText("ACME")).toBeInTheDocument();
    expect(screen.getByText("Cut latency by 70%")).toBeInTheDocument();
    expect(screen.getByText("Mentored three engineers")).toBeInTheDocument();
  });

  it("shows an open-ended range for a current role", () => {
    renderSection("experience");
    expect(screen.getByText(/Jan 2022 — Present/)).toBeInTheDocument();
  });

  it("renders nothing when there is no experience", () => {
    const portfolio = makePortfolio({ experience: [] });
    const { container } = renderSection("experience", portfolio);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("EducationSection", () => {
  it("renders the grade with its scale, so 1.3 is not mistaken for a GPA", () => {
    renderSection("education");
    expect(screen.getByText("1.3")).toBeInTheDocument();
    expect(screen.getByText(/German grade/)).toBeInTheDocument();
  });

  it("lists coursework", () => {
    renderSection("education");
    expect(screen.getByText("Algorithms")).toBeInTheDocument();
    expect(screen.getByText("Databases")).toBeInTheDocument();
  });
});

describe("SkillsSection", () => {
  it("groups skills under their category", () => {
    renderSection("skills");
    expect(screen.getByRole("heading", { name: "Languages" })).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
  });

  it("exposes proficiency to assistive tech rather than colour alone", () => {
    renderSection("skills");
    expect(screen.getByRole("img", { name: "Python: 5 out of 5" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Go: 3 out of 5" })).toBeInTheDocument();
  });
});

describe("LanguagesSection", () => {
  it("renders a labelled CEFR scale", () => {
    renderSection("languages");
    expect(screen.getByRole("img", { name: /German: level native/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /English: level C2/ })).toBeInTheDocument();
  });
});

describe("InterestsSection", () => {
  it("renders when hobbies are enabled", () => {
    renderSection("interests");
    expect(screen.getByText("Cycling")).toBeInTheDocument();
  });

  it("renders nothing when hobbies are switched off", () => {
    const portfolio = makePortfolio({ settings: { show_hobbies: false } });
    const { container } = renderSection("interests", portfolio);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("ReferencesSection", () => {
  it("renders nothing when references are switched off", () => {
    const { container } = renderSection("references");
    expect(container).toBeEmptyDOMElement();
  });

  it("says details are on request when the backend masked them", () => {
    const portfolio = makePortfolio({
      references: [
        {
          id: 1,
          name: "Referee",
          role: "VP",
          company: "ACME",
          relationship: "Manager",
          email: "",
          phone: "",
          is_public: false,
          order: 0,
        },
      ],
      settings: { show_references: true },
    });
    renderSection("references", portfolio);
    expect(screen.getByText(/available on request/i)).toBeInTheDocument();
  });
});

describe("ProjectsSection", () => {
  it("renders every project", () => {
    renderSection("projects");
    expect(screen.getByRole("heading", { name: "Alpha Project" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Beta Project" })).toBeInTheDocument();
  });

  it("offers a filter for each technology used", () => {
    renderSection("projects");
    const filters = screen.getByRole("group", { name: /filter projects/i });
    expect(within(filters).getByRole("button", { name: "Python" })).toBeInTheDocument();
    expect(within(filters).getByRole("button", { name: "Go" })).toBeInTheDocument();
  });

  it("shows headline metrics", () => {
    renderSection("projects");
    expect(screen.getByText("18k/s")).toBeInTheDocument();
  });
});

describe("empty states", () => {
  it("every section survives a completely empty payload", () => {
    const empty = makePortfolio({
      experience: [],
      education: [],
      skill_categories: [],
      projects: [],
      certifications: [],
      publications: [],
      awards: [],
      languages: [],
      volunteering: [],
      interests: [],
      talks: [],
      references: [],
      social_links: [],
    });

    for (const key of SECTION_KEYS) {
      const Component = SECTION_REGISTRY[key];
      expect(() =>
        renderWithProviders(<Component data={empty} id={key} title={key} />),
      ).not.toThrow();
    }
  });
});
