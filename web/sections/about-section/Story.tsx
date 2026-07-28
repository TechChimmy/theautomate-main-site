"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const milestones = [
  {
    year: "2022",
    title: "The Vision: Shifting from Slides to Skills",
    image: "/images/story-2022.png",
    description: "Founded by senior QA engineers who noticed that traditional academies relied on passive slides and basic script writing. We set out to design a rigorous, builder-focused program that teaches standard software patterns, modern frameworks, and true automation principles.",
    points: [
      "Replacing passive slides with active programming sandbox environments",
      "Focusing on modular, scalable software design testing patterns",
      "Bridging the knowledge gap between manual testing and SDET roles"
    ]
  },
  {
    year: "2023",
    title: "Going Hands-On: Production-Ready Pipelines",
    image: "/images/story-2023.png",
    description: "We eliminated theoretical training entirely and introduced our Live Project ecosystem. Learners started designing real-world automation test suites, debugging execution threads, and integrating CI/CD pipelines in production-equivalent setups from day one.",
    points: [
      "Integrating test frameworks with Github Actions & CI/CD tools",
      "Deploying test run automation across parallel browser grids",
      "Diagnosing and debugging real-world software compilation bugs"
    ]
  },
  {
    year: "2024",
    title: "Global Impact: Placing Leadership-Ready SDETs",
    image: "/images/story-2024.png",
    description: "Expanded our community to 10K+ active learners worldwide and built active placement networks with 50+ leading MNC hiring partners. Today, our graduates lead QA teams and software architectures across global industries.",
    points: [
      "Graduating 10,000+ active automated testing experts",
      "Establishing placement partnerships with 50+ hiring MNCs",
      "Empowering software testers to pivot to high-paying SDET careers"
    ]
  }
];

export default function Story() {
  return (
    <section id="about-story-section" className="py-12 md:py-16 bg-[#F8FAFC] border-t border-slate-100 relative">
      {/* Soft background glow decorator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[60%] rounded-full bg-blue-50/20 blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
          
          {/* Left Column: Sticky Sidebar on Desktop */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 self-start text-left select-none">
            <span className="text-xs font-bold text-[#0166A7] tracking-widest uppercase mb-2 block">
              How We Evolved
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
              Our <span className="text-[#0166A7]">Journey</span>
            </h2>
            <p className="mt-4 text-slate-500 text-sm sm:text-base leading-relaxed max-w-sm">
              From a single vision to a global automation training academy, we've continuously innovated the way engineers learn code.
            </p>
            {/* Visual Indicator Line */}
            <div className="hidden lg:block w-0.5 bg-slate-200 h-24 mt-8 relative rounded-full overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-[#0166A7] rounded-full" />
            </div>
          </div>

          {/* Right Column: Vertical Scrolling Milestones */}
          <div className="lg:col-span-8 flex flex-col gap-20 text-left">
            {milestones.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="flex flex-col items-start border-b border-slate-200/50 pb-16 last:border-b-0 last:pb-0"
              >
                {/* Year Typography */}
                <span className="text-5xl md:text-6xl font-black text-[#0166A7]/25 leading-none select-none tracking-tight">
                  {item.year}
                </span>

                {/* Milestone Title */}
                <h3 className="text-2xl font-extrabold text-[#0F172A] mt-4 leading-snug">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-slate-500 text-sm sm:text-base leading-relaxed mt-4">
                  {item.description}
                </p>

                {/* Highlights List */}
                <ul className="flex flex-col gap-3 mt-6 w-full">
                  {item.points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600">
                      <span className="w-5 h-5 rounded-full bg-[#c3e8e4]/60 text-[#1b5e55] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                {/* Wide Letterbox Banner Image */}
                <div className="relative w-full aspect-[16/7] rounded-3xl overflow-hidden shadow-md border border-slate-100/80 bg-slate-50 mt-8 group select-none">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                  />
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
