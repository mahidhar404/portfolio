/**
 * Convenience aliases over the generated schema.
 *
 * `schema.d.ts` is generated from the Django OpenAPI document by
 * `pnpm run gen:api` — never edit it, and never hand-write an API shape here.
 * This file only gives the generated types shorter names.
 */
import type { components } from "./schema";

type Schemas = components["schemas"];

export type Portfolio = Schemas["Portfolio"];
export type SiteSettings = Schemas["SiteSettings"];
export type Profile = Schemas["Profile"];
export type SocialLink = Schemas["SocialLink"];
export type Experience = Schemas["Experience"];
export type ExperienceHighlight = Schemas["ExperienceHighlight"];
export type Education = Schemas["Education"];
export type Skill = Schemas["Skill"];
export type SkillCategory = Schemas["SkillCategory"];
export type ProjectList = Schemas["ProjectList"];
export type ProjectDetail = Schemas["ProjectDetail"];
export type ProjectImage = Schemas["ProjectImage"];
export type Certification = Schemas["Certification"];
export type Publication = Schemas["Publication"];
export type Award = Schemas["Award"];
export type Language = Schemas["Language"];
export type Volunteering = Schemas["Volunteering"];
export type Interest = Schemas["Interest"];
export type Talk = Schemas["Talk"];
export type Reference = Schemas["Reference"];
export type SectionConfig = Schemas["SectionConfig"];

/** The section keys the backend can ask us to render. */
export const SECTION_KEYS = [
  "about",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "publications",
  "awards",
  "languages",
  "volunteering",
  "talks",
  "interests",
  "references",
  "contact",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export function isSectionKey(value: string): value is SectionKey {
  return (SECTION_KEYS as readonly string[]).includes(value);
}
