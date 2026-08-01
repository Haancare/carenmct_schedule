import type { CSSProperties } from "react";

export const SVC_META: Record<
  string,
  { short: string; first: string; color: string }
> = {
  visit_care: { short: "요양", first: "요", color: "#2563eb" },
  family_care: { short: "가족", first: "가", color: "#0891b2" },
  full_day_visit: { short: "종일", first: "종", color: "#6366f1" },
  visit_bath: { short: "목욕", first: "목", color: "#059669" },
  visit_nursing: { short: "간호", first: "간", color: "#d97706" },
  day_care: { short: "주간", first: "주", color: "#7c3aed" },
};

export const SVC_ORDER = [
  "visit_care",
  "family_care",
  "full_day_visit",
  "visit_bath",
  "visit_nursing",
  "day_care",
] as const;

export const PA_GROUPS = [
  { id: "all", label: "전체", subs: [] as string[] },
  {
    id: "sw",
    label: "담당사회복지사",
    subs: ["김지원", "박수현", "이나연"],
  },
  { id: "region", label: "지역구분", subs: ["동부지역", "서부지역"] },
] as const;

/** com.employees.position 직종 코드 */
export const POSITION_CODES: Record<string, string> = {
  ST_01: "시설장(관리책임자)",
  ST_02: "사무국장",
  ST_03: "사회복지사",
  ST_04: "간호사",
  ST_05: "물리치료사",
  ST_06: "작업치료사",
  ST_07: "언어치료사",
  ST_08: "요양보호사",
  ST_09: "간호조무사",
  ST_10: "영양사",
  ST_11: "조리원",
  ST_12: "사무원",
  ST_13: "운전원",
  ST_14: "위생원",
};

export const DEFAULT_CARE_WORKER_POSITIONS = ["ST_08"] as const;
export const NURSING_WORKER_POSITIONS = ["ST_04", "ST_09"] as const;

/** 통합관리 포털 직종명 ↔ ST 코드 (포털은 "요양보호사" 등 한글 저장) */
const PORTAL_POSITION_ALIASES: Record<string, string> = {
  조리사: "ST_11",
};

export function normalizePositionCode(raw?: string | null): string {
  const value = raw?.trim() ?? "";
  if (!value || value === "선택") return "";
  if (value.startsWith("ST_")) return value;
  for (const [code, label] of Object.entries(POSITION_CODES)) {
    if (label === value) return code;
  }
  return PORTAL_POSITION_ALIASES[value] ?? value;
}

export function matchesPositionFilter(
  rawPosition: string | undefined,
  allowedCodes: readonly string[],
): boolean {
  const code = normalizePositionCode(rawPosition);
  if (code && allowedCodes.includes(code)) return true;
  const raw = rawPosition?.trim() ?? "";
  return allowedCodes.some((c) => c === raw || POSITION_CODES[c] === raw);
}

export const selStyle: CSSProperties = {
  height: 24,
  padding: "0 6px",
  fontSize: 12,
  borderRadius: 6,
  outline: "none",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  color: "#1e293b",
  cursor: "pointer",
};

export const btnNav: CSSProperties = {
  width: 20,
  height: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #e2e8f0",
  borderRadius: 4,
  background: "#f8fafc",
  cursor: "pointer",
};
