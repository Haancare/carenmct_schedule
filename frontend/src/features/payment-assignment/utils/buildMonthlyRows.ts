import type {
  MonthlyScheduleEntryDto,
  MonthlyScheduleRowDto,
  PaymentAssignmentRecipientDto,
  ScheduleKind,
  ServiceTypeCode,
} from "@/lib/api/paymentAssignment.types";

import { SVC_ORDER } from "@/features/payment-assignment/constants";

function parseGradeNum(gradeText: string): number {
  const match = gradeText.match(/^(\d)/);
  return match ? parseInt(match[1], 10) : 1;
}

type RowGroup = {
  svc: ServiceTypeCode;
  gradeNum: number;
  reduction: string;
  days: Set<number>;
  totalMinutes: number;
  count: number;
};

/** 피그마 PaymentAssignment monthlyRows 로직 — 백엔드 구현 시 서버에서 동일 규칙 적용 */
export function buildMonthlyScheduleRows(
  recipients: PaymentAssignmentRecipientDto[],
  entries: MonthlyScheduleEntryDto[],
  year: number,
  month: number,
  scheduleKind: ScheduleKind,
): MonthlyScheduleRowDto[] {
  const out: MonthlyScheduleRowDto[] = [];
  const prefix = `${year}-${String(month).padStart(2, "0")}`;

  recipients.forEach((recipient) => {
    const scheds = entries.filter(
      (s) =>
        s.recipientId === recipient.id &&
        s.date.startsWith(prefix) &&
        s.scheduleKind === scheduleKind,
    );
    const startIdx = out.length;
    const fbGrade = parseGradeNum(recipient.gradeText);
    const fbRed = recipient.reduction;

    if (scheds.length === 0) {
      out.push({
        recipient,
        key: `${recipient.id}::none`,
        serviceType: null,
        gradeNum: null,
        reduction: null,
        days: [],
        totalMinutes: 0,
        count: 0,
        firstOfRecipient: true,
        recRowSpan: 1,
        firstOfPeriod: true,
        periodRowSpan: 1,
      });
    } else {
      const groups = new Map<string, RowGroup>();

      scheds.forEach((s) => {
        const gradeNum = s.grade ?? fbGrade;
        const reduction = s.reduction ?? fbRed;
        const key = `${s.serviceType}|${gradeNum}|${reduction}`;
        let grp = groups.get(key);
        if (!grp) {
          grp = {
            svc: s.serviceType,
            gradeNum,
            reduction,
            days: new Set(),
            totalMinutes: 0,
            count: 0,
          };
          groups.set(key, grp);
        }
        const day = parseInt(s.date.slice(8, 10), 10);
        if (day) grp.days.add(day);
        grp.totalMinutes += s.durationMinutes;
        grp.count += 1;
      });

      const items = Array.from(groups.values()).sort((a, b) => {
        const so =
          SVC_ORDER.indexOf(a.svc as (typeof SVC_ORDER)[number]) -
          SVC_ORDER.indexOf(b.svc as (typeof SVC_ORDER)[number]);
        if (so !== 0) return so;
        if (a.gradeNum !== b.gradeNum) return a.gradeNum - b.gradeNum;
        return a.reduction.localeCompare(b.reduction, "ko");
      });

      items.forEach((grp, i) => {
        const firstOfPeriod = i === 0 || items[i - 1].svc !== grp.svc;
        out.push({
          recipient,
          key: `${recipient.id}::${grp.svc}|${grp.gradeNum}|${grp.reduction}`,
          serviceType: grp.svc,
          gradeNum: grp.gradeNum,
          reduction: grp.reduction,
          days: Array.from(grp.days).sort((a, b) => a - b),
          totalMinutes: grp.totalMinutes,
          count: grp.count,
          firstOfRecipient: i === 0,
          recRowSpan: 1,
          firstOfPeriod,
          periodRowSpan: 1,
        });
      });
    }

    out[startIdx].recRowSpan = out.length - startIdx;

    let periodStart = startIdx;
    for (let i = startIdx + 1; i <= out.length; i++) {
      if (i === out.length || out[i].firstOfPeriod) {
        out[periodStart].periodRowSpan = i - periodStart;
        periodStart = i;
      }
    }
  });

  return out;
}
