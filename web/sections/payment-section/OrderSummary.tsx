"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, CreditCard, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Script from "next/script";
import PaymentStatusModal from "./PaymentStatusModal";

interface SummaryProps {
  courseName: string;
  courseKey: string;
  productUuid?: string;
  bundleTitle: string;
  customAmount: number;
  batch: string;
  userData: {
    name: string;
    email: string;
    phone: string;
    comments: string;
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function OrderSummary({
  courseName,
  courseKey,
  productUuid,
  bundleTitle,
  customAmount,
  batch,
  userData,
}: SummaryProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    status: "success" | "error" | "loading";
    message: string;
    orderId?: string;
    redirectUrl?: string;
    isExistingUser?: boolean;
  }>({
    isOpen: false,
    status: "loading",
    message: "",
  });

  const finalPrice = customAmount || 0;

  const handlePayment = async () => {
    // Validation check
    if (!userData.name || !userData.email || !userData.phone) {
      setModal({
        isOpen: true,
        status: "error",
        message:
          "Please fill in your name, email, and phone number before proceeding.",
      });
      return;
    }

    setIsProcessing(true);
    setModal({
      isOpen: true,
      status: "loading",
      message: "Initiating secure payment gateway...",
    });

    try {
      // 1. Create Order
      const response = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseKey,
          bundleTitle,
          amount: finalPrice,
        }),
      });

      if (!response.ok) {
        setModal({
          isOpen: true,
          status: "error",
          message: "Failed to create payment order. Please try again.",
        });
        return;
      }

      const order = await response.json();

      // 2. Initialize Razorpay
      console.log(
        "Initializing Razorpay with Key:",
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      );

      if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        setModal({
          isOpen: true,
          status: "error",
          message:
            "Razorpay Key ID is missing in the environment. Please check your deployment settings.",
        });
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Auto-Mate",
        description: `Enrollment for ${courseName}`,
        order_id: order.id,
        handler: async function (response: any) {
          setModal({
            isOpen: true,
            status: "loading",
            message: "Verifying payment...",
          });

          // 3. Verify Payment
          const verifyResponse = await fetch("/api/razorpay/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              course_id: courseKey,
              product_uuid: productUuid,
              course_name: courseName,
              bundle_id: bundleTitle,
              batch_type: batch,
              customer_name: userData.name,
              customer_email: userData.email,
              customer_phone: userData.phone,
              customer_comments: userData.comments,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            // 4. Sync to Google Sheets
            setModal({
              isOpen: true,
              status: "loading",
              message: "Finalizing your enrollment...",
            });

            try {
              await fetch("/api/sync-to-sheet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...userData,
                  course: courseName,
                  batch: batch,
                  amount: finalPrice,
                  paymentId: response.razorpay_payment_id,
                }),
              });
            } catch (syncError) {
              console.error("Sync failed:", syncError);
              // We don't block the success state if sync fails, but we log it
            }

            const isExistingUser = Boolean(verifyData.existingUser);
            const successMsg = isExistingUser
              ? "Payment verified! Your new course access has been added. Please log in to continue."
              : "Account created! Log in using the credentials sent to your email.";

            setModal({
              isOpen: true,
              status: "success",
              message: successMsg,
              orderId: verifyData.orderId,
              redirectUrl: verifyData.redirectUrl,
              isExistingUser,
            });

            // Removed auto-redirect so the user can click the "Download Invoice" button
            // if (verifyData.redirectUrl) {
            //   setTimeout(() => {
            //     window.location.href = verifyData.redirectUrl;
            //   }, 2000);
            // }
          } else {
            setModal({
              isOpen: true,
              status: "error",
              message:
                verifyData.error ||
                "Payment verification failed. Please contact support.",
            });
          }
        },
        prefill: {
          name: userData.name,
          email: userData.email,
          contact: userData.phone,
        },
        theme: {
          color: "#0A3D62",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setModal((prev) => ({ ...prev, isOpen: false }));
          },
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response: any) {
        setModal({
          isOpen: true,
          status: "error",
          message: response.error.description || "Payment process interrupted.",
        });
      });
      rzp1.open();
    } catch (error) {
      console.error("Payment Error:", error);
      setModal({
        isOpen: true,
        status: "error",
        message: "A connection error occurred. Please check your internet.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto p-8">
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full"
      >
        <Card className="border-none shadow-2xl overflow-hidden rounded-[32px] bg-white">
          {/* Header */}
          <div className="bg-[#0A3D62] p-5 md:p-6 text-white text-center">
            <p className="text-blue-200 text-xs font-bold uppercase tracking-[0.2em]">
              Order Summary
            </p>
          </div>

          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Course Details Row */}
            <div className="flex justify-between items-start gap-4 border-b border-gray-50 pb-6">
              <div className="space-y-1">
                <h3 className="font-bold text-[#0A3D62] text-lg leading-tight">
                  {courseName}
                </h3>
                <p className="text-sm text-slate-500">
                  {bundleTitle || "Standard Plan"}
                </p>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-md w-fit">
                  <Clock className="w-3.5 h-3.5 text-[#1E90FF]" />
                  <span className="text-xs font-semibold text-[#1E90FF] capitalize">
                    {batch} Batch
                  </span>
                </div>
              </div>
              <span className="font-bold text-xl text-[#0A3D62] whitespace-nowrap">
                ₹{finalPrice}
              </span>
            </div>

            {/* Pricing Table */}
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">
                  ₹{finalPrice}.00
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax / Processing</span>
                <span className="text-green-600 font-bold uppercase text-[10px] bg-green-50 px-2 py-0.5 rounded">
                  Free
                </span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-200">
                <span className="font-bold text-[#0A3D62]">Grand Total</span>
                <div className="text-right">
                  <span className="block font-black text-3xl text-[#1E90FF]">
                    ₹{finalPrice}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium italic">
                    Inclusive of all taxes
                  </span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Button
              className="w-full bg-[#1B262C] hover:bg-gray-500 h-14 md:h-16 rounded-full text-sm font-bold transition-all duration-300 shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePayment}
              disabled={isProcessing || finalPrice <= 0}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin mr-3" />
              ) : (
                <CreditCard className="w-5 h-5 mr-3" />
              )}
              {finalPrice <= 0
                ? "Enter Amount to Proceed"
                : isProcessing
                  ? "Processing..."
                  : "Proceed to Payment"}
            </Button>

            {/* Trust Footer */}
            <div className="flex items-center justify-center gap-2 text-gray-400 text-[11px] font-medium uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Verified & Secure Checkout
            </div>
          </CardContent>
        </Card>

        {/* Trust Badge - More compact on mobile */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-2xl border-l-4 border-[#1E90FF] flex items-center gap-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#1E90FF]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <p className="text-xs md:text-sm text-blue-900 font-semibold italic">
            Join 5,000+ students already mastering automation.
          </p>
        </div>
      </motion.div>

      <PaymentStatusModal
        isOpen={modal.isOpen}
        status={modal.status}
        message={modal.message}
        orderId={modal.orderId}
        redirectUrl={modal.redirectUrl}
        isExistingUser={modal.isExistingUser}
        onClose={() => setModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
