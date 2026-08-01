import type { PaymentAssignmentTab } from "./types";
import { PAYMENT_ASSIGNMENT_TABS } from "./types";

type Props = {
  tab: PaymentAssignmentTab;
  onTabChange: (tab: PaymentAssignmentTab) => void;
};

export default function PaymentAssignmentTabBar({ tab, onTabChange }: Props) {
  return (
    <div
      style={{
        flexShrink: 0,
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "flex-end",
        gap: 2,
        padding: "0 12px",
      }}
    >
      {PAYMENT_ASSIGNMENT_TABS.map(({ key, label }) => {
        const on = tab === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onTabChange(key)}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              cursor: "pointer",
              background: "transparent",
              border: "none",
              borderBottom: on ? "3px solid #2563eb" : "3px solid transparent",
              color: on ? "#1d4ed8" : "#64748b",
              fontWeight: on ? 700 : 500,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
