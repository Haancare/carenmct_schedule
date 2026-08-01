export type ConsultStatus = "planned" | "completed" | "unable";
export type ConsultType =
  | "new_consult"
  | "regular"
  | "benefit_change"
  | "complaint"
  | "termination"
  | "inspection";
export type JournalStatus = "draft" | "completed";

export interface ConsultWorkerDto {
  id: string;
  name: string;
  position: string;
  status: string;
  mobile?: string | null;
}

export interface ConsultationVisitDto {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  recipientId: string;
  date: string;
  consultStatus: ConsultStatus;
  consultType: ConsultType;
  plannedStartTime: string;
  plannedEndTime?: string | null;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  notes?: string | null;
  hasJournal: boolean;
  journalId?: string | null;
  journalStatus?: string | null;
}

export interface CreateConsultationVisitRequest {
  employeeId: string;
  recipientId: string;
  date: string;
  consultStatus?: ConsultStatus;
  consultType?: ConsultType;
  plannedStartTime: string;
  plannedEndTime?: string | null;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  notes?: string | null;
}

export interface UpdateConsultationVisitRequest {
  consultStatus?: ConsultStatus;
  consultType?: ConsultType;
  plannedStartTime: string;
  plannedEndTime?: string | null;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  notes?: string | null;
}

export interface ConsultationRecipientDto {
  id: string;
  name: string;
  gradeText: string;
  reduction: string;
  certNo: string;
  contractStatus: string;
  legalDob?: string | null;
  mobile?: string | null;
  address?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  serviceTypes: string[];
  hasSchedulesInMonth: boolean;
}

export interface RecipientScheduleItemDto {
  id: string;
  serviceDate: string;
  serviceType: string;
  scheduleKind: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  employeeId: string;
  employeeName: string;
}

export interface WorkJournalSummaryDto {
  id: string;
  consultationVisitId?: string | null;
  recipientId: string;
  employeeId: string;
  journalStatus: JournalStatus;
  writtenDate: string;
}

export interface WorkJournalDetailDto {
  id: string;
  consultationVisitId?: string | null;
  recipientId: string;
  employeeId: string;
  journalStatus: JournalStatus;
  writtenDate: string;
  formData: Record<string, unknown>;
}

export interface CreateWorkJournalRequest {
  consultationVisitId?: string | null;
  recipientId: string;
  employeeId: string;
  journalStatus?: JournalStatus;
  writtenDate?: string;
  formData: Record<string, unknown>;
}

export interface UpdateWorkJournalRequest {
  journalStatus?: JournalStatus;
  writtenDate?: string;
  formData: Record<string, unknown>;
}
