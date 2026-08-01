import { ClipboardList } from "lucide-react";

import FilterDivider from "./FilterDivider";

const LEGEND_ITEMS = [
  {
    planBg: "#dbeafe",
    planBd: "#93c5fd",
    claimBg: "#d1fae5",
    claimBd: "#6ee7b7",
    label: "계획 + 청구 모두 있음",
    labelColor: "#475569",
  },
  {
    planBg: "#dbeafe",
    planBd: "#93c5fd",
    claimBg: "#f1f5f9",
    claimBd: "#e2e8f0",
    label: "계획만 있음",
    labelColor: "#475569",
  },
  {
    planBg: "#f1f5f9",
    planBd: "#e2e8f0",
    claimBg: "#d1fae5",
    claimBd: "#6ee7b7",
    label: "청구만 있음",
    labelColor: "#475569",
  },
  {
    planBg: "#f1f5f9",
    planBd: "#e2e8f0",
    claimBg: "#f1f5f9",
    claimBd: "#e2e8f0",
    label: "자료 없음",
    labelColor: "#94a3b8",
  },
] as const;

export default function AnnualScheduleLegendBar() {
  return (
    <div
      style={{
        flexShrink: 0,
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: "4px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <ClipboardList size={11} color="#94a3b8" />
      <span style={{ fontSize: 12, color: "#94a3b8" }}>범례</span>

      {LEGEND_ITEMS.map(
        ({ planBg, planBd, claimBg, claimBd, label, labelColor }) => (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", gap: 5 }}
          >
            <div style={{ display: "flex", gap: 2 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 2,
                  background: planBg,
                  border: `1px solid ${planBd}`,
                }}
              />
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 2,
                  background: claimBg,
                  border: `1px solid ${claimBd}`,
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: labelColor }}>{label}</span>
          </div>
        ),
      )}

      <FilterDivider />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
          color: "#64748b",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: "#dbeafe",
              border: "1px solid #93c5fd",
            }}
          />
          좌 = 계획
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: "#d1fae5",
              border: "1px solid #6ee7b7",
            }}
          />
          우 = 청구
        </span>
      </div>

      <FilterDivider />

      <span style={{ fontSize: 12, color: "#94a3b8" }}>
        네모상자를 클릭하면 해당 수급자의 해당 월의 일정표로 이동합니다
      </span>
    </div>
  );
}
