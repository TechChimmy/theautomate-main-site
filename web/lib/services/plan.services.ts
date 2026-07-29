import { client } from "@/lib/sanity.client";
import { PLANS_QUERY, PLAN_BY_BADGE_QUERY } from "@/lib/queries/plan";
import { Plan } from "@/lib/types/plan";

export async function getPlans(): Promise<Plan[]> {
    return await client.fetch<Plan[]>(PLANS_QUERY);
}

/**
 * Fetch a single plan by its badge slug (e.g. "starter", "pro", "premium").
 * The slug is lowercased in the URL; we capitalise it to match Sanity badge values.
 */
export async function getPlanByBadge(badgeSlug: string): Promise<Plan | null> {
    const badge = badgeSlug.charAt(0).toUpperCase() + badgeSlug.slice(1).toLowerCase();
    return await client.fetch<Plan | null>(PLAN_BY_BADGE_QUERY, { badge });
}