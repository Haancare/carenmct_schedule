export const JWT_COOKIE_NAME = "access_token";
export const ADMIN_JWT_COOKIE_NAME = "admin_access_token";
export const JWT_QUERY_PARAM = "token";
export const SSO_USER_STORAGE_KEY = "sso_user";
export const ADMIN_SSO_USER_STORAGE_KEY = "admin_sso_user";

export const SSO_REQUIRED =
  process.env.NEXT_PUBLIC_SSO_REQUIRED === "true";

/** 관리자 SSO — 미설정 시 기관 SSO 플래그와 동일 */
export const ADMIN_SSO_REQUIRED =
  process.env.NEXT_PUBLIC_ADMIN_SSO_REQUIRED != null
    ? process.env.NEXT_PUBLIC_ADMIN_SSO_REQUIRED === "true"
    : SSO_REQUIRED;
