/**
 * Runtime guards for the shapes the UI depends on.
 *
 * These mirror the generated types rather than replacing them: `schema.d.ts` is
 * the compile-time contract, these are the runtime one. They are deliberately
 * permissive about fields the UI does not read, and strict about the ones it does —
 * the goal is to catch a real contract break, not to re-specify the API.
 */
import { z } from "zod";

import type { Portfolio, ProjectDetail } from "./types";

const nullableString = z.string().nullable().optional();
const nullableUrl = z.string().nullable().optional();

const skill = z.object({
  id: z.number(),
  name: z.string(),
  category_name: nullableString,
  proficiency: z.number(),
  years_experience: nullableString.or(z.number().nullable()),
  is_featured: z.boolean().optional(),
  icon: z.string().optional(),
});

const skillCategory = z.object({
  id: z.number(),
  name: z.string(),
  icon: z.string().optional(),
  skills: z.array(skill),
});

const experience = z.object({
  id: z.number(),
  company: z.string(),
  company_logo: nullableUrl,
  company_url: z.string().optional(),
  role: z.string(),
  employment_type_display: z.string().optional(),
  location: z.string().optional(),
  is_remote: z.boolean().optional(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  is_current: z.boolean().optional(),
  description: z.string().optional(),
  highlights: z.array(z.object({ id: z.number(), text: z.string() })),
  skills: z.array(skill),
});

const education = z.object({
  id: z.number(),
  institution: z.string(),
  logo: nullableUrl,
  degree: z.string(),
  field_of_study: z.string().optional(),
  grade_value: z.string().optional(),
  grade_scale_display: z.string().optional(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  location: z.string().optional(),
  thesis_title: z.string().optional(),
  thesis_url: z.string().optional(),
  coursework: z.array(z.string()).optional(),
  description: z.string().optional(),
});

const projectBase = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  summary: z.string(),
  role: z.string().optional(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  cover_image: nullableUrl,
  skills: z.array(skill),
  repo_url: z.string().optional(),
  live_url: z.string().optional(),
  is_featured: z.boolean().optional(),
  metrics: z.record(z.string(), z.unknown()).optional(),
});

const projectDetail = projectBase.extend({
  description: z.string().optional(),
  case_study: z.string().optional(),
  images: z.array(
    z.object({ id: z.number(), image: z.string(), caption: z.string().optional() }),
  ),
});

const siteSettings = z.object({
  site_title: z.string(),
  meta_description: z.string().optional(),
  og_image: nullableUrl,
  primary_color: z.string(),
  accent_color: z.string(),
  default_locale: z.string(),
  analytics_id: z.string().optional(),
  sections: z.array(
    z.object({
      key: z.string(),
      enabled: z.boolean().optional(),
      label: nullableString,
    }),
  ),
  show_photo: z.boolean(),
  show_personal_details: z.boolean(),
  show_references: z.boolean(),
  show_hobbies: z.boolean(),
});

const profile = z.object({
  full_name: z.string(),
  headline: z.string().optional(),
  tagline: z.string().optional(),
  summary_short: z.string().optional(),
  summary_long: z.string().optional(),
  photo: nullableUrl,
  date_of_birth: nullableString,
  place_of_birth: nullableString,
  nationality: nullableString,
  marital_status: nullableString,
  current_city: z.string().optional(),
  country: z.string().optional(),
  willing_to_relocate: z.boolean().optional(),
  work_authorisation: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  availability: z.string().optional(),
  years_experience: z.number().nullable().optional(),
  resume_pdf_en: nullableUrl,
  resume_pdf_de: nullableUrl,
});

export const portfolioSchema = z.object({
  settings: siteSettings,
  profile,
  section_order: z.array(z.string()),
  social_links: z.array(
    z.object({ id: z.number(), platform: z.string(), url: z.string(), icon: z.string().optional() }),
  ),
  experience: z.array(experience),
  education: z.array(education),
  skill_categories: z.array(skillCategory),
  projects: z.array(projectBase),
  certifications: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      issuer: z.string(),
      issuer_logo: nullableUrl,
      issue_date: z.string().nullable(),
      expiry_date: z.string().nullable(),
      credential_id: z.string().optional(),
      credential_url: z.string().optional(),
    }),
  ),
  publications: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      authors: z.string().optional(),
      venue: z.string().optional(),
      date: z.string().nullable(),
      doi: z.string().optional(),
      url: z.string().optional(),
      abstract: z.string().optional(),
    }),
  ),
  awards: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      issuer: z.string().optional(),
      date: z.string().nullable(),
      description: z.string().optional(),
    }),
  ),
  languages: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      level: z.string(),
      level_display: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
  volunteering: z.array(
    z.object({
      id: z.number(),
      organisation: z.string(),
      role: z.string().optional(),
      start_date: z.string().nullable(),
      end_date: z.string().nullable(),
      is_current: z.boolean().optional(),
      description: z.string().optional(),
    }),
  ),
  interests: z.array(z.object({ id: z.number(), name: z.string(), icon: z.string().optional() })),
  talks: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      event: z.string().optional(),
      date: z.string().nullable(),
      url: z.string().optional(),
      slides_url: z.string().optional(),
    }),
  ),
  references: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      role: z.string().optional(),
      company: z.string().optional(),
      relationship: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      is_public: z.boolean().optional(),
    }),
  ),
  generated_at: z.string(),
});

/**
 * Parse and return a Portfolio.
 *
 * The cast is safe and deliberate: the Zod schema is intentionally looser than
 * the generated type (it ignores fields the UI never reads), so it validates a
 * superset. The generated type remains the source of truth for the shape.
 */
export function parsePortfolio(data: unknown): Portfolio {
  return portfolioSchema.parse(data) as unknown as Portfolio;
}

export function parseProjectDetail(data: unknown): ProjectDetail {
  return projectDetail.parse(data) as unknown as ProjectDetail;
}

export const contactResponseSchema = z.object({ detail: z.string() });
