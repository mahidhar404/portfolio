/**
 * The section registry.
 *
 * The backend decides which sections appear and in what order; this maps each
 * key it can send to the component that renders it. Adding a new resume section
 * later means adding a model on the backend and one entry here — no layout code
 * changes anywhere else.
 */
import type { ComponentType } from "react";

import type { SectionKey } from "@/api/types";

import { AboutSection } from "./AboutSection";
import { AwardsSection } from "./AwardsSection";
import { CertificationsSection } from "./CertificationsSection";
import { ContactSection } from "./ContactSection";
import { EducationSection } from "./EducationSection";
import { ExperienceSection } from "./ExperienceSection";
import { InterestsSection } from "./InterestsSection";
import { LanguagesSection } from "./LanguagesSection";
import { ProjectsSection } from "./ProjectsSection";
import { PublicationsSection } from "./PublicationsSection";
import { ReferencesSection } from "./ReferencesSection";
import { SkillsSection } from "./SkillsSection";
import { TalksSection } from "./TalksSection";
import { VolunteeringSection } from "./VolunteeringSection";
import type { SectionProps } from "./types";

export const SECTION_REGISTRY: Record<SectionKey, ComponentType<SectionProps>> = {
  about: AboutSection,
  experience: ExperienceSection,
  education: EducationSection,
  skills: SkillsSection,
  projects: ProjectsSection,
  certifications: CertificationsSection,
  publications: PublicationsSection,
  awards: AwardsSection,
  languages: LanguagesSection,
  volunteering: VolunteeringSection,
  talks: TalksSection,
  interests: InterestsSection,
  references: ReferencesSection,
  contact: ContactSection,
};

export type { SectionProps };
