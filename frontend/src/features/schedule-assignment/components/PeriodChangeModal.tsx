"use client";

import type { ReactNode } from "react";
import { Calendar, Check, Info, X } from "lucide-react";

import { addDays, fmtMd } from "../utils/periodChange";

export type PeriodChangeOption = {
  value: string;
  label: string;
  sub?: string;
};

type Props = {
  icon: ReactNode;
  title: string;
  recipientName: string;
  monthLabel: string;
  monthStart: string;
  monthEnd: string;
  splitDate: string;
  onSplitChange: (v: string) => void;
  options: PeriodChangeOption[];
  beforeValue: string;
  onBeforeChange: (v: string) => void;
  afterValue: string;
  onAfterChange: (v: string) => void;
  reason: string;
  onReasonChange: (v: string) => void;
  accent: string;
  onClose: () => void;
  onSave: () => void;
};

export default function PeriodChangeModal({
  icon,
  title,
  recipientName,
  monthLabel,
  monthStart,
  monthEnd,
  splitDate,
  onSplitChange,
  options,
  beforeValue,
  onBeforeChange,
  afterValue,
  onAfterChange,
  reason,
  onReasonChange,
  accent,
  onClose,
  onSave,
}: Props) {
  const splitValid = splitDate >= monthStart && splitDate <= monthEnd;
  const wholeMonth = splitValid && splitDate === monthStart;
  const beforeEnd = splitValid ? addDays(splitDate, -1) : monthEnd;
  const canSave = splitValid && (wholeMonth || beforeValue !== afterValue);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15,39,68,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          width: 460,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 8px 32px rgba(15,39,68,0.22)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid #e2e8f0",
            background: "linear-gradient(90deg,#0f2744,#1a3a5c)",
            borderRadius: "10px 10px 0 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            {icon}
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
              {title}
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              {recipientName} · {monthLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <X size={15} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        <div
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <div style={labelStyle}>
              변경 적용일{" "}
              <span style={{ fontWeight: 400, color: "#94a3b8" }}>
                (1일 선택 시 월 전체)
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <Calendar
                size={13}
                color="#94a3b8"
                style={{
                  position: "absolute",
                  left: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="date"
                value={splitDate}
                min={monthStart}
                max={monthEnd}
                onChange={(e) => onSplitChange(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: 12,
                  padding: "7px 9px 7px 28px",
                  border: `1px solid ${splitValid ? "#d1d5db" : "#fca5a5"}`,
                  borderRadius: 6,
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {!wholeMonth && (
            <div style={sectionBox}>
              <PeriodHead
                accent={accent}
                tag="변경 전"
                range={`${fmtMd(monthStart)} ~ ${fmtMd(beforeEnd)}`}
              />
              <OptionChips
                accent={accent}
                options={options}
                selected={beforeValue}
                onSelect={onBeforeChange}
              />
            </div>
          )}

          <div style={{ ...sectionBox, border: `1px solid ${accent}66`, background: `${accent}08` }}>
            <PeriodHead
              accent={accent}
              tag={wholeMonth ? "월 전체" : "변경 후"}
              range={`${splitValid ? fmtMd(splitDate) : "-"} ~ ${fmtMd(monthEnd)}`}
            />
            <OptionChips
              accent={accent}
              options={options}
              selected={afterValue}
              onSelect={onAfterChange}
            />
          </div>

          <div>
            <div style={labelStyle}>변경사유</div>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={2}
              placeholder="예) 등급 재판정 결과 반영"
              style={{
                width: "100%",
                fontSize: 12,
                padding: "7px 9px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 7,
              padding: "9px 11px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 6,
            }}
          >
            <Info size={13} color="#d97706" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#92400e", lineHeight: 1.5 }}>
              저장하면 각 기간 값이 일정카드 스냅샷으로 반영됩니다.
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 7,
            padding: "12px 16px",
            borderTop: "1px solid #e2e8f0",
            background: "#f8fafc",
          }}
        >
          <button type="button" onClick={onClose} style={cancelBtn}>
            취소
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            style={{
              ...cancelBtn,
              border: "none",
              background: canSave ? accent : "#cbd5e1",
              color: "#fff",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Check size={13} /> 기간 저장
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionChips({
  accent,
  options,
  selected,
  onSelect,
}: {
  accent: string;
  options: PeriodChangeOption[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {options.map((o) => {
        const active = o.value === selected;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onSelect(o.value)}
            style={{
              fontSize: 12,
              padding: "4px 9px",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: active ? 700 : 400,
              background: active ? `${accent}14` : "#fff",
              color: active ? accent : "#64748b",
              border: `1px solid ${active ? accent : "#e2e8f0"}`,
            }}
          >
            {o.label}
            {o.sub && (
              <span
                style={{
                  fontSize: 10,
                  marginLeft: 4,
                  color: active ? accent : "#94a3b8",
                }}
              >
                {o.sub}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function PeriodHead({
  accent,
  tag,
  range,
}: {
  accent: string;
  tag: string;
  range: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 7,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: accent,
          background: `${accent}14`,
          padding: "2px 8px",
          borderRadius: 4,
        }}
      >
        {tag}
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
        {range}
      </span>
    </div>
  );
}

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: "#64748b",
  letterSpacing: "0.03em",
  marginBottom: 6,
} as const;

const sectionBox = {
  padding: "11px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#fafbfd",
} as const;

const cancelBtn = {
  fontSize: 12,
  padding: "7px 14px",
  borderRadius: 6,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#64748b",
  cursor: "pointer",
} as const;
