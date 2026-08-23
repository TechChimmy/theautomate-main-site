"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, LayoutList, Trash2, CircleSlash } from "lucide-react";
import { StarRating } from "@/components/ui/StarRating";
import { PlanFeatureList } from "@/components/ui/PlanFeatureList";
import { urlFor } from "@/lib/sanity.client";
import { Plan } from "@/lib/types/plan";
import { addToCart, removeFromCart, getCart } from "@/lib/services/cart";

interface PricingCardProps {
  bundle: Plan;
  courseSlug?: string;
  /**
   * Sanity courseDetails._id for the course this card belongs to.
   * Required for correct cart identity. When omitted (e.g. the generic
   * /plans page), cart add/remove is disabled gracefully.
   */
  courseId?: string;
  /** Human-readable course name stored in the cart item. */
  courseTitle?: string;
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
 * Cart identity: (courseId, bundle._id) — two courses with the same plan
 * are independent cart items.
 *
 * Button behaviour per badge:
 *  - Starter / Pro  → [View Plan]  [Add to Cart / Added to Cart]
 *  - Premium        → [View Plan]  (no cart action)
 */
export function PricingCard({
  bundle,
  courseSlug,
  courseId,
  courseTitle,
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

  // ---------------------------------------------------------------------------
  // Cart state — keyed on (courseId, bundle._id) so Course A + Starter and
  // Course B + Starter are completely independent.
  // ---------------------------------------------------------------------------
  const [addedToCart, setAddedToCart] = useState(false);
  const [isOtherPlanInCart, setIsOtherPlanInCart] = useState(false);

  useEffect(() => {
    if (!courseId) return;

    const checkCart = () => {
      const cart = getCart();
      const thisPlanInCart = cart.some(
        (item) => item.courseId === courseId && item.selectedPlanId === bundle._id
      );
      const anyPlanInCart = cart.some((item) => item.courseId === courseId);
      
      setAddedToCart(thisPlanInCart);
      setIsOtherPlanInCart(!thisPlanInCart && anyPlanInCart);
    };

    checkCart(); // initial

    window.addEventListener("cart-updated", checkCart);
    window.addEventListener("storage", checkCart);
    return () => {
      window.removeEventListener("cart-updated", checkCart);
      window.removeEventListener("storage", checkCart);
    };
  }, [courseId, bundle._id]);

  const handleCartToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!courseId) return; // guard — no courseId means we cannot build a valid cart item

    if (addedToCart) {
      removeFromCart(courseId, bundle._id);
    } else {
      addToCart({
        courseId,
        courseTitle: courseTitle ?? courseSlug ?? "Course",
        courseSlug: courseSlug ?? "",
        selectedPlanId: bundle._id,
        selectedPlanTitle: bundle.title,
        selectedPlanPrice: bundle.price,
        thumbnailUrl: bundle.coverImage
          ? urlFor(bundle.coverImage).width(400).url()
          : null,
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Navigation URLs
  // ---------------------------------------------------------------------------
  const paymentParams = new URLSearchParams();
  if (courseSlug) paymentParams.set("course", courseSlug);
  paymentParams.set("bundleId", bundle._id);
  paymentParams.set("bundleTitle", bundle.title);
  paymentParams.set("amount", bundle.price.toString());
  const paymentUrl = `/payment?${paymentParams.toString()}`;
  const buyHref = buttonHref ?? paymentUrl;
  const buyLabel = buttonLabel ?? "Buy Plan";

  const badgeSlug = bundle.badge.toLowerCase();
  const viewPlanHref = courseSlug
    ? `/courses/${courseSlug}/plans/${badgeSlug}`
    : `/plans`;

  const isPremium = badgeSlug === "premium";
  const canAddToCart = Boolean(courseId); // only meaningful when courseId is known

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
      <div
        className={`h-48 md:h-56 relative overflow-hidden ${recommended ? "mt-8" : ""}`}
      >
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

        {/* Metadata */}
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

        {/* Feature list */}
        <div className="flex-grow mb-8">
          <PlanFeatureList features={bundle.features ?? []} />
        </div>

        {/* Action buttons */}
        {isPremium ? (
          /* Premium: View Plan only — no cart */
          <Link href={viewPlanHref} className="mt-auto">
            <Button
              variant="outline"
              className="w-full rounded-full border-[#0166A7] text-[#0166A7] font-bold py-6 hover:bg-[#0166A7] hover:text-white hover:border-[#0166A7] transition-all"
            >
              View Plan
            </Button>
          </Link>
        ) : (
          /* Starter / Pro: View Plan + Add to Cart */
          <div className="mt-auto flex gap-3">
            <Link href={viewPlanHref} className="flex-1">
              <Button
                variant="outline"
                className="w-full rounded-full border-slate-300 text-slate-600 font-semibold py-6 hover:border-[#0166A7] hover:text-[#0166A7] transition-all"
              >
                View Plan
              </Button>
            </Link>

            {canAddToCart ? (
              <div className="flex-1">
                {isOtherPlanInCart ? (
                  <div
                    title="Another plan for this course is already in your cart. Remove it from the cart to choose a different plan."
                    className="w-full h-full cursor-not-allowed"
                  >
                    <Button
                      variant="outline"
                      disabled
                      className="w-full rounded-full font-bold py-6 transition-all flex items-center justify-center gap-2 bg-slate-50 text-slate-500 border-slate-200 pointer-events-none"
                    >
                      <CircleSlash className="w-4 h-4" /> Unavailable
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleCartToggle}
                    className={`w-full rounded-full font-bold py-6 transition-all flex items-center justify-center gap-2 ${
                      addedToCart
                        ? "bg-[#0166A7] border-[#0166A7] text-white hover:bg-white hover:text-[#0166A7] hover:border-[#0166A7]"
                        : "border-slate-300 text-slate-700 hover:bg-[#0166A7] hover:text-white hover:border-[#0166A7]"
                    }`}
                  >
                    {addedToCart ? (
                      <>
                        Added to Cart <Trash2 className="w-4 h-4" />
                      </>
                    ) : (
                      "Add to Cart"
                    )}
                  </Button>
                )}
              </div>
            ) : (
              /* Fallback for pages that don't provide courseId (e.g. /plans) */
              <Link href={buyHref} className="flex-1">
                <Button
                  variant="outline"
                  className="w-full rounded-full border-slate-300 text-slate-700 font-bold py-6 hover:bg-[#0166A7] hover:text-white hover:border-[#0166A7] transition-all"
                >
                  {buyLabel}
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
