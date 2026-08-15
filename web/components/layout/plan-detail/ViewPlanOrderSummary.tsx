"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plan } from "@/lib/types/plan";

interface ViewPlanOrderSummaryProps {
  plan: Plan;
  courseSlug: string;
  courseTitle: string;
}

/**
 * Right column for Starter / Pro plan detail pages.
 * Shows a mini order summary and redirects to the existing /payment page.
 * All course access is self-paced and recorded-video based.
 */
export function ViewPlanOrderSummary({
  plan,
  courseSlug,
  courseTitle,
}: ViewPlanOrderSummaryProps) {
  const router = useRouter();

  const handleProceed = () => {
    const params = new URLSearchParams();
    params.set("course", courseSlug);
    params.set("bundleId", plan._id);
    params.set("bundleTitle", plan.title);
    params.set("amount", plan.price.toString());
    router.push(`/payment?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#0A3D62] px-6 py-5 text-white text-center">
        <p className="text-blue-200 text-xs font-bold uppercase tracking-[0.2em]">
          Order Summary
        </p>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Course + plan row */}
        <div className="flex justify-between items-start gap-4 border-b border-slate-50 pb-6">
          <div className="space-y-1">
            <h3 className="font-bold text-[#0A3D62] text-lg leading-tight">
              {courseTitle}
            </h3>
            <p className="text-sm text-slate-500">{plan.title}</p>
          </div>
          <span className="font-bold text-xl text-[#0A3D62] whitespace-nowrap">
            ₹{plan.price.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Pricing rows */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium text-gray-900">
              ₹{plan.price.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax / Processing</span>
            <span className="text-green-600 font-bold uppercase text-[10px] bg-green-50 px-2 py-0.5 rounded">
              Free
            </span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-200">
            <span className="font-bold text-[#0A3D62]">Grand Total</span>
            <div className="text-right">
              <span className="block font-black text-3xl text-[#1E90FF]">
                ₹{plan.price.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-gray-400 font-medium italic">
                Inclusive of all taxes
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={handleProceed}
          className="w-full bg-[#1B262C] hover:bg-gray-600 h-14 rounded-full text-sm font-bold transition-all duration-300 shadow-xl active:scale-95"
        >
          <CreditCard className="w-5 h-5 mr-2" />
          Proceed to Checkout
        </Button>

        <p className="text-center text-[11px] text-gray-400 uppercase tracking-wider">
          🔒 Verified &amp; Secure Checkout
        </p>
      </div>
    </div>
  );
}
