import React, { useId } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  showNumber?: boolean;
  size?: number;
  className?: string;
  starClassName?: string;
}

/**
 * Renders up to `maxRating` stars with precise fractional fill.
 *
 * How fractional fill works:
 *   Each star gets fill% = clamp(rating - starIndex, 0, 1) × 100.
 *   A unique SVG linearGradient per star goes from yellow (fill%) to
 *   light-grey (remainder), so a 4.2 rating renders 4 full yellow stars
 *   and one star that is 20% yellow / 80% grey.
 *
 *   Examples (maxRating = 5):
 *     5.0 → all five stars 100% yellow
 *     4.5 → four full + one 50/50
 *     4.2 → four full + one 20% yellow
 *     3.7 → three full + one 70% yellow + one empty
 *
 * The numeric label uses one decimal place (4.67 → "4.7").
 *
 * Existing props are fully preserved — backward-compatible update.
 */
export function StarRating({
  rating,
  maxRating = 5,
  showNumber = false,
  size = 16,
  className,
  starClassName,
}: StarRatingProps) {
  // useId gives a stable, unique prefix so multiple instances on the same
  // page don't collide on SVG gradient IDs.
  const uid = useId().replace(/:/g, "");

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {/* Hidden SVG that only contains gradient definitions */}
      <svg width={0} height={0} className="absolute overflow-hidden" aria-hidden="true">
        <defs>
          {Array.from({ length: maxRating }, (_, i) => {
            const fillPct = Math.min(Math.max(rating - i, 0), 1) * 100;
            return (
              <linearGradient
                key={i}
                id={`${uid}-star-${i}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset={`${fillPct}%`} stopColor="#facc15" /* yellow-400 */ />
                <stop offset={`${fillPct}%`} stopColor="#e2e8f0" /* slate-200  */ />
              </linearGradient>
            );
          })}
        </defs>
      </svg>

      {Array.from({ length: maxRating }, (_, i) => (
        <Star
          key={i}
          size={size}
          style={{ fill: `url(#${uid}-star-${i})`, color: "transparent" }}
          strokeWidth={1.2}
          stroke="#d1d5db" /* gray-300 — subtle outline on all stars */
          className={cn(starClassName)}
          aria-hidden="true"
        />
      ))}

      {showNumber && (
        <span className="text-xs text-slate-500 ml-1 font-medium mt-0.5">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
}
