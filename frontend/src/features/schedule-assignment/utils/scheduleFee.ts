import type { ScheduleAssignmentEntry } from "@/lib/api/scheduleAssignment.types";

export function copayRateFromReduction(reduction?: string): number {
  if (!reduction) return 15;
  if (reduction.includes("9")) return 9;
  if (reduction.includes("6")) return 6;
  if (reduction.includes("기초")) return 0;
  return 15;
}

/** 수급자 마스터 감경값 → 일정추가 폼 버튼 값 */
export function copaymentTypeFromReduction(reduction: string): string {
  if (reduction.includes("9")) return "감경9%";
  if (reduction.includes("6")) return "감경6%";
  if (reduction.includes("기초")) return "기초";
  return "일반";
}

export function calcCopayAmount(totalFee: number, copayRate: number): number {
  return Math.floor((totalFee * copayRate) / 1000) * 10;
}

export function calcMonthlyCopayAmount(
  schedules: ScheduleAssignmentEntry[],
): number {
  const groups = new Map<string, { total: number; rate: number }>();
  for (const entry of schedules) {
    const rate = entry.copaymentRate ?? copayRateFromReduction(entry.reduction);
    const key = `${entry.serviceType}|${entry.scheduleKind}|${entry.grade ?? ""}|${entry.reduction ?? ""}|${rate}`;
    const current = groups.get(key) ?? { total: 0, rate };
    current.total += getEntryBenefitTotal(entry);
    groups.set(key, current);
  }
  let sum = 0;
  for (const { total, rate } of groups.values()) {
    sum += calcCopayAmount(total, rate);
  }
  return sum;
}

export function isClaimSchedule(entry: ScheduleAssignmentEntry): boolean {
  return entry.scheduleKind === "claim";
}

export function getEntryBenefitTotal(entry: ScheduleAssignmentEntry): number {
  // 청구: 공단 총액(benefitTotal) 우선
  if (isClaimSchedule(entry) && entry.benefitTotal != null) {
    return entry.benefitTotal;
  }
  // 계획: 기본수가 + 서버 저장 가산금 (benefitTotal에 합산 반올림 오차가 있어도 재합성)
  return entry.unitCost + (entry.surchargeAmount ?? 0);
}

/** 팝오버·집계용 1회 급여액 — 청구=총액, 계획=기본수가+가산금 */
export function getDisplayBenefitTotal(
  entry: ScheduleAssignmentEntry,
  surchargeAmount = 0,
): number {
  if (isClaimSchedule(entry)) return getEntryBenefitTotal(entry);
  return entry.unitCost + surchargeAmount;
}

export function getEntryCopayAmount(entry: ScheduleAssignmentEntry): number {
  const rate = entry.copaymentRate ?? copayRateFromReduction(entry.reduction);
  return calcCopayAmount(getEntryBenefitTotal(entry), rate);
}

export function applyFeePatch(
  entry: ScheduleAssignmentEntry,
  unitCost: number,
  surchargeAmount: number,
): ScheduleAssignmentEntry {
  const benefitTotal = unitCost + surchargeAmount;
  return {
    ...entry,
    unitCost,
    surchargeAmount,
    benefitTotal,
    feeEdited: true,
  };
}

export function formatKrwPlain(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}
