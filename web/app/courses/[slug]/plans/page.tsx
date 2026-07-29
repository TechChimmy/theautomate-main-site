import { notFound } from "next/navigation";
import { getCoursePlans } from "@/lib/services/course.service";
import { getPlans } from "@/lib/services/plan.services";
import { PricingCard } from "@/components/ui/PricingCard";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CoursePlansPage({ params }: Props) {
  const { slug } = await params;

  // Fetch ALL plans + course info (for title + recommended bundle IDs) in parallel
  const [allPlans, courseData] = await Promise.all([
    getPlans().catch(() => []),
    getCoursePlans(slug).catch(() => null),
  ]);

  // Course must exist — 404 if not found
  if (!courseData) return notFound();

  // Collect the IDs of plans the course recommends via bundles[]
  const recommendedIds = new Set(
    (courseData.bundles ?? []).map((b) => b._id)
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#0166A7] mb-3">
            Choose Your Plan
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
            {courseData.title}
          </h1>
          <p className="mt-4 text-slate-500 text-base max-w-xl mx-auto">
            All plans include full access to the course content. Choose the
            one that fits your goals.
          </p>
        </div>

        {allPlans.length === 0 ? (
          <p className="text-center text-slate-500 py-20 text-lg">
            No plans available yet — please check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allPlans.map((plan) => (
              <PricingCard
                key={plan._id}
                bundle={plan}
                courseSlug={slug}
                buttonLabel="Buy Plan"
                recommended={recommendedIds.has(plan._id)}
              />
            ))}
          </div>
        )}

      </section>
    </main>
  );
}
