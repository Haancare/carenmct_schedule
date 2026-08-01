import { JWT_QUERY_PARAM } from "./constants";
import { setAccessToken } from "./token";

/**
 * 통합관리 프로그램에서 리다이렉트될 때 URL 파라미터(?token=...)로 전달된 JWT를 쿠키에 저장합니다.
 * 저장에 성공하면 URL에서 token 파라미터를 제거합니다.
 */
export function captureTokenFromUrl(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const url = new URL(window.location.href);
  const token = url.searchParams.get(JWT_QUERY_PARAM);

  if (!token) {
    return false;
  }

  setAccessToken(token);
  url.searchParams.delete(JWT_QUERY_PARAM);
  window.history.replaceState({}, "", url.toString());

  return true;
}
