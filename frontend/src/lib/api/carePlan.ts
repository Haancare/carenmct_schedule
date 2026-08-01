import apiClient from "@/lib/api/client";
import type {
  AssessmentDocType,
  AssessmentDocumentDetailDto,
  AssessmentDocumentSummaryDto,
  CarePlanRecipientDto,
  CreateAssessmentDocumentRequest,
  UpdateAssessmentDocumentRequest,
} from "@/lib/api/carePlan.types";

export async function fetchCarePlanRecipients(params?: {
  query?: string;
  activeOnly?: boolean;
  groupId?: string;
  subgroupId?: string;
}): Promise<CarePlanRecipientDto[]> {
  const { data } = await apiClient.get<CarePlanRecipientDto[]>(
    "/api/care-plan/recipients",
    {
      params: {
        query: params?.query || undefined,
        activeOnly: params?.activeOnly,
        groupId:
          params?.groupId && params.groupId !== "all"
            ? params.groupId
            : undefined,
        subgroupId:
          params?.subgroupId && params.subgroupId !== "all"
            ? params.subgroupId
            : undefined,
      },
    },
  );
  return data;
}

export async function fetchAssessmentDocuments(
  recipientId: string,
  docType: AssessmentDocType,
): Promise<AssessmentDocumentSummaryDto[]> {
  const { data } = await apiClient.get<AssessmentDocumentSummaryDto[]>(
    `/api/care-plan/recipients/${recipientId}/documents`,
    { params: { docType } },
  );
  return data;
}

export async function fetchAssessmentDocument(
  id: number,
): Promise<AssessmentDocumentDetailDto> {
  const { data } = await apiClient.get<AssessmentDocumentDetailDto>(
    `/api/care-plan/documents/${id}`,
  );
  return data;
}

export async function createAssessmentDocument(
  body: CreateAssessmentDocumentRequest,
): Promise<AssessmentDocumentDetailDto> {
  const { data } = await apiClient.post<AssessmentDocumentDetailDto>(
    "/api/care-plan/documents",
    body,
  );
  return data;
}

export async function updateAssessmentDocument(
  id: number,
  body: UpdateAssessmentDocumentRequest,
): Promise<AssessmentDocumentDetailDto> {
  const { data } = await apiClient.put<AssessmentDocumentDetailDto>(
    `/api/care-plan/documents/${id}`,
    body,
  );
  return data;
}

export async function deleteAssessmentDocument(id: number): Promise<void> {
  await apiClient.delete(`/api/care-plan/documents/${id}`);
}
