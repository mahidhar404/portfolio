import type { Portfolio } from "@/api/types";

/** Every section component receives the whole payload and its own identity. */
export interface SectionProps {
  data: Portfolio;
  id: string;
  title: string;
  eyebrow?: string;
}
