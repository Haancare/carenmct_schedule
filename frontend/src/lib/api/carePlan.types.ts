export type AssessmentDocType =
  | "longTerm"
  | "needs"
  | "fall"
  | "pressure"
  | "cognitive"
  | "carePlan";

export interface CarePlanRecipientDto {
  id: string;
  name: string;
  legalDob: string | null;
  realDob: string | null;
  gradeText: string;
  reduction: string;
  certNo: string;
  contractStatus: string;
  validFrom: string | null;
  validTo: string | null;
  mobile: string | null;
  approvedAmtCare: number | null;
  approvedAmtBath: number | null;
  approvedAmtNursing: number | null;
  approvedAmtDay: number | null;
  approvedAmtOther: number | null;
  serviceTypes: string[];
  latestWrittenDates: Record<string, string>;
}

export interface AssessmentDocumentSummaryDto {
  id: number;
  recipientId: string;
  docType: AssessmentDocType;
  writtenDate: string;
  employeeId: number | null;
  authorName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AssessmentDocumentDetailDto {
  id: number;
  recipientId: string;
  docType: AssessmentDocType;
  writtenDate: string;
  employeeId: number | null;
  authorName: string | null;
  formData: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateAssessmentDocumentRequest {
  recipientId: string;
  docType: AssessmentDocType;
  writtenDate: string;
  employeeId?: number | null;
  formData: Record<string, unknown>;
}

export interface UpdateAssessmentDocumentRequest {
  writtenDate: string;
  employeeId?: number | null;
  formData: Record<string, unknown>;
}
