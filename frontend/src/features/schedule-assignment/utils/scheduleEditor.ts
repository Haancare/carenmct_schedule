import type { ScheduleAssignmentEntry } from "@/lib/api/scheduleAssignment.types";
import type { ScheduleAddFormData } from "@/lib/api/scheduleAssignment.types";
import type { ServiceTypeCode } from "@/lib/api/paymentAssignment.types";

import type { ScheduleSummaryRow } from "./buildScheduleSummary";
import { estimateUnitCost } from "@/lib/mock/scheduleAssignmentSeed";

import { QUICK_DURATION_PRESETS } from "../constants";
import { copayRateFromReduction } from "./scheduleFee";
import { calcSurchargeAmount } from "./scheduleSurcharge";

export function validateScheduleForm(
  form: ScheduleAddFormData,
  durationMinutes: number,
): string | null {
  if (form.serviceType === "family_care") {
    if (!form.familyRelation) {
      return "가족관계를 선택하세요.";
    }
    if (durationMinutes !== 60 && durationMinutes !== 90) {
      return "가족요양은 60분 또는 90분만 선택할 수 있습니다.";
    }
  }
  if (form.serviceType === "full_day_visit" && durationMinutes < 720) {
    return "종일방문은 12시간(720분) 이상이어야 합니다.";
  }
  return null;
}

export function applyServiceTypeDurationDefaults(
  serviceType: ServiceTypeCode,
  startHour: string,
  startMin: string,
): { endHour: string; endMin: string } {
  const preset = QUICK_DURATION_PRESETS[serviceType]?.[0];
  if (!preset) {
    return { endHour: startHour, endMin: startMin };
  }
  const sh = parseInt(startHour, 10) || 0;
  const sm = parseInt(startMin, 10) || 0;
  const total = sh * 60 + sm + preset.mins;
  return {
    endHour: String(Math.floor(total / 60) % 24).padStart(2, "0"),
    endMin: String(total % 60).padStart(2, "0"),
  };
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function computeDurationMinutes(
  startHour: string,
  startMin: string,
  endHour: string,
  endMin: string,
): number {
  const sh = parseInt(startHour, 10) || 0;
  const sm = parseInt(startMin, 10) || 0;
  const eh = parseInt(endHour, 10) || 0;
  const em = parseInt(endMin, 10) || 0;
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff;
}

export function timesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  const as = timeToMinutes(aStart);
  let ae = timeToMinutes(aEnd);
  const bs = timeToMinutes(bStart);
  let be = timeToMinutes(bEnd);
  if (ae <= as) ae += 24 * 60;
  if (be <= bs) be += 24 * 60;
  return as < be && bs < ae;
}

/** 방문간호 ↔ 요양/목욕은 겹쳐도 허용 */
function isOverlapException(a: ServiceTypeCode, b: ServiceTypeCode): boolean {
  const nursing = "visit_nursing";
  const careLike = new Set<ServiceTypeCode>([
    "visit_care",
    "family_care",
    "visit_bath",
    "full_day_visit",
  ]);
  return (
    (a === nursing && careLike.has(b)) || (b === nursing && careLike.has(a))
  );
}

export function hasRecipientOverlap(
  schedules: ScheduleAssignmentEntry[],
  date: string,
  startTime: string,
  endTime: string,
  serviceType: ServiceTypeCode,
  excludeId?: string,
): boolean {
  return schedules.some((s) => {
    if (s.date !== date || s.scheduleKind !== "plan") return false;
    if (excludeId && s.id === excludeId) return false;
    if (isOverlapException(serviceType, s.serviceType)) return false;
    return timesOverlap(startTime, endTime, s.startTime, s.endTime);
  });
}

export function hasWorkerOverlap(
  allSchedules: ScheduleAssignmentEntry[],
  careWorkerId: string,
  date: string,
  startTime: string,
  endTime: string,
  serviceType: ServiceTypeCode,
): boolean {
  return allSchedules.some((s) => {
    if (s.careWorkerId !== careWorkerId || s.date !== date) return false;
    if (s.scheduleKind !== "plan") return false;
    if (isOverlapException(serviceType, s.serviceType)) return false;
    return timesOverlap(startTime, endTime, s.startTime, s.endTime);
  });
}

export type WorkerPlanScheduleRef = {
  recipientId: string;
  serviceDate: string;
  scheduleKind: "plan" | "claim";
  serviceType: ServiceTypeCode;
  startTime: string;
  endTime: string;
};

/** 같은 직원이 다른 수급자와 겹치는 계획 일정 */
export function hasWorkerCrossRecipientOverlap(
  workerSchedules: WorkerPlanScheduleRef[],
  recipientId: string,
  date: string,
  startTime: string,
  endTime: string,
  serviceType: ServiceTypeCode,
): boolean {
  return workerSchedules.some((s) => {
    if (s.serviceDate !== date || s.scheduleKind !== "plan") return false;
    if (String(s.recipientId) === String(recipientId)) return false;
    if (isOverlapException(serviceType, s.serviceType)) return false;
    return timesOverlap(startTime, endTime, s.startTime, s.endTime);
  });
}

export function hasAssignConflict(
  schedules: ScheduleAssignmentEntry[],
  workerSchedules: WorkerPlanScheduleRef[],
  recipientId: string,
  date: string,
  startTime: string,
  endTime: string,
  serviceType: ServiceTypeCode,
): boolean {
  return (
    hasRecipientOverlap(schedules, date, startTime, endTime, serviceType) ||
    hasWorkerCrossRecipientOverlap(
      workerSchedules,
      recipientId,
      date,
      startTime,
      endTime,
      serviceType,
    )
  );
}

export function buildScheduleEntry(
  params: {
    recipientId: string;
    date: string;
    serviceType: ServiceTypeCode;
    careWorkerId: string;
    startHour: string;
    startMin: string;
    endHour: string;
    endMin: string;
    grade: number;
    reduction: string;
    holidayDates?: ReadonlySet<string>;
  },
  suffix = "",
): ScheduleAssignmentEntry {
  const startTime = `${params.startHour}:${params.startMin}`;
  const endTime = `${params.endHour}:${params.endMin}`;
  const durationMinutes = computeDurationMinutes(
    params.startHour,
    params.startMin,
    params.endHour,
    params.endMin,
  );
  const unitCost = estimateUnitCost(durationMinutes, params.serviceType);
  const surchargeAmount = calcSurchargeAmount({
    serviceType: params.serviceType,
    date: params.date,
    startTime,
    endTime,
    durationMinutes,
    gradeNum: params.grade,
    unitCost,
    holidayDates: params.holidayDates,
  }).amount;
  const copaymentRate = copayRateFromReduction(params.reduction);
  const benefitTotal = unitCost + surchargeAmount;
  return {
    id: `NEW-${params.date}-${params.careWorkerId}-${Date.now()}${suffix}`,
    date: params.date,
    serviceType: params.serviceType,
    scheduleKind: "plan",
    startTime,
    endTime,
    durationMinutes,
    careWorkerId: params.careWorkerId,
    grade: params.grade,
    reduction: params.reduction,
    copaymentRate,
    unitCost,
    surchargeAmount,
    benefitTotal,
    feeEdited: false,
  };
}

export function isHolidayDate(
  dateStr: string,
  holidayDates: ReadonlySet<string>,
): boolean {
  return holidayDates.has(dateStr);
}

/** 집계표 행 옵션 → 일정추가 폼 (figma RecipientDetail 동일) */
export function applySummaryRowToAddForm(
  base: ScheduleAddFormData,
  row: ScheduleSummaryRow,
): ScheduleAddFormData {
  const [sh, sm] = (row.startTime || "09:00").split(":");
  const [eh, em] = (row.endTime || "10:30").split(":");
  return {
    ...base,
    careWorkerId: row.careWorkerId,
    serviceType: row.serviceType as ServiceTypeCode,
    startHour: (sh ?? "09").padStart(2, "0"),
    startMin: (sm ?? "00").padStart(2, "0"),
    endHour: (eh ?? "10").padStart(2, "0"),
    endMin: (em ?? "30").padStart(2, "0"),
  };
}
