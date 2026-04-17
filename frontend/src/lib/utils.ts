import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the effective price to charge (offer price if available, otherwise regular price)
 */
export function getEffectivePrice(item: { price: number; offerPrice?: number; originalPrice?: number }): number {
  return item.offerPrice !== undefined && item.offerPrice !== null ? item.offerPrice : item.price || 0;
}

/**
 * Check if an item has an active offer
 */
export function hasOffer(item: { offerPrice?: number; originalPrice?: number }): boolean {
  return item.offerPrice !== undefined && item.offerPrice !== null;
}

/**
 * Get original price for display (with fallback)
 */
export function getOriginalPrice(item: { price: number; originalPrice?: number }): number {
  return item.originalPrice !== undefined && item.originalPrice !== null ? item.originalPrice : item.price;
}
