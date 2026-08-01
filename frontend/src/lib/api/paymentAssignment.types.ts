/** 급여일정관리 API DTO — 백엔드 응답 형태와 맞춘다 */

export type ServiceTypeCode =
  | "visit_care"
  | "family_care"
  | "full_day_visit"
  | "visit_bath"
  | "visit_nursing"
  | "day_care";

export interface CareWorkerDto {
  id: string;
  name: string;
  nickname?: string;
  birth: string;
  positionCode?: string;
  status?: string;
}

export interface RecipientGroupSubgroupDto {
  id: string;
  name: string;
}

export interface RecipientGroupDto {
  id: string;
  name: string;
  color: string;
  hasSubgroups: boolean;
  subgroups: RecipientGroupSubgroupDto[];
}

export interface PaymentAssignmentRecipientDto {
  id: string;
  name: string;
  legalDob: string;
  gradeText: string;
  reduction: string;
  certNo: string;
  contractStatus: string;
  assignedCareWorkerIds: string[];
  hasSchedulesInYear: boolean;
  /** 해당 연도 일정에 포함된 급여종류 (종류 필터용) */
  serviceTypesInYear: ServiceTypeCode[];
}

export interface MonthScheduleSummaryDto {
  month: number;
  planCount: number;
  claimCount: number;
}

export interface AnnualScheduleRowDto {
  recipient: PaymentAssignmentRecipientDto;
  months: MonthScheduleSummaryDto[];
}

/** GET /api/payment-assignment/recipients | /annual 공통 쿼리 */
export interface PaymentAssignmentListQuery {
  year: number;
  query?: string;
  grade?: string;
  reductionType?: string;
  serviceType?: string;
  workerId?: string;
  showAllActive?: boolean;
  groupId?: string;
  subgroupId?: string;
}

export interface PaymentAssignmentRecipientsResponse {
  recipients: PaymentAssignmentRecipientDto[];
  totalCount: number;
}

export interface AnnualScheduleResponse {
  rows: AnnualScheduleRowDto[];
  totalCount: number;
}

export type ScheduleKind = "plan" | "claim";

/** 월별 일정 1건 — 백엔드 sch_service_schedules 집계 전 단위 */
export interface MonthlyScheduleEntryDto {
  recipientId: string;
  date: string;
  serviceType: ServiceTypeCode;
  scheduleKind: ScheduleKind;
  grade?: number;
  reduction?: string;
  durationMinutes: number;
}

/** 월별 테이블 행 — 서버에서 rowSpan 포함해 내려줄 수 있음 */
export interface MonthlyScheduleRowDto {
  recipient: PaymentAssignmentRecipientDto;
  key: string;
  serviceType: ServiceTypeCode | null;
  gradeNum: number | null;
  reduction: string | null;
  days: number[];
  totalMinutes: number;
  count: number;
  firstOfRecipient: boolean;
  recRowSpan: number;
  firstOfPeriod: boolean;
  periodRowSpan: number;
}

export interface MonthlyScheduleQuery extends PaymentAssignmentListQuery {
  month: number;
  scheduleKind: ScheduleKind;
}

export interface MonthlyScheduleResponse {
  rows: MonthlyScheduleRowDto[];
  totalCount: number;
  lastDay: number;
}

/** 주간 일정 1건 */
export interface WeeklyScheduleEntryDto {
  date: string;
  serviceType: ServiceTypeCode;
  scheduleKind: ScheduleKind;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  careWorkerId: string;
  scheduleId?: string;
  unitCost?: number;
  surchargeAmount?: number;
  benefitTotal?: number;
  grade?: number;
  reduction?: string;
  copaymentRate?: number;
}

export interface WeeklyCalendarWeekDto {
  days: string[];
  label: string;
}

export interface WeeklyRecipientListQuery {
  year: number;
  query?: string;
  contractStatus?: string;
  groupId?: string;
  subgroupId?: string;
}

export interface WeeklyScheduleQuery {
  recipientId: string;
  year: number;
  scheduleKind: ScheduleKind;
}

export interface WeeklyScheduleResponse {
  recipient: PaymentAssignmentRecipientDto;
  weeks: WeeklyCalendarWeekDto[];
  entriesByDate: Record<string, WeeklyScheduleEntryDto[]>;
  dayMemos: Record<string, string>;
}
