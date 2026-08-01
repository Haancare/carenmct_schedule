"use client";

import { createContext, useContext } from "react";

import type {
  PaymentAssignmentListQuery,
  PaymentAssignmentRecipientDto,
  RecipientGroupDto,
} from "@/lib/api/paymentAssignment.types";

import type { PaymentAssignmentFilters } from "../hooks/usePaymentAssignmentFilters";
import type { PlanClaimView } from "../types";

export type PaymentAssignmentContextValue = {
  year: number;
  month: number;
  view: PlanClaimView;
  recipient: string;
  flashId: string;
  filtered: PaymentAssignmentRecipientDto[];
  recipientsLoading: boolean;
  recipientGroups: RecipientGroupDto[];
  recipientGroupsLoading: boolean;
  listQuery: PaymentAssignmentListQuery;
  filters: PaymentAssignmentFilters;
  annualReloadKey: number;
  /** 월 급여일정 탭의 수급자 명수 (필터바 총 N명용). null이면 연간 recipients 기준 */
  monthlyTotalCount: number | null;
  setMonthlyTotalCount: (count: number | null) => void;
};

const PaymentAssignmentContext =
  createContext<PaymentAssignmentContextValue | null>(null);

export function PaymentAssignmentProvider({
  value,
  children,
}: {
  value: PaymentAssignmentContextValue;
  children: React.ReactNode;
}) {
  return (
    <PaymentAssignmentContext.Provider value={value}>
      {children}
    </PaymentAssignmentContext.Provider>
  );
}

export function usePaymentAssignmentContext() {
  const ctx = useContext(PaymentAssignmentContext);
  if (!ctx) {
    throw new Error(
      "usePaymentAssignmentContext must be used within PaymentAssignmentProvider",
    );
  }
  return ctx;
}
