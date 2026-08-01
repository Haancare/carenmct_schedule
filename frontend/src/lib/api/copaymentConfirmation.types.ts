export type ServiceTypeCode =
  | "visit_care"
  | "visit_bath"
  | "visit_nursing"
  | "day_care";

export type ConfirmTypeCode = "plan" | "claim" | "manual";

export type StatusFilterCode =
  | "all"
  | "unconfirmed"
  | "plan"
  | "claim"
  | "manual";

export interface CopayAmountsDto {
  count: number;
  benefit: number;
  insurance: number;
  copay: number;
}

export interface CopayConfirmationEntryDto {
  type: ConfirmTypeCode;
  count: number;
  insuranceAmount: number;
  copayAmount: number;
  limitExcessAmount: number;
  confirmedAt: string;
}

export interface CopayConfirmationRowDto {
  recipientId: string;
  recipientName: string;
  legalDob: string | null;
  serviceType: ServiceTypeCode;
  periodKey: string;
  gradeNum: number;
  reduction: string;
  copaymentRate: number;
  dateFrom: string;
  dateTo: string;
  plan: CopayAmountsDto;
  claim: CopayAmountsDto;
  confirmation: CopayConfirmationEntryDto | null;
  limitExcess: number;
  nonBenefitTotal: number;
}

export interface CopayConfirmationStatsDto {
  total: number;
  confirmed: number;
  unconfirmed: number;
}

export interface CopayConfirmationRowsResponse {
  year: number;
  month: number;
  rows: CopayConfirmationRowDto[];
  stats: CopayConfirmationStatsDto;
}

export interface CopayMonthSummaryItemDto {
  month: number;
  totalSegments: number;
  unconfirmedSegments: number;
}

export interface CopayMonthSummaryResponse {
  year: number;
  months: CopayMonthSummaryItemDto[];
}

export interface CopayConfirmationListQuery {
  year: number;
  month: number;
  query?: string;
  status?: StatusFilterCode;
  serviceType?: ServiceTypeCode | "all";
}

export interface CopayConfirmationMutationResponse {
  affectedCount: number;
}

export interface ConfirmSelectionDto {
  serviceType: ServiceTypeCode;
  periodKey: string;
  action: "none" | ConfirmTypeCode;
  count?: number;
  insuranceAmount?: number;
  copayAmount?: number;
}

export interface ApplyRecipientConfirmRequest {
  year: number;
  month: number;
  selections: ConfirmSelectionDto[];
}

export type BulkConfirmScope = "selected" | "unconfirmed" | "all";

export interface BulkConfirmRequest {
  year: number;
  month: number;
  basis: "plan" | "claim";
  scope: BulkConfirmScope;
  recipientIds?: string[];
  query?: string;
  status?: string;
  serviceType?: string;
}

export interface BulkCancelRequest {
  year: number;
  month: number;
  recipientIds: string[];
  query?: string;
  status?: string;
  serviceType?: string;
}

export interface NonBenefitRecipientEntryDto {
  recipientId: string;
  recipientName: string;
  gradeText: string;
  meal: number;
  room: number;
  beauty: number;
  otherAmounts: Record<string, number>;
  total: number;
}

export interface NonBenefitBulkResponse {
  year: number;
  month: number;
  facilityOtherCategories: string[];
  entries: NonBenefitRecipientEntryDto[];
}

export interface NonBenefitSaveEntryDto {
  recipientId: string;
  meal: number;
  room: number;
  beauty: number;
  otherAmounts: Record<string, number>;
}

export interface SaveNonBenefitBulkRequest {
  year: number;
  month: number;
  entries: NonBenefitSaveEntryDto[];
}

export interface NonBenefitCategoriesResponse {
  categories: string[];
}
