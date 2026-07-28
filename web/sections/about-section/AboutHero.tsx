"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import Image from "next/image";

const StarDustSVG = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    style={{ fill: "currentColor" }}
  >
    <path d="M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z" />
  </svg>
);

export default function AboutHero() {
  const scrollToNextSection = () => {
    const nextSection = document.getElementById("about-story-section");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative pt-24 pb-10 px-6 md:pt-28 md:pb-12 bg-gradient-to-b from-blue-50/70 to-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none -z-10 text-blue-200">
        <StarDustSVG className="absolute top-10 left-5 w-8 h-8 md:w-12 md:h-12 opacity-20" />
        <StarDustSVG className="absolute top-1/4 right-5 w-10 h-10 md:w-16 md:h-16 opacity-10 rotate-45" />
        <StarDustSVG className="absolute bottom-10 left-1/4 w-6 h-6 md:w-10 md:h-10 opacity-15" />
        <StarDustSVG className="hidden md:block absolute top-1/2 left-1/2 w-8 h-8 opacity-20 -rotate-12" />
        <StarDustSVG className="absolute bottom-1/4 right-1/4 w-10 h-10 md:w-14 md:h-14 opacity-10" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Heading, Description, and Stats */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 flex flex-col items-start"
          >
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#0F172A] tracking-tight leading-[1.1] mb-6">
              Redefining tech training for a
              <br />
              <span className="text-[#0166A7] relative inline-block mt-2">
                Future-Proof Career
                <span className="absolute left-0 bottom-1.5 w-full h-2 md:h-3 bg-[#c3e8e4]/60 -z-10 rounded-full" />
              </span>
            </h1>

            {/* Core Description */}
            <p className="text-slate-500 text-base md:text-lg leading-relaxed mb-8 max-w-xl">
              At Auto-Mate, we're not just teaching skills; we're cultivating the
              next generation of leaders who will shape the future of technology.
              Our mission is to empower professionals with the practical,
              high-demand skills needed to thrive in an automated world.
            </p>

            {/* Key stats dashboard */}
            <div className="grid grid-cols-3 gap-6 md:gap-8 border-t border-slate-200/80 pt-8 w-full max-w-lg">
              <div>
                <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0166A7]">10K+</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">Active Learners</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0166A7]">95%</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">Placement Rate</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0166A7]">50+</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">MNC Partners</p>
              </div>
            </div>

            {/* Read Story Scroll Button */}
            <div className="mt-8">
              <button
                onClick={scrollToNextSection}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#0166A7] hover:text-[#004d7c] group transition-colors cursor-pointer"
              >
                Read Our Story
                <ArrowDown size={16} className="group-hover:translate-y-1 transition-transform duration-200 text-[#0166A7]" />
              </button>
            </div>
          </motion.div>

          {/* Right Column: Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative w-full aspect-[4/3] sm:aspect-square max-w-[460px] mx-auto lg:mr-0 mt-12 lg:mt-0 flex items-center justify-center"
          >
            {/* Background glowing blob */}
            <div className="absolute w-[90%] h-[90%] rounded-[40px] bg-gradient-to-tr from-[#0166A7]/20 to-blue-200/30 blur-3xl -z-10 animate-pulse" />

            {/* Styled Image Frame */}
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-slate-100 bg-slate-50 flex items-center justify-center">
              <Image
                src="/images/about-hero.png"
                alt="Automate Tech Education"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover hover:scale-105 transition-transform duration-700 ease-out"
                priority
              />
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
