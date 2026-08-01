"use client";

import { useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";

import type { ScheduleAssignmentEntry } from "@/lib/api/scheduleAssignment.types";
import { getCareWorkerBirth, getCareWorkerName } from "@/lib/api/careWorkers";
import { typeDisplay } from "@/features/payment-assignment/utils/recipientDisplay";

import { SERVICE_LABELS, SVC_STYLE } from "../constants";
import { formatKrwPlain, getDisplayBenefitTotal, isClaimSchedule } from "../utils/scheduleFee";
import { resolveSurchargeAmount } from "../utils/scheduleSurcharge";
import {
  getScheduleSelectionFrame,
  selectionDoubleBorderStyle,
} from "../utils/scheduleSelectionFrame";

type Props = {
  recipientName: string;
  schedule: ScheduleAssignmentEntry;
  position: { x: number; y: number };
  holidayDates?: ReadonlySet<string>;
  onClose: () => void;
  onSaveFee: (
    scheduleId: string,
    unitCost: number,
    surchargeAmount: number,
  ) => void;
};

function formatWorkerBirth(birth: string): string {
  if (!birth) return "-";
  const m = birth.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}.${m[2]}.${m[3]}`;
  return birth;
}

export default function ScheduleCardPopover({
  recipientName,
  schedule,
  position,
  holidayDates = new Set<string>(),
  onClose,
  onSaveFee,
}: Props) {
  const isClaim = isClaimSchedule(schedule);
  const displaySurcharge = resolveSurchargeAmount(schedule, holidayDates);
  const [editing, setEditing] = useState(false);
  const [baseVal, setBaseVal] = useState(schedule.unitCost);
  const [surVal, setSurVal] = useState(displaySurcharge);

  useEffect(() => {
    if (isClaim) return;
    const next = resolveSurchargeAmount(schedule, holidayDates);
    setBaseVal(schedule.unitCost);
    setSurVal(next);
  }, [schedule, holidayDates, isClaim]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sc = SVC_STYLE[schedule.serviceType] ?? SVC_STYLE.visit_care;
  const total = getDisplayBenefitTotal(schedule, displaySurcharge);
  const workerName = getCareWorkerName(schedule.careWorkerId);
  const workerBirth = formatWorkerBirth(getCareWorkerBirth(schedule.careWorkerId));
  const selectionFrame = getScheduleSelectionFrame(schedule.scheduleKind);
  const accent = selectionFrame.inner;

  const left = Math.min(position.x, window.innerWidth - 540);
  const top = Math.min(position.y, window.innerHeight - 220);

  const save = () => {
    onSaveFee(schedule.id, baseVal, surVal);
    setEditing(false);
  };

  const th: React.CSSProperties = {
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
    padding: "3px 5px",
    fontSize: 12,
    fontWeight: 600,
    color: "#64748b",
    textAlign: "center",
    whiteSpace: "nowrap",
    lineHeight: 1.35,
  };

  const td: React.CSSProperties = {
    borderBottom: "1px solid #f1f5f9",
    borderRight: "1px solid #f1f5f9",
    padding: "3px 5px",
    fontSize: 13,
    color: "#1e293b",
    textAlign: "center",
    whiteSpace: "nowrap",
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 300 }}
      />
      <div
        style={{
          position: "fixed",
          left,
          top,
          zIndex: 301,
          width: 520,
          overflow: "hidden",
          userSelect: "none",
          ...selectionDoubleBorderStyle(selectionFrame, {
            dropShadow: true,
            borderRadius: 8,
            surface: "popover",
          }),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "7px 10px",
            borderBottom: "1px solid #e2e8f0",
            background: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
              {recipientName}
            </span>
            <span
              style={{
                width: 1,
                height: 11,
                background: "#e2e8f0",
                display: "inline-block",
                margin: "0 2px",
              }}
            />
            <span style={{ fontSize: 12, color: "#94a3b8" }}>급여일자</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
              {schedule.date}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 18,
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #e2e8f0",
              borderRadius: 4,
              background: "#f1f5f9",
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
          >
            <X size={10} color="#64748b" strokeWidth={2.5} />
          </button>
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#ffffff",
          }}
        >
          <thead>
            <tr>
              <th
                rowSpan={2}
                style={{ ...th, width: 36, borderLeft: "none", verticalAlign: "middle" }}
              >
                구분
              </th>
              <th style={th}>수급등급</th>
              <th style={th}>수급구분</th>
              <th rowSpan={2} style={{ ...th, verticalAlign: "middle" }}>
                시작시간
              </th>
              <th rowSpan={2} style={{ ...th, verticalAlign: "middle" }}>
                종료시간
              </th>
              <th rowSpan={2} style={{ ...th, verticalAlign: "middle" }}>
                제공시간
              </th>
              <th
                rowSpan={2}
                style={{
                  ...th,
                  textAlign: "right",
                  verticalAlign: "middle",
                  borderRight: "none",
                }}
              >
                급여액
              </th>
            </tr>
            <tr>
              <th style={{ ...th, borderTop: "1px solid #e2e8f0" }}>
                종사자이름
              </th>
              <th
                style={{
                  ...th,
                  borderTop: "1px solid #e2e8f0",
                  borderRight: "none",
                }}
              >
                생년월일
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                rowSpan={2}
                style={{
                  ...td,
                  borderLeft: "none",
                  background: sc.bg,
                  color: sc.color,
                  fontWeight: 700,
                  verticalAlign: "middle",
                }}
              >
                {SERVICE_LABELS[schedule.serviceType]?.slice(0, 2) ??
                  schedule.serviceType}
              </td>
              <td style={td}>{schedule.grade ?? "-"}등급</td>
              <td style={td}>{typeDisplay(schedule.reduction ?? "일반")}</td>
              <td style={{ ...td, fontWeight: 600, color: "#334155" }}>
                {schedule.startTime}
              </td>
              <td style={{ ...td, fontWeight: 600, color: "#334155" }}>
                {schedule.endTime}
              </td>
              <td style={{ ...td, fontWeight: 600 }}>
                {schedule.durationMinutes}분
              </td>
              <td
                rowSpan={2}
                style={{
                  ...td,
                  textAlign: "right",
                  borderRight: "none",
                  verticalAlign: "middle",
                }}
              >
                {isClaim ? (
                  <span style={{ fontWeight: 700 }}>{formatKrwPlain(total)}</span>
                ) : editing ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      width: 160,
                      marginLeft: "auto",
                    }}
                  >
                    <FeeInput
                      label="기본수가"
                      value={baseVal}
                      onChange={setBaseVal}
                      onEnter={save}
                      onEscape={() => setEditing(false)}
                      autoFocus
                    />
                    <FeeInput
                      label="가산금"
                      value={surVal}
                      onChange={setSurVal}
                      onEnter={save}
                      onEscape={() => setEditing(false)}
                      accent
                    />
                    <div style={{ fontSize: 12, textAlign: "right" }}>
                      합계 {formatKrwPlain(baseVal + surVal)}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        style={miniBtn}
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={save}
                        style={{
                          ...miniBtn,
                          background: "#f59e0b",
                          color: "#fff",
                          border: "none",
                          fontWeight: 700,
                        }}
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setBaseVal(schedule.unitCost);
                      setSurVal(displaySurcharge);
                      setEditing(true);
                    }}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      textAlign: "right",
                      padding: 0,
                    }}
                    title="클릭하여 수정"
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        justifyContent: "flex-end",
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>{formatKrwPlain(total)}</span>
                      <span
                        style={{
                          fontSize: 9,
                          padding: "1px 4px",
                          borderRadius: 3,
                          background: "#fffbeb",
                          color: accent === "#16a34a" ? "#d97706" : "#d97706",
                          border: "1px solid #fde68a",
                        }}
                      >
                        <Pencil size={8} color="#d97706" />
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                      기본수가 {formatKrwPlain(schedule.unitCost)}&nbsp;&nbsp;가산금{" "}
                      {formatKrwPlain(displaySurcharge)}
                    </div>
                  </button>
                )}
              </td>
            </tr>
            <tr>
              <td style={{ ...td, color: "#1e40af", fontWeight: 600 }}>
                {workerName}
              </td>
              <td
                style={{
                  ...td,
                  color: "#475569",
                  borderRight: "none",
                }}
              >
                {workerBirth}
              </td>
              <td style={{ ...td, color: "#94a3b8" }}>-</td>
              <td style={{ ...td, color: "#94a3b8" }}>-</td>
              <td style={{ ...td, color: "#94a3b8" }}>-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function FeeInput({
  label,
  value,
  onChange,
  onEnter,
  onEscape,
  autoFocus,
  accent,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onEnter: () => void;
  onEscape: () => void;
  autoFocus?: boolean;
  accent?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span
        style={{
          fontSize: 10,
          color: accent ? "#b45309" : "#64748b",
          width: 42,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <input
        autoFocus={autoFocus}
        type="text"
        value={value.toLocaleString("ko-KR")}
        onChange={(e) =>
          onChange(parseInt(e.target.value.replace(/[^0-9]/g, "") || "0", 10))
        }
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === "Enter") onEnter();
          if (e.key === "Escape") onEscape();
        }}
        style={{
          width: 80,
          fontSize: 12,
          padding: "2px 5px",
          border: `1px solid ${accent ? "#fde68a" : "#f59e0b"}`,
          borderRadius: 3,
          textAlign: "right",
          background: accent ? "#fffbeb" : "#fff",
        }}
      />
    </div>
  );
}

const miniBtn = {
  fontSize: 11,
  padding: "3px 8px",
  borderRadius: 3,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#64748b",
  cursor: "pointer",
} as const;
