import type {
  PaymentAssignmentRecipientDto,
  ScheduleKind,
} from "@/lib/api/paymentAssignment.types";
import type {
  ScheduleAssignmentEntry,
  ScheduleAssignmentListItem,
  ScheduleAssignmentMonthResponse,
  ScheduleAssignmentRecipient,
  SchedulePaymentStatusDto,
  ScheduleYearMonthCounts,
} from "@/lib/api/scheduleAssignment.types";
import {
  SEED_CARE_WORKERS,
  SEED_DAY_MEMOS,
  SEED_RECIPIENTS,
  SEED_WEEKLY_ENTRIES,
  getSeedRecipientsForYear,
} from "@/lib/mock/paymentAssignmentSeed";

const SERVICE_LABELS: Record<string, string> = {
  visit_care: "방문요양",
  family_care: "가족요양",
  full_day_visit: "종일방문",
  visit_bath: "방문목욕",
  visit_nursing: "방문간호",
  day_care: "주간보호",
};

const SEED_EXTRA: Record<
  string,
  {
    validFrom: string;
    validTo: string;
    mobile: string;
    monthlyLimit: number;
    guardians: { name: string; relation: string; phone: string }[];
  }
> = {
  R001: {
    validFrom: "2025-01-01",
    validTo: "2026-12-31",
    mobile: "010-1234-5678",
    monthlyLimit: 1_383_950,
    guardians: [{ name: "김민수", relation: "아들", phone: "010-9876-5432" }],
  },
  R002: {
    validFrom: "2024-06-01",
    validTo: "2026-05-31",
    mobile: "010-2345-6789",
    monthlyLimit: 1_620_000,
    guardians: [{ name: "박지영", relation: "딸", phone: "010-8765-4321" }],
  },
  R003: {
    validFrom: "2025-03-01",
    validTo: "2027-02-28",
    mobile: "010-3456-7890",
    monthlyLimit: 1_383_950,
    guardians: [],
  },
  R004: {
    validFrom: "2024-01-01",
    validTo: "2025-12-31",
    mobile: "010-4567-8901",
    monthlyLimit: 1_166_390,
    guardians: [{ name: "최준호", relation: "아들", phone: "010-7654-3210" }],
  },
  R005: {
    validFrom: "2025-02-01",
    validTo: "2027-01-31",
    mobile: "010-5678-9012",
    monthlyLimit: 2_050_000,
    guardians: [{ name: "한서연", relation: "딸", phone: "010-6543-2109" }],
  },
};

function estimateUnitCost(durationMinutes: number, serviceType: string): number {
  const base: Record<string, number> = {
    visit_care: 20580,
    visit_bath: 85000,
    visit_nursing: 45000,
    day_care: 78000,
    family_care: 18000,
    full_day_visit: 35000,
  };
  const hourly = base[serviceType] ?? 20000;
  return Math.round((hourly * durationMinutes) / 60);
}

function parseGradeNum(gradeText: string): number {
  const m = gradeText.match(/^(\d)/);
  return m ? Number(m[1]) : 3;
}

function buildScheduleEntries(
  recipientId: string,
  year: number,
  month?: number,
): ScheduleAssignmentEntry[] {
  const prefix =
    month != null
      ? `${year}-${String(month).padStart(2, "0")}`
      : `${year}-`;

  return SEED_WEEKLY_ENTRIES.filter(
    (e) => e.recipientId === recipientId && e.date.startsWith(prefix),
  ).map((e, idx) => ({
    id: `${e.date}-${e.scheduleKind}-${e.careWorkerId}-${e.startTime}-${idx}`,
    date: e.date,
    serviceType: e.serviceType,
    scheduleKind: e.scheduleKind,
    startTime: e.startTime,
    endTime: e.endTime,
    durationMinutes: e.durationMinutes,
    careWorkerId: e.careWorkerId,
    grade: parseGradeNum(
      SEED_RECIPIENTS.find((r) => r.id === recipientId)?.gradeText ?? "3등급",
    ),
    reduction:
      SEED_RECIPIENTS.find((r) => r.id === recipientId)?.reduction ?? "일반",
    unitCost: estimateUnitCost(e.durationMinutes, e.serviceType),
  }));
}

export function buildSeedScheduleAssignmentRecipient(
  base: PaymentAssignmentRecipientDto,
): ScheduleAssignmentRecipient {
  const extra = SEED_EXTRA[base.id];
  const workerContacts = base.assignedCareWorkerIds.map((wid) => {
    const w = SEED_CARE_WORKERS.find((c) => c.id === wid);
    const WORKER_PHONES: Record<string, string> = {
      CW001: "010-2345-6789",
      CW002: "010-3456-7890",
      CW003: "010-4567-8901",
    };
    return {
      name: w?.name ?? wid,
      role: "worker" as const,
      phone: WORKER_PHONES[wid],
    };
  });

  const contacts = [
    {
      name: base.name,
      role: "self" as const,
      phone: extra?.mobile,
    },
    ...(extra?.guardians.map((g) => ({
      name: g.name,
      role: "guardian" as const,
      relation: g.relation,
      phone: g.phone,
    })) ?? []),
    ...workerContacts,
  ];

  return {
    ...base,
    validFrom: extra?.validFrom,
    validTo: extra?.validTo,
    mobile: extra?.mobile,
    serviceTypes: base.serviceTypesInYear.length
      ? base.serviceTypesInYear
      : ["visit_care"],
    contacts,
  };
}

function buildPaymentStatus(
  schedules: ScheduleAssignmentEntry[],
  scheduleKind: ScheduleKind,
  monthlyLimit: number,
): SchedulePaymentStatusDto {
  const filtered = schedules.filter((s) => s.scheduleKind === scheduleKind);
  const activeUsed = filtered.reduce((sum, s) => sum + s.unitCost, 0);
  const remaining = Math.max(0, monthlyLimit - activeUsed);
  const usageRate =
    monthlyLimit > 0 ? Math.min((activeUsed / monthlyLimit) * 100, 100) : 0;
  const rate =
    filtered[0]?.reduction?.includes("9")
      ? 0.09
      : filtered[0]?.reduction?.includes("6")
        ? 0.06
        : filtered[0]?.reduction?.includes("기초")
          ? 0
          : 0.15;
  const activeSelfPay = Math.floor(activeUsed * rate);
  const limitExcess = Math.max(0, activeUsed - monthlyLimit);

  const svcMap = new Map<string, number>();
  filtered.forEach((s) => {
    const label = SERVICE_LABELS[s.serviceType] ?? s.serviceType;
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

export function getSeedYearMonthCounts(
  recipientId: string,
  year: number,
): ScheduleYearMonthCounts {
  const entries = buildScheduleEntries(recipientId, year);
  const map: ScheduleYearMonthCounts = {};
  for (let m = 1; m <= 12; m++) {
    map[m] = { plan: 0, claim: 0 };
  }
  entries.forEach((e) => {
    const month = Number(e.date.slice(5, 7));
    if (e.scheduleKind === "plan") map[month].plan += 1;
    else map[month].claim += 1;
  });
  return map;
}

export function mockFetchScheduleAssignmentMonth(
  recipientId: string,
  year: number,
  month: number,
  scheduleKind: ScheduleKind,
): ScheduleAssignmentMonthResponse | null {
  const base = getSeedRecipientsForYear(year).find((r) => r.id === recipientId);
  if (!base) return null;

  const schedules = buildScheduleEntries(recipientId, year, month);
  const extra = SEED_EXTRA[recipientId];

  return {
    recipient: buildSeedScheduleAssignmentRecipient(base),
    schedules,
    paymentStatus: buildPaymentStatus(
      schedules,
      scheduleKind,
      extra?.monthlyLimit ?? 1_383_950,
    ),
  };
}

export function mockFetchScheduleAssignmentList(
  year: number,
  month: number,
  showAllActive = true,
): ScheduleAssignmentListItem[] {
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
  const monthEntries = SEED_WEEKLY_ENTRIES.filter((e) =>
    e.date.startsWith(monthPrefix),
  );

  const countMap: Record<string, { plan: number; claim: number }> = {};
  monthEntries.forEach((e) => {
    if (!countMap[e.recipientId]) countMap[e.recipientId] = { plan: 0, claim: 0 };
    if (e.scheduleKind === "plan") countMap[e.recipientId].plan += 1;
    else countMap[e.recipientId].claim += 1;
  });

  return getSeedRecipientsForYear(year)
    .filter(
      (r) =>
        countMap[r.id] != null || (showAllActive && r.contractStatus === "수급중"),
    )
    .map((recipient) => ({
      recipient,
      planCount: countMap[recipient.id]?.plan ?? 0,
      claimCount: countMap[recipient.id]?.claim ?? 0,
    }))
    .sort((a, b) => a.recipient.name.localeCompare(b.recipient.name, "ko"));
}

export function getSeedCareWorkerName(id: string): string {
  return SEED_CARE_WORKERS.find((w) => w.id === id)?.name ?? id;
}

export { SERVICE_LABELS, estimateUnitCost };
