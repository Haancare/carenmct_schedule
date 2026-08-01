export const JWT_COOKIE_NAME = "access_token";
export const JWT_QUERY_PARAM = "token";
export const SSO_USER_STORAGE_KEY = "sso_user";
/** dev: false — JWT 없이 API 테스트 / prod·연동: true */
export const SSO_REQUIRED =
  process.env.NEXT_PUBLIC_SSO_REQUIRED === "true";
