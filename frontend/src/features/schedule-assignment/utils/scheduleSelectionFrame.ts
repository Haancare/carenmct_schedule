import type { CSSProperties } from "react";

import type { PlanClaimView } from "../constants";

export type ScheduleSelectionFrame = {
  inner: string;
  outer: string;
  bg: string;
};

export function getScheduleSelectionFrame(
  kind: PlanClaimView | "plan" | "claim",
): ScheduleSelectionFrame {
  return kind === "claim"
    ? { inner: "#16a34a", outer: "#bbf7d0", bg: "#f0fdf4" }
    : { inner: "#2563eb", outer: "#bfdbfe", bg: "#eff6ff" };
}

/** 안쪽 짙은선 + 바깥 옅은 링 (2중 테두리) */
export function selectionDoubleBorderStyle(
  frame: ScheduleSelectionFrame,
  opts?: {
    dropShadow?: boolean;
    borderRadius?: number;
    /** card: 옅은 배경 틴트 / popover: 흰색 본문 */
    surface?: "card" | "popover";
  },
): CSSProperties {
  const isCard = opts?.surface === "card";
  const innerWidth = isCard ? 3 : 2;
  const outerWidth = isCard ? 2 : 3;
  const shadows = [`0 0 0 ${outerWidth}px ${frame.outer}`];
  if (opts?.dropShadow) {
    shadows.push(
      "0 8px 24px rgba(15,23,42,0.12)",
      "0 2px 6px rgba(15,23,42,0.06)",
    );
  }
  return {
    background: opts?.surface === "popover" ? "#ffffff" : frame.bg,
    border: `${innerWidth}px solid ${frame.inner}`,
    boxShadow: shadows.join(", "),
    borderRadius: opts?.borderRadius,
  };
}
