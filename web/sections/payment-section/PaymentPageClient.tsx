"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  const [finalPrice, setFinalPrice] = useState(bundlePrice);
  const [isUpgradeEligible, setIsUpgradeEligible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isCheckingUpgrade, setIsCheckingUpgrade] = useState(false);

  const [resolvedProductUuid, setResolvedProductUuid] = useState(productUuid);
  const [resolvedCourseTitle, setResolvedCourseTitle] = useState(courseTitle);
  const [isPhoneAutofilled, setIsPhoneAutofilled] = useState(!!phoneParam);

  useEffect(() => {
    // Only check if it's a valid looking email and they are trying to buy Pro/Premium
    const isProPlan = bundleTitle.toLowerCase().includes("pro") || bundleTitle.toLowerCase().includes("premium");
    if (!email || !email.includes("@") || !isProPlan) {
      setFinalPrice(bundlePrice);
      setIsUpgradeEligible(false);
      setTimeRemaining(null);
      return;
    }

    const checkUpgrade = async () => {
      setIsCheckingUpgrade(true);
      try {
        const response = await fetch("/api/razorpay/check-upgrade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, productUuid, targetBundleTitle: bundleTitle, targetBundlePrice: bundlePrice }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.eligible && data.price !== undefined) {
            setFinalPrice(data.price);
            setIsUpgradeEligible(true);
            setTimeRemaining(Math.round(data.timeRemainingHours || 120));
            if (data.resolvedProductUuid) setResolvedProductUuid(data.resolvedProductUuid);
            if (data.resolvedCourseTitle) setResolvedCourseTitle(data.resolvedCourseTitle);
            if (data.resolvedBatchType) setBatch(data.resolvedBatchType);
            if (data.resolvedPhone && !phone) {
              setPhone(data.resolvedPhone);
              setIsPhoneAutofilled(true);
            }
          } else {
            setFinalPrice(bundlePrice);
            setIsUpgradeEligible(false);
            setTimeRemaining(null);
          }
        }
      } catch (error) {
        console.error("Upgrade check failed:", error);
      } finally {
        setIsCheckingUpgrade(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      checkUpgrade();
    }, 800);

    return () => clearTimeout(delayDebounce);
  }, [email, bundleTitle, bundlePrice, productUuid, phone]);

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
            
            <AnimatePresence>
              {isUpgradeEligible && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
                >
                  <div className="bg-white p-2 rounded-full shadow-sm text-blue-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 text-sm">Special Upgrade Offer Available!</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      Since you purchased the Starter plan recently, you can upgrade to {bundleTitle} for just ₹{finalPrice.toLocaleString("en-IN")}. 
                      {timeRemaining !== null && ` Offer expires in ~${timeRemaining} hours.`}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Course — read-only */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Course</Label>
                <div className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 flex items-center text-slate-700 font-medium text-sm">
                  {resolvedCourseTitle || courseTitle || "Your Course"}
                </div>
              </div>

              {/* Plan — read-only */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Plan</Label>
                <div className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 flex items-center text-slate-700 font-medium text-sm">
                  {bundleTitle}
                </div>
              </div>

              {/* Batch — editable unless upgrade */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Batch Type</Label>
                <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  disabled={isUpgradeEligible}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E90FF] disabled:bg-slate-50 disabled:text-slate-500 disabled:opacity-100"
                >
                  <option value="weekday">Weekday (Mon–Fri)</option>
                  <option value="weekend">Weekend (Sat–Sun)</option>
                </select>
              </div>

              {/* Amount — read-only */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Amount</Label>
                <div className={`h-12 rounded-xl border flex items-center px-4 font-bold text-sm transition-colors ${isUpgradeEligible ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-[#1E90FF] text-[#0A3D62]'}`}>
                  {isCheckingUpgrade ? (
                    <span className="text-xs font-normal text-slate-500 animate-pulse">Calculating...</span>
                  ) : (
                    <>
                      ₹{finalPrice.toLocaleString("en-IN")}
                      {isUpgradeEligible && <span className="ml-2 text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Pro-rated</span>}
                    </>
                  )}
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
                  disabled={isUpgradeEligible && !!initialName}
                  className={`h-12 rounded-xl ${(isUpgradeEligible && !!initialName) ? "bg-slate-50 cursor-not-allowed text-slate-500" : ""}`}
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
                  disabled={isUpgradeEligible && !!initialEmail}
                  className={`h-12 rounded-xl ${(isUpgradeEligible && !!initialEmail) ? "bg-slate-50 cursor-not-allowed text-slate-500" : ""}`}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                  Phone Number
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-medium text-sm">+91</span>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 10) setPhone(val);
                    }}
                    disabled={isUpgradeEligible && isPhoneAutofilled}
                    className={`h-12 rounded-xl pl-12 ${(isUpgradeEligible && isPhoneAutofilled) ? "bg-slate-50 cursor-not-allowed text-slate-500" : ""}`}
                  />
                </div>
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
            courseName={resolvedCourseTitle || courseTitle}
            courseKey={courseSlug}
            productUuid={resolvedProductUuid || productUuid}
            bundleTitle={bundleTitle}
            customAmount={finalPrice}
            targetBundlePrice={bundlePrice}
            batch={batch}
            userData={{ name, email, phone, comments }}
          />
        </div>

      </div>
    </div>
  );
}
