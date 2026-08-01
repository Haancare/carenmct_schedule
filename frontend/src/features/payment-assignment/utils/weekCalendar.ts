import type { WeeklyCalendarWeekDto } from "@/lib/api/paymentAssignment.types";

export const PUBLIC_HOLIDAYS = new Set<string>([
  "2026-01-01",
  "2026-03-01",
  "2026-05-05",
  "2026-06-06",
  "2026-08-15",
  "2026-10-03",
  "2026-10-09",
  "2026-12-25",
]);

export function isHoliday(dateStr: string): boolean {
  return PUBLIC_HOLIDAYS.has(dateStr);
}

function mondayOf(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

function parseDateStr(ds: string): Date {
  const [y, mo, da] = ds.split("-").map(Number);
  return new Date(y, mo - 1, da);
}

/** YYYY-MM-DD → 로컬 Date (타임존 안전) */
export function parseLocalDate(dateStr: string): Date {
  return parseDateStr(dateStr);
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function firstWeekMonday(Y: number, M: number): Date {
  const monF = mondayOf(new Date(Y, M, 1));
  let cnt = 0;
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monF);
    dd.setDate(dd.getDate() + i);
    if (dd.getFullYear() === Y && dd.getMonth() === M) cnt++;
  }
  if (cnt >= 4) return monF;
  const next = new Date(monF);
  next.setDate(next.getDate() + 7);
  return next;
}

/** 일정 날짜 목록 → 월~일 주차 배열 */
export function buildWeeksFromDates(dates: string[]): WeeklyCalendarWeekDto[] {
  if (dates.length === 0) return [];

  const sorted = [...dates].sort();
  const toMonday = (ds: string) => mondayOf(parseDateStr(ds));

  const start = toMonday(sorted[0]);
  const lastMon = toMonday(sorted[sorted.length - 1]);
  const end = new Date(lastMon);
  end.setDate(end.getDate() + 6);

  const cur = new Date(start);
  const rawWeeks: { mon: Date; days: Date[] }[] = [];

  while (cur <= end) {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    rawWeeks.push({ mon: days[0], days });
  }

  return rawWeeks.map((wk) => {
    const counts = new Map<string, number>();
    wk.days.forEach((d) => {
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
    let bestKey = "";
    let bestCnt = -1;
    counts.forEach((c, k) => {
      if (c > bestCnt) {
        bestCnt = c;
        bestKey = k;
      }
    });
    const [yStr, mStr] = bestKey.split("-");
    const Y = Number(yStr);
    const M = Number(mStr);
    const w1 = firstWeekMonday(Y, M);
    const thisMon = mondayOf(wk.mon);
    const ord =
      Math.round((thisMon.getTime() - w1.getTime()) / (7 * 86400000)) + 1;

    return {
      days: wk.days.map(toDateStr),
      label: `${M + 1}월 ${ord}주차`,
    };
  });
}

export function formatWeeklyDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return m > 0 ? `${h}시간${m}분` : `${h}시간`;
  return `${m}분`;
}
