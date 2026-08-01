import axios from "axios";

import type { SsoExchangeRequest, SsoExchangeResponse } from "@/lib/api/auth.types";

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
