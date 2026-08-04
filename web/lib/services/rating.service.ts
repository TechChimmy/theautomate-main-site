import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Supabase client — read-only, server-side only.
//
// We use the ANON key here because:
//   1. course_ratings aggregate data is public information (star ratings).
//   2. We only query AVG + COUNT — no user_id or raw review text is fetched.
//   3. This function is called exclusively from Next.js Server Components,
//      so neither the client instance nor the key ever reaches the browser.
//
// If RLS on course_ratings ever restricts anon access, swap to the service
// role key here — but keep this file server-only and never import it from
// a Client Component.
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Lazily created — avoids re-creating the client on every call in dev hot-reloads.
let _client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}

// ---------------------------------------------------------------------------

export interface CourseRating {
  averageRating: number;
  totalReviews: number;
}

/**
 * Fetches the live learner rating aggregate for a course from Supabase.
 *
 * Queries: public.course_ratings WHERE product_id = productUuid
 * Returns: { averageRating, totalReviews }
 *
 * - Returns { averageRating: 0, totalReviews: 0 } when there are no reviews.
 * - Returns null on a database error so the caller can render a safe fallback
 *   without crashing the page.
 *
 * @param productUuid  The UUID stored in courseDetails.productUuid in Sanity,
 *                     which matches public.course_ratings.product_id.
 */
export async function getCourseRating(
  productUuid: string
): Promise<CourseRating | null> {
  if (!productUuid) {
    return { averageRating: 0, totalReviews: 0 };
  }

  try {
    const supabase = getClient();

    const { data, error } = await supabase
      .from("course_ratings")
      .select("rating")
      .eq("product_id", productUuid)
      .returns<{ rating: number }[]>();

    if (error) {
      // Log server-side for debugging. Never propagate DB error details to the client.
      console.error(
        `[rating.service] Failed to fetch ratings for product ${productUuid}:`,
        error.message
      );
      return null; // Caller renders a neutral "No reviews yet" state.
    }

    const rows = data ?? [];

    if (rows.length === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }

    const totalReviews = rows.length;
    const sum = rows.reduce((acc, row) => acc + (row.rating ?? 0), 0);
    const averageRating = sum / totalReviews;

    return { averageRating, totalReviews };
  } catch (err) {
    // Catch unexpected errors (network, env vars missing, etc.)
    console.error(
      `[rating.service] Unexpected error for product ${productUuid}:`,
      err
    );
    return null;
  }
}
