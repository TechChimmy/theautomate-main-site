export interface CartItem {
    productId: string;
    productTitle: string;
    productSlug: string;
    thumbnailUrl?: string | null;
    selectedPlanId?: string | null;
    selectedPlanTitle?: string | null;
    selectedPlanPrice?: number | null;
}

const CART_KEY = "automate-learning-cart";

export function getCart(): CartItem[] {
    if (typeof window === "undefined") return [];

    try {
        const stored = localStorage.getItem(CART_KEY);
        if (!stored) return [];

        const parsed = JSON.parse(stored);

        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveCart(items: CartItem[]) {
    if (typeof window === "undefined") return;

    localStorage.setItem(CART_KEY, JSON.stringify(items));

    window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(item: CartItem): CartItem[] {
    const cart = getCart();

    const alreadyExists = cart.some(
        (cartItem) => cartItem.productId === item.productId,
    );

    if (alreadyExists) {
        return cart;
    }

    const updatedCart = [...cart, item];

    saveCart(updatedCart);

    return updatedCart;
}

export function removeFromCart(productId: string): CartItem[] {
    const cart = getCart();

    const updatedCart = cart.filter(
        (item) => item.productId !== productId,
    );

    saveCart(updatedCart);

    return updatedCart;
}

export function updateCartItem(
    productId: string,
    updates: Partial<CartItem>,
): CartItem[] {
    const cart = getCart();

    const updatedCart = cart.map((item) =>
        item.productId === productId
            ? { ...item, ...updates }
            : item,
    );

    saveCart(updatedCart);

    return updatedCart;
}

export function clearCart() {
    saveCart([]);
}