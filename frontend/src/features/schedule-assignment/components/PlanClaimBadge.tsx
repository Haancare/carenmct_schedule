type Props = {
  planCount: number;
  claimCount: number;
};

export default function PlanClaimBadge({ planCount, claimCount }: Props) {
  const boxBase = {
    width: 23,
    height: 19,
    borderRadius: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
    userSelect: "none" as const,
  };

  const hasPlan = planCount > 0;
  const hasClaim = claimCount > 0;

  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center", flexShrink: 0 }}>
      <div
        title={hasPlan ? `계획 ${planCount}건` : "계획 없음"}
        style={{
          ...boxBase,
          background: hasPlan ? "#dbeafe" : "#f1f5f9",
          border: hasPlan ? "1px solid #93c5fd" : "1px solid #e2e8f0",
          color: hasPlan ? "#1d4ed8" : "#cbd5e1",
        }}
      >
        {hasPlan ? planCount : ""}
      </div>
      <div
        title={hasClaim ? `청구 ${claimCount}건` : "청구 없음"}
        style={{
          ...boxBase,
          background: hasClaim ? "#d1fae5" : "#f1f5f9",
          border: hasClaim ? "1px solid #6ee7b7" : "1px solid #e2e8f0",
          color: hasClaim ? "#059669" : "#cbd5e1",
        }}
      >
        {hasClaim ? claimCount : ""}
      </div>
    </div>
  );
}
