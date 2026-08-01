"use client";

import type { ScheduleAssignmentEntry } from "@/lib/api/scheduleAssignment.types";
import { getCareWorkerName } from "@/lib/api/careWorkers";

import { SERVICE_LABELS, SVC_STYLE, TABLE_TH } from "../constants";
import {
  buildScheduleSummary,
  type ScheduleSummaryRow,
} from "../utils/buildScheduleSummary";

type Props = {
  schedules: ScheduleAssignmentEntry[];
  view: "plan" | "claim";
  highlightedRowKey: string | null;
  onRowClick: (rowKey: string) => void;
  onAddFromRow?: (row: ScheduleSummaryRow) => void;
};

export default function RecipientScheduleSummaryTable({
  schedules,
  view,
  highlightedRowKey,
  onRowClick,
  onAddFromRow,
}: Props) {
  const filtered = schedules.filter((s) => s.scheduleKind === view);
  const summary = buildScheduleSummary(filtered);

  return (
    <div style={{ borderTop: "1px solid #e2e8f0", background: "#ffffff" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr>
            {[
              "구분",
              "급여제공직원",
              "시작시간",
              "종료시간",
              "급여종류",
              "제공시간",
              "급여액(1회)",
              "제공횟수",
              "급여액합계",
            ].map((h) => (
              <th
                key={h}
                style={{
                  ...TABLE_TH,
                  borderRight: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                {h}
              </th>
            ))}
            {view === "plan" && (
              <th
                style={{
                  ...TABLE_TH,
                  borderRight: "none",
                  width: 60,
                  minWidth: 60,
                }}
              />
            )}
          </tr>
        </thead>
        <tbody>
          {summary.length === 0 ? (
            <tr>
              <td
                colSpan={view === "plan" ? 10 : 9}
                style={{
                  padding: 10,
                  textAlign: "center",
                  fontSize: 11,
                  color: "#94a3b8",
                }}
              >
                이 달의 일정 데이터가 없습니다.
              </td>
            </tr>
          ) : (
            summary.map((row, idx) => (
              <SummaryRow
                key={row.rowKey}
                row={row}
                idx={idx}
                isActive={highlightedRowKey === row.rowKey}
                showAddButton={view === "plan"}
                onClick={() => onRowClick(row.rowKey)}
                onAddFromRow={onAddFromRow}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function SummaryRow({
  row,
  idx,
  isActive,
  showAddButton,
  onClick,
  onAddFromRow,
}: {
  row: ScheduleSummaryRow;
  idx: number;
  isActive: boolean;
  showAddButton: boolean;
  onClick: () => void;
  onAddFromRow?: (row: ScheduleSummaryRow) => void;
}) {
  const worker = getCareWorkerName(row.careWorkerId);
  const c = SVC_STYLE[row.serviceType] ?? SVC_STYLE.visit_care;
  const bg = isActive
    ? "rgba(254,243,199,0.85)"
    : idx % 2 === 0
      ? "#ffffff"
      : "#f4f7fb";

  const td = {
    padding: "0 8px",
    height: 30,
    borderBottom: "1px solid #e4eaf3",
    textAlign: "center" as const,
    background: bg,
    color: "#1e293b",
    fontSize: 13,
  };

  return (
    <tr
      onClick={onClick}
      style={{
        cursor: "pointer",
        outline: isActive ? "2px solid #fbbf24" : "none",
        outlineOffset: -1,
      }}
    >
      <td style={td}>
        <span
          style={{
            fontSize: 11,
            padding: "1px 7px",
            borderRadius: 3,
            fontWeight: 700,
            background: row.kind === "claim" ? "#d1fae5" : "#dbeafe",
            color: row.kind === "claim" ? "#059669" : "#1d4ed8",
            border: `1px solid ${row.kind === "claim" ? "#6ee7b7" : "#93c5fd"}`,
          }}
        >
          {row.kind === "claim" ? "청구" : "계획"}
        </span>
      </td>
      <td style={td}>{worker}</td>
      <td style={td}>{row.startTime || "-"}</td>
      <td style={td}>{row.endTime || "-"}</td>
      <td style={td}>
        <span
          style={{
            background: c.bg,
            color: c.color,
            border: `1px solid ${c.border}`,
            fontSize: 11,
            padding: "1px 5px",
            borderRadius: 3,
            fontWeight: 600,
          }}
        >
          {SERVICE_LABELS[row.serviceType] ?? row.serviceType}
        </span>
      </td>
      <td style={td}>{row.durationMinutes}분</td>
      <td style={td}>{row.unitCost.toLocaleString("ko-KR")}원</td>
      <td style={td}>{row.count}회</td>
      <td
        style={{
          ...td,
          color: row.kind === "claim" ? "#059669" : "#1d4ed8",
          fontWeight: 600,
        }}
      >
        {row.benefitTotalSum.toLocaleString("ko-KR")}원
      </td>
      {showAddButton && (
        <td style={{ ...td, padding: "0 6px" }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddFromRow?.(row);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              padding: "2px 7px",
              fontSize: 10,
              borderRadius: 4,
              cursor: "pointer",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#ffffff",
              border: "none",
              fontWeight: 700,
              whiteSpace: "nowrap",
              boxShadow: "0 1px 3px rgba(37,99,235,0.35)",
            }}
          >
            + 일정추가
          </button>
        </td>
      )}
    </tr>
  );
}
