import apiClient from "@/lib/api/client";
import type {
  ConsultWorkerDto,
  ConsultationRecipientDto,
  ConsultationVisitDto,
  CreateConsultationVisitRequest,
  CreateWorkJournalRequest,
  RecipientScheduleItemDto,
  UpdateConsultationVisitRequest,
  UpdateWorkJournalRequest,
  WorkJournalDetailDto,
  WorkJournalSummaryDto,
} from "@/lib/api/consultation.types";

export async function fetchConsultWorkers(
  status: "all" | "active" = "all",
): Promise<ConsultWorkerDto[]> {
  const { data } = await apiClient.get<ConsultWorkerDto[]>(
    "/api/consultation/workers",
    { params: { status } },
  );
  return data;
}

export async function fetchConsultationVisits(params: {
  year: number;
  month: number;
  employeeId?: string;
  recipientId?: string;
}): Promise<ConsultationVisitDto[]> {
  const { data } = await apiClient.get<ConsultationVisitDto[]>(
    "/api/consultation/visits",
    {
      params: {
        year: params.year,
        month: params.month,
        employeeId:
          params.employeeId && params.employeeId !== "__ALL__"
            ? params.employeeId
            : undefined,
        recipientId: params.recipientId || undefined,
      },
    },
  );
  return data;
}

export async function createConsultationVisit(
  body: CreateConsultationVisitRequest,
): Promise<ConsultationVisitDto> {
  const { data } = await apiClient.post<ConsultationVisitDto>(
    "/api/consultation/visits",
    body,
  );
  return data;
}

export async function updateConsultationVisit(
  id: string | number,
  body: UpdateConsultationVisitRequest,
): Promise<ConsultationVisitDto> {
  const { data } = await apiClient.put<ConsultationVisitDto>(
    `/api/consultation/visits/${id}`,
    body,
  );
  return data;
}

export async function deleteConsultationVisit(id: string | number): Promise<void> {
  await apiClient.delete(`/api/consultation/visits/${id}`);
}

export async function fetchConsultationRecipients(params?: {
  query?: string;
  activeOnly?: boolean;
  gradeFilter?: string;
  serviceFilter?: string;
  groupId?: string;
  subgroupId?: string;
  year?: number;
  month?: number;
  hasSchedulesInMonth?: boolean;
}): Promise<ConsultationRecipientDto[]> {
  const { data } = await apiClient.get<ConsultationRecipientDto[]>(
    "/api/consultation/recipients",
    {
      params: {
        query: params?.query || undefined,
        activeOnly: params?.activeOnly,
        gradeFilter:
          params?.gradeFilter && params.gradeFilter !== "all"
            ? params.gradeFilter
            : undefined,
        serviceFilter:
          params?.serviceFilter && params.serviceFilter !== "all"
            ? params.serviceFilter
            : undefined,
        groupId:
          params?.groupId && params.groupId !== "all"
            ? params.groupId
            : undefined,
        subgroupId:
          params?.subgroupId && params.subgroupId !== "all"
            ? params.subgroupId
            : undefined,
        year: params?.year,
        month: params?.month,
        hasSchedulesInMonth: params?.hasSchedulesInMonth,
      },
    },
  );
  return data;
}

export async function fetchRecipientSchedules(
  recipientId: string,
  year: number,
  month: number,
): Promise<RecipientScheduleItemDto[]> {
  const { data } = await apiClient.get<RecipientScheduleItemDto[]>(
    `/api/consultation/recipients/${recipientId}/schedules`,
    { params: { year, month } },
  );
  return data;
}

export async function fetchWorkJournals(params: {
  recipientId?: string;
  visitId?: string;
  year?: number;
  month?: number;
}): Promise<WorkJournalSummaryDto[]> {
  const { data } = await apiClient.get<WorkJournalSummaryDto[]>(
    "/api/consultation/journals",
    { params },
  );
  return data;
}

export async function fetchWorkJournal(
  id: string | number,
): Promise<WorkJournalDetailDto> {
  const { data } = await apiClient.get<WorkJournalDetailDto>(
    `/api/consultation/journals/${id}`,
  );
  return data;
}

export async function createWorkJournal(
  body: CreateWorkJournalRequest,
): Promise<WorkJournalDetailDto> {
  const { data } = await apiClient.post<WorkJournalDetailDto>(
    "/api/consultation/journals",
    body,
  );
  return data;
}

export async function updateWorkJournal(
  id: string | number,
  body: UpdateWorkJournalRequest,
): Promise<WorkJournalDetailDto> {
  const { data } = await apiClient.put<WorkJournalDetailDto>(
    `/api/consultation/journals/${id}`,
    body,
  );
  return data;
}

export async function deleteWorkJournal(id: string | number): Promise<void> {
  await apiClient.delete(`/api/consultation/journals/${id}`);
}
