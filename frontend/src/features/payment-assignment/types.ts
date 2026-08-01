export type PaymentAssignmentTab = "annual" | "monthly" | "weekly";

export type PlanClaimView = "plan" | "claim";

export const PAYMENT_ASSIGNMENT_TABS: readonly {
  key: PaymentAssignmentTab;
  label: string;
}[] = [
  { key: "annual", label: "(전체)연간급여일정" },
  { key: "monthly", label: "(전체)월별급여일정" },
  { key: "weekly", label: "(수급자별)주간급여일정" },
] as const;

export const CUR_YEAR = 2026;
export const CUR_MONTH = 3;
