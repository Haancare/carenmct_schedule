import type { PlanClaimView } from "../constants";
import type { ScheduleAssignmentEntry } from "@/lib/api/scheduleAssignment.types";

export type PeriodSegment = { from: string; to: string; value: string };

const GAP_DAYS = 7;

function dayDiff(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`).getTime();
  const db = new Date(`${b}T00:00:00`).getTime();
  return Math.round((db - da) / 86400000);
}

function deriveByField(
  schedules: ScheduleAssignmentEntry[],
  field: "grade" | "reduction",
  view: PlanClaimView,
  fallbackGrade: number,
  fallbackReduction: string,
): PeriodSegment[] {
  const all = schedules.filter((s) => s.scheduleKind === view);
  if (all.length === 0) return [];

  const valOf = (entry: ScheduleAssignmentEntry) =>
    field === "grade"
      ? String(entry.grade ?? fallbackGrade)
      : (entry.reduction ?? fallbackReduction);

  const byDate = new Map<string, string>();
  all.forEach((e) => {
    byDate.set(e.date, valOf(e));
  });

  const dates = Array.from(byDate.keys()).sort();
  const segs: PeriodSegment[] = [];
  let cur: PeriodSegment | null = null;

  for (const d of dates) {
    const v = byDate.get(d)!;
    if (!cur || cur.value !== v || dayDiff(cur.to, d) > GAP_DAYS) {
      if (cur) segs.push(cur);
      cur = { from: d, to: d, value: v };
    } else {
      cur.to = d;
    }
  }
  if (cur) segs.push(cur);

  const distinct = new Set(segs.map((s) => s.value));
  return distinct.size > 1 ? segs : [];
}

export function deriveGradeSegments(
  schedules: ScheduleAssignmentEntry[],
  view: PlanClaimView,
  fallbackGrade: number,
  fallbackReduction: string,
): PeriodSegment[] {
  return deriveByField(
    schedules,
    "grade",
    view,
    fallbackGrade,
    fallbackReduction,
  );
}

export function deriveReductionSegments(
  schedules: ScheduleAssignmentEntry[],
  view: PlanClaimView,
  fallbackGrade: number,
  fallbackReduction: string,
): PeriodSegment[] {
  return deriveByField(
    schedules,
    "reduction",
    view,
    fallbackGrade,
    fallbackReduction,
  );
}

export function fmtMd(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}
