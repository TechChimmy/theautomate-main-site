"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plan } from "@/lib/types/plan";

interface CourseOption {
  title: string;
  slug: string;
}

interface DetailsProps {
  setCourseKey: (val: string) => void;
  currentCourse: string;
  bundleId: string;
  setBundleId: (val: string) => void;
  bundles: Plan[];
  bundleTitle: string;
  bundlePrice: number;
  courses: CourseOption[];
  batch: string;
  setBatch: (val: string) => void;
  name: string;
  setName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  comments: string;
  setComments: (val: string) => void;
}

export default function PaymentDetails({
  setCourseKey,
  currentCourse,
  bundleId,
  setBundleId,
  bundles,
  bundleTitle,
  bundlePrice,
  courses,
  batch,
  setBatch,
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  comments,
  setComments,
}: DetailsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 md:space-y-10"
    >
      {/* Personal Details Section */}
      <section className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-gray-300">
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-300">
          <div className="p-2 bg-blue-50 rounded-lg text-[#1E90FF]">
            <User className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-[#0A3D62]">Personal Details</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-sm font-semibold text-gray-700"
            >
              Full Name
            </Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl focus:ring-[#1E90FF]"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-semibold text-gray-700"
            >
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
          <div className="sm:col-span-2 space-y-2">
            <Label
              htmlFor="phone"
              className="text-sm font-semibold text-gray-700"
            >
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
        </div>
      </section>

      {/* Course Selection Section */}
      <section className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-gray-300">
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-50">
          <div className="p-2 bg-blue-50 rounded-lg text-[#1E90FF]">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-[#0A3D62]">Course Selection</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Select Course
            </Label>
            <Select value={currentCourse} onValueChange={setCourseKey}>
              <SelectTrigger className="h-12 rounded-xl bg-white">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.slug} value={course.slug}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Select Plan
            </Label>
            <Select value={bundleId} onValueChange={setBundleId}>
              <SelectTrigger className="h-12 rounded-xl bg-white">
                <SelectValue placeholder="Select Plan" />
              </SelectTrigger>
              <SelectContent>
                {bundles.map((bundle) => (
                  <SelectItem key={bundle._id} value={bundle._id}>
                    {bundle.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label
              htmlFor="payment-amount"
              className="text-sm font-semibold text-gray-700"
            >
              Payment Amount (₹)
            </Label>
            <Input
              id="payment-amount"
              type="text"
              value={`₹${bundlePrice}`}
              readOnly
              className="h-12 rounded-xl bg-slate-50 border-[#1E90FF] text-slate-700 cursor-not-allowed"
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label
              htmlFor="comments"
              className="text-sm font-semibold text-gray-700"
            >
              Additional Comments
            </Label>
            <textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full min-h-[120px] rounded-xl border border-input px-3 py-3 text-sm focus:ring-2 focus:ring-[#1E90FF] outline-none transition-all"
              placeholder="Tell us about your goals..."
            />
          </div>
        </div>
      </section>
    </motion.div>
  );
}
