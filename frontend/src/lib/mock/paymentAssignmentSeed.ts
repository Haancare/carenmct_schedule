import type {
  AnnualScheduleRowDto,
  CareWorkerDto,
  MonthScheduleSummaryDto,
  MonthlyScheduleEntryDto,
  PaymentAssignmentRecipientDto,
  ScheduleKind,
  ServiceTypeCode,
  WeeklyScheduleEntryDto,
} from "@/lib/api/paymentAssignment.types";

export const GRADE_OPTIONS = [
  "1등급",
  "2등급",
  "3등급",
  "4등급",
  "5등급",
  "인지지원",
  "등급외",
] as const;

export const SEED_CARE_WORKERS: CareWorkerDto[] = [
  {
    id: "CW001",
    name: "이순자",
    nickname: "순자",
    birth: "1975-04-18",
    positionCode: "ST_08",
    status: "재직",
  },
  {
    id: "CW002",
    name: "박정희",
    birth: "1982-11-03",
    positionCode: "ST_08",
    status: "재직",
  },
  {
    id: "CW003",
    name: "최민수",
    nickname: "민수",
    birth: "1990-07-22",
    positionCode: "ST_08",
    status: "재직",
  },
  {
    id: "CW004",
    name: "김퇴직",
    birth: "1968-05-12",
    positionCode: "ST_08",
    status: "퇴직",
  },
  {
    id: "CW005",
    name: "박간호",
    birth: "1985-09-20",
    positionCode: "ST_04",
    status: "재직",
  },
];

/** 개발용 수급자 5명 — 백엔드 연동 후 제거 */
export const SEED_RECIPIENTS: PaymentAssignmentRecipientDto[] = [
  {
    id: "R001",
    name: "김영숙",
    legalDob: "1945-03-12",
    gradeText: "3등급",
    reduction: "감경9%",
    certNo: "L2024010001",
    contractStatus: "수급중",
    assignedCareWorkerIds: ["CW001"],
    hasSchedulesInYear: true,
    serviceTypesInYear: ["visit_care"],
  },
  {
    id: "R002",
    name: "박철수",
    legalDob: "1938-07-25",
    gradeText: "2등급",
    reduction: "일반",
    certNo: "L2024010002",
    contractStatus: "수급중",
    assignedCareWorkerIds: ["CW002"],
    hasSchedulesInYear: true,
    serviceTypesInYear: ["visit_care", "visit_bath"],
  },
  {
    id: "R003",
    name: "이정희",
    legalDob: "1952-11-08",
    gradeText: "4등급",
    reduction: "기초",
    certNo: "L2024010003",
    contractStatus: "수급중",
    assignedCareWorkerIds: ["CW001", "CW003"],
    hasSchedulesInYear: true,
    serviceTypesInYear: ["visit_nursing"],
  },
  {
    id: "R004",
    name: "최미경",
    legalDob: "1949-01-30",
    gradeText: "5등급",
    reduction: "감경6%",
    certNo: "L2024010004",
    contractStatus: "입원",
    assignedCareWorkerIds: ["CW002"],
    hasSchedulesInYear: false,
    serviceTypesInYear: [],
  },
  {
    id: "R005",
    name: "한동원",
    legalDob: "1940-09-15",
    gradeText: "1등급",
    reduction: "일반",
    certNo: "L2024010005",
    contractStatus: "수급중",
    assignedCareWorkerIds: ["CW003"],
    hasSchedulesInYear: true,
    serviceTypesInYear: ["visit_care", "day_care"],
  },
];

type MonthCounts = Partial<
  Record<number, { planCount: number; claimCount: number }>
>;

/** 연도별 월 집계 (recipientId → month → counts) */
const SEED_ANNUAL_COUNTS: Record<number, Record<string, MonthCounts>> = {
  2026: {
    R001: {
      1: { planCount: 22, claimCount: 20 },
      2: { planCount: 20, claimCount: 18 },
      3: { planCount: 21, claimCount: 19 },
      4: { planCount: 0, claimCount: 0 },
      5: { planCount: 18, claimCount: 0 },
      6: { planCount: 0, claimCount: 15 },
    },
    R002: {
      1: { planCount: 15, claimCount: 14 },
      3: { planCount: 16, claimCount: 16 },
      6: { planCount: 12, claimCount: 11 },
    },
    R003: {
      2: { planCount: 8, claimCount: 8 },
      3: { planCount: 9, claimCount: 7 },
    },
    R005: {
      1: { planCount: 25, claimCount: 24 },
      2: { planCount: 24, claimCount: 23 },
      3: { planCount: 26, claimCount: 25 },
      4: { planCount: 22, claimCount: 21 },
    },
  },
};

function buildMonths(recipientId: string, year: number): MonthScheduleSummaryDto[] {
  const byRecipient = SEED_ANNUAL_COUNTS[year]?.[recipientId] ?? {};
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const counts = byRecipient[month] ?? { planCount: 0, claimCount: 0 };
    return { month, ...counts };
  });
}

export function buildAnnualRowsForYear(
  year: number,
  recipients: PaymentAssignmentRecipientDto[],
): AnnualScheduleRowDto[] {
  return recipients.map((recipient) => ({
    recipient,
    months: buildMonths(recipient.id, year),
  }));
}

export function getSeedRecipientsForYear(
  year: number,
): PaymentAssignmentRecipientDto[] {
  return SEED_RECIPIENTS.map((r) => ({
    ...r,
    hasSchedulesInYear: Boolean(
      SEED_ANNUAL_COUNTS[year]?.[r.id] &&
        Object.keys(SEED_ANNUAL_COUNTS[year][r.id]).length > 0,
    ),
    serviceTypesInYear: r.serviceTypesInYear,
  }));
}

export function recipientHasServiceInYear(
  recipient: PaymentAssignmentRecipientDto,
  serviceType: ServiceTypeCode,
): boolean {
  return recipient.serviceTypesInYear.includes(serviceType);
}

/** 개발용 월별 일정 — 백엔드 연동 후 제거 */
export const SEED_MONTHLY_ENTRIES: MonthlyScheduleEntryDto[] = [
  {
    recipientId: "R001",
    date: "2026-03-03",
    serviceType: "visit_care",
    scheduleKind: "plan",
    grade: 3,
    reduction: "감경9%",
    durationMinutes: 180,
  },
  {
    recipientId: "R001",
    date: "2026-03-05",
    serviceType: "visit_care",
    scheduleKind: "plan",
    grade: 3,
    reduction: "감경9%",
    durationMinutes: 180,
  },
  {
    recipientId: "R001",
    date: "2026-03-10",
    serviceType: "visit_care",
    scheduleKind: "plan",
    grade: 3,
    reduction: "감경9%",
    durationMinutes: 240,
  },
  {
    recipientId: "R001",
    date: "2026-03-03",
    serviceType: "visit_care",
    scheduleKind: "claim",
    grade: 3,
    reduction: "감경9%",
    durationMinutes: 180,
  },
  {
    recipientId: "R001",
    date: "2026-03-05",
    serviceType: "visit_care",
    scheduleKind: "claim",
    grade: 3,
    reduction: "감경9%",
    durationMinutes: 180,
  },
  {
    recipientId: "R002",
    date: "2026-03-02",
    serviceType: "visit_care",
    scheduleKind: "plan",
    grade: 2,
    reduction: "일반",
    durationMinutes: 120,
  },
  {
    recipientId: "R002",
    date: "2026-03-08",
    serviceType: "visit_bath",
    scheduleKind: "plan",
    grade: 2,
    reduction: "일반",
    durationMinutes: 60,
  },
  {
    recipientId: "R002",
    date: "2026-03-02",
    serviceType: "visit_care",
    scheduleKind: "claim",
    grade: 2,
    reduction: "일반",
    durationMinutes: 120,
  },
  {
    recipientId: "R003",
    date: "2026-03-04",
    serviceType: "visit_nursing",
    scheduleKind: "plan",
    grade: 4,
    reduction: "기초",
    durationMinutes: 60,
  },
  {
    recipientId: "R003",
    date: "2026-03-04",
    serviceType: "visit_nursing",
    scheduleKind: "claim",
    grade: 4,
    reduction: "기초",
    durationMinutes: 60,
  },
  {
    recipientId: "R005",
    date: "2026-03-01",
    serviceType: "visit_care",
    scheduleKind: "plan",
    grade: 1,
    reduction: "일반",
    durationMinutes: 300,
  },
  {
    recipientId: "R005",
    date: "2026-03-15",
    serviceType: "day_care",
    scheduleKind: "plan",
    grade: 1,
    reduction: "일반",
    durationMinutes: 480,
  },
  {
    recipientId: "R005",
    date: "2026-03-01",
    serviceType: "visit_care",
    scheduleKind: "claim",
    grade: 1,
    reduction: "일반",
    durationMinutes: 300,
  },
  {
    recipientId: "R002",
    date: "2026-06-12",
    serviceType: "visit_care",
    scheduleKind: "claim",
    grade: 2,
    reduction: "일반",
    durationMinutes: 120,
  },
];

export function getSeedMonthlyEntries(
  year: number,
  month: number,
): MonthlyScheduleEntryDto[] {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return SEED_MONTHLY_ENTRIES.filter((entry) => entry.date.startsWith(prefix));
}

export const CONTRACT_STATUSES = [
  "준비중",
  "수급중",
  "타기관",
  "계약종료",
  "사망",
  "보류",
  "입원",
  "상담중",
] as const;

type SeedWeeklyEntry = WeeklyScheduleEntryDto & { recipientId: string };

/** 주간 캘린더 상세 — startTime/endTime/요양보호사 포함 */
export const SEED_WEEKLY_ENTRIES: SeedWeeklyEntry[] = [
  {
    recipientId: "R001",
    date: "2026-03-03",
    serviceType: "visit_care",
    scheduleKind: "plan",
    startTime: "09:00",
    endTime: "12:00",
    durationMinutes: 180,
    careWorkerId: "CW001",
  },
  {
    recipientId: "R001",
    date: "2026-03-05",
    serviceType: "visit_care",
    scheduleKind: "plan",
    startTime: "09:00",
    endTime: "12:00",
    durationMinutes: 180,
    careWorkerId: "CW001",
  },
  {
    recipientId: "R001",
    date: "2026-03-10",
    serviceType: "visit_care",
    scheduleKind: "plan",
    startTime: "10:00",
    endTime: "14:00",
    durationMinutes: 240,
    careWorkerId: "CW001",
  },
  {
    recipientId: "R001",
    date: "2026-03-03",
    serviceType: "visit_care",
    scheduleKind: "claim",
    startTime: "09:00",
    endTime: "12:00",
    durationMinutes: 180,
    careWorkerId: "CW001",
  },
  {
    recipientId: "R001",
    date: "2026-03-05",
    serviceType: "visit_care",
    scheduleKind: "claim",
    startTime: "09:00",
    endTime: "12:00",
    durationMinutes: 180,
    careWorkerId: "CW001",
  },
  {
    recipientId: "R002",
    date: "2026-03-02",
    serviceType: "visit_care",
    scheduleKind: "plan",
    startTime: "13:00",
    endTime: "15:00",
    durationMinutes: 120,
    careWorkerId: "CW002",
  },
  {
    recipientId: "R002",
    date: "2026-03-08",
    serviceType: "visit_bath",
    scheduleKind: "plan",
    startTime: "14:00",
    endTime: "15:00",
    durationMinutes: 60,
    careWorkerId: "CW002",
  },
  {
    recipientId: "R003",
    date: "2026-03-04",
    serviceType: "visit_nursing",
    scheduleKind: "plan",
    startTime: "11:00",
    endTime: "12:00",
    durationMinutes: 60,
    careWorkerId: "CW003",
  },
  {
    recipientId: "R005",
    date: "2026-03-01",
    serviceType: "visit_care",
    scheduleKind: "plan",
    startTime: "08:00",
    endTime: "13:00",
    durationMinutes: 300,
    careWorkerId: "CW003",
  },
  {
    recipientId: "R005",
    date: "2026-03-15",
    serviceType: "day_care",
    scheduleKind: "plan",
    startTime: "09:00",
    endTime: "17:00",
    durationMinutes: 480,
    careWorkerId: "CW003",
  },
];

export const SEED_DAY_MEMOS: Record<string, Record<string, string>> = {
  R001: { "2026-03-05": "보호자 방문 예정" },
  R005: { "2026-03-01": "건강 상태 양호" },
};

export function findSeedRecipient(
  id: string,
  year: number,
): PaymentAssignmentRecipientDto | undefined {
  return getSeedRecipientsForYear(year).find((r) => r.id === id);
}

export function getSeedWeeklyEntriesForRecipient(
  recipientId: string,
  year: number,
  scheduleKind: ScheduleKind,
): WeeklyScheduleEntryDto[] {
  const prefix = `${year}-`;
  return SEED_WEEKLY_ENTRIES.filter(
    (e) =>
      e.recipientId === recipientId &&
      e.date.startsWith(prefix) &&
      e.scheduleKind === scheduleKind,
  ).map(({ recipientId: _rid, ...entry }) => entry);
}

export function getSeedDayMemos(recipientId: string): Record<string, string> {
  return SEED_DAY_MEMOS[recipientId] ?? {};
}
