"use client";

import React, { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import Image from "next/image";

const stats = [
  {
    label: "Automation Completed",
    value: 10,
    suffix: "K+",
    icon: <Image src="/icons/autocomplete.png" alt="" width={48} height={48} className="w-10 h-10 object-contain" />,
    description: "Frameworks deployed",
    bgClass: "bg-teal-50/80",
    textClass: "text-teal-600",
  },
  {
    label: "Industrial Courses",
    value: 20,
    suffix: "",
    icon: <Image src="/icons/courses.png" alt="" width={48} height={48} className="w-10 h-10 object-contain" />,
    description: "Expert-led curriculum",
    bgClass: "bg-blue-50/80",
    textClass: "text-blue-600",
  },
  {
    label: "Skilled Experts",
    value: 10,
    suffix: "",
    icon: <Image src="/icons/expert.png" alt="" width={48} height={48} className="w-10 h-10 object-contain" />,
    description: "Industry veterans",
    bgClass: "bg-rose-50/80",
    textClass: "text-rose-600",
  },
  {
    label: "Happy Students",
    value: 5,
    suffix: "K+",
    icon: <Image src="/icons/students.png" alt="" width={48} height={48} className="w-10 h-10 object-contain" />,
    description: "Global alumni network",
    bgClass: "bg-amber-50/80",
    textClass: "text-amber-600",
  },
];

export default function Achievements() {
  return (
    <section className="py-10 md:py-12 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Subtle background glow decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[60%] rounded-full bg-blue-50/40 blur-3xl -z-10 pointer-events-none" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative z-10">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 flex flex-col items-center text-center shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_15px_45px_rgba(1,102,167,0.07)] hover:-translate-y-1.5 transition-all duration-300 group relative overflow-hidden"
            >
              {/* Background gradient pill glow on hover */}
              <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

              {/* Icon Container with Custom Colors */}
              <div className={`mb-6 p-4 rounded-[22px] ${stat.bgClass} ${stat.textClass} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                {stat.icon}
              </div>

              {/* Counter and Suffix */}
              <div className="flex items-baseline justify-center gap-0.5 mt-2">
                <Counter value={stat.value} className="text-4xl md:text-5xl font-black text-[#0F172A] tracking-tight" />
                <span className="text-3xl md:text-4xl font-extrabold text-[#0166A7]">
                  {stat.suffix}
                </span>
              </div>

              {/* Label */}
              <p className="text-base md:text-lg font-bold text-[#0F172A] mt-4 leading-tight">
                {stat.label}
              </p>
              
              {/* Description */}
              <p className="text-sm text-slate-400 mt-2 font-medium">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Counter({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10px" });

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [motionValue, value, isInView]);

  useEffect(() => {
    springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat("en-US").format(
          Math.floor(latest),
        );
      }
    });
  }, [springValue]);

  return (
    <span
      ref={ref}
      className={className}
    >
      0
    </span>
  );
}
