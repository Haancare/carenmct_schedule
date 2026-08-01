"use client";

import type { ScheduleKind } from "@/lib/api/paymentAssignment.types";

import FilterDivider from "./FilterDivider";

type Props = {
  year: number;
  month: number;
  scheduleKind: ScheduleKind;
  onMonthChange: (month: number) => void;
  onScheduleKindChange: (kind: ScheduleKind) => void;
};

const VIEW_OPTIONS = [
  ["plan", "계획보기", "#1d4ed8", "#dbeafe", "#93c5fd"],
  ["claim", "청구보기", "#059669", "#d1fae5", "#6ee7b7"],
] as const;

export default function MonthlyScheduleSubBar({
  year,
  month,
  scheduleKind,
  onMonthChange,
  onScheduleKindChange,
}: Props) {
  return (
    <div
      style={{
        flexShrink: 0,
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: "5px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", gap: 2 }}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
          const on = month === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onMonthChange(m)}
              style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 14,
                cursor: "pointer",
                background: on ? "#152e50" : "#ffffff",
                color: on ? "#fff" : "#64748b",
                border: `1px solid ${on ? "#152e50" : "#e2e8f0"}`,
                fontWeight: on ? 700 : 400,
              }}
            >
              {m}월
            </button>
          );
        })}
      </div>

      <FilterDivider />

      <div style={{ display: "flex", gap: 3 }}>
        {VIEW_OPTIONS.map(([key, label, col, bg, bd]) => {
          const on = scheduleKind === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onScheduleKindChange(key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                padding: "3px 10px",
                borderRadius: 16,
                cursor: "pointer",
                background: on ? bg : "#ffffff",
                color: on ? col : "#64748b",
                border: `1px solid ${on ? bd : "#e2e8f0"}`,
                fontWeight: on ? 700 : 500,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: bg,
                  border: `1px solid ${bd}`,
                }}
              />
              {label}
            </button>
          );
        })}
      </div>

      <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 8 }}>
        행을 클릭하면 해당 수급자의 {year}년 {month}월{" "}
        {scheduleKind === "plan" ? "계획" : "청구"}보기로 이동합니다.
      </span>
    </div>
  );
}
