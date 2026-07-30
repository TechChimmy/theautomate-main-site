import { Plan } from "./plan";

export interface KeyConcept {
  title: string;
  icon: any; // Sanity image object
  description: string;
}

export interface CurriculumModule {
  subheading: string;
  points: string[];
  summary: string;
}

export interface Highlight {
  icon: any; // Sanity image object
  title: string;
}

export interface Course {
  _id: string;

  title: string;

  /**
   * Both COURSES_QUERY and COURSE_BY_SLUG_QUERY alias slug to a flat string:
   *   "slug": slug.current
   * Access as a plain string everywhere — no .current needed.
   */
  slug: string;

  tagline: string;

  hoverDescription?: string;
  
  _updatedAt?: string;

  heroImage: any; // Sanity image object — use urlFor() to resolve

  rating: number;

  students: number;

  hours: number;

  duration: string;

  price: number;

  level: string;

  instructorName: string;

  instructorImage: any; // Sanity image object — use urlFor() to resolve

  description: any[]; // Portable Text blocks

  keyConcepts: KeyConcept[];

  whoFor: string[];

  curriculum: CurriculumModule[];

  outcomes: string[];

  highlights: Highlight[];

  projects: number;

  batchDetails: string[];

  bundles: Plan[];
}
