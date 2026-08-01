import type { ConsultationRecipientDto, ConsultWorkerDto, RecipientScheduleItemDto } from "@/lib/api/consultation.types";
import type { ConsultationVisitDto } from "@/lib/api/consultation.types";

export const POSITION_CODES: Record<string, string> = {
  ST_01: "시설장(관리책임자)",
  ST_02: "사무국장",
  ST_03: "사회복지사",
  ST_04: "간호사",
  ST_05: "물리치료사",
  ST_06: "작업치료사",
  ST_07: "언어치료사",
  ST_08: "요양보호사",
  ST_09: "간호조무사",
  ST_10: "영양사",
  ST_11: "조리원",
  ST_12: "사무원",
  ST_13: "운전원",
  ST_14: "위생원",
};

export const SERVICE_LABELS: Record<string, string> = {
  visit_care: "방문요양",
  family_care: "가족요양",
  full_day_visit: "종일방문",
  visit_bath: "방문목욕",
  visit_nursing: "방문간호",
  day_care: "주간보호",
};

/** UI 호환용 방문 모델 (피그마 ConsultationVisit) */
export interface ConsultationVisit {
  id: string;
  socialWorkerId: string;
  recipientId: string;
  date: string;
  consultStatus: "planned" | "completed" | "unable";
  plannedStartTime: string;
  plannedEndTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  consultType: string;
  notes?: string;
  hasJournal?: boolean;
  journalId?: string | null;
  journalStatus?: string | null;
}

export interface ScheduleEntry {
  id: string;
  recipientId: string;
  careWorkerId: string;
  careWorkerName?: string;
  date: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  kind: "plan" | "claim";
}

export interface UiRecipient {
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
  status: "active" | "inactive";
  guardians: { name: string; mobile: string }[];
}

export interface UiWorker {
  id: string;
  name: string;
  positionCode: string;
  status: "active" | "inactive";
  phone?: string;
}

export function toVisit(dto: ConsultationVisitDto): ConsultationVisit {
  return {
    id: dto.id,
    socialWorkerId: dto.employeeId,
    recipientId: dto.recipientId,
    date: dto.date,
    consultStatus: dto.consultStatus,
    plannedStartTime: dto.plannedStartTime,
    plannedEndTime: dto.plannedEndTime ?? undefined,
    actualStartTime: dto.actualStartTime ?? undefined,
    actualEndTime: dto.actualEndTime ?? undefined,
    consultType: dto.consultType,
    notes: dto.notes ?? undefined,
    hasJournal: dto.hasJournal,
    journalId: dto.journalId,
    journalStatus: dto.journalStatus,
  };
}

export function toUiRecipient(dto: ConsultationRecipientDto): UiRecipient {
  return {
    ...dto,
    status: dto.contractStatus === "수급중" ? "active" : "inactive",
    guardians: dto.guardianName
      ? [{ name: dto.guardianName, mobile: dto.guardianPhone || "" }]
      : [],
  };
}

export function toUiWorker(dto: ConsultWorkerDto): UiWorker {
  const active =
    dto.status === "근무중" || dto.status === "active" || dto.status === "ACTIVE";
  return {
    id: dto.id,
    name: dto.name,
    positionCode: dto.position,
    status: active ? "active" : "inactive",
    phone: dto.mobile ?? undefined,
  };
}

export function toScheduleEntry(
  dto: RecipientScheduleItemDto,
  recipientId: string,
): ScheduleEntry {
  return {
    id: dto.id,
    recipientId,
    careWorkerId: dto.employeeId,
    careWorkerName: dto.employeeName,
    date: dto.serviceDate,
    serviceType: dto.serviceType,
    startTime: dto.startTime,
    endTime: dto.endTime,
    durationMinutes: dto.durationMinutes,
    kind: dto.scheduleKind === "claim" ? "claim" : "plan",
  };
}

export function getGradeText(r: { gradeText?: string }): string {
  return r.gradeText ?? "";
}

export function getGradeNum(r: { gradeText?: string }): number {
  const m = String(r.gradeText ?? "").match(/(\d)/);
  const n = m ? Number(m[1]) : 5;
  return n >= 1 && n <= 5 ? n : 5;
}

export function getMobile(r: { mobile?: string | null }): string {
  return r.mobile ?? "";
}

/** 휴대폰/일반전화 숫자를 보기 좋은 하이픈 형식으로 변환 */
export function formatPhone(raw?: string | null): string {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return String(raw).trim();
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    if (digits.startsWith("02")) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9 && digits.startsWith("02")) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return String(raw).trim();
}

export function getGuardians(r: { guardians?: { name: string; mobile: string }[] }) {
  return r.guardians ?? [];
}

export function getServiceTypes(r: { serviceTypes?: string[] }): string[] {
  return r.serviceTypes ?? [];
}

export function getCertNo(r: { certNo?: string }): string {
  return r.certNo ?? "";
}

export function getReduction(r: { reduction?: string }): string {
  return r.reduction ?? "일반";
}
