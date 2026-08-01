"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { CareWorkerDto } from "@/lib/api/paymentAssignment.types";

import { POSITION_CODES, matchesPositionFilter } from "../constants";

type Props = {
  workers: CareWorkerDto[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyValue?: string;
  /** 급여일정 배정 패널 — 퇴직자 포함·전체직종 옵션 */
  pickerMode?: boolean;
  allowedPositions?: string[];
  fullWidth?: boolean;
};

function isActiveEmployee(status?: string): boolean {
  if (!status) return true;
  return status === "재직" || status === "active";
}

export default function WorkerCombo({
  workers,
  value,
  onChange,
  placeholder = "전체 요양보호사",
  emptyValue = "all",
  pickerMode = false,
  allowedPositions = ["ST_08"],
  fullWidth = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [showAllPos, setShowAllPos] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const isEmpty = !value || value === emptyValue;
  const selected = isEmpty ? null : (workers.find((w) => w.id === value) ?? null);
  const q = query.trim().toLowerCase();

  const pool = workers
    .filter((w) => {
      if (pickerMode && !showAllPos) {
        const effective = w.positionCode?.trim() || "ST_08";
        if (!matchesPositionFilter(effective, allowedPositions)) return false;
      }
      if (pickerMode && !showAll && !isActiveEmployee(w.status)) return false;
      if (!q) return true;
      return (
        w.name.toLowerCase().includes(q) ||
        (w.nickname ?? "").toLowerCase().includes(q) ||
        (w.birth ?? "").includes(q)
      );
    })
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));

  const label = (w: CareWorkerDto) =>
    `${w.name}${w.nickname ? `(${w.nickname})` : ""}`;

  const birthText = (w: CareWorkerDto) => w.birth?.trim() || "-";

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  const triggerHeight = pickerMode ? 28 : 24;
  const boxWidth = fullWidth ? "100%" : 188;
  const dropdownWidth = fullWidth ? "100%" : 260;

  return (
    <div ref={boxRef} style={{ position: "relative", width: boxWidth }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          height: triggerHeight,
          padding: "0 8px",
          display: "flex",
          alignItems: "center",
          gap: pickerMode ? 6 : 4,
          border: pickerMode
            ? `1px solid ${value ? "#93c5fd" : "#e2e8f0"}`
            : "1px solid #e2e8f0",
          borderRadius: pickerMode ? 5 : 6,
          fontSize: 12,
          background: pickerMode
            ? value
              ? "#eff6ff"
              : "#fff"
            : "#f8fafc",
          color: selected
            ? pickerMode
              ? "#1d4ed8"
              : "#1e293b"
            : pickerMode
              ? "#94a3b8"
              : "#64748b",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {selected ? `${label(selected)}  ${birthText(selected)}` : placeholder}
        </span>
        {selected && (
          <X
            size={12}
            color="#94a3b8"
            onClick={(e) => {
              e.stopPropagation();
              pick(emptyValue);
            }}
          />
        )}
        <ChevronDown size={12} color="#94a3b8" />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: triggerHeight + 3,
            left: 0,
            right: fullWidth ? 0 : undefined,
            width: fullWidth ? undefined : dropdownWidth,
            zIndex: pickerMode ? 9999 : 50,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: pickerMode ? 7 : 8,
            boxShadow: "0 8px 24px rgba(15,39,68,0.16)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: pickerMode ? 4 : 6,
              padding: pickerMode ? "6px 8px" : "7px 9px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <Search size={12} color="#94a3b8" style={{ flexShrink: 0 }} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름·별칭·생년월일 검색"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 12,
                color: "#1e293b",
              }}
            />
          </div>

          {pickerMode && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "3px 8px",
                background: "#f8fafc",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                  style={{ accentColor: "#2563eb" }}
                />
                <span style={{ fontSize: 11, color: "#64748b" }}>퇴직자 포함</span>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={showAllPos}
                  onChange={(e) => setShowAllPos(e.target.checked)}
                  style={{ accentColor: "#7c3aed" }}
                />
                <span style={{ fontSize: 11, color: "#64748b" }}>전체직종</span>
              </label>
            </div>
          )}

          <div style={{ maxHeight: pickerMode ? 220 : 256, overflowY: "auto" }}>
            {!pickerMode && emptyValue === "all" && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => pick(emptyValue)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") pick(emptyValue);
                }}
                style={{
                  padding: "7px 11px",
                  fontSize: 12,
                  cursor: "pointer",
                  color: isEmpty ? "#1d4ed8" : "#64748b",
                  fontWeight: isEmpty ? 700 : 400,
                  background: isEmpty ? "#eff6ff" : "#fff",
                }}
              >
                {placeholder}
              </div>
            )}
            {pool.map((w) => {
              const on = w.id === value;
              const pos = w.positionCode ?? "ST_08";
              return (
                <div
                  key={w.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => pick(w.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") pick(w.id);
                  }}
                  style={{
                    padding: pickerMode ? "6px 10px" : "7px 11px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                    background: on ? "#eff6ff" : "#fff",
                    borderTop: "1px solid #f8fafc",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: on ? 700 : 600,
                      color: on ? "#1d4ed8" : "#0f172a",
                    }}
                  >
                    {w.name}
                    {w.nickname ? (
                      <span
                        style={{
                          color: "#64748b",
                          fontWeight: 400,
                          fontSize: 11,
                        }}
                      >
                        ({w.nickname})
                      </span>
                    ) : null}
                  </span>
                  {pickerMode && showAllPos && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: "1px 4px",
                        borderRadius: 3,
                        background: "#f5f3ff",
                        color: "#7c3aed",
                        border: "1px solid #ddd6fe",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {POSITION_CODES[pos] ?? pos}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 11,
                      color: "#94a3b8",
                      marginLeft: "auto",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {birthText(w)}
                  </span>
                  {pickerMode && !isActiveEmployee(w.status) && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: "1px 4px",
                        borderRadius: 3,
                        background: "#fef2f2",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                        whiteSpace: "nowrap",
                      }}
                    >
                      퇴직
                    </span>
                  )}
                </div>
              );
            })}
            {pool.length === 0 && (
              <div
                style={{
                  padding: pickerMode ? "14px" : "14px 11px",
                  textAlign: "center",
                  fontSize: 12,
                  color: "#94a3b8",
                }}
              >
                {pickerMode ? "검색 결과 없음" : "검색 결과가 없습니다"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
