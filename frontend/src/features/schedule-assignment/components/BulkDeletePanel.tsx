"use client";

import { X } from "lucide-react";
import { useState } from "react";

import type { ScheduleAssignmentEntry } from "@/lib/api/scheduleAssignment.types";

import { SERVICE_TYPE_LABELS } from "../constants";

const SVC_ITEMS = [
  { key: "visit_care", label: "방문요양" },
  { key: "family_care", label: "가족요양" },
  { key: "full_day_visit", label: "종일방문" },
  { key: "visit_bath", label: "방문목욕" },
  { key: "visit_nursing", label: "방문간호" },
  { key: "day_care", label: "주간보호" },
] as const;

type Props = {
  schedules: ScheduleAssignmentEntry[];
  onDelete: (types: Set<string>) => void | Promise<void>;
  onClose: () => void;
};

export default function BulkDeletePanel({ schedules, onDelete, onClose }: Props) {
  const [deleteTypes, setDeleteTypes] = useState<Set<string>>(new Set());
  const presentTypes = new Set(
    schedules.filter((s) => s.scheduleKind === "plan").map((s) => s.serviceType),
  );
  const allSelected = SVC_ITEMS.every((i) => deleteTypes.has(i.key));

  const toggleAll = () => {
    if (allSelected) setDeleteTypes(new Set());
    else setDeleteTypes(new Set(SVC_ITEMS.map((i) => i.key)));
  };

  const doDelete = async () => {
    if (deleteTypes.size === 0) return;
    const count = schedules.filter(
      (s) => s.scheduleKind === "plan" && deleteTypes.has(s.serviceType),
    ).length;
    if (count === 0) {
      window.alert("삭제할 일정이 없습니다.");
      return;
    }
    if (!window.confirm(`${count}건을 삭제할까요?`)) return;
    await onDelete(deleteTypes);
    onClose();
    setDeleteTypes(new Set());
  };

  return (
    <div
      style={{
        background: "#fff8f8",
        border: "1px solid #fecaca",
        borderRadius: 7,
        padding: "8px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "#dc2626",
          marginBottom: 2,
        }}
      >
        삭제할 급여종류 선택
      </div>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 700,
          color: "#475569",
        }}
      >
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          style={{ accentColor: "#dc2626", width: 13, height: 13 }}
        />
        전체
      </label>
      <div style={{ height: 1, background: "#fee2e2" }} />
      {SVC_ITEMS.map(({ key, label }) => {
        const hasSched = presentTypes.has(key);
        const on = deleteTypes.has(key);
        return (
          <label
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: hasSched ? "pointer" : "default",
              fontSize: 11,
              color: hasSched ? "#0f172a" : "#cbd5e1",
            }}
          >
            <input
              type="checkbox"
              checked={on}
              disabled={!hasSched}
              onChange={() =>
                setDeleteTypes((prev) => {
                  const n = new Set(prev);
                  if (on) n.delete(key);
                  else n.add(key);
                  return n;
                })
              }
              style={{ accentColor: "#dc2626", width: 13, height: 13 }}
            />
            {label}
            {hasSched && (
              <span
                style={{ fontSize: 10, color: "#94a3b8", marginLeft: "auto" }}
              >
                {
                  schedules.filter(
                    (s) => s.scheduleKind === "plan" && s.serviceType === key,
                  ).length
                }
                건
              </span>
            )}
          </label>
        );
      })}
      <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1,
            padding: "5px 0",
            fontSize: 11,
            borderRadius: 5,
            cursor: "pointer",
            border: "1px solid #e2e8f0",
            background: "#fff",
            color: "#64748b",
          }}
        >
          취소
        </button>
        <button
          type="button"
          onClick={doDelete}
          disabled={deleteTypes.size === 0}
          style={{
            flex: 1,
            padding: "5px 0",
            fontSize: 11,
            borderRadius: 5,
            cursor: deleteTypes.size > 0 ? "pointer" : "not-allowed",
            border: "none",
            background: deleteTypes.size > 0 ? "#dc2626" : "#fca5a5",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          삭제
        </button>
      </div>
    </div>
  );
}

export function BulkDeleteToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "5px 12px",
        fontSize: 11,
        borderRadius: 7,
        fontWeight: 500,
        border: "1px dashed #cbd5e1",
        background: "transparent",
        color: "#94a3b8",
        cursor: "pointer",
      }}
    >
      <X size={10} color="#94a3b8" />
      일괄삭제
    </button>
  );
}
