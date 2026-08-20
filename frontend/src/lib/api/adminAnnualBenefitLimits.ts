import { adminApiClient } from "@/lib/api/adminClient";

export type AnnualBenefitLimitDto = {
  id: number;
  benefitYear: number;
  limitGrade1: number;
  limitGrade2: number;
  limitGrade3: number;
  limitGrade4: number;
  limitGrade5: number;
  limitGradeCognitive: number;
  note: string | null;
};

export type UpsertAnnualBenefitLimitPayload = {
  limitGrade1: number;
  limitGrade2: number;
  limitGrade3: number;
  limitGrade4: number;
  limitGrade5: number;
  limitGradeCognitive: number;
  note?: string | null;
};

export async function fetchAnnualBenefitLimits(): Promise<AnnualBenefitLimitDto[]> {
  const { data } = await adminApiClient.get<AnnualBenefitLimitDto[]>(
    "/api/admin/annual-benefit-limits",
  );
  return data ?? [];
}

export async function upsertAnnualBenefitLimit(
  year: number,
  payload: UpsertAnnualBenefitLimitPayload,
): Promise<AnnualBenefitLimitDto> {
  const { data } = await adminApiClient.put<AnnualBenefitLimitDto>(
    `/api/admin/annual-benefit-limits/${year}`,
    payload,
  );
  return data;
}

export async function createNextAnnualBenefitLimitYear(): Promise<AnnualBenefitLimitDto> {
  const { data } = await adminApiClient.post<AnnualBenefitLimitDto>(
    "/api/admin/annual-benefit-limits/next-year",
  );
  return data;
}
