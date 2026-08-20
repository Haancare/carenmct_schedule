import axios from "axios";

import type {
  AdminSsoExchangeRequest,
  AdminSsoExchangeResponse,
  SsoExchangeRequest,
  SsoExchangeResponse,
} from "@/lib/api/auth.types";

const PORTAL_API_BASE_URL =
  process.env.NEXT_PUBLIC_PORTAL_API_URL ?? "http://192.168.10.54:8080";

const SSO_TARGET_SYSTEM = "schedule" as const;

export async function exchangeSsoCode(code: string): Promise<SsoExchangeResponse> {
  const body: SsoExchangeRequest = {
    code,
    targetSystem: SSO_TARGET_SYSTEM,
  };

  const { data } = await axios.post<SsoExchangeResponse>(
    `${PORTAL_API_BASE_URL}/api/auth/sso/exchange`,
    body,
    {
      headers: { "Content-Type": "application/json" },
    },
  );

  return data;
}

/** 관리자 SSO 코드 교환 — 기관 exchange 와 경로·토큰이 다름 */
export async function exchangeAdminSsoCode(
  code: string,
): Promise<AdminSsoExchangeResponse> {
  const body: AdminSsoExchangeRequest = {
    code,
    targetSystem: SSO_TARGET_SYSTEM,
  };

  const { data } = await axios.post<AdminSsoExchangeResponse>(
    `${PORTAL_API_BASE_URL}/api/auth/sso/admin/exchange`,
    body,
    {
      headers: { "Content-Type": "application/json" },
    },
  );

  return data;
}
