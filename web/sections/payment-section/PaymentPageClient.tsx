"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import OrderSummary from "./OrderSummary";

interface Props {
  courseSlug: string;
  courseTitle: string;
  productUuid?: string;
  bundleId: string;
  bundleTitle: string;
  bundlePrice: number;
  batch: string;
  initialName: string;
  initialEmail: string;
  initialPhone: string;
}

/**
 * Client component — owns mutable form state only.
 * Course + plan are already resolved server-side and shown as read-only.
 * No dropdowns, no STATIC_COURSES, no client-side fetches.
 */
export default function PaymentPageClient({
  courseSlug,
  courseTitle,
  productUuid,
  bundleTitle,
  bundlePrice,
  batch: initialBatch,
  initialName,
  initialEmail,
  initialPhone,
}: Props) {
  const [batch,    setBatch]    = useState(initialBatch);
  const [name,     setName]     = useState(initialName);
  const [email,    setEmail]    = useState(initialEmail);
  const [phone,    setPhone]    = useState(initialPhone);
  const [comments, setComments] = useState("");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 md:pt-32 md:pb-24">

      {/* Page heading */}
      <div className="mb-12 text-center lg:text-left">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold bg-clip-text text-transparent
                       bg-gradient-to-r from-[#0A3D62] via-[#1E90FF] to-[#0A3D62] leading-tight pb-2">
          Secure Checkout
        </h1>
        <p className="text-slate-500 text-sm md:text-base max-w-2xl lg:mx-0 mx-auto">
          Complete the form below to finalise your enrolment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

        {/* ── Left column: forms ── */}
        <div className="lg:col-span-7 order-1 space-y-6 md:space-y-10">

          {/* ── Enrolment summary (read-only) ── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-100">
              <div className="p-2 bg-blue-50 rounded-lg text-[#1E90FF]">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#0A3D62]">Your Selection</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Course — read-only */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Course</Label>
                <div className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 flex items-center text-slate-700 font-medium text-sm">
                  {courseTitle}
                </div>
              </div>

              {/* Plan — read-only */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Plan</Label>
                <div className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 flex items-center text-slate-700 font-medium text-sm">
                  {bundleTitle}
                </div>
              </div>

              {/* Batch — editable */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Batch Type</Label>
                <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E90FF]"
                >
                  <option value="weekday">Weekday (Mon–Fri)</option>
                  <option value="weekend">Weekend (Sat–Sun)</option>
                </select>
              </div>

              {/* Amount — read-only */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Amount</Label>
                <div className="h-12 rounded-xl border border-[#1E90FF] bg-slate-50 px-4 flex items-center text-[#0A3D62] font-bold text-sm">
                  ₹{bundlePrice.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </motion.section>

          {/* ── Personal details ── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-100">
              <div className="p-2 bg-blue-50 rounded-lg text-[#1E90FF]">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#0A3D62]">Personal Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                  Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  placeholder="+91 00000 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="comments" className="text-sm font-semibold text-gray-700">
                  Additional Comments
                </Label>
                <textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Tell us about your goals…"
                  className="w-full min-h-[120px] rounded-xl border border-input px-3 py-3 text-sm focus:ring-2 focus:ring-[#1E90FF] outline-none transition-all"
                />
              </div>
            </div>
          </motion.section>

        </div>

        {/* ── Right column: order summary + pay button ── */}
        <div className="lg:col-span-5 order-2 lg:sticky lg:top-28">
          <OrderSummary
            courseName={courseTitle}
            courseKey={courseSlug}
            productUuid={productUuid}
            bundleTitle={bundleTitle}
            customAmount={bundlePrice}
            batch={batch}
            userData={{ name, email, phone, comments }}
          />
        </div>

      </div>
    </div>
  );
}
