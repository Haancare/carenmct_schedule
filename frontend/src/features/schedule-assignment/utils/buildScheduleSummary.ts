import type { ScheduleAssignmentEntry } from "@/lib/api/scheduleAssignment.types";
import { getEntryBenefitTotal } from "./scheduleFee";
import type { ScheduleKind } from "@/lib/api/paymentAssignment.types";

export interface ScheduleSummaryRow {
  careWorkerId: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  unitCost: number;
  benefitTotalSum: number;
  count: number;
  kind: ScheduleKind;
  rowKey: string;
}

/** figma buildSummary 간소화 — Phase A 집계표 */
export function buildScheduleSummary(
  schedules: ScheduleAssignmentEntry[],
): ScheduleSummaryRow[] {
  const map: Record<string, ScheduleSummaryRow> = {};

  schedules.forEach((s) => {
    const feePerVisit = getEntryBenefitTotal(s);
    const key =
      s.scheduleKind === "claim"
        ? `${s.careWorkerId}|${s.serviceType}|${s.durationMinutes}|${feePerVisit}|claim`
        : `${s.careWorkerId}|${s.serviceType}|${s.startTime}|${s.endTime}|${feePerVisit}|plan`;

    if (!map[key]) {
      map[key] = {
        careWorkerId: s.careWorkerId,
        serviceType: s.serviceType,
        startTime: s.startTime,
        endTime: s.endTime,
        durationMinutes: s.durationMinutes,
        unitCost: feePerVisit,
        benefitTotalSum: 0,
        count: 0,
        kind: s.scheduleKind,
        rowKey: key,
      };
    } else if (s.scheduleKind === "claim") {
      if (map[key].startTime !== s.startTime || map[key].endTime !== s.endTime) {
        map[key].startTime = "";
        map[key].endTime = "";
      }
    }
    map[key].count += 1;
    map[key].benefitTotalSum += getEntryBenefitTotal(s);
  });

  return Object.values(map).sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "claim" ? 1 : -1;
    return a.careWorkerId.localeCompare(b.careWorkerId);
  });
}

export function scheduleCardKey(s: ScheduleAssignmentEntry): string {
  const feePerVisit = getEntryBenefitTotal(s);
  return s.scheduleKind === "claim"
    ? `${s.careWorkerId}|${s.serviceType}|${s.durationMinutes}|${feePerVisit}|claim`
    : `${s.careWorkerId}|${s.serviceType}|${s.startTime}|${s.endTime}|${feePerVisit}|plan`;
}
