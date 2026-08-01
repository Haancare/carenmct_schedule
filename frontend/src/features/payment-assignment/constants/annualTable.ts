import type { CSSProperties } from "react";

import type { MonthScheduleSummaryDto } from "@/lib/api/paymentAssignment.types";

export const ANNUAL_W = {
  seq: 38,
  name: 82,
  birth: 60,
  grade: 52,
  type: 44,
  regId: 136,
  month: 54,
} as const;

export const ANNUAL_S = {
  seq: 0,
  name: ANNUAL_W.seq,
  birth: ANNUAL_W.seq + ANNUAL_W.name,
  grade: ANNUAL_W.seq + ANNUAL_W.name + ANNUAL_W.birth,
  type: ANNUAL_W.seq + ANNUAL_W.name + ANNUAL_W.birth + ANNUAL_W.grade,
  regId:
    ANNUAL_W.seq +
    ANNUAL_W.name +
    ANNUAL_W.birth +
    ANNUAL_W.grade +
    ANNUAL_W.type,
} as const;

export const ANNUAL_FIXED_W =
  ANNUAL_W.seq +
  ANNUAL_W.name +
  ANNUAL_W.birth +
  ANNUAL_W.grade +
  ANNUAL_W.type +
  ANNUAL_W.regId;

export const ANNUAL_MONTHS = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
] as const;

export const ANNUAL_TH_BASE: CSSProperties = {
  position: "sticky",
  top: 0,
  color: "rgba(255,255,255,0.88)",
  fontSize: 12,
  fontWeight: 600,
  height: 34,
  whiteSpace: "nowrap",
  textAlign: "center",
  borderRight: "1px solid rgba(255,255,255,0.12)",
  padding: "0 4px",
};

export const PLAN_ON: CSSProperties = {
  background: "#dbeafe",
  border: "1px solid #93c5fd",
  color: "#1d4ed8",
};

export const PLAN_OFF: CSSProperties = {
  background: "#f1f5f9",
  border: "1px solid #e2e8f0",
  color: "#cbd5e1",
};

export const CLAIM_ON: CSSProperties = {
  background: "#d1fae5",
  border: "1px solid #6ee7b7",
  color: "#059669",
};

export const CLAIM_OFF: CSSProperties = {
  background: "#f1f5f9",
  border: "1px solid #e2e8f0",
  color: "#cbd5e1",
};

export function monthColBg(rowIsEven: boolean, colIsEven: boolean): string {
  if (colIsEven) return rowIsEven ? "#edf1f8" : "#e5eaf3";
  return rowIsEven ? "#ffffff" : "#f4f7fb";
}

export function isQuarterStart(index: number): boolean {
  return index > 0 && index % 3 === 0;
}

export type MonthCellInfo = {
  hasPlan: boolean;
  planCount: number;
  hasClaim: boolean;
  claimCount: number;
};

export function toMonthCellInfo(
  summary: MonthScheduleSummaryDto,
): MonthCellInfo {
  return {
    hasPlan: summary.planCount > 0,
    planCount: summary.planCount,
    hasClaim: summary.claimCount > 0,
    claimCount: summary.claimCount,
  };
}
