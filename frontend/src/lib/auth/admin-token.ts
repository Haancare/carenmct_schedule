import Cookies from "js-cookie";

import { ADMIN_JWT_COOKIE_NAME } from "./constants";

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function getAdminAccessToken(): string | undefined {
  return Cookies.get(ADMIN_JWT_COOKIE_NAME);
}

export function setAdminAccessToken(token: string): void {
  Cookies.set(ADMIN_JWT_COOKIE_NAME, token, COOKIE_OPTIONS);
}

export function removeAdminAccessToken(): void {
  Cookies.remove(ADMIN_JWT_COOKIE_NAME, { path: "/" });
}

export function hasAdminAccessToken(): boolean {
  return Boolean(getAdminAccessToken());
}
