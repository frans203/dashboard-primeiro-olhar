import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * `cn` — merge Tailwind classes so a caller-supplied `className` OVERRIDES the
 * component's base classes (via tailwind-merge) instead of duplicating them.
 * This is what makes `<PrimaryButton className="p-6" />` bump the padding without
 * breaking the base style. Every ui-kit component composes its classes through `cn`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
