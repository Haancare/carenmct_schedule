import type { CarePlanRecipientDto } from "@/lib/api/carePlan.types";

export type ServiceTypeCode =
  | "visit_care"
  | "visit_bath"
  | "visit_nursing"
  | "day_care"
  | "family_care"
  | "full_day_visit";

export const SERVICE_LABELS: Record<string, string> = {
  visit_care: "방문요양",
  visit_bath: "방문목욕",
  visit_nursing: "방문간호",
  day_care: "주야간보호",
  family_care: "가족요양",
  full_day_visit: "24시간방문",
  방문요양: "방문요양",
  방문목욕: "방문목욕",
  방문간호: "방문간호",
  주야간보호: "주야간보호",
  주간보호: "주간보호",
  가족요양: "가족요양",
};

export const REDUCTION_OPTIONS = [
  "일반",
  "감경9%",
  "감경7.5%",
  "감경6%",
  "기초",
] as const;

/** 피그마 mock Recipient 와 호환되는 뷰 모델 */
export type CarePlanUiRecipient = CarePlanRecipientDto & {
  status: "active" | "inactive";
  grade: number;
  copaymentType: string;
  copaymentRate: number;
  insuranceId: string;
  validityStart: string;
  validityEnd: string;
  phone: string;
  registrationId: string;
};

export function toUiRecipient(dto: CarePlanRecipientDto): CarePlanUiRecipient {
  const active = dto.contractStatus === "수급중";
  return {
    ...dto,
    status: active ? "active" : "inactive",
    grade: getGradeNum(dto),
    copaymentType: dto.reduction,
    copaymentRate: getCopayRate(dto),
    insuranceId: dto.legalDob ?? "",
    validityStart: dto.validFrom ?? "",
    validityEnd: dto.validTo ?? "",
    phone: dto.mobile ?? "",
    registrationId: dto.certNo,
  };
}

export function getGradeText(r: CarePlanRecipientDto): string {
  return r.gradeText ?? "";
}

export function getGradeNum(r: CarePlanRecipientDto): number {
  const m = String(r.gradeText ?? "").match(/(\d)/);
  return m ? Number(m[1]) : 3;
}

export function getReduction(r: CarePlanRecipientDto): string {
  return r.reduction ?? "일반";
}

export function getCertNo(r: CarePlanRecipientDto): string {
  return r.certNo ?? "";
}

export function getValidFrom(r: CarePlanRecipientDto): string {
  return r.validFrom ?? "";
}

export function getValidTo(r: CarePlanRecipientDto): string {
  return r.validTo ?? "";
}

export function getMobile(r: CarePlanRecipientDto): string {
  return r.mobile ?? "";
}

export function getRealDob(r: CarePlanRecipientDto): string {
  return (r.realDob || r.legalDob || "").replace(/-/g, ".");
}

export function getServiceTypes(r: CarePlanRecipientDto): string[] {
  return r.serviceTypes ?? [];
}

export function getCopayRate(r: CarePlanRecipientDto): number {
  const red = r.reduction ?? "";
  if (red.includes("기초")) return 0;
  const m = red.match(/(\d+(?:\.\d+)?)/);
  if (m) return Number(m[1]);
  return 15;
}

export function getApprovedAmounts(r: CarePlanRecipientDto): {
  care: number;
  bath: number;
  nursing: number;
  day: number;
  other: number;
} {
  return {
    care: r.approvedAmtCare ?? 0,
    bath: r.approvedAmtBath ?? 0,
    nursing: r.approvedAmtNursing ?? 0,
    day: r.approvedAmtDay ?? 0,
    other: r.approvedAmtOther ?? 0,
  };
}

export function normalizeServiceFilterValue(value: string): string {
  return value;
}
