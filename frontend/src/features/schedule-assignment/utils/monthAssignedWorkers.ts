import type { CareWorkerDto } from "@/lib/api/paymentAssignment.types";
import type { ScheduleAssignmentEntry } from "@/lib/api/scheduleAssignment.types";
import {
  getCareWorkerBirth,
  getCareWorkerName,
} from "@/lib/api/careWorkers";

import type { PlanClaimView } from "../constants";

/** 해당 월 일정(현재 보기 기준)에 등장하는 직원 ID — 중복 제거, 최초 등장 순 */
export function deriveMonthAssignedWorkerIds(
  schedules: ScheduleAssignmentEntry[],
  view: PlanClaimView,
): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const entry of schedules) {
    if (entry.scheduleKind !== view) continue;
    const wid = entry.careWorkerId?.trim();
    if (!wid || seen.has(wid)) continue;
    seen.add(wid);
    ids.push(wid);
  }
  return ids;
}

export function resolveMonthAssignedWorkers(
  schedules: ScheduleAssignmentEntry[],
  view: PlanClaimView,
  careWorkers: CareWorkerDto[],
): CareWorkerDto[] {
  return deriveMonthAssignedWorkerIds(schedules, view).map((wid) => {
    const found = careWorkers.find((w) => w.id === wid);
    if (found) return found;
    return {
      id: wid,
      name: getCareWorkerName(wid),
      nickname: "",
      birth: getCareWorkerBirth(wid),
    };
  });
}
