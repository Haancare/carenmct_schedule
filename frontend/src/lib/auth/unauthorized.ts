import { removeAccessToken } from "./token";
import { clearUserSession } from "./user-session";

let handling = false;

/** API 401 — 세션 만료 시 토큰 제거 및 포털 재진입 안내 */
export function handleUnauthorized(): void {
  if (typeof window === "undefined" || handling) return;

  handling = true;
  removeAccessToken();
  clearUserSession();

  window.alert(
    "로그인 세션이 만료되었습니다.\n통합관리 포털에서 다시 이동해 주세요.",
  );

  window.setTimeout(() => {
    handling = false;
  }, 3000);
}
