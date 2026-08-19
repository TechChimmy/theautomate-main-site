"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, X } from "lucide-react";
import { CartItem, removeFromCart, getCart } from "@/lib/services/cart";

export default function CartDropdown() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [open, setOpen] = useState(false);

    const loadCart = () => {
        setItems(getCart());
    };

    useEffect(() => {
        loadCart();

        window.addEventListener("cart-updated", loadCart);

        return () => {
            window.removeEventListener("cart-updated", loadCart);
        };
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
                    <h3 className="mb-4 text-lg font-bold">
                        Your Cart
                    </h3>

                    {items.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            Your cart is empty.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.productId}
                                    className="flex items-center justify-between gap-3"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {item.productTitle}
                                        </p>
                                    </div>

                                    <select
                                        value={item.selectedPlanId ?? ""}
                                        className="rounded-lg border px-2 py-2 text-sm"
                                    >
                                        <option value="">
                                            Choose Plan
                                        </option>
                                        {/* Plans will be populated in Step 4 */}
                                    </select>

                                    <button
                                        type="button"
                                        onClick={() => removeFromCart(item.productId)}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}

                            <div className="flex gap-2 border-t pt-4">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="flex-1 rounded-lg border px-4 py-2"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="flex-1 rounded-lg bg-brand-blue px-4 py-2 text-white"
                                >
                                    Checkout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}