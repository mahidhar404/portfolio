/**
 * A small but complete Portfolio payload.
 *
 * Deliberately handwritten rather than copied from the API: these fixtures are
 * what the component tests assert against, so they need to be readable and
 * stable, not realistic.
 */
import type { Portfolio } from "@/api/types";

/**
 * The generated Portfolio type is deeply readonly, so tests build a new fixture
 * rather than mutating one. `settings` and `profile` merge field-by-field so a
 * test can flip a single flag without restating the whole object.
 */
export interface PortfolioOverrides extends Partial<Omit<Portfolio, "settings" | "profile">> {
  settings?: Partial<Portfolio["settings"]>;
  profile?: Partial<Portfolio["profile"]>;
}

export function makePortfolio(overrides: PortfolioOverrides = {}): Portfolio {
  const base = {
    settings: {
      site_title: "Test Person",
      meta_description: "A test portfolio.",
      og_image: null,
      primary_color: "#1e4fd8",
      accent_color: "#0ea5a4",
      default_locale: "en",
      analytics_id: "",
      sections: [
        { key: "about", enabled: true, label: null },
        { key: "experience", enabled: true, label: null },
        { key: "projects", enabled: true, label: null },
      ],
      show_photo: true,
      show_personal_details: false,
      show_references: false,
      show_hobbies: true,
    },
    profile: {
      full_name: "Test Person",
      headline: "Engineer",
      tagline: "Builds things",
      summary_short: "Short summary.",
      summary_long: "Long summary paragraph.",
      photo: "/media/photo.jpg",
      date_of_birth: null,
      place_of_birth: null,
      nationality: null,
      marital_status: null,
      current_city: "Berlin",
      country: "Germany",
      willing_to_relocate: true,
      work_authorisation: "",
      email: "test@example.com",
      phone: "+49 30 000",
      availability: "Open to roles",
      years_experience: 8,
      resume_pdf_en: null,
      resume_pdf_de: null,
    },
    section_order: ["about", "experience", "projects"],
    social_links: [
      { id: 1, platform: "GitHub", url: "https://github.com/x", icon: "github", order: 0 },
    ],
    experience: [
      {
        id: 1,
        company: "ACME",
        company_logo: null,
        company_url: "https://acme.example",
        role: "Senior Engineer",
        employment_type: "full_time",
        employment_type_display: "Full-time",
        location: "Berlin",
        is_remote: false,
        start_date: "2022-01-01",
        end_date: null,
        is_current: true,
        description: "Led the platform team.",
        highlights: [
          { id: 1, text: "Cut latency by 70%", order: 0 },
          { id: 2, text: "Mentored three engineers", order: 1 },
        ],
        skills: [
          {
            id: 1,
            name: "Python",
            category: 1,
            category_name: "Languages",
            proficiency: 5,
            years_experience: null,
            is_featured: true,
            icon: "",
            order: 0,
          },
        ],
        order: 0,
      },
    ],
    education: [
      {
        id: 1,
        institution: "Test University",
        logo: null,
        degree: "M.Sc.",
        field_of_study: "Computer Science",
        grade_value: "1.3",
        grade_scale: "german_1_5",
        grade_scale_display: "German grade (1.0–5.0)",
        start_date: "2015-10-01",
        end_date: "2017-09-30",
        is_current: false,
        location: "Berlin",
        thesis_title: "A Thesis",
        thesis_url: "",
        coursework: ["Algorithms", "Databases"],
        description: "",
        order: 0,
      },
    ],
    skill_categories: [
      {
        id: 1,
        name: "Languages",
        icon: "",
        order: 0,
        skills: [
          {
            id: 1,
            name: "Python",
            category: 1,
            category_name: "Languages",
            proficiency: 5,
            years_experience: null,
            is_featured: true,
            icon: "",
            order: 0,
          },
          {
            id: 2,
            name: "Go",
            category: 1,
            category_name: "Languages",
            proficiency: 3,
            years_experience: null,
            is_featured: false,
            icon: "",
            order: 1,
          },
        ],
      },
    ],
    projects: [
      {
        id: 1,
        title: "Alpha Project",
        slug: "alpha-project",
        summary: "Does alpha things.",
        role: "Creator",
        start_date: "2023-01-01",
        end_date: null,
        cover_image: null,
        skills: [
          {
            id: 1,
            name: "Python",
            category: 1,
            category_name: "Languages",
            proficiency: 5,
            years_experience: null,
            is_featured: true,
            icon: "",
            order: 0,
          },
        ],
        repo_url: "https://github.com/x/alpha",
        live_url: "",
        is_featured: true,
        metrics: { throughput: "18k/s" },
        order: 0,
      },
      {
        id: 2,
        title: "Beta Project",
        slug: "beta-project",
        summary: "Does beta things.",
        role: "",
        start_date: null,
        end_date: null,
        cover_image: null,
        skills: [
          {
            id: 2,
            name: "Go",
            category: 1,
            category_name: "Languages",
            proficiency: 3,
            years_experience: null,
            is_featured: false,
            icon: "",
            order: 1,
          },
        ],
        repo_url: "",
        live_url: "",
        is_featured: false,
        metrics: {},
        order: 1,
      },
    ],
    certifications: [],
    publications: [],
    awards: [],
    languages: [
      { id: 1, name: "German", level: "native", level_display: "Native", notes: "", order: 0 },
      {
        id: 2,
        name: "English",
        level: "C2",
        level_display: "C2 — Proficient",
        notes: "",
        order: 1,
      },
    ],
    volunteering: [],
    interests: [{ id: 1, name: "Cycling", icon: "", order: 0 }],
    talks: [],
    references: [],
    generated_at: "2026-01-01T00:00:00Z",
  } as unknown as Portfolio;

  const { settings, profile, ...rest } = overrides;
  return {
    ...base,
    ...rest,
    settings: { ...base.settings, ...settings },
    profile: { ...base.profile, ...profile },
  };
}
