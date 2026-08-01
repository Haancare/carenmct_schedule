import type { CSSProperties } from "react";

export function typeLabel(
  reduction: string,
): "감경" | "기초" | "일반" {
  if (reduction.includes("감경")) return "감경";
  if (reduction.includes("기초")) return "기초";
  return "일반";
}

export function typeDisplay(reduction: string): string {
  if (reduction.includes("9")) return "9%";
  if (reduction.includes("7.5")) return "7.5%";
  if (reduction.includes("6")) return "6%";
  if (reduction.includes("기초")) return "기초";
  return "일반";
}

/** Figma copayLabel — 캘린더 일정 카드 감경 pill */
export function copayLabel(type: string): string {
  if (type === "일반대상자" || type === "일반") return "일반";
  if (type === "감경9%" || type === "감경대상자") return "9%";
  if (type === "감경7.5%") return "7.5%";
  if (type === "감경6%") return "6%";
  if (type === "기초수급자" || type === "기초") return "기초";
  return type;
}

export function normalizeReductionType(type: string): string {
  if (type === "일반대상자") return "일반";
  if (type === "기초수급자") return "기초";
  if (type === "감경대상자") return "감경9%";
  return type;
}

/** Figma copayStyle — 캘린더 일정 카드 감경 pill 색상 */
export function copayStyle(type: string): {
  bg: string;
  color: string;
  border: string;
} {
  const t = normalizeReductionType(type);
  if (t === "기초") return { bg: "#fefce8", color: "#854d0e", border: "#fde047" };
  if (t === "감경9%") return { bg: "#fff7ed", color: "#c2410c", border: "#fdba74" };
  if (t === "감경7.5%") return { bg: "#fff7ed", color: "#b45309", border: "#fde68a" };
  if (t === "감경6%") return { bg: "#f0fdf4", color: "#059669", border: "#6ee7b7" };
  return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
}

/** Figma getReductionPill — 사이드바 감경구분 칩 */
export function reductionPillDisplay(reduction: string): string {
  if (reduction === "일반") return `일반 ${copayRatePercent(reduction)}%`;
  if (reduction === "기초") return "기초";
  return reduction;
}

export function copayRatePercent(reduction: string): number {
  switch (reduction) {
    case "기초":
      return 0;
    case "감경6%":
      return 6;
    case "감경7.5%":
      return 7.5;
    case "감경9%":
      return 9;
    case "일반":
    default:
      return 15;
  }
}

export function typeStyle(t: string): CSSProperties {
  if (t === "감경") {
    return {
      background: "#fffbeb",
      color: "#d97706",
      border: "1px solid #fde68a",
    };
  }
  if (t === "기초") {
    return {
      background: "#fff1f2",
      color: "#dc2626",
      border: "1px solid #fecaca",
    };
  }
  return {
    background: "#f8fafc",
    color: "#64748b",
    border: "1px solid #e2e8f0",
  };
}

export function formatLegalDob(legalDob: string): string {
  if (!legalDob || legalDob.length < 10) return "-";
  return `${legalDob.slice(2, 4)}.${legalDob.slice(5, 7)}.${legalDob.slice(8, 10)}`;
}

export function contractStyle(status: string): CSSProperties {
  switch (status) {
    case "수급중":
      return {
        background: "#ecfdf5",
        color: "#059669",
        border: "1px solid #6ee7b7",
      };
    case "준비중":
      return {
        background: "#eff6ff",
        color: "#2563eb",
        border: "1px solid #bfdbfe",
      };
    case "타기관":
      return {
        background: "#f5f3ff",
        color: "#7c3aed",
        border: "1px solid #ddd6fe",
      };
    case "계약종료":
      return {
        background: "#f1f5f9",
        color: "#64748b",
        border: "1px solid #e2e8f0",
      };
    case "사망":
      return {
        background: "#1f2937",
        color: "#f9fafb",
        border: "1px solid #111827",
      };
    case "보류":
      return {
        background: "#fffbeb",
        color: "#d97706",
        border: "1px solid #fde68a",
      };
    case "입원":
      return {
        background: "#fef2f2",
        color: "#dc2626",
        border: "1px solid #fecaca",
      };
    case "상담중":
      return {
        background: "#f0fdfa",
        color: "#0d9488",
        border: "1px solid #99f6e4",
      };
    default:
      return {
        background: "#f8fafc",
        color: "#64748b",
        border: "1px solid #e2e8f0",
      };
  }
}
