import { client } from "@/lib/sanity.client";
import {
  COURSES_QUERY,
  COURSE_BY_SLUG_QUERY,
  COURSE_PLANS_QUERY,
} from "../queries/course";
import { Course } from "../types/course";
import { Plan } from "../types/plan";

export async function getCourses(): Promise<Course[]> {
  return client.fetch(COURSES_QUERY);
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  return client.fetch(COURSE_BY_SLUG_QUERY, { slug });
}

export interface CoursePlans {
  _id: string;
  title: string;
  slug: string;
  /** Full Plan documents dereferenced from bundles[]. May be null/empty if none assigned. */
  bundles: Plan[] | null;
}

/**
 * Returns the course title + fully-dereferenced Plan documents from bundles[].
 * Used by /courses/[slug]/plans — single query, no second fetch.
 */
export async function getCoursePlans(slug: string): Promise<CoursePlans | null> {
  return client.fetch(COURSE_PLANS_QUERY, { slug });
}
