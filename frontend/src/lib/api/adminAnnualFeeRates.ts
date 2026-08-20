import { adminApiClient } from "@/lib/api/adminClient";

export type AnnualFeeRatePartialRule = {
  minMinutes: number;
  maxMinutes: number;
  rate: number;
};

export type AnnualFeeRateItem = {
  code: string;
  label: string;
  amount: number;
  applyFamily?: boolean;
  minMinutes: number;
  maxMinutes: number | null;
  maxInclusive?: boolean;
  gradeAmounts?: Record<string, number> | null;
};

export type AnnualFeeRateService = {
  serviceType: string;
  serviceLabel: string;
  note?: string | null;
  partialRule?: AnnualFeeRatePartialRule | null;
  items: AnnualFeeRateItem[];
};

export type AnnualFeeRateYear = {
  benefitYear: number;
  services: AnnualFeeRateService[];
};

export type UpsertAnnualFeeRateServicePayload = {
  note?: string | null;
  partialRule?: AnnualFeeRatePartialRule | null;
  items: AnnualFeeRateItem[];
};

export async function fetchAnnualFeeRateYears(): Promise<number[]> {
  const { data } = await adminApiClient.get<number[]>("/api/admin/annual-fee-rates");
  return data ?? [];
}

export async function fetchAnnualFeeRateYear(
  year: number,
): Promise<AnnualFeeRateYear> {
  const { data } = await adminApiClient.get<AnnualFeeRateYear>(
    `/api/admin/annual-fee-rates/${year}`,
  );
  return data;
}

export async function upsertAnnualFeeRateService(
  year: number,
  serviceType: string,
  payload: UpsertAnnualFeeRateServicePayload,
): Promise<AnnualFeeRateService> {
  const { data } = await adminApiClient.put<AnnualFeeRateService>(
    `/api/admin/annual-fee-rates/${year}/${serviceType}`,
    payload,
  );
  return data;
}

export async function createNextAnnualFeeRateYear(): Promise<AnnualFeeRateYear> {
  const { data } = await adminApiClient.post<AnnualFeeRateYear>(
    "/api/admin/annual-fee-rates/next-year",
  );
  return data;
}
