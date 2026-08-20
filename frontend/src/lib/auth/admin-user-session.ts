import type { AdminSsoUserDto } from "@/lib/api/auth.types";

import { ADMIN_SSO_USER_STORAGE_KEY } from "./constants";

export function getAdminUserSession(): AdminSsoUserDto | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(ADMIN_SSO_USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AdminSsoUserDto;
  } catch {
    return null;
  }
}

export function setAdminUserSession(user: AdminSsoUserDto): void {
  sessionStorage.setItem(ADMIN_SSO_USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearAdminUserSession(): void {
  sessionStorage.removeItem(ADMIN_SSO_USER_STORAGE_KEY);
}
