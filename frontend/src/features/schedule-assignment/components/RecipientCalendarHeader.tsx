"use client";

import { ChevronLeft, ChevronRight, Lock, Printer, StickyNote, Zap } from "lucide-react";

import type { ScheduleYearMonthCounts } from "@/lib/api/scheduleAssignment.types";

import type { PlanClaimView } from "../constants";

type Props = {
  year: number;
  month: number;
  view: PlanClaimView;
  yearMonthCounts: ScheduleYearMonthCounts;
  assignMode?: boolean;
  statusLabel?: string;
  memoOpen?: boolean;
  memoCount?: number;
  onMemoToggle?: () => void;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onViewChange: (view: PlanClaimView) => void;
};

export default function RecipientCalendarHeader({
  year,
  month,
  view,
  yearMonthCounts,
  assignMode = false,
  statusLabel,
  memoOpen = false,
  memoCount = 0,
  onMemoToggle,
  onYearChange,
  onMonthChange,
  onViewChange,
}: Props) {
  const prevMonth = () => {
    if (month === 1) {
      onYearChange(year - 1);
      onMonthChange(12);
    } else onMonthChange(month - 1);
  };

  const nextMonth = () => {
    if (month === 12) {
      onYearChange(year + 1);
      onMonthChange(1);
    } else onMonthChange(month + 1);
  };

  return (
    <div
      style={{
        flexShrink: 0,
        height: 46,
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        borderBottom: "1px solid #e8edf5",
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "#f1f5f9",
          borderRadius: 8,
          padding: 2,
          border: "1px solid #e2e8f0",
          marginRight: 12,
        }}
      >
        <button
          type="button"
          onClick={() => onYearChange(year - 1)}
          style={navBtn}
        >
          <ChevronLeft size={11} color="#64748b" />
        </button>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#0f172a",
            minWidth: 52,
            textAlign: "center",
          }}
        >
          {year}년
        </span>
        <button
          type="button"
          onClick={() => onYearChange(year + 1)}
          style={navBtn}
        >
          <ChevronRight size={11} color="#64748b" />
        </button>
      </div>

      <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
          const active = month === m;
          const cnt = yearMonthCounts[m];
          const planCnt = cnt?.plan ?? 0;
          const claimCnt = cnt?.claim ?? 0;
          const count = view === "claim" ? claimCnt : planCnt;
          const hasAny = planCnt > 0 || claimCnt > 0;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onMonthChange(m)}
              style={{
                width: 38,
                height: 30,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                background: active
                  ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
                  : hasAny
                    ? "#f1f5f9"
                    : "transparent",
                boxShadow: active ? "0 2px 6px rgba(37,99,235,0.30)" : "none",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#ffffff" : "#475569",
                  lineHeight: 1,
                }}
              >
                {m}월
              </span>
              {count > 0 ? (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    lineHeight: "11px",
                    minWidth: 14,
                    padding: "0 3px",
                    borderRadius: 5,
                    background: active
                      ? "rgba(255,255,255,0.25)"
                      : view === "claim"
                        ? "#dcfce7"
                        : "#dbeafe",
                    color: active
                      ? "#ffffff"
                      : view === "claim"
                        ? "#059669"
                        : "#2563eb",
                  }}
                >
                  {count}
                </span>
              ) : (
                <span style={{ height: 11 }} />
              )}
            </button>
          );
        })}

        <div
          style={{
            width: 1,
            height: 22,
            background: "#e2e8f0",
            margin: "0 8px",
          }}
        />
        <div
          style={{
            display: "flex",
            background: "#e4eaf3",
            borderRadius: 6,
            padding: 2,
            gap: 1,
          }}
        >
          {(
            [
              { key: "plan", label: "계획보기" },
              { key: "claim", label: "청구보기" },
            ] as const
          ).map(({ key, label }) => {
            const active = view === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (!assignMode) onViewChange(key);
                }}
                title={
                  assignMode && key === "claim"
                    ? "배정 모드 중에는 계획보기만 사용할 수 있습니다"
                    : undefined
                }
                style={{
                  padding: "3px 9px",
                  borderRadius: 4,
                  border: "none",
                  cursor:
                    assignMode && key === "claim" ? "not-allowed" : "pointer",
                  fontSize: 11,
                  fontWeight: active ? 700 : 400,
                  whiteSpace: "nowrap",
                  backgroundImage: active
                    ? key === "plan"
                      ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                      : "linear-gradient(135deg, #059669, #047857)"
                    : "none",
                  color: active
                    ? "#ffffff"
                    : assignMode && key === "claim"
                      ? "#cbd5e1"
                      : "#64748b",
                  opacity: assignMode && key === "claim" ? 0.45 : 1,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
        {statusLabel && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#2563eb",
              padding: "3px 8px",
              borderRadius: 12,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
            }}
          >
            {statusLabel}
          </span>
        )}
        {assignMode ? (
          <>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 9px",
                borderRadius: 20,
                fontSize: 10,
                fontWeight: 700,
                background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                color: "#065f46",
                border: "1px solid #6ee7b7",
              }}
            >
              <Zap size={9} strokeWidth={2.5} />
              배정 가능
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 9px",
                borderRadius: 20,
                fontSize: 10,
                fontWeight: 700,
                background: "linear-gradient(135deg, #fff1f2, #fee2e2)",
                color: "#991b1b",
                border: "1px solid #fca5a5",
              }}
            >
              <Lock size={9} strokeWidth={2.5} />
              불가
            </span>
          </>
        ) : (
          <>
            {onMemoToggle && (
              <button
                type="button"
                onClick={onMemoToggle}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 9px",
                  fontSize: 11,
                  borderRadius: 6,
                  cursor: "pointer",
                  background:
                    memoOpen || memoCount > 0 ? "#fefce8" : "#ffffff",
                  border: `1px solid ${
                    memoOpen
                      ? "#fbbf24"
                      : memoCount > 0
                        ? "#fde68a"
                        : "#e2e8f0"
                  }`,
                  color:
                    memoOpen || memoCount > 0 ? "#92400e" : "#64748b",
                }}
              >
                <StickyNote
                  size={10}
                  color={
                    memoOpen
                      ? "#d97706"
                      : memoCount > 0
                        ? "#f59e0b"
                        : "#94a3b8"
                  }
                />
                메모
                {memoCount > 0 && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      minWidth: 14,
                      padding: "0 4px",
                      borderRadius: 8,
                      background: "#fde68a",
                      color: "#92400e",
                    }}
                  >
                    {memoCount}
                  </span>
                )}
              </button>
            )}
            <button type="button" style={actionBtn}>
              <Printer size={10} />
              출력
            </button>
            <button
              type="button"
              onClick={prevMonth}
              style={actionBtn}
              title="이전 달"
            >
              <ChevronLeft size={10} />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              style={actionBtn}
              title="다음 달"
            >
              <ChevronRight size={10} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const navBtn = {
  width: 20,
  height: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: 6,
  background: "transparent",
  cursor: "pointer",
} as const;

const actionBtn = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 9px",
  fontSize: 11,
  borderRadius: 6,
  border: "1px solid #e2e8f0",
  backgroundColor: "#ffffff",
  color: "#64748b",
  cursor: "pointer",
} as const;
