"use client";
import { CartItem, getCart, removeFromCart, updateCartItem } from "@/lib/services/cart";
import { getCoursePlans } from "@/lib/services/course.service";
import { useState, useEffect, useRef } from "react";
import { Trash2, ShoppingCart } from "lucide-react";
import Image from "next/image";

export default function CartPage() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<Record<string, any[]>>({});
    const [loadingPlans, setLoadingPlans] = useState<Record<string, boolean>>({});
    const fetchedPlans = useRef<Set<string>>(new Set());

    useEffect(() => {
        const handleUpdate = () => {
            setCartItems(getCart());
        };

        // Initial load
        handleUpdate();
        setLoading(false);

        // Listen for changes in the same tab
        window.addEventListener("cart-updated", handleUpdate);
        
        // Listen for changes across tabs
        const handleStorage = (e: StorageEvent) => {
            if (e.key === "automate-learning-cart") {
                handleUpdate();
            }
        };
        window.addEventListener("storage", handleStorage);

        return () => {
            window.removeEventListener("cart-updated", handleUpdate);
            window.removeEventListener("storage", handleStorage);
        };
    }, []);

    useEffect(() => {
        cartItems.forEach(item => {
            if (!fetchedPlans.current.has(item.productId)) {
                fetchedPlans.current.add(item.productId);
                
                setLoadingPlans(prev => ({ ...prev, [item.productId]: true }));
                
                getCoursePlans(item.productSlug).then(data => {
                    setPlans(prev => ({ ...prev, [item.productId]: data?.bundles || [] }));
                }).catch(error => {
                    console.error("Failed to fetch plans for", item.productSlug, error);
                    setPlans(prev => ({ ...prev, [item.productId]: [] }));
                }).finally(() => {
                    setLoadingPlans(prev => ({ ...prev, [item.productId]: false }));
                });
            }
        });
    }, [cartItems]);

    const handleRemove = (productId: string) => {
        removeFromCart(productId);
        // State update will be triggered by the cart-updated event
    };

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading cart...</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-surface-page px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Your Cart
                    </h1>

                    <p className="mt-2 text-gray-500">
                        {cartItems.length}{" "}
                        {cartItems.length === 1 ? "course" : "courses"} in your cart
                    </p>
                </div>

                {/* Empty Cart */}
                {cartItems.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                        <ShoppingCart
                            size={48}
                            className="mx-auto mb-4 text-gray-300"
                        />

                        <h2 className="text-xl font-semibold text-gray-800">
                            Your cart is empty
                        </h2>

                        <p className="mt-2 text-gray-500">
                            Add courses to your cart and they will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

                        {/* Cart Items */}
                        <div className="space-y-4 lg:col-span-2">
                            {cartItems.map((item) => (
                                <div
                                    key={item.productId}
                                    className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row"
                                >

                                    {/* Thumbnail */}
                                    <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:w-48">
                                        {item.thumbnailUrl ? (
                                            <Image
                                                src={item.thumbnailUrl}
                                                alt={item.productTitle}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-gray-400">
                                                No Image
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex flex-1 flex-col">

                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {item.productTitle}
                                        </h2>

                                        <p className="mt-1 text-sm text-gray-500">
                                            {item.productSlug}
                                        </p>

                                        {/* Plan selection */}
                                        <div className="mt-5">
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Choose Plan
                                            </label>

                                            <select
                                                value={item.selectedPlanId || ""}
                                                onChange={(e) => {
                                                    const newPlanId = e.target.value;
                                                    const availablePlans = plans[item.productId] || [];
                                                    const selected = availablePlans.find((p: any) => p._id === newPlanId);
                                                    
                                                    if (selected) {
                                                        updateCartItem(item.productId, {
                                                            selectedPlanId: selected._id,
                                                            selectedPlanTitle: selected.title,
                                                            selectedPlanPrice: selected.price
                                                        });
                                                    } else {
                                                        updateCartItem(item.productId, {
                                                            selectedPlanId: null,
                                                            selectedPlanTitle: null,
                                                            selectedPlanPrice: null
                                                        });
                                                    }
                                                }}
                                                disabled={loadingPlans[item.productId]}
                                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none sm:max-w-sm disabled:opacity-60"
                                            >
                                                <option value="">
                                                    {loadingPlans[item.productId] 
                                                        ? "Loading plans..." 
                                                        : plans[item.productId]?.length === 0 
                                                            ? "No plans available" 
                                                            : "Choose a plan..."}
                                                </option>
                                                
                                                {(plans[item.productId] || []).map((p: any) => (
                                                    <option key={p._id} value={p._id}>
                                                        {p.title} - ₹{p.price}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Remove */}
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(item.productId)}
                                            className="mt-4 flex w-fit items-center gap-2 text-sm font-medium text-red-500 transition-colors hover:text-red-700"
                                        >
                                            <Trash2 size={16} />
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Order Summary
                            </h2>

                            <div className="my-6 border-t border-gray-100" />

                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">
                                    Selected courses
                                </span>

                                <span className="font-semibold text-gray-900">
                                    {cartItems.length}
                                </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-lg font-semibold text-gray-900">
                                    Total
                                </span>

                                <span className="text-xl font-bold text-brand-blue">
                                    ₹0
                                </span>
                            </div>

                            <p className="mt-2 text-xs text-gray-400">
                                Select a plan for each course to calculate the total.
                            </p>

                            {/* Actions */}
                            <div className="mt-8 flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={() => window.history.back()}
                                    className="w-full rounded-xl border border-gray-200 px-5 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    disabled
                                    className="w-full rounded-xl bg-brand-blue px-5 py-3 font-semibold text-white opacity-50"
                                >
                                    Checkout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}