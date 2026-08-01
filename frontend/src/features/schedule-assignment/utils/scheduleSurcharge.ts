import type { ScheduleAssignmentEntry } from "@/lib/api/scheduleAssignment.types";
import type { ServiceTypeCode } from "@/lib/api/paymentAssignment.types";

export type SurchargeQuote = {
  amount: number;
  rate: number;
  minutes: number;
  periodLabel: string;
};

const HOLIDAY_RATE = 0.5;
const SUNDAY_RATE = 0.3;
const NIGHT_RATE = 0.3;

const SURCHARGE_ELIGIBLE = new Set<ServiceTypeCode>([
  "visit_care",
  "visit_nursing",
  "full_day_visit",
]);

function parseGradeNum(grade?: number): number {
  return grade != null && grade >= 1 && grade <= 5 ? grade : 3;
}

function isSurchargeEligible(
  serviceType: ServiceTypeCode,
  gradeNum: number,
): boolean {
  if (serviceType === "family_care") return false;
  if (serviceType === "visit_care" && gradeNum === 5) return false;
  return SURCHARGE_ELIGIBLE.has(serviceType);
}

/** 백엔드 ScheduleSurchargeCalculator.calcNightOverlapMinutes 와 동일 */
export function calcNightOverlapMinutes(
  startTime: string,
  endTime: string,
): number {
  const toMins = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };
  let start = toMins(startTime);
  let end = toMins(endTime);
  if (end <= start) end += 24 * 60;
  const overlap1 = Math.max(0, Math.min(end, 360) - Math.max(start, 0));
  const overlap2 = Math.max(0, Math.min(end, 1800) - Math.max(start, 1320));
  return overlap1 + overlap2;
}

export function calcSurchargeAmount(args: {
  serviceType: ServiceTypeCode;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  gradeNum?: number;
  unitCost: number;
  feeItemMinMinutes?: number;
  holidayDates?: ReadonlySet<string>;
}): SurchargeQuote {
  const zero: SurchargeQuote = {
    amount: 0,
    rate: 0,
    minutes: 0,
    periodLabel: "",
  };
  const gradeNum = parseGradeNum(args.gradeNum);
  if (!isSurchargeEligible(args.serviceType, gradeNum)) return zero;

  const minMinutes =
    (args.feeItemMinMinutes ?? 0) > 0
      ? args.feeItemMinMinutes!
      : args.durationMinutes;
  if (minMinutes <= 0 || args.unitCost <= 0) return zero;

  const isHoliday = args.holidayDates?.has(args.date) ?? false;
  const isSunday = new Date(`${args.date}T12:00:00`).getDay() === 0;

  let rate = 0;
  let appliedMinutes = 0;
  let periodLabel = "";

  if (isHoliday) {
    rate = HOLIDAY_RATE;
    appliedMinutes = Math.min(args.durationMinutes, minMinutes);
    periodLabel = "공휴일";
  } else if (isSunday) {
    rate = SUNDAY_RATE;
    appliedMinutes = Math.min(args.durationMinutes, minMinutes);
    periodLabel = "일요일";
  } else {
    const nightMinutes = calcNightOverlapMinutes(args.startTime, args.endTime);
    if (nightMinutes <= 0) return zero;
    rate = NIGHT_RATE;
    appliedMinutes = Math.min(nightMinutes, minMinutes);
    periodLabel = "심야";
  }

  if (appliedMinutes <= 0) return zero;

  const raw =
    (args.unitCost * rate * appliedMinutes) / minMinutes;
  const amount = roundOnesDigit(raw);
  return { amount, rate, minutes: appliedMinutes, periodLabel };
}

/** 가산금 일의 자리 반올림 — 십원 단위 (예: 19,307→19,310, 19,304→19,300) */
export function roundOnesDigit(amount: number): number {
  return Math.round(amount / 10) * 10;
}

/**
 * 청구 일정은 공단 총액만 저장 — 가산금 분해·재계산 없음.
 * 계획 일정은 서버가 저장한 가산금을 사용한다.
 * (방문요양 240분 분할 후 구간별 가산·반올림을, 합산 수가로 프론트에서 다시 계산하면
 *  140160×0.3→42050 처럼 10원 오차가 난다. 정답은 구간별 21020+21020=42040)
 */
export function resolveSurchargeAmount(
  entry: ScheduleAssignmentEntry,
  holidayDates: ReadonlySet<string>,
): number {
  if (entry.scheduleKind === "claim") return 0;
  if (entry.feeEdited) return entry.surchargeAmount ?? 0;
  if (typeof entry.surchargeAmount === "number") {
    return entry.surchargeAmount;
  }
  return calcSurchargeAmount({
    serviceType: entry.serviceType,
    date: entry.date,
    startTime: entry.startTime,
    endTime: entry.endTime,
    durationMinutes: entry.durationMinutes,
    gradeNum: entry.grade,
    unitCost: entry.unitCost,
    holidayDates,
  }).amount;
}
