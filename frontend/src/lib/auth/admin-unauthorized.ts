import { removeAdminAccessToken } from "./admin-token";
import { clearAdminUserSession } from "./admin-user-session";

let handling = false;

/** 관리자 API 401 — 관리자 세션만 정리 */
export function handleAdminUnauthorized(): void {
  if (typeof window === "undefined" || handling) return;

  handling = true;
  removeAdminAccessToken();
  clearAdminUserSession();

  window.alert(
    "관리자 로그인 세션이 만료되었습니다.\n통합관리 포털에서 다시 이동해 주세요.",
  );

  window.setTimeout(() => {
    handling = false;
  }, 3000);
}
