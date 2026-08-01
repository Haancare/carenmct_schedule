import type { CSSProperties } from "react";

import { ANNUAL_TH_BASE } from "./annualTable";

export const MONTHLY_W = {
  seq: 36,
  name: 82,
  birth: 60,
  svc: 60,
  grade: 48,
  red: 48,
} as const;

export const MONTHLY_S = {
  seq: 0,
  name: MONTHLY_W.seq,
  birth: MONTHLY_W.seq + MONTHLY_W.name,
  svc: MONTHLY_W.seq + MONTHLY_W.name + MONTHLY_W.birth,
  grade: MONTHLY_W.seq + MONTHLY_W.name + MONTHLY_W.birth + MONTHLY_W.svc,
  red:
    MONTHLY_W.seq +
    MONTHLY_W.name +
    MONTHLY_W.birth +
    MONTHLY_W.svc +
    MONTHLY_W.grade,
} as const;

export const MONTHLY_FIXED_W = MONTHLY_S.red + MONTHLY_W.red;

export const MONTHLY_DAY_COL_W = 26;
export const MONTHLY_TIME_COL_W = 80;
export const MONTHLY_COUNT_COL_W = 60;

export const MONTHLY_TH_BASE: CSSProperties = ANNUAL_TH_BASE;

export function formatDurationMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "-";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) return `${h}시간${m > 0 ? ` ${m}분` : ""}`;
  return `${m}분`;
}

export function monthlyTableMinWidth(lastDay: number): number {
  return (
    MONTHLY_FIXED_W +
    MONTHLY_DAY_COL_W * lastDay +
    MONTHLY_TIME_COL_W +
    MONTHLY_COUNT_COL_W
  );
}
