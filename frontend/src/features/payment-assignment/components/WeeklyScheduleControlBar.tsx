"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import type {
  PaymentAssignmentRecipientDto,
  ScheduleKind,
} from "@/lib/api/paymentAssignment.types";

import { btnNav } from "../constants";
import { typeDisplay } from "../utils/recipientDisplay";
import FilterDivider from "./FilterDivider";

type Props = {
  recipient: PaymentAssignmentRecipientDto | null;
  year: number;
  scheduleKind: ScheduleKind;
  onYearChange: (year: number) => void;
  onScheduleKindChange: (kind: ScheduleKind) => void;
};

const VIEW_OPTIONS = [
  ["plan", "계획보기", "#1d4ed8", "#dbeafe", "#93c5fd"],
  ["claim", "청구보기", "#059669", "#d1fae5", "#6ee7b7"],
] as const;

export default function WeeklyScheduleControlBar({
  recipient,
  year,
  scheduleKind,
  onYearChange,
  onScheduleKindChange,
}: Props) {
  return (
    <div
      style={{
        flexShrink: 0,
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
        padding: "5px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
        {recipient ? recipient.name : "수급자를 선택하세요"}
      </span>
      {recipient && (
        <span style={{ fontSize: 12, color: "#94a3b8" }}>
          {recipient.gradeText} · {typeDisplay(recipient.reduction)}
        </span>
      )}

      <FilterDivider />

      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <button
          type="button"
          onClick={() => onYearChange(year - 1)}
          style={btnNav}
        >
          <ChevronLeft size={12} color="#64748b" />
        </button>
        <div
          style={{
            minWidth: 54,
            textAlign: "center",
            fontSize: 12,
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          {year}년
        </div>
        <button
          type="button"
          onClick={() => onYearChange(year + 1)}
          style={btnNav}
        >
          <ChevronRight size={12} color="#64748b" />
        </button>
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
                background: on ? bg : "#fff",
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
    </div>
  );
}
