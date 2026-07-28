"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";

/* ─────────────────────────────────────────
   Types  (kept identical to original so
   page.tsx props stay untouched)
───────────────────────────────────────── */
export interface Testimonial {
  name: string;
  image: string;
  text: string;
}

interface TestimonialsProps {
  initialData: Testimonial[];
}

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const AUTOPLAY_MS = 2000;
const EASE = "power2.inOut";
const DURATION = 0.55;

/* ─────────────────────────────────────────
   Individual card  (memoised)
───────────────────────────────────────── */
const TestimonialCard = React.memo(function TestimonialCard({
  t,
}: {
  t: Testimonial;
}) {
  return (
    <div
      className="
        flex-shrink-0
        w-[85vw] sm:w-[320px] md:w-[360px] lg:w-[420px]
        bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)]
        px-8 py-8 flex flex-col gap-5
        select-none
      "
    >
      {/* Faded quote icon */}
      <div
        aria-hidden="true"
        className="text-[#0166A7] font-serif leading-none"
        style={{ fontSize: "4.5rem", lineHeight: 1, opacity: 0.12 }}
      >
        {"\u201C"}
      </div>

      {/* Review text */}
      <p className="text-slate-600 text-sm md:text-base leading-relaxed -mt-4 flex-1">
        {t.text}
      </p>

      {/* Author row */}
      <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
        <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-[#0166A7]/20">
          <Image
            src={t.image || "/avatars/placeholder.png"}
            alt={t.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
        <div>
          <p className="font-semibold text-slate-900 text-sm leading-tight">
            {t.name}
          </p>
          <p className="text-[#0166A7] text-xs mt-0.5 font-medium">Learner</p>
        </div>
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────
   Main component
───────────────────────────────────────── */
export default function Testimonials({ initialData }: TestimonialsProps) {
  const testimonials = useMemo(() => initialData ?? [], [initialData]);
  const total = testimonials.length;

  /* We render the list THREE times (tripled) so we can loop infinitely
     without any visible jump. */
  const tripled = useMemo(
    () => [...testimonials, ...testimonials, ...testimonials],
    [testimonials],
  );

  const stripRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const isTransitioning = useRef(false);
  const isHoveredRef = useRef(false);

  const startMarquee = useCallback(() => {
    if (!stripRef.current || total === 0) return;

    // Clean up any existing tween
    if (tweenRef.current) {
      tweenRef.current.kill();
    }

    const card = stripRef.current.children[0] as HTMLElement | undefined;
    if (!card) return;

    const gap = parseInt(getComputedStyle(stripRef.current).gap || "24", 10);
    const cardWidth = card.offsetWidth;
    const setWidth = total * (cardWidth + gap);

    // Initial position: start at 0
    gsap.set(stripRef.current, { x: 0 });

    // Speed: 30 pixels per second (slow, smooth marquee)
    const speed = 30;
    const duration = setWidth / speed;

    // Linear translation from x: 0 to x: -setWidth (right to left)
    tweenRef.current = gsap.to(stripRef.current, {
      x: -setWidth,
      ease: "none",
      duration: duration,
      repeat: -1,
    });

    // Respect hover state if already hovered when marquee starts
    if (isHoveredRef.current) {
      tweenRef.current.pause();
    }
  }, [total]);

  const nudge = useCallback((direction: "prev" | "next") => {
    if (!stripRef.current || total === 0 || isTransitioning.current) return;

    isTransitioning.current = true;

    // 1. Kill the active marquee tween
    if (tweenRef.current) {
      tweenRef.current.kill();
    }

    const card = stripRef.current.children[0] as HTMLElement | undefined;
    if (!card) {
      isTransitioning.current = false;
      return;
    }

    const gap = parseInt(getComputedStyle(stripRef.current).gap || "24", 10);
    const cardWidth = card.offsetWidth;
    const step = cardWidth + gap;
    const setWidth = total * (cardWidth + gap);

    // 2. Get current X
    const currentX = gsap.getProperty(stripRef.current, "x") as number;

    // 3. Compute target X
    let targetX = direction === "prev" ? currentX + step : currentX - step;
    let fromX = currentX;

    // 4. Wrap coordinates seamlessly
    if (targetX > 0) {
      fromX = currentX - setWidth;
      targetX = targetX - setWidth;
      gsap.set(stripRef.current, { x: fromX });
    } else if (targetX < -setWidth) {
      fromX = currentX + setWidth;
      targetX = targetX + setWidth;
      gsap.set(stripRef.current, { x: fromX });
    }

    // 5. Animate to the target
    gsap.to(stripRef.current, {
      x: targetX,
      duration: 0.5,
      ease: "power2.out",
      onComplete: () => {
        isTransitioning.current = false;

        // 6. Resume marquee loop from the new position
        const speed = 30; // base speed
        const remainingDistance = -setWidth - targetX;
        const remainingDuration = Math.abs(remainingDistance) / speed;

        tweenRef.current = gsap.to(stripRef.current, {
          x: -setWidth,
          ease: "none",
          duration: remainingDuration,
          onComplete: () => {
            // Once we reach the end of the loop, start standard marquee from x: 0
            startMarquee();
          }
        });

        // Respect hover state
        if (isHoveredRef.current) {
          tweenRef.current.pause();
        }
      }
    });
  }, [total, startMarquee]);

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    if (!isTransitioning.current) {
      tweenRef.current?.pause();
    }
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    if (!isTransitioning.current) {
      tweenRef.current?.play();
    }
  };

  useEffect(() => {
    // Wait for the DOM layout to complete before measuring
    const timer = setTimeout(() => {
      startMarquee();
    }, 100);

    const onResize = () => {
      startMarquee();
    };

    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      if (tweenRef.current) {
        tweenRef.current.kill();
      }
    };
  }, [startMarquee]);

  if (total === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* ── Heading ── */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            What <span className="text-[#0166A7]">Learners</span> Say About{" "}
            <span className="text-[#0166A7]">The-Automate</span>
          </h2>
          <p className="mt-4 text-slate-500 text-base max-w-xl mx-auto leading-relaxed">
            Real words from people across different industries who transformed
            their careers with us.
          </p>
        </div>

        {/* ── Carousel viewport (clips overflow) ── */}
        <div
          className="overflow-hidden py-4 -my-4 cursor-pointer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Strip — rendered 3× for seamless loop */}
          <div
            ref={stripRef}
            className="flex gap-6 will-change-transform"
            style={{ width: "max-content" }}
          >
            {tripled.map((t, i) => (
              <TestimonialCard key={`${t.name}-${i}`} t={t} />
            ))}
          </div>
        </div>

        {/* ── Dashboard Controls (Centered Nudge Buttons Only) ── */}
        <div className="flex items-center justify-center gap-4 mt-12 pt-6 border-t border-slate-100 max-w-5xl mx-auto">
          <button
            onClick={() => nudge("prev")}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-600 shadow-sm hover:border-[#0166A7] hover:text-[#0166A7] active:scale-95 transition-all duration-150"
            aria-label="Scroll left"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => nudge("next")}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-600 shadow-sm hover:border-[#0166A7] hover:text-[#0166A7] active:scale-95 transition-all duration-150"
            aria-label="Scroll right"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
