import clsx, { type ClassValue } from "clsx";

/** Class-name join. Thin wrapper so the import site reads cleanly. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
