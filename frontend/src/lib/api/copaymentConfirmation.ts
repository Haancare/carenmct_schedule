import apiClient from "@/lib/api/client";
import type {
  ApplyRecipientConfirmRequest,
  BulkCancelRequest,
  BulkConfirmRequest,
  CopayConfirmationListQuery,
  CopayConfirmationMutationResponse,
  CopayConfirmationRowsResponse,
  CopayMonthSummaryResponse,
  NonBenefitBulkResponse,
  NonBenefitCategoriesResponse,
  SaveNonBenefitBulkRequest,
} from "@/lib/api/copaymentConfirmation.types";

function toRowsParams(query: CopayConfirmationListQuery) {
  return {
    year: query.year,
    month: query.month,
    query: query.query || undefined,
    status: query.status ?? "all",
    serviceType: query.serviceType ?? "all",
  };
}

export async function fetchCopayMonthSummary(
  year: number,
): Promise<CopayMonthSummaryResponse> {
  const { data } = await apiClient.get<CopayMonthSummaryResponse>(
    "/api/copayment-confirmation/month-summary",
    { params: { year } },
  );
  return data;
}

export async function fetchCopayRows(
  query: CopayConfirmationListQuery,
): Promise<CopayConfirmationRowsResponse> {
  const { data } = await apiClient.get<CopayConfirmationRowsResponse>(
    "/api/copayment-confirmation/rows",
    { params: toRowsParams(query) },
  );
  return data;
}

export async function applyRecipientConfirm(
  recipientId: string,
  body: ApplyRecipientConfirmRequest,
): Promise<CopayConfirmationMutationResponse> {
  const { data } = await apiClient.put<CopayConfirmationMutationResponse>(
    `/api/copayment-confirmation/recipients/${recipientId}`,
    body,
  );
  return data;
}

export async function bulkConfirmCopay(
  body: BulkConfirmRequest,
): Promise<CopayConfirmationMutationResponse> {
  const { data } = await apiClient.post<CopayConfirmationMutationResponse>(
    "/api/copayment-confirmation/bulk-confirm",
    body,
  );
  return data;
}

export async function bulkCancelCopay(
  body: BulkCancelRequest,
): Promise<CopayConfirmationMutationResponse> {
  const { data } = await apiClient.post<CopayConfirmationMutationResponse>(
    "/api/copayment-confirmation/bulk-cancel",
    body,
  );
  return data;
}

export async function fetchNonBenefitBulk(params: {
  year: number;
  month: number;
  query?: string;
  status?: string;
  serviceType?: string;
  recipientId?: string;
}): Promise<NonBenefitBulkResponse> {
  const { data } = await apiClient.get<NonBenefitBulkResponse>(
    "/api/copayment-confirmation/non-benefit",
    { params },
  );
  return data;
}

export async function saveNonBenefitBulk(
  body: SaveNonBenefitBulkRequest,
): Promise<CopayConfirmationMutationResponse> {
  const { data } = await apiClient.put<CopayConfirmationMutationResponse>(
    "/api/copayment-confirmation/non-benefit",
    body,
  );
  return data;
}

export async function fetchNonBenefitCategories(): Promise<NonBenefitCategoriesResponse> {
  const { data } = await apiClient.get<NonBenefitCategoriesResponse>(
    "/api/copayment-confirmation/non-benefit/categories",
  );
  return data;
}

export async function addNonBenefitCategory(
  label: string,
): Promise<NonBenefitCategoriesResponse> {
  const { data } = await apiClient.post<NonBenefitCategoriesResponse>(
    "/api/copayment-confirmation/non-benefit/categories",
    { label },
  );
  return data;
}

export async function deleteNonBenefitCategory(
  label: string,
): Promise<NonBenefitCategoriesResponse> {
  const { data } = await apiClient.delete<NonBenefitCategoriesResponse>(
    "/api/copayment-confirmation/non-benefit/categories",
    { params: { label } },
  );
  return data;
}
