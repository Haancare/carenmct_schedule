import type {
  MonthlyScheduleQuery,
  PaymentAssignmentListQuery,
  ScheduleKind,
} from "@/lib/api/paymentAssignment.types";

import type { PaymentAssignmentFilters } from "./usePaymentAssignmentFilters";

export function buildPaymentAssignmentListQuery(
  year: number,
  filters: PaymentAssignmentFilters,
): PaymentAssignmentListQuery {
  return {
    year,
    query: filters.query || undefined,
    grade: filters.filterGrade,
    reductionType: filters.filterType,
    serviceType: filters.filterSvc,
    workerId: filters.filterWorker,
    showAllActive: filters.showAllActive,
    groupId: filters.selGroup !== "all" ? filters.selGroup : undefined,
    subgroupId: filters.selSubGroup !== "all" ? filters.selSubGroup : undefined,
  };
}

export function buildMonthlyScheduleQuery(
  year: number,
  month: number,
  scheduleKind: ScheduleKind,
  filters: PaymentAssignmentFilters,
): MonthlyScheduleQuery {
  return {
    ...buildPaymentAssignmentListQuery(year, filters),
    month,
    scheduleKind,
  };
}
