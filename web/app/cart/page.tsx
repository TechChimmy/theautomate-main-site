"use client";

import { CartItem, getCart, removeFromCart } from "@/lib/services/cart";
import { useState, useEffect } from "react";
import { Trash2, ShoppingCart, CreditCard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => setCartItems(getCart());

    load();
    setLoading(false);

    // Same-tab cart changes
    window.addEventListener("cart-updated", load);
    // Cross-tab changes
    const onStorage = (e: StorageEvent) => {
      if (e.key === "automate-learning-cart") load();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("cart-updated", load);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const handleRemove = (courseId: string, selectedPlanId: string) => {
    removeFromCart(courseId, selectedPlanId);
    // cart-updated event triggers the load() listener above
  };

  // Total is the sum of each item's selectedPlanPrice
  const total = cartItems.reduce(
    (sum, item) => sum + item.selectedPlanPrice,
    0
  );

  // Build checkout URL.
  // For multi-item carts we pass fromCart=1 and let the payment page
  // read all items directly from localStorage — no URL-length issues.
  // For single-item carts we keep the existing URL param shape so
  // direct "Buy Plan" links (not from cart) continue to work unchanged.
  const buildCheckoutUrl = (): string => {
    if (cartItems.length === 0) return "/payment";

    if (cartItems.length === 1) {
      // Single item — use the existing URL param shape (fully backward compatible)
      const item = cartItems[0];
      const p = new URLSearchParams();
      p.set("course", item.courseSlug);
      p.set("bundleId", item.selectedPlanId);
      p.set("bundleTitle", item.selectedPlanTitle);
      p.set("amount", item.selectedPlanPrice.toString());
      return `/payment?${p.toString()}`;
    }

    // Multiple items — signal the payment page to read the cart from localStorage
    return `/payment?fromCart=1&amount=${total}`;
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading cart…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
          <p className="mt-2 text-gray-500">
            {cartItems.length}{" "}
            {cartItems.length === 1 ? "course" : "courses"} in your cart
          </p>
        </div>

        {/* Empty state */}
        {cartItems.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-800">
              Your cart is empty
            </h2>
            <p className="mt-2 text-gray-500">
              Browse courses and add them to your cart.
            </p>
            <Link
              href="/courses"
              className="mt-6 inline-block rounded-full bg-[#0166A7] px-8 py-3 text-sm font-semibold text-white hover:bg-[#01538a] transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

            {/* ── Cart items ── */}
            <div className="space-y-4 lg:col-span-2">
              {cartItems.map((item) => (
                <div
                  key={`${item.courseId}-${item.selectedPlanId}`}
                  className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row"
                >
                  {/* Thumbnail */}
                  <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:w-48">
                    {item.thumbnailUrl ? (
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.courseTitle}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      {/* Course title */}
                      <h2 className="text-lg font-semibold text-gray-900">
                        {item.courseTitle}
                      </h2>

                      {/* Plan badge row */}
                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        <span className="inline-block rounded-full bg-[#EAF4FD] px-3 py-1 text-xs font-semibold text-[#0166A7]">
                          {item.selectedPlanTitle}
                        </span>
                        <span className="text-base font-bold text-slate-800">
                          ₹{item.selectedPlanPrice.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() =>
                        handleRemove(item.courseId, item.selectedPlanId)
                      }
                      className="mt-4 flex w-fit items-center gap-2 text-sm font-medium text-red-500 transition-colors hover:text-red-700"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Order summary ── */}
            <div className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                Order Summary
              </h2>

              <div className="my-6 border-t border-gray-100" />

              {/* Per-item price lines */}
              <div className="space-y-3 mb-4">
                {cartItems.map((item) => (
                  <div
                    key={`${item.courseId}-${item.selectedPlanId}`}
                    className="flex items-start justify-between gap-2 text-sm"
                  >
                    <div className="text-gray-600 leading-snug">
                      <span className="font-medium text-gray-800">
                        {item.courseTitle}
                      </span>
                      <br />
                      <span className="text-xs text-gray-400">
                        {item.selectedPlanTitle}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 whitespace-nowrap">
                      ₹{item.selectedPlanPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4 flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  Total
                </span>
                <span className="text-xl font-bold text-[#0166A7]">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="w-full rounded-xl border border-gray-200 px-5 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Continue Shopping
                </button>

                <Link
                  href={buildCheckoutUrl()}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#0A3D62] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#0166A7]"
                >
                  <CreditCard size={18} />
                  Secure Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
