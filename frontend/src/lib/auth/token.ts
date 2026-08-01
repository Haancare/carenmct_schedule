import Cookies from "js-cookie";

import { JWT_COOKIE_NAME } from "./constants";

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function getAccessToken(): string | undefined {
  return Cookies.get(JWT_COOKIE_NAME);
}

export function setAccessToken(token: string): void {
  Cookies.set(JWT_COOKIE_NAME, token, COOKIE_OPTIONS);
}

export function removeAccessToken(): void {
  Cookies.remove(JWT_COOKIE_NAME, { path: "/" });
}

export function hasAccessToken(): boolean {
  return Boolean(getAccessToken());
}
