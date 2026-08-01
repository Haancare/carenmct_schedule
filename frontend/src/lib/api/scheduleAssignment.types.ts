import type {
  PaymentAssignmentRecipientDto,
  ScheduleKind,
  ServiceTypeCode,
} from "@/lib/api/paymentAssignment.types";

/** 일정 배정 — 캘린더·집계표 1건 */
export interface ScheduleAssignmentEntry {
  id: string;
  date: string;
  serviceType: ServiceTypeCode;
  scheduleKind: ScheduleKind;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  careWorkerId: string;
  grade?: number;
  reduction?: string;
  copaymentRate?: number;
  /** 기본수가(원) */
  unitCost: number;
  surchargeAmount?: number;
  benefitTotal?: number;
  feeEdited?: boolean;
  /** 수가 코드 (가-1, 나-2 등) */
  feeCode?: string | null;
  /** 가족요양 시 가족관계 */
  familyRelation?: string | null;
}

export interface ScheduleAssignmentContactDto {
  name: string;
  role: "self" | "guardian" | "worker";
  relation?: string;
  phone?: string;
}

export interface ScheduleAssignmentRecipient extends PaymentAssignmentRecipientDto {
  validFrom?: string;
  validTo?: string;
  mobile?: string;
  serviceTypes: ServiceTypeCode[];
  contacts: ScheduleAssignmentContactDto[];
}

export interface SchedulePaymentStatusDto {
  monthlyLimit: number;
  activeUsed: number;
  remaining: number;
  usageRate: number;
  activeSelfPay: number;
  limitExcess: number;
  serviceAmounts: { label: string; amount: number }[];
}

export interface ScheduleAssignmentMonthResponse {
  recipient: ScheduleAssignmentRecipient;
  schedules: ScheduleAssignmentEntry[];
  paymentStatus: SchedulePaymentStatusDto;
}

export interface ScheduleAssignmentListItem {
  recipient: PaymentAssignmentRecipientDto;
  planCount: number;
  claimCount: number;
}

export interface ScheduleYearMonthCounts {
  [month: number]: { plan: number; claim: number };
}

export interface ScheduleAssignmentQuery {
  recipientId: string;
  year: number;
  month: number;
  scheduleKind: ScheduleKind;
}

export interface ScheduleAssignmentListQuery {
  year: number;
  month: number;
  showAllActive?: boolean;
}

export type ScheduleAddFormData = {
  serviceType: ServiceTypeCode;
  careWorkerId: string;
  careWorkerId2: string;
  bathType: string;
  familyRelation: string;
  startHour: string;
  startMin: string;
  endHour: string;
  endMin: string;
  grade: number;
  copaymentType: string;
  copaymentRate: number;
};

export type BatchAssignType =
  | ""
  | "all_month"
  | "weekday_only"
  | "no_holiday_only"
  | "no_weekend"
  | "specific_day";
