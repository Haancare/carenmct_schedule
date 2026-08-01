/** 월간 캘린더 주차 — Date | null (빈 칸) */
export function getCalendarWeeks(
  year: number,
  month: number,
): (Date | null)[][] {
  const lastDay = new Date(year, month, 0).getDate();
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = [];

  const startDow = new Date(year, month - 1, 1).getDay();
  for (let i = 0; i < startDow; i++) week.push(null);

  for (let d = 1; d <= lastDay; d++) {
    week.push(new Date(year, month - 1, d));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatKrw(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}
