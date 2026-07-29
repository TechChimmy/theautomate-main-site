import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { PlanFeature } from "@/lib/types/plan";

interface PlanFeatureListProps {
  features: PlanFeature[];
  className?: string;
}

/**
 * Renders a list of plan features with included/excluded icons.
 * Extracted from PricingCard so it can be reused on the plan detail page.
 */
export function PlanFeatureList({ features, className }: PlanFeatureListProps) {
  if (!features || features.length === 0) return null;

  return (
    <ul className={`space-y-3 ${className ?? ""}`}>
      {features.map((feature, idx) => (
        <li key={idx} className="flex items-start gap-2.5 text-sm">
          {feature.included ? (
            <CheckCircle2 className="w-5 h-5 text-[#0166A7] shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
          )}
          <span
            className={
              feature.included
                ? "text-slate-700 font-medium"
                : "text-slate-400 line-through"
            }
          >
            {feature.title}
          </span>
        </li>
      ))}
    </ul>
  );
}
