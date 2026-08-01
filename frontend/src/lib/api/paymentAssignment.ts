import apiClient from "@/lib/api/client";
import type {
  AnnualScheduleResponse,
  MonthlyScheduleQuery,
  MonthlyScheduleResponse,
  PaymentAssignmentListQuery,
  PaymentAssignmentRecipientDto,
  PaymentAssignmentRecipientsResponse,
  RecipientGroupDto,
  ServiceTypeCode,
  WeeklyRecipientListQuery,
  WeeklyScheduleQuery,
  WeeklyScheduleResponse,
} from "@/lib/api/paymentAssignment.types";
import { PA_GROUPS } from "@/features/payment-assignment/constants";
import { buildMonthlyScheduleRows } from "@/features/payment-assignment/utils/buildMonthlyRows";
import { buildWeeksFromDates } from "@/features/payment-assignment/utils/weekCalendar";
import {
  buildAnnualRowsForYear,
  findSeedRecipient,
  getSeedDayMemos,
  getSeedMonthlyEntries,
  getSeedRecipientsForYear,
  getSeedWeeklyEntriesForRecipient,
  recipientHasServiceInYear,
} from "@/lib/mock/paymentAssignmentSeed";

const USE_MOCK =
  process.env.NEXT_PUBLIC_PAYMENT_ASSIGNMENT_MOCK !== "false";

function typeLabel(reduction: string): "감경" | "기초" | "일반" {
  if (reduction.includes("감경")) return "감경";
  if (reduction.includes("기초")) return "기초";
  return "일반";
}

/** 서버·mock 공통 필터 — 백엔드 구현 시 동일 규칙 적용 */
export function filterPaymentAssignmentRecipients(
  recipients: PaymentAssignmentRecipientDto[],
  query: PaymentAssignmentListQuery,
  /** 있으면 해당 ID만 일정 있음으로 판정(월 급여일정용). 없으면 hasSchedulesInYear */
  withSchedulesRecipientIds?: Set<string>,
): PaymentAssignmentRecipientDto[] {
  const {
    query: nameQuery = "",
    grade = "all",
    reductionType = "all",
    serviceType = "all",
    workerId = "all",
    showAllActive = true,
  } = query;

  return recipients
    .filter((r) => {
      const matchQ = nameQuery === "" || r.name.includes(nameQuery.trim());
      const matchG = grade === "all" || r.gradeText === grade;
      const matchT =
        reductionType === "all" || typeLabel(r.reduction) === reductionType;
      const matchW =
        workerId === "all" || r.assignedCareWorkerIds.includes(workerId);
      const matchS =
        serviceType === "all" ||
        recipientHasServiceInYear(r, serviceType as ServiceTypeCode);

      if (!(matchQ && matchG && matchT && matchW && matchS)) return false;

      const isActive = r.contractStatus === "수급중";
      const hasSchedules =
        withSchedulesRecipientIds != null
          ? withSchedulesRecipientIds.has(r.id)
          : r.hasSchedulesInYear;
      return hasSchedules || (showAllActive && isActive);
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

function toApiQuery(query: PaymentAssignmentListQuery) {
  return {
    year: query.year,
    query: query.query || undefined,
    grade: query.grade !== "all" ? query.grade : undefined,
    reductionType: query.reductionType !== "all" ? query.reductionType : undefined,
    serviceType: query.serviceType !== "all" ? query.serviceType : undefined,
    workerId: query.workerId !== "all" ? query.workerId : undefined,
    showAllActive: query.showAllActive,
    groupId: query.groupId,
    subgroupId: query.subgroupId,
  };
}

async function mockFetchRecipients(
  query: PaymentAssignmentListQuery,
): Promise<PaymentAssignmentRecipientsResponse> {
  await delay(80);
  const pool = getSeedRecipientsForYear(query.year);
  const recipients = filterPaymentAssignmentRecipients(pool, query);
  return { recipients, totalCount: recipients.length };
}

async function mockFetchAnnual(
  query: PaymentAssignmentListQuery,
): Promise<AnnualScheduleResponse> {
  await delay(80);
  const pool = getSeedRecipientsForYear(query.year);
  const recipients = filterPaymentAssignmentRecipients(pool, query);
  const rows = buildAnnualRowsForYear(query.year, recipients);
  return { rows, totalCount: rows.length };
}

async function mockFetchMonthly(
  query: MonthlyScheduleQuery,
): Promise<MonthlyScheduleResponse> {
  await delay(80);
  const pool = getSeedRecipientsForYear(query.year);
  const entries = getSeedMonthlyEntries(query.year, query.month);
  const withMonthSchedules = new Set(entries.map((e) => e.recipientId));
  const recipients = filterPaymentAssignmentRecipients(
    pool,
    query,
    withMonthSchedules,
  );
  const rows = buildMonthlyScheduleRows(
    recipients,
    entries,
    query.year,
    query.month,
    query.scheduleKind,
  );
  const lastDay = new Date(query.year, query.month, 0).getDate();
  return { rows, totalCount: recipients.length, lastDay };
}

async function mockFetchWeeklyRecipients(
  query: WeeklyRecipientListQuery,
): Promise<PaymentAssignmentRecipientsResponse> {
  await delay(80);
  const pool = getSeedRecipientsForYear(query.year);
  const { query: nameQuery = "", contractStatus = "all" } = query;

  const recipients = pool
    .filter((r) => {
      const inPool = r.contractStatus === "수급중" || r.hasSchedulesInYear;
      if (!inPool) return false;
      if (nameQuery && !r.name.includes(nameQuery.trim())) return false;
      if (contractStatus !== "all" && r.contractStatus !== contractStatus) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));

  return { recipients, totalCount: recipients.length };
}

async function mockFetchWeeklySchedule(
  query: WeeklyScheduleQuery,
): Promise<WeeklyScheduleResponse> {
  await delay(80);
  const recipient =
    findSeedRecipient(query.recipientId, query.year) ??
    getSeedRecipientsForYear(query.year).find((r) => r.id === query.recipientId);

  if (!recipient) {
    throw new Error("Recipient not found");
  }

  const entries = getSeedWeeklyEntriesForRecipient(
    query.recipientId,
    query.year,
    query.scheduleKind,
  );
  const entriesByDate: WeeklyScheduleResponse["entriesByDate"] = {};
  entries.forEach((entry) => {
    const arr = entriesByDate[entry.date] ?? [];
    arr.push(entry);
    entriesByDate[entry.date] = arr;
  });

  const weeks = buildWeeksFromDates(Object.keys(entriesByDate));
  const dayMemos = getSeedDayMemos(query.recipientId);

  return { recipient, weeks, entriesByDate, dayMemos };
}

function toMonthlyApiQuery(query: MonthlyScheduleQuery) {
  return {
    ...toApiQuery(query),
    month: query.month,
    scheduleKind: query.scheduleKind,
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mockRecipientGroups(): RecipientGroupDto[] {
  return PA_GROUPS.filter((g) => g.id !== "all").map((g) => ({
    id: g.id,
    name: g.label,
    color: "blue",
    hasSubgroups: g.subs.length > 0,
    subgroups: g.subs.map((name, i) => ({ id: `${g.id}-${i}`, name })),
  }));
}

/** GET /api/payment-assignment/recipient-groups */
export async function fetchRecipientGroups(): Promise<RecipientGroupDto[]> {
  if (USE_MOCK) {
    await delay(40);
    return mockRecipientGroups();
  }

  const { data } = await apiClient.get<RecipientGroupDto[]>(
    "/api/payment-assignment/recipient-groups",
  );
  return data;
}

/** GET /api/payment-assignment/recipients */
export async function fetchPaymentAssignmentRecipients(
  query: PaymentAssignmentListQuery,
): Promise<PaymentAssignmentRecipientsResponse> {
  if (USE_MOCK) {
    return mockFetchRecipients(query);
  }

  const { data } = await apiClient.get<PaymentAssignmentRecipientsResponse>(
    "/api/payment-assignment/recipients",
    { params: toApiQuery(query) },
  );
  return data;
}

/** GET /api/payment-assignment/annual */
export async function fetchAnnualSchedule(
  query: PaymentAssignmentListQuery,
): Promise<AnnualScheduleResponse> {
  if (USE_MOCK) {
    return mockFetchAnnual(query);
  }

  const { data } = await apiClient.get<AnnualScheduleResponse>(
    "/api/payment-assignment/annual",
    { params: toApiQuery(query) },
  );
  return data;
}

/** GET /api/payment-assignment/monthly */
export async function fetchMonthlySchedule(
  query: MonthlyScheduleQuery,
): Promise<MonthlyScheduleResponse> {
  if (USE_MOCK) {
    return mockFetchMonthly(query);
  }

  const { data } = await apiClient.get<MonthlyScheduleResponse>(
    "/api/payment-assignment/monthly",
    { params: toMonthlyApiQuery(query) },
  );
  return data;
}

/** GET /api/payment-assignment/weekly/recipients */
export async function fetchWeeklyRecipients(
  query: WeeklyRecipientListQuery,
): Promise<PaymentAssignmentRecipientsResponse> {
  if (USE_MOCK) {
    return mockFetchWeeklyRecipients(query);
  }

  const { data } = await apiClient.get<PaymentAssignmentRecipientsResponse>(
    "/api/payment-assignment/weekly/recipients",
    {
      params: {
        year: query.year,
        query: query.query || undefined,
        contractStatus:
          query.contractStatus !== "all" ? query.contractStatus : undefined,
        groupId: query.groupId,
        subgroupId: query.subgroupId,
      },
    },
  );
  return data;
}

/** GET /api/payment-assignment/weekly */
export async function fetchWeeklySchedule(
  query: WeeklyScheduleQuery,
): Promise<WeeklyScheduleResponse> {
  if (USE_MOCK) {
    return mockFetchWeeklySchedule(query);
  }

  const { data } = await apiClient.get<WeeklyScheduleResponse>(
    "/api/payment-assignment/weekly",
    {
      params: {
        recipientId: query.recipientId,
        year: query.year,
        scheduleKind: query.scheduleKind,
      },
    },
  );
  return data;
}
