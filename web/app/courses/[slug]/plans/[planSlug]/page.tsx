import { notFound } from "next/navigation";
import { getPlanByBadge } from "@/lib/services/plan.services";
import { getCoursePlans } from "@/lib/services/course.service";
import { PlanDetailCard } from "@/components/layout/plan-detail/PlanDetailCard";
import { ViewPlanOrderSummary } from "@/components/layout/plan-detail/ViewPlanOrderSummary";
import { PremiumContactForm } from "@/components/layout/plan-detail/PremiumContactForm";

interface Props {
  params: Promise<{ slug: string; planSlug: string }>;
}

/**
 * Generic plan detail page.
 * Route: /courses/[slug]/plans/[planSlug]
 *
 * planSlug is the lowercased badge value: starter | pro | premium
 *
 * - Starter / Pro  → left: plan details  |  right: order summary → existing /payment
 * - Premium        → left: plan details  |  right: WhatsApp contact form
 */
export default async function PlanDetailPage({ params }: Props) {
  const { slug: courseSlug, planSlug } = await params;

  // Fetch course and plan in parallel
  const [courseData, plan] = await Promise.all([
    getCoursePlans(courseSlug).catch(() => null),
    getPlanByBadge(planSlug).catch(() => null),
  ]);

  if (!courseData || !plan) return notFound();

  const isPremium = plan.badge.toLowerCase() === "premium";

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Breadcrumb / header strip */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center gap-2 text-sm text-slate-500">
          <a href={`/courses/${courseSlug}`} className="hover:text-[#0166A7] transition-colors">
            {courseData.title}
          </a>
          <span>/</span>
          <a href={`/courses/${courseSlug}/plans`} className="hover:text-[#0166A7] transition-colors">
            Plans
          </a>
          <span>/</span>
          <span className="text-slate-900 font-medium">{plan.badge}</span>
        </div>
      </section>

      {/* Main two-column layout */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-start">
          {/* Left column — plan details */}
          <PlanDetailCard plan={plan} />

          {/* Right column — sticky on desktop */}
          <div className="lg:sticky lg:top-28">
            {isPremium ? (
              <PremiumContactForm courseTitle={courseData.title} />
            ) : (
              <ViewPlanOrderSummary
                plan={plan}
                courseSlug={courseSlug}
                courseTitle={courseData.title}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

/**
 * Pre-render the three known badge slugs so they are statically optimised.
 * The dynamic fallback still handles any future badges automatically.
 */
export function generateStaticParams() {
  return [
    { planSlug: "starter" },
    { planSlug: "pro" },
    { planSlug: "premium" },
  ];
}
