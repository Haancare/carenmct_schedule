import type { ScheduleAssignmentEntry } from "@/lib/api/scheduleAssignment.types";

import { copayRateFromReduction } from "./scheduleFee";

export type PeriodChangeKind = "grade" | "reduction";

export function applyPeriodChangeToSchedules(
  schedules: ScheduleAssignmentEntry[],
  splitDate: string,
  kind: PeriodChangeKind,
  before: string,
  after: string,
  fallbackGrade: number,
  fallbackReduction: string,
): ScheduleAssignmentEntry[] {
  return schedules.map((entry) => {
    if (entry.scheduleKind !== "plan") return entry;
    const inAfter = entry.date >= splitDate;
    const grade =
      kind === "grade"
        ? parseInt(inAfter ? after : before, 10)
        : (entry.grade ?? fallbackGrade);
    const reduction =
      kind === "reduction"
        ? inAfter
          ? after
          : before
        : (entry.reduction ?? fallbackReduction);
    const copaymentRate = copayRateFromReduction(reduction);
    return { ...entry, grade, reduction, copaymentRate };
  });
}

export function fmtMd(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}
