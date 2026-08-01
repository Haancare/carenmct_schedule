import type { SsoUserDto } from "@/lib/api/auth.types";

import { SSO_USER_STORAGE_KEY } from "./constants";

export function getUserSession(): SsoUserDto | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(SSO_USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SsoUserDto;
  } catch {
    return null;
  }
}

export function setUserSession(user: SsoUserDto): void {
  sessionStorage.setItem(SSO_USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearUserSession(): void {
  sessionStorage.removeItem(SSO_USER_STORAGE_KEY);
}
