"use client";

import { useCallback, useMemo, useState } from "react";

import {
  applyPeriodChangeApi,
  buildBulkCreateScheduleRequest,
  buildCreateScheduleRequest,
  bulkCreateSchedulesApi,
  bulkDeleteSchedulesApi,
  createScheduleApi,
  deleteScheduleApi,
  isPersistedScheduleId,
  isScheduleAssignmentApiMode,
  updateScheduleFeeApi,
} from "@/lib/api/scheduleAssignment";
import type {
  ScheduleAddFormData,
  ScheduleAssignmentEntry,
  ScheduleAssignmentMonthResponse,
  SchedulePaymentStatusDto,
  ScheduleYearMonthCounts,
} from "@/lib/api/scheduleAssignment.types";
import type { ScheduleKind } from "@/lib/api/paymentAssignment.types";

import {
  applyPeriodChangeToSchedules,
  type PeriodChangeKind,
} from "../utils/periodChange";
import {
  applyFeePatch,
  calcMonthlyCopayAmount,
  copaymentTypeFromReduction,
  copayRateFromReduction,
  getEntryBenefitTotal,
} from "../utils/scheduleFee";
import {
  buildScheduleEntry,
  computeDurationMinutes,
  hasAssignConflict,
  hasRecipientOverlap,
  hasWorkerCrossRecipientOverlap,
  isHolidayDate,
  validateScheduleForm,
  type WorkerPlanScheduleRef,
} from "../utils/scheduleEditor";

type EditorState = {
  added: ScheduleAssignmentEntry[];
  removedIds: Set<string>;
  updated: Record<string, ScheduleAssignmentEntry>;
};

type EditorOptions = {
  onRefetch?: () => void;
  workerPlanSchedules?: WorkerPlanScheduleRef[];
  holidayDates?: ReadonlySet<string>;
};

function mergeSchedules(
  base: ScheduleAssignmentEntry[],
  editor: EditorState,
): ScheduleAssignmentEntry[] {
  const filtered = base.filter((s) => !editor.removedIds.has(s.id));
  const combined = [
    ...filtered,
    ...editor.added.filter((s) => !editor.removedIds.has(s.id)),
  ];
  return combined.map((s) => editor.updated[s.id] ?? s);
}

function recountYearMonth(
  schedules: ScheduleAssignmentEntry[],
  month: number,
  base: ScheduleYearMonthCounts,
): ScheduleYearMonthCounts {
  const map: ScheduleYearMonthCounts = { ...base };
  if (!map[month]) map[month] = { plan: 0, claim: 0 };
  map[month] = { plan: 0, claim: 0 };
  schedules.forEach((s) => {
    if (s.scheduleKind === "plan") map[month].plan += 1;
    else map[month].claim += 1;
  });
  return map;
}

function rebuildPaymentStatus(
  schedules: ScheduleAssignmentEntry[],
  scheduleKind: ScheduleKind,
  prev: SchedulePaymentStatusDto,
): SchedulePaymentStatusDto {
  const filtered = schedules.filter((s) => s.scheduleKind === scheduleKind);
  const activeUsed = filtered.reduce(
    (sum, s) => sum + getEntryBenefitTotal(s),
    0,
  );
  const remaining = Math.max(0, prev.monthlyLimit - activeUsed);
  const usageRate =
    prev.monthlyLimit > 0
      ? Math.min((activeUsed / prev.monthlyLimit) * 100, 100)
      : 0;
  const activeSelfPay = calcMonthlyCopayAmount(filtered);
  const limitExcess = Math.max(0, activeUsed - prev.monthlyLimit);

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
    svcMap.set(label, (svcMap.get(label) ?? 0) + getEntryBenefitTotal(s));
  });

  return {
    monthlyLimit: prev.monthlyLimit,
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

export function useScheduleEditor(
  baseData: ScheduleAssignmentMonthResponse | null,
  yearMonthCountsBase: ScheduleYearMonthCounts,
  year: number,
  month: number,
  scheduleKind: ScheduleKind,
  recipientId: string,
  options?: EditorOptions,
) {
  const useApi = isScheduleAssignmentApiMode;
  const onRefetch = options?.onRefetch;
  const workerPlanSchedules = options?.workerPlanSchedules ?? [];
  const holidayDates = options?.holidayDates ?? new Set<string>();

  const [editor, setEditor] = useState<EditorState>({
    added: [],
    removedIds: new Set(),
    updated: {},
  });
  const [saving, setSaving] = useState(false);

  const resetEditor = useCallback(() => {
    setEditor({ added: [], removedIds: new Set(), updated: {} });
  }, []);

  const schedules = useMemo(() => {
    if (!baseData) return [];
    return mergeSchedules(baseData.schedules, editor);
  }, [baseData, editor]);

  const yearMonthCounts = useMemo(() => {
    if (!baseData) return yearMonthCountsBase;
    return recountYearMonth(schedules, month, yearMonthCountsBase);
  }, [baseData, schedules, month, yearMonthCountsBase]);

  const paymentStatus = useMemo(() => {
    if (!baseData) return null;
    return rebuildPaymentStatus(schedules, scheduleKind, baseData.paymentStatus);
  }, [baseData, schedules, scheduleKind]);

  const runWithSaving = useCallback(
    async <T>(action: () => Promise<T>): Promise<T> => {
      setSaving(true);
      try {
        return await action();
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const addSchedule = useCallback((entry: ScheduleAssignmentEntry) => {
    setEditor((prev) => ({
      ...prev,
      added: [...prev.added, entry],
    }));
  }, []);

  const removeSchedulesByIds = useCallback((ids: string[]) => {
    setEditor((prev) => {
      const removedIds = new Set(prev.removedIds);
      const added = [...prev.added];
      ids.forEach((id) => {
        const addedIdx = added.findIndex((s) => s.id === id);
        if (addedIdx >= 0) added.splice(addedIdx, 1);
        else removedIds.add(id);
      });
      return { added, removedIds, updated: prev.updated };
    });
  }, []);

  const updateScheduleFee = useCallback(
    async (scheduleId: string, unitCost: number, surchargeAmount: number) => {
      if (useApi && isPersistedScheduleId(scheduleId)) {
        await runWithSaving(async () => {
          await updateScheduleFeeApi(scheduleId, unitCost, surchargeAmount);
          onRefetch?.();
          resetEditor();
        });
        return;
      }

      setEditor((prev) => {
        const current = baseData
          ? mergeSchedules(baseData.schedules, prev)
          : [];
        const entry = current.find((s) => s.id === scheduleId);
        if (!entry) return prev;
        const patched = applyFeePatch(entry, unitCost, surchargeAmount);
        return {
          ...prev,
          updated: { ...prev.updated, [scheduleId]: patched },
        };
      });
    },
    [baseData, useApi, onRefetch, resetEditor, runWithSaving],
  );

  const applyPeriodChange = useCallback(
    async (
      splitDate: string,
      kind: PeriodChangeKind,
      before: string,
      after: string,
      fallbackGrade: number,
      fallbackReduction: string,
    ) => {
      if (useApi) {
        await runWithSaving(async () => {
          await applyPeriodChangeApi({
            recipientId,
            year,
            month,
            splitDate,
            kind,
            before,
            after,
          });
          onRefetch?.();
          resetEditor();
        });
        return;
      }

      setEditor((prev) => {
        if (!baseData) return prev;
        const current = mergeSchedules(baseData.schedules, prev);
        const next = applyPeriodChangeToSchedules(
          current,
          splitDate,
          kind,
          before,
          after,
          fallbackGrade,
          fallbackReduction,
        );
        const updated = { ...prev.updated };
        next.forEach((entry) => {
          if (entry.scheduleKind !== "plan") return;
          const beforeEntry = current.find((s) => s.id === entry.id);
          if (
            beforeEntry &&
            (beforeEntry.grade !== entry.grade ||
              beforeEntry.reduction !== entry.reduction)
          ) {
            updated[entry.id] = entry;
          }
        });
        return { ...prev, updated };
      });
    },
    [
      baseData,
      useApi,
      recipientId,
      year,
      month,
      onRefetch,
      resetEditor,
      runWithSaving,
    ],
  );

  const assignToDate = useCallback(
    async (
      dateStr: string,
      form: ScheduleAddFormData,
    ): Promise<{ ok: true } | { ok: false; reason: string }> => {
      if (!form.careWorkerId) {
        return { ok: false, reason: "담당 직원을 선택해 주세요." };
      }
      const duration = computeDurationMinutes(
        form.startHour,
        form.startMin,
        form.endHour,
        form.endMin,
      );
      const validationError = validateScheduleForm(form, duration);
      if (validationError) {
        return { ok: false, reason: validationError };
      }
      const startTime = `${form.startHour}:${form.startMin}`;
      const endTime = `${form.endHour}:${form.endMin}`;
      if (
        hasRecipientOverlap(
          schedules,
          dateStr,
          startTime,
          endTime,
          form.serviceType,
        )
      ) {
        return { ok: false, reason: "해당 날짜에 겹치는 일정이 있습니다." };
      }
      if (
        hasWorkerCrossRecipientOverlap(
          workerPlanSchedules,
          recipientId,
          dateStr,
          startTime,
          endTime,
          form.serviceType,
        )
      ) {
        return {
          ok: false,
          reason:
            "선택한 요양보호사는 해당 시간에 다른 수급자 일정이 있습니다.",
        };
      }
      const dup = schedules.some(
        (s) =>
          s.date === dateStr &&
          s.scheduleKind === "plan" &&
          s.careWorkerId === form.careWorkerId &&
          s.serviceType === form.serviceType &&
          s.startTime === startTime &&
          s.endTime === endTime,
      );
      if (dup) return { ok: false, reason: "동일 일정이 이미 있습니다." };

      if (useApi) {
        try {
          await runWithSaving(async () => {
            const duration = computeDurationMinutes(
              form.startHour,
              form.startMin,
              form.endHour,
              form.endMin,
            );
            await createScheduleApi(
              buildCreateScheduleRequest(
                recipientId,
                form,
                dateStr,
                duration,
              ),
            );
            onRefetch?.();
            resetEditor();
          });
          return { ok: true };
        } catch {
          return { ok: false, reason: "일정 저장에 실패했습니다." };
        }
      }

      addSchedule(
        buildScheduleEntry({
          recipientId,
          date: dateStr,
          serviceType: form.serviceType,
          careWorkerId: form.careWorkerId,
          startHour: form.startHour,
          startMin: form.startMin,
          endHour: form.endHour,
          endMin: form.endMin,
          grade: form.grade,
          reduction: form.copaymentType,
          holidayDates,
        }),
      );
      return { ok: true };
    },
    [
      schedules,
      workerPlanSchedules,
      useApi,
      recipientId,
      addSchedule,
      onRefetch,
      resetEditor,
      runWithSaving,
    ],
  );

  const runBatchAssign = useCallback(
    async (
      form: ScheduleAddFormData,
      opts: {
        allowedDows?: Set<number> | null;
        excludeHoliday?: boolean;
      },
    ): Promise<number> => {
      const { allowedDows = null, excludeHoliday = false } = opts;
      if (!form.careWorkerId) return 0;

      const duration = computeDurationMinutes(
        form.startHour,
        form.startMin,
        form.endHour,
        form.endMin,
      );
      if (validateScheduleForm(form, duration)) return 0;

      const lastDay = new Date(year, month, 0).getDate();
      const mm = String(month).padStart(2, "0");
      const startTime = `${form.startHour}:${form.startMin}`;
      const endTime = `${form.endHour}:${form.endMin}`;
      const dateStrs: string[] = [];

      for (let d = 1; d <= lastDay; d++) {
        const dateStr = `${year}-${mm}-${String(d).padStart(2, "0")}`;
        const dow = new Date(year, month - 1, d).getDay();
        if (allowedDows && !allowedDows.has(dow)) continue;
        if (excludeHoliday && isHolidayDate(dateStr, holidayDates)) continue;
        if (
          hasAssignConflict(
            schedules,
            workerPlanSchedules,
            recipientId,
            dateStr,
            startTime,
            endTime,
            form.serviceType,
          )
        ) {
          continue;
        }
        const dup = schedules.some(
          (s) =>
            s.date === dateStr &&
            s.scheduleKind === "plan" &&
            s.careWorkerId === form.careWorkerId &&
            s.serviceType === form.serviceType &&
            s.startTime === startTime &&
            s.endTime === endTime,
        );
        if (dup) continue;
        dateStrs.push(dateStr);
      }

      if (dateStrs.length === 0) return 0;

      if (useApi) {
        const duration = computeDurationMinutes(
          form.startHour,
          form.startMin,
          form.endHour,
          form.endMin,
        );
        let createdCount = 0;
        await runWithSaving(async () => {
          const { created } = await bulkCreateSchedulesApi(
            buildBulkCreateScheduleRequest(
              recipientId,
              form,
              dateStrs,
              duration,
            ),
          );
          createdCount = created.length;
          onRefetch?.();
          resetEditor();
        });
        return createdCount;
      }

      const entries: ScheduleAssignmentEntry[] = dateStrs.map((dateStr, d) =>
        buildScheduleEntry(
          {
            recipientId,
            date: dateStr,
            serviceType: form.serviceType,
            careWorkerId: form.careWorkerId,
            startHour: form.startHour,
            startMin: form.startMin,
            endHour: form.endHour,
            endMin: form.endMin,
            grade: form.grade,
            reduction: form.copaymentType,
            holidayDates,
          },
          `-${d}`,
        ),
      );

      setEditor((prev) => ({
        ...prev,
        added: [...prev.added, ...entries],
      }));
      return entries.length;
    },
    [year, month, schedules, workerPlanSchedules, holidayDates, useApi, recipientId, onRefetch, resetEditor, runWithSaving],
  );

  const bulkDeletePlanByTypes = useCallback(
    async (serviceTypes: Set<string>) => {
      const targets = schedules
        .filter(
          (s) => s.scheduleKind === "plan" && serviceTypes.has(s.serviceType),
        )
        .map((s) => s.id);

      if (targets.length === 0) return 0;

      if (useApi) {
        const persisted = targets.filter(isPersistedScheduleId);
        if (persisted.length === 0) return 0;
        await runWithSaving(async () => {
          await bulkDeleteSchedulesApi(persisted);
          onRefetch?.();
          resetEditor();
        });
        return persisted.length;
      }

      removeSchedulesByIds(targets);
      return targets.length;
    },
    [schedules, useApi, onRefetch, resetEditor, removeSchedulesByIds, runWithSaving],
  );

  const deleteScheduleById = useCallback(
    async (scheduleId: string) => {
      if (useApi && isPersistedScheduleId(scheduleId)) {
        await runWithSaving(async () => {
          await deleteScheduleApi(scheduleId);
          onRefetch?.();
          resetEditor();
        });
        return;
      }
      removeSchedulesByIds([scheduleId]);
    },
    [useApi, onRefetch, resetEditor, removeSchedulesByIds, runWithSaving],
  );

  return {
    schedules,
    yearMonthCounts,
    paymentStatus,
    assignToDate,
    runBatchAssign,
    bulkDeletePlanByTypes,
    deleteScheduleById,
    updateScheduleFee,
    applyPeriodChange,
    resetEditor,
    saving,
    useApi,
    hasEdits:
      !useApi &&
      (editor.added.length > 0 ||
        editor.removedIds.size > 0 ||
        Object.keys(editor.updated).length > 0),
  };
}

export function defaultAddForm(recipient: {
  gradeText: string;
  reduction: string;
}): ScheduleAddFormData {
  const gradeMatch = recipient.gradeText.match(/^(\d)/);
  const grade = gradeMatch ? Number(gradeMatch[1]) : 3;
  const copaymentType = copaymentTypeFromReduction(recipient.reduction);
  const rate = copayRateFromReduction(copaymentType);
  return {
    serviceType: "visit_care",
    careWorkerId: "",
    careWorkerId2: "",
    bathType: "차량이용(차량내)",
    familyRelation: "",
    startHour: "09",
    startMin: "00",
    endHour: "10",
    endMin: "30",
    grade,
    copaymentType,
    copaymentRate: rate,
  };
}

export function canAssignDate(
  schedules: ScheduleAssignmentEntry[],
  dateStr: string,
  form: ScheduleAddFormData,
  recipientId: string,
  workerPlanSchedules: WorkerPlanScheduleRef[] = [],
): boolean {
  if (!form.careWorkerId) return false;
  const startTime = `${form.startHour}:${form.startMin}`;
  const endTime = `${form.endHour}:${form.endMin}`;
  return !hasAssignConflict(
    schedules,
    workerPlanSchedules,
    recipientId,
    dateStr,
    startTime,
    endTime,
    form.serviceType,
  );
}
