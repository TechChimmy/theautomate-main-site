"use client";

import React, { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PremiumContactFormProps {
  courseTitle: string;
}

/**
 * Right column for the Premium plan detail page.
 * On submit, redirects to WhatsApp Web/app with a pre-filled message.
 * Phone number is read from NEXT_PUBLIC_WHATSAPP_NUMBER — never hardcoded.
 */
export function PremiumContactForm({ courseTitle }: PremiumContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required.";
    if (!email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address.";
    if (!phone.trim()) next.phone = "Phone number is required.";
    return next;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setErrors({});

    const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

    const baseMessage = `Hi,\nI'm interested in the Premium plan.\nCourse: ${courseTitle}\nPlan: Premium\nName: ${name}\nEmail: ${email}\nPhone: ${phone}`;
    const fullMessage = message.trim()
      ? `${baseMessage}\nMessage: ${message.trim()}`
      : baseMessage;

    const encoded = encodeURIComponent(fullMessage);
    window.open(`https://wa.me/${waNumber}?text=${encoded}`, "_blank");
  };

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 md:p-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-50 rounded-xl">
          <MessageCircle className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Contact Us</h2>
          <p className="text-sm text-slate-500">
            We&apos;ll get back to you on WhatsApp.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="pm-name" className="text-sm font-semibold text-gray-700">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="pm-name"
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-xl"
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="pm-email" className="text-sm font-semibold text-gray-700">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="pm-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl"
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="pm-phone" className="text-sm font-semibold text-gray-700">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="pm-phone"
            type="tel"
            placeholder="+91 00000 00000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-12 rounded-xl"
          />
          {errors.phone && (
            <p className="text-xs text-red-500">{errors.phone}</p>
          )}
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <Label htmlFor="pm-message" className="text-sm font-semibold text-gray-700">
            Additional Message
          </Label>
          <Textarea
            id="pm-message"
            placeholder="Tell us about your goals or any questions…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px] rounded-xl resize-none"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white h-14 rounded-full font-bold text-base transition-all duration-200 shadow-lg active:scale-95 flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          Send Message on WhatsApp
        </Button>

        <p className="text-center text-xs text-slate-400">
          You will be redirected to WhatsApp to complete the enquiry.
        </p>
      </form>
    </div>
  );
}
