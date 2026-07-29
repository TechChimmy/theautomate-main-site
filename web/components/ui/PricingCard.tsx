import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, LayoutList } from "lucide-react";
import { StarRating } from "@/components/ui/StarRating";
import { PlanFeatureList } from "@/components/ui/PlanFeatureList";
import { urlFor } from "@/lib/sanity.client";
import { Plan } from "@/lib/types/plan";

interface PricingCardProps {
  bundle: Plan;
  courseSlug?: string;
  /** Override the primary button label (legacy prop — still respected) */
  buttonLabel?: string;
  /** Override the primary button href entirely (legacy prop — still respected) */
  buttonHref?: string;
  /** When true, shows a "Recommended" badge on the card */
  recommended?: boolean;
}

/**
 * Plan card used on the course plans grid.
 *
 * Button behaviour per badge:
 *  - Starter / Pro  → [View Plan]  [Buy Plan]
 *  - Premium        → [View Plan]  (no Buy Plan)
 *
 * Passing buttonHref or buttonLabel overrides the Buy Plan button only
 * (backward-compatible with callers that pass those props).
 */
export function PricingCard({
  bundle,
  courseSlug,
  buttonLabel,
  buttonHref,
  recommended = false,
}: PricingCardProps) {
  const imageUrl = bundle.coverImage
    ? urlFor(bundle.coverImage).width(800).url()
    : "/placeholder.png";

  const batchLabel = bundle.batchOptions?.length
    ? bundle.batchOptions.join(" or ")
    : "Weekday or Weekend";

  const normalizedBatch = bundle.batchOptions?.[0]
    ? bundle.batchOptions[0].toLowerCase().includes("weekday")
      ? "weekday"
      : "weekend"
    : "weekend";

  // --- Payment URL (Buy Plan) ---
  const paymentParams = new URLSearchParams();
  if (courseSlug) paymentParams.set("course", courseSlug);
  paymentParams.set("bundleId", bundle._id);
  paymentParams.set("bundleTitle", bundle.title);
  paymentParams.set("amount", bundle.price.toString());
  paymentParams.set("batch", normalizedBatch);
  const paymentUrl = `/payment?${paymentParams.toString()}`;
  const buyHref = buttonHref ?? paymentUrl;
  const buyLabel = buttonLabel ?? "Buy Plan";

  // --- View Plan URL ---
  const badgeSlug = bundle.badge.toLowerCase(); // "starter" | "pro" | "premium"
  const viewPlanHref = courseSlug
    ? `/courses/${courseSlug}/plans/${badgeSlug}`
    : `/plans`; // graceful fallback when no courseSlug

  const isPremium = badgeSlug === "premium";

  return (
    <div
      className={`bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] overflow-hidden flex flex-col border transition-all duration-300 group relative
        ${recommended ? "border-[#0166A7] ring-2 ring-[#0166A7]/30" : "border-slate-100"}`}
    >
      {/* Recommended banner */}
      {recommended && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-[#0166A7] text-white text-xs font-bold uppercase tracking-widest text-center py-1.5">
          ⭐ Recommended for this course
        </div>
      )}

      {/* Cover image + badge chip */}
      <div className={`h-48 md:h-56 relative overflow-hidden ${recommended ? "mt-8" : ""}`}>
        <Image
          src={imageUrl}
          alt={bundle.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-slate-700 shadow-sm border border-slate-100">
          {bundle.badge}
        </div>
      </div>

      {/* Card body */}
      <div className="p-6 md:p-8 flex flex-col flex-grow">
        {/* Rating & Price */}
        <div className="flex items-center justify-between mb-4">
          <StarRating rating={bundle.rating ?? 5} showNumber size={16} />
          <span className="font-bold text-slate-900 text-lg">
            ₹{bundle.price.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl md:text-2xl font-bold mb-1 text-slate-900">
          {bundle.title}
        </h3>
        <p className="text-sm text-slate-500 mb-5">By Auto-Mate</p>

        {/* Duration + batch metadata */}
        <div className="flex items-center gap-5 text-xs font-medium text-slate-600 mb-6">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            {bundle.duration}
          </div>
          <div className="flex items-center gap-1.5">
            <LayoutList className="w-4 h-4 text-slate-400" />
            {batchLabel}
          </div>
        </div>

        <div className="h-px bg-slate-100 w-full mb-6" />

        {/* Feature list — reuses extracted component */}
        <div className="flex-grow mb-8">
          <PlanFeatureList features={bundle.features ?? []} />
        </div>

        {/* Action buttons */}
        {isPremium ? (
          /* Premium: View Plan only */
          <Link href={viewPlanHref} className="mt-auto">
            <Button
              variant="outline"
              className="w-full rounded-full border-[#0166A7] text-[#0166A7] font-bold py-6 hover:bg-[#0166A7] hover:text-white hover:border-[#0166A7] transition-all"
            >
              View Plan
            </Button>
          </Link>
        ) : (
          /* Starter / Pro: View Plan + Buy Plan side by side */
          <div className="mt-auto flex gap-3">
            <Link href={viewPlanHref} className="flex-1">
              <Button
                variant="outline"
                className="w-full rounded-full border-slate-300 text-slate-600 font-semibold py-6 hover:border-[#0166A7] hover:text-[#0166A7] transition-all"
              >
                View Plan
              </Button>
            </Link>
            <Link href={buyHref} className="flex-1">
              <Button
                variant="outline"
                className="w-full rounded-full border-slate-300 text-slate-700 font-bold py-6 hover:bg-[#0166A7] hover:text-white hover:border-[#0166A7] transition-all"
              >
                {buyLabel}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
