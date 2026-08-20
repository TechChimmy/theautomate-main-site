"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, X } from "lucide-react";
import { CartItem, removeFromCart, getCart } from "@/lib/services/cart";
import Link from "next/link";

export default function CartDropdown() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  const loadCart = () => setItems(getCart());

  useEffect(() => {
    loadCart();
    window.addEventListener("cart-updated", loadCart);
    return () => window.removeEventListener("cart-updated", loadCart);
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative"
      >
        <ShoppingCart size={22} />
        {items.length > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-96 rounded-xl border bg-white p-4 shadow-xl">
          <h3 className="mb-4 text-lg font-bold">Your Cart</h3>

          {items.length === 0 ? (
            <p className="text-sm text-gray-500">Your cart is empty.</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.courseId}-${item.selectedPlanId}`}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {item.courseTitle}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.selectedPlanTitle} —{" "}
                      ₹{item.selectedPlanPrice.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeFromCart(item.courseId, item.selectedPlanId)
                    }
                    className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Remove"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}

              <div className="flex gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <Link
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg bg-brand-blue px-4 py-2 text-sm text-white text-center"
                >
                  View Cart
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
