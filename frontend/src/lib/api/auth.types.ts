export interface SsoExchangeRequest {
  code: string;
  targetSystem: "schedule";
}

export interface SsoUserDto {
  userId: string;
  name: string;
  facilityId: string;
  facilityName: string;
  isAdmin: boolean;
}

export interface SsoExchangeResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: SsoUserDto;
}

/** 관리자 SSO — 통합관리 admin/exchange 응답 */
export interface AdminSsoUserDto {
  userId: string;
  name: string;
  dept?: string | null;
  title?: string | null;
}

export interface AdminSsoExchangeRequest {
  code: string;
  targetSystem: "schedule";
}

export interface AdminSsoExchangeResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: AdminSsoUserDto;
}
