import apiClient from "@/lib/api/client";
import {
  fetchMonthlySchedule,
  fetchWeeklyRecipients,
  fetchWeeklySchedule,
} from "@/lib/api/paymentAssignment";
import type {
  PaymentAssignmentRecipientDto,
  ScheduleKind,
  WeeklyScheduleEntryDto,
} from "@/lib/api/paymentAssignment.types";
import type {
  ScheduleAssignmentEntry,
  ScheduleAssignmentListItem,
  ScheduleAssignmentListQuery,
  ScheduleAssignmentMonthResponse,
  ScheduleAssignmentRecipient,
  ScheduleYearMonthCounts,
} from "@/lib/api/scheduleAssignment.types";
import {
  buildSeedScheduleAssignmentRecipient,
  getSeedYearMonthCounts,
  mockFetchScheduleAssignmentMonth,
  mockFetchScheduleAssignmentList,
} from "@/lib/mock/scheduleAssignmentSeed";
import { getCareWorkerName, formatCareWorkerLabel } from "@/lib/api/careWorkers";

const USE_PAYMENT_API =
  process.env.NEXT_PUBLIC_PAYMENT_ASSIGNMENT_MOCK === "false";

export const isScheduleAssignmentApiMode = USE_PAYMENT_API;

export function isPersistedScheduleId(id: string): boolean {
  return /^\d+$/.test(id);
}

/** 백엔드 ScheduleEntryResponse */
export type ScheduleEntryResponseDto = {
  id: number;
  recipientId: string;
  employeeId: string;
  serviceDate: string;
  serviceType: ScheduleAssignmentEntry["serviceType"];
  scheduleKind: ScheduleKind;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  unitCost: number;
  feeCode?: string | null;
  surchargeAmount: number;
  benefitTotal: number | null;
  feeEdited: boolean;
  familyRelation?: string | null;
  gradeSnapshot: string | null;
  reductionSnapshot: string | null;
  copayRateSnapshot: number | null;
};

export function mapScheduleEntryResponse(
  dto: ScheduleEntryResponseDto,
): ScheduleAssignmentEntry {
  const benefitTotal =
    dto.benefitTotal ?? dto.unitCost + (dto.surchargeAmount ?? 0);
  const grade = dto.gradeSnapshot
    ? parseInt(dto.gradeSnapshot.match(/^(\d)/)?.[1] ?? "3", 10)
    : undefined;
  const reduction = dto.reductionSnapshot ?? undefined;
  const copaymentRate =
    dto.copayRateSnapshot != null
      ? Number(dto.copayRateSnapshot)
      : reduction
        ? copayRateFromReduction(reduction)
        : undefined;
  return {
    id: String(dto.id),
    date: dto.serviceDate,
    serviceType: dto.serviceType,
    scheduleKind: dto.scheduleKind,
    startTime: dto.startTime,
    endTime: dto.endTime,
    durationMinutes: dto.durationMinutes,
    careWorkerId: dto.employeeId,
    grade,
    reduction,
    copaymentRate,
    unitCost: dto.unitCost,
    surchargeAmount: dto.surchargeAmount ?? 0,
    benefitTotal,
    feeEdited: dto.feeEdited,
    feeCode: dto.feeCode ?? undefined,
    familyRelation: dto.familyRelation ?? undefined,
  };
}

function apiRecipientToInfo(
  r: PaymentAssignmentRecipientDto,
): ScheduleAssignmentRecipient {
  const seeded = buildSeedScheduleAssignmentRecipient(r);
  if (seeded.validFrom) return seeded;
  return {
    ...r,
    serviceTypes: r.serviceTypesInYear.length ? r.serviceTypesInYear : [],
    contacts: [
      { name: r.name, role: "self" },
      ...r.assignedCareWorkerIds.map((wid) => ({
        name: getCareWorkerName(wid),
        role: "worker" as const,
      })),
    ],
  };
}

function parseGradeNum(gradeText: string): number {
  const m = gradeText.match(/^(\d)/);
  return m ? Number(m[1]) : 3;
}

function copayRateFromReduction(reduction: string): number {
  if (reduction.includes("9")) return 9;
  if (reduction.includes("6")) return 6;
  if (reduction.includes("기초")) return 0;
  return 15;
}

function estimateUnitCost(entry: WeeklyScheduleEntryDto): number {
  const base: Record<string, number> = {
    visit_care: 20580,
    visit_bath: 85000,
    visit_nursing: 45000,
    day_care: 78000,
    family_care: 18000,
    full_day_visit: 35000,
  };
  const hourly = base[entry.serviceType] ?? 20000;
  return Math.round((hourly * entry.durationMinutes) / 60);
}

function weeklyEntryToSchedule(
  entry: WeeklyScheduleEntryDto,
  recipient: PaymentAssignmentRecipientDto,
  idx: number,
): ScheduleAssignmentEntry {
  const unitCost =
    entry.unitCost ?? estimateUnitCost(entry);
  const surchargeAmount = entry.surchargeAmount ?? 0;
  const benefitTotal = entry.benefitTotal ?? unitCost + surchargeAmount;
  const reduction = entry.reduction ?? recipient.reduction;
  const copaymentRate =
    entry.copaymentRate ?? copayRateFromReduction(reduction);
  return {
    id:
      entry.scheduleId ??
      `${entry.date}-${entry.scheduleKind}-${entry.careWorkerId}-${entry.startTime}-${idx}`,
    date: entry.date,
    serviceType: entry.serviceType,
    scheduleKind: entry.scheduleKind,
    startTime: entry.startTime,
    endTime: entry.endTime,
    durationMinutes: entry.durationMinutes,
    careWorkerId: entry.careWorkerId,
    grade: entry.grade ?? parseGradeNum(recipient.gradeText),
    reduction,
    copaymentRate,
    unitCost,
    surchargeAmount,
    benefitTotal,
  };
}

function filterMonthEntries<T extends { date: string }>(
  entries: T[],
  year: number,
  month: number,
): T[] {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return entries.filter((e) => e.date.startsWith(prefix));
}

function buildPaymentStatusFromSchedules(
  schedules: ScheduleAssignmentEntry[],
  scheduleKind: ScheduleKind,
  recipient: PaymentAssignmentRecipientDto,
): ScheduleAssignmentMonthResponse["paymentStatus"] {
  const filtered = schedules.filter((s) => s.scheduleKind === scheduleKind);
  const monthlyLimit = 1_383_950;
  const activeUsed = filtered.reduce((sum, s) => sum + s.unitCost, 0);
  const remaining = Math.max(0, monthlyLimit - activeUsed);
  const usageRate =
    monthlyLimit > 0 ? Math.min((activeUsed / monthlyLimit) * 100, 100) : 0;
  const rate = recipient.reduction.includes("9")
    ? 0.09
    : recipient.reduction.includes("6")
      ? 0.06
      : recipient.reduction.includes("기초")
        ? 0
        : 0.15;
  const activeSelfPay = Math.floor(activeUsed * rate);
  const limitExcess = Math.max(0, activeUsed - monthlyLimit);

  const svcLabels: Record<string, string> = {
    visit_care: "방문요양",
    visit_bath: "방문목욕",
    visit_nursing: "방문간호",
    day_care: "주간보호",
    family_care: "가족요양",
    full_day_visit: "종일방문",
  };
  const svcMap = new Map<string, number>();
  filtered.forEach((s) => {
    const label = svcLabels[s.serviceType] ?? s.serviceType;
    svcMap.set(label, (svcMap.get(label) ?? 0) + s.unitCost);
  });

  return {
    monthlyLimit,
    activeUsed,
    remaining,
    usageRate,
    activeSelfPay,
    limitExcess,
    serviceAmounts: Array.from(svcMap.entries()).map(([label, amount]) => ({
      label,
      amount,
    })),
  };
}

async function apiFetchScheduleAssignmentMonth(
  recipientId: string,
  year: number,
  month: number,
  scheduleKind: ScheduleKind,
): Promise<ScheduleAssignmentMonthResponse | null> {
  const [planRes, claimRes] = await Promise.all([
    fetchWeeklySchedule({ recipientId, year, scheduleKind: "plan" }),
    fetchWeeklySchedule({ recipientId, year, scheduleKind: "claim" }),
  ]);

  const recipient = planRes.recipient ?? claimRes.recipient;
  if (!recipient) return null;

  const allEntries: ScheduleAssignmentEntry[] = [];
  let idx = 0;

  for (const res of [planRes, claimRes]) {
    Object.values(res.entriesByDate).flat().forEach((entry) => {
      allEntries.push(weeklyEntryToSchedule(entry, recipient, idx++));
    });
  }

  const monthSchedules = filterMonthEntries(allEntries, year, month);

  return {
    recipient: apiRecipientToInfo(recipient),
    schedules: monthSchedules,
    paymentStatus: buildPaymentStatusFromSchedules(
      monthSchedules,
      scheduleKind,
      recipient,
    ),
  };
}

async function apiFetchScheduleAssignmentList(
  query: ScheduleAssignmentListQuery,
): Promise<ScheduleAssignmentListItem[]> {
  const { year, month, showAllActive = true } = query;

  const [recipientsRes, planRes, claimRes] = await Promise.all([
    fetchWeeklyRecipients({ year }),
    fetchMonthlySchedule({ year, month, scheduleKind: "plan", showAllActive }),
    fetchMonthlySchedule({ year, month, scheduleKind: "claim", showAllActive }),
  ]);

  const planCounts: Record<string, number> = {};
  planRes.rows.forEach((row) => {
    planCounts[row.recipient.id] =
      (planCounts[row.recipient.id] ?? 0) + row.count;
  });

  const claimCounts: Record<string, number> = {};
  claimRes.rows.forEach((row) => {
    claimCounts[row.recipient.id] =
      (claimCounts[row.recipient.id] ?? 0) + row.count;
  });

  const listedIds = new Set([
    ...Object.keys(planCounts),
    ...Object.keys(claimCounts),
    ...recipientsRes.recipients
      .filter((r) => showAllActive && r.contractStatus === "수급중")
      .map((r) => r.id),
  ]);

  return recipientsRes.recipients
    .filter((r) => listedIds.has(r.id))
    .map((recipient) => ({
      recipient,
      planCount: planCounts[recipient.id] ?? 0,
      claimCount: claimCounts[recipient.id] ?? 0,
    }))
    .sort((a, b) => a.recipient.name.localeCompare(b.recipient.name, "ko"));
}

async function apiFetchYearMonthCounts(
  recipientId: string,
  year: number,
): Promise<ScheduleYearMonthCounts> {
  const [planRes, claimRes] = await Promise.all([
    fetchWeeklySchedule({ recipientId, year, scheduleKind: "plan" }),
    fetchWeeklySchedule({ recipientId, year, scheduleKind: "claim" }),
  ]);

  const map: ScheduleYearMonthCounts = {};
  for (let m = 1; m <= 12; m++) map[m] = { plan: 0, claim: 0 };

  const countEntries = (kind: ScheduleKind, res: typeof planRes) => {
    Object.entries(res.entriesByDate).forEach(([date, entries]) => {
      if (!date.startsWith(`${year}-`)) return;
      const month = Number(date.slice(5, 7));
      map[month][kind === "plan" ? "plan" : "claim"] += entries.length;
    });
  };

  countEntries("plan", planRes);
  countEntries("claim", claimRes);
  return map;
}

export async function fetchScheduleAssignmentMonth(
  recipientId: string,
  year: number,
  month: number,
  scheduleKind: ScheduleKind,
): Promise<ScheduleAssignmentMonthResponse | null> {
  if (USE_PAYMENT_API) {
    return fetchScheduleAssignmentMonthFromApi(
      recipientId,
      year,
      month,
      scheduleKind,
    );
  }
  return mockFetchScheduleAssignmentMonth(
    recipientId,
    year,
    month,
    scheduleKind,
  );
}

export async function fetchScheduleAssignmentList(
  query: ScheduleAssignmentListQuery,
): Promise<ScheduleAssignmentListItem[]> {
  if (USE_PAYMENT_API) {
    return fetchScheduleAssignmentListFromApi(query);
  }
  return mockFetchScheduleAssignmentList(
    query.year,
    query.month,
    query.showAllActive,
  );
}

export async function fetchScheduleYearMonthCounts(
  recipientId: string,
  year: number,
): Promise<ScheduleYearMonthCounts> {
  if (USE_PAYMENT_API) {
    return fetchScheduleYearMonthCountsFromApi(recipientId, year);
  }
  return getSeedYearMonthCounts(recipientId, year);
}

export { getCareWorkerName as getSeedCareWorkerName, formatCareWorkerLabel as getSeedCareWorkerLabel };

export type CreateScheduleApiRequest = {
  recipientId: string;
  employeeId: string;
  serviceDate: string;
  serviceType: string;
  scheduleKind?: ScheduleKind;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  gradeSnapshot?: string;
  reductionSnapshot?: string;
  copayRateSnapshot?: number;
  bathType?: string;
  familyRelation?: string;
};

export function buildCreateScheduleRequest(
  recipientId: string,
  form: import("@/lib/api/scheduleAssignment.types").ScheduleAddFormData,
  dateStr: string,
  durationMinutes: number,
): CreateScheduleApiRequest {
  return {
    recipientId,
    employeeId: form.careWorkerId,
    serviceDate: dateStr,
    serviceType: form.serviceType,
    scheduleKind: "plan",
    startTime: `${form.startHour}:${form.startMin}`,
    endTime: `${form.endHour}:${form.endMin}`,
    durationMinutes,
    gradeSnapshot: String(form.grade),
    reductionSnapshot: form.copaymentType,
    copayRateSnapshot: form.copaymentRate,
    bathType: form.serviceType === "visit_bath" ? form.bathType : undefined,
    familyRelation:
      form.serviceType === "family_care" ? form.familyRelation || undefined : undefined,
  };
}

export async function createScheduleApi(body: CreateScheduleApiRequest) {
  const { data } = await apiClient.post<ScheduleEntryResponseDto>(
    "/api/schedule-assignment/schedules",
    body,
  );
  return mapScheduleEntryResponse(data);
}

export type BulkCreateScheduleApiRequest = {
  recipientId: string;
  employeeId: string;
  serviceType: string;
  serviceDates: string[];
  startTime: string;
  endTime: string;
  durationMinutes: number;
  gradeSnapshot?: string;
  reductionSnapshot?: string;
  copayRateSnapshot?: number;
  bathType?: string;
  familyRelation?: string;
};

export async function bulkCreateSchedulesApi(body: BulkCreateScheduleApiRequest) {
  const { data } = await apiClient.post<{
    created: ScheduleEntryResponseDto[];
    skipped: number;
  }>("/api/schedule-assignment/schedules/bulk-create", body);
  return {
    created: data.created.map(mapScheduleEntryResponse),
    skipped: data.skipped,
  };
}

export function buildBulkCreateScheduleRequest(
  recipientId: string,
  form: import("@/lib/api/scheduleAssignment.types").ScheduleAddFormData,
  serviceDates: string[],
  durationMinutes: number,
): BulkCreateScheduleApiRequest {
  return {
    recipientId,
    employeeId: form.careWorkerId,
    serviceType: form.serviceType,
    serviceDates,
    startTime: `${form.startHour}:${form.startMin}`,
    endTime: `${form.endHour}:${form.endMin}`,
    durationMinutes,
    gradeSnapshot: String(form.grade),
    reductionSnapshot: form.copaymentType,
    copayRateSnapshot: form.copaymentRate,
    bathType: form.serviceType === "visit_bath" ? form.bathType : undefined,
    familyRelation:
      form.serviceType === "family_care" ? form.familyRelation || undefined : undefined,
  };
}

export type ScheduleFeeQuoteRequest = {
  year: number;
  serviceType: string;
  serviceDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  gradeSnapshot?: string;
  bathType?: string;
  familyRelation?: string;
};

export type ScheduleFeeQuoteDto = {
  unitCost: number;
  feeCode: string;
  surchargeAmount: number;
  surchargeRate: number | null;
  surchargeMinutes: number;
  surchargePeriodLabel: string;
};

export async function fetchScheduleFeeQuote(
  request: ScheduleFeeQuoteRequest,
): Promise<ScheduleFeeQuoteDto> {
  const { data } = await apiClient.post<ScheduleFeeQuoteDto>(
    "/api/schedule-assignment/fee-quote",
    request,
  );
  return data;
}

export async function updateScheduleFeeApi(
  scheduleId: string,
  unitCost: number,
  surchargeAmount: number,
) {
  const { data } = await apiClient.patch<ScheduleEntryResponseDto>(
    `/api/schedule-assignment/schedules/${scheduleId}/fee`,
    { unitCost, surchargeAmount },
  );
  return mapScheduleEntryResponse(data);
}

export async function deleteScheduleApi(scheduleId: string) {
  await apiClient.delete(`/api/schedule-assignment/schedules/${scheduleId}`);
}

export async function bulkDeleteSchedulesApi(scheduleIds: string[]) {
  const { data } = await apiClient.post<number>(
    "/api/schedule-assignment/schedules/bulk-delete",
    { scheduleIds: scheduleIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id)) },
  );
  return data;
}

export async function applyPeriodChangeApi(body: {
  recipientId: string;
  year: number;
  month: number;
  splitDate: string;
  kind: "grade" | "reduction";
  before: string;
  after: string;
}) {
  const { data } = await apiClient.post<ScheduleEntryResponseDto[]>(
    "/api/schedule-assignment/schedules/apply-period-change",
    body,
  );
  return data.map(mapScheduleEntryResponse);
}

export async function fetchScheduleAssignmentMonthFromApi(
  recipientId: string,
  year: number,
  month: number,
  scheduleKind: ScheduleKind,
): Promise<ScheduleAssignmentMonthResponse | null> {
  try {
    const { data } = await apiClient.get<{
      recipient: ScheduleAssignmentRecipient;
      schedules: ScheduleEntryResponseDto[];
      paymentStatus: ScheduleAssignmentMonthResponse["paymentStatus"];
    }>(`/api/schedule-assignment/${recipientId}`, {
      params: { year, month, scheduleKind },
    });
    return {
      recipient: data.recipient,
      schedules: data.schedules.map(mapScheduleEntryResponse),
      paymentStatus: data.paymentStatus,
    };
  } catch {
    return null;
  }
}

export async function fetchScheduleAssignmentListFromApi(
  query: ScheduleAssignmentListQuery,
): Promise<ScheduleAssignmentListItem[]> {
  const { data } = await apiClient.get<ScheduleAssignmentListItem[]>(
    "/api/schedule-assignment",
    {
      params: {
        year: query.year,
        month: query.month,
        showAllActive: query.showAllActive,
      },
    },
  );
  return data;
}

type YearMonthCountsApiResponse = {
  counts: Record<string, { plan: number; claim: number }>;
};

export async function fetchScheduleYearMonthCountsFromApi(
  recipientId: string,
  year: number,
): Promise<ScheduleYearMonthCounts> {
  const { data } = await apiClient.get<YearMonthCountsApiResponse>(
    `/api/schedule-assignment/${recipientId}/year-month-counts`,
    { params: { year } },
  );
  const map: ScheduleYearMonthCounts = {};
  for (let month = 1; month <= 12; month++) {
    const entry = data.counts[String(month)];
    map[month] = { plan: entry?.plan ?? 0, claim: entry?.claim ?? 0 };
  }
  return map;
}

export type RecipientMemoEntry = {
  id: string;
  content: string;
  timestamp: string;
  authorName?: string;
  serviceMonth?: string;
  pinned: boolean;
};

export async function fetchRecipientMemos(
  recipientId: string,
): Promise<RecipientMemoEntry[]> {
  if (!USE_PAYMENT_API) return [];
  const { data } = await apiClient.get<RecipientMemoEntry[]>(
    `/api/schedule-assignment/${recipientId}/memos`,
  );
  return data;
}

export async function createRecipientMemo(
  recipientId: string,
  content: string,
): Promise<RecipientMemoEntry> {
  const { data } = await apiClient.post<RecipientMemoEntry>(
    `/api/schedule-assignment/${recipientId}/memos`,
    { content },
  );
  return data;
}

export async function updateRecipientMemo(
  memoId: string,
  content: string,
): Promise<RecipientMemoEntry> {
  const { data } = await apiClient.put<RecipientMemoEntry>(
    `/api/schedule-assignment/memos/${memoId}`,
    { content },
  );
  return data;
}

export async function toggleRecipientMemoPin(
  memoId: string,
): Promise<RecipientMemoEntry> {
  const { data } = await apiClient.patch<RecipientMemoEntry>(
    `/api/schedule-assignment/memos/${memoId}/pin`,
  );
  return data;
}

export async function deleteRecipientMemo(memoId: string): Promise<void> {
  await apiClient.delete(`/api/schedule-assignment/memos/${memoId}`);
}

export type RecipientServiceWorkerItem = {
  serviceType: string;
  employeeId: number;
  familyRelation?: string | null;
  sortOrder: number;
};

export type RecipientServiceWorkersResponse = {
  items: RecipientServiceWorkerItem[];
};

export async function fetchRecipientServiceWorkers(
  recipientId: string,
): Promise<RecipientServiceWorkerItem[]> {
  if (!USE_PAYMENT_API) return [];
  const { data } = await apiClient.get<RecipientServiceWorkersResponse>(
    `/api/schedule-assignment/${recipientId}/service-workers`,
  );
  return data.items ?? [];
}

export type RecipientFamilyWorkerDto = {
  employeeId: string;
  employeeName: string;
  familyRelation: string;
  selfCopayDeduction: boolean;
};

/** 통합관리 recipient_family_workers — 가족요양 자동선택 */
export async function fetchRecipientFamilyWorkers(
  recipientId: string,
): Promise<RecipientFamilyWorkerDto[]> {
  if (!USE_PAYMENT_API) return [];
  const { data } = await apiClient.get<RecipientFamilyWorkerDto[]>(
    `/api/schedule-assignment/${recipientId}/family-workers`,
  );
  return data ?? [];
}

export async function replaceRecipientServiceWorkers(
  recipientId: string,
  items: RecipientServiceWorkerItem[],
): Promise<RecipientServiceWorkerItem[]> {
  const { data } = await apiClient.put<RecipientServiceWorkersResponse>(
    `/api/schedule-assignment/${recipientId}/service-workers`,
    { items },
  );
  return data.items ?? [];
}

export type WorkerScheduleEntry = {
  id: string;
  recipientId: string;
  recipientName: string;
  serviceDate: string;
  serviceType: ScheduleAssignmentEntry["serviceType"];
  scheduleKind: ScheduleKind;
  startTime: string;
  endTime: string;
  durationMinutes: number;
};

type WorkerScheduleEntryDto = {
  id: number;
  recipientId: string;
  recipientName: string;
  serviceDate: string;
  serviceType: ScheduleAssignmentEntry["serviceType"];
  scheduleKind: ScheduleKind;
  startTime: string;
  endTime: string;
  durationMinutes: number;
};

export async function fetchWorkerMonthSchedules(
  workerId: string,
  year: number,
  month: number,
  scheduleKind: ScheduleKind,
): Promise<WorkerScheduleEntry[]> {
  if (USE_PAYMENT_API) {
    const { data } = await apiClient.get<WorkerScheduleEntryDto[]>(
      `/api/schedule-assignment/workers/${workerId}/schedules`,
      { params: { year, month, scheduleKind } },
    );
    return data.map((e) => ({
      ...e,
      id: String(e.id),
    }));
  }

  const { SEED_WEEKLY_ENTRIES, findSeedRecipient } = await import(
    "@/lib/mock/paymentAssignmentSeed"
  );
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  return SEED_WEEKLY_ENTRIES.filter(
    (e) =>
      e.careWorkerId === workerId &&
      e.date.startsWith(prefix) &&
      e.scheduleKind === scheduleKind,
  ).map((e, idx) => ({
    id: `${e.recipientId}-${e.date}-${idx}`,
    recipientId: e.recipientId,
    recipientName:
      findSeedRecipient(e.recipientId, year)?.name ?? e.recipientId,
    serviceDate: e.date,
    serviceType: e.serviceType,
    scheduleKind: e.scheduleKind,
    startTime: e.startTime,
    endTime: e.endTime,
    durationMinutes: e.durationMinutes,
  }));
}
