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
