import type { MonthCellInfo } from "../constants/annualTable";
import { CLAIM_OFF, CLAIM_ON, PLAN_OFF, PLAN_ON } from "../constants/annualTable";

type Props = {
  info: MonthCellInfo;
  onPlan?: () => void;
  onClaim?: () => void;
};

export default function PlanClaimCell({ info, onPlan, onClaim }: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 3,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        title={
          info.hasPlan
            ? `계획 ${info.planCount}건 — 클릭하여 상세 보기`
            : "계획 없음 — 클릭하여 상세 보기"
        }
        onClick={
          onPlan
            ? (e) => {
                e.stopPropagation();
                onPlan();
              }
            : undefined
        }
        style={{
          width: 23,
          height: 19,
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          fontFamily: "'Noto Sans KR', sans-serif",
          flexShrink: 0,
          userSelect: "none",
          cursor: onPlan ? "pointer" : "default",
          transition: "opacity .12s",
          ...(info.hasPlan ? PLAN_ON : PLAN_OFF),
        }}
        onMouseEnter={(e) => {
          if (onPlan) (e.currentTarget as HTMLDivElement).style.opacity = "0.78";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.opacity = "1";
        }}
      >
        {info.hasPlan ? info.planCount : ""}
      </div>
      <div
        title={
          info.hasClaim
            ? `청구 ${info.claimCount}건 — 클릭하여 상세 보기`
            : "청구 없음 — 클릭하여 상세 보기"
        }
        onClick={
          onClaim
            ? (e) => {
                e.stopPropagation();
                onClaim();
              }
            : undefined
        }
        style={{
          width: 23,
          height: 19,
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          fontFamily: "'Noto Sans KR', sans-serif",
          flexShrink: 0,
          userSelect: "none",
          cursor: onClaim ? "pointer" : "default",
          transition: "opacity .12s",
          ...(info.hasClaim ? CLAIM_ON : CLAIM_OFF),
        }}
        onMouseEnter={(e) => {
          if (onClaim) (e.currentTarget as HTMLDivElement).style.opacity = "0.78";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.opacity = "1";
        }}
      >
        {info.hasClaim ? info.claimCount : ""}
      </div>
    </div>
  );
}
