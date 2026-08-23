// ---------------------------------------------------------------------------
// Cart service — COURSE + PLAN identity
//
// A cart item represents a unique (course, plan) pair.
// The same plan used for two different courses → two separate cart items.
// Duplicate detection uses BOTH courseId AND selectedPlanId.
// ---------------------------------------------------------------------------

export interface CartItem {
  /** Sanity courseDetails._id — the course this item belongs to */
  courseId: string;
  /** Human-readable course name shown in the cart */
  courseTitle: string;
  /** URL slug of the course (used for navigation) */
  courseSlug: string;

  /** Sanity plan._id — the specific plan chosen for this course */
  selectedPlanId: string;
  /** Human-readable plan name */
  selectedPlanTitle: string;
  /** Price of the selected plan in INR */
  selectedPlanPrice: number;

  /** Course cover image URL (optional) */
  thumbnailUrl?: string | null;
}

const CART_KEY = "automate-learning-cart";

// ---------------------------------------------------------------------------
// Normalise items loaded from localStorage.
// Old items (pre-fix) used productId as the course identifier. We drop them
// rather than inventing a courseId from incomplete data, because a stale item
// with a wrong identity is worse than an empty cart entry.
// ---------------------------------------------------------------------------
function normalise(raw: unknown[]): CartItem[] {
  return raw.filter((item): item is CartItem => {
    if (typeof item !== "object" || item === null) return false;
    const i = item as Record<string, unknown>;
    // Must have the new fields to be a valid item
    return (
      typeof i.courseId === "string" &&
      i.courseId !== "" &&
      typeof i.selectedPlanId === "string" &&
      i.selectedPlanId !== "" &&
      typeof i.selectedPlanPrice === "number"
    );
  });
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(CART_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? normalise(parsed) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

/**
 * Add a (course, plan) item to the cart.
 * No-op if the exact same (courseId + selectedPlanId) pair already exists.
 */
export function addToCart(item: CartItem): CartItem[] {
  const cart = getCart();

  const alreadyExists = cart.some(
    (c) =>
      c.courseId === item.courseId && c.selectedPlanId === item.selectedPlanId
  );

  if (alreadyExists) return cart;

  const updated = [...cart, item];
  saveCart(updated);
  return updated;
}

/**
 * Remove a specific (course, plan) pair from the cart.
 */
export function removeFromCart(
  courseId: string,
  selectedPlanId: string
): CartItem[] {
  const cart = getCart();
  const updated = cart.filter(
    (item) =>
      !(item.courseId === courseId && item.selectedPlanId === selectedPlanId)
  );
  saveCart(updated);
  return updated;
}

/**
 * Check whether a specific (course, plan) pair is in the cart.
 * Pure helper — does not modify state.
 */
export function isInCart(courseId: string, selectedPlanId: string): boolean {
  return getCart().some(
    (item) =>
      item.courseId === courseId && item.selectedPlanId === selectedPlanId
  );
}

export function isCourseInCart(courseId: string): boolean {
  return getCart().some((item) => item.courseId === courseId);
}

export function getCartItemByCourseId(courseId: string): CartItem | undefined {
  return getCart().find((item) => item.courseId === courseId);
}

export function clearCart(): void {
  saveCart([]);
}
