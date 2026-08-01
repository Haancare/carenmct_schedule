"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Award, Percent, Plus } from "lucide-react";

import type {
  BatchAssignType,
  ScheduleAddFormData,
  ScheduleAssignmentEntry,
} from "@/lib/api/scheduleAssignment.types";

import PeriodChangeModal from "./components/PeriodChangeModal";
import ScheduleCardPopover from "./components/ScheduleCardPopover";

import RecipientCalendarHeader from "./components/RecipientCalendarHeader";
import RecipientInfoSidebar from "./components/RecipientInfoSidebar";
import RecipientListPanel from "./components/RecipientListPanel";
import RecipientMonthlyCalendar from "./components/RecipientMonthlyCalendar";
import RecipientScheduleSummaryTable from "./components/RecipientScheduleSummaryTable";
import BulkDeletePanel, {
  BulkDeleteToggle,
} from "./components/BulkDeletePanel";
import ScheduleAddPanel from "./components/ScheduleAddPanel";
import RecipientMemoPanel from "./components/RecipientMemoPanel";
import WorkerScheduleModal from "./components/WorkerScheduleModal";
import {
  deriveGradeSegments,
  deriveReductionSegments,
  fmtMd,
} from "./utils/derivePeriodSegments";
import { deriveMonthAssignedWorkerIds } from "./utils/monthAssignedWorkers";
import {
  canAssignDate,
  defaultAddForm,
  useScheduleEditor,
} from "./hooks/useScheduleEditor";
import { useScheduleAssignmentMonth } from "./hooks/useScheduleAssignmentMonth";
import { useScheduleAssignmentParams } from "./hooks/useScheduleAssignmentParams";
import { useScheduleAssignmentList } from "./hooks/useScheduleAssignmentList";
import { useHolidays } from "./hooks/useHolidays";
import { useCareWorkers } from "./hooks/useCareWorkers";
import { useWorkerPlanSchedules } from "./hooks/useWorkerPlanSchedules";
import { fetchRecipientMemos } from "@/lib/api/scheduleAssignment";
import { fetchConsultationVisits } from "@/lib/api/consultation";
import type { ConsultationVisitDto } from "@/lib/api/consultation.types";
import {
  applySummaryRowToAddForm,
  computeDurationMinutes,
  validateScheduleForm,
} from "./utils/scheduleEditor";
import type { ScheduleSummaryRow } from "./utils/buildScheduleSummary";
import { readCachedShowAllActive } from "./utils/recipientListCache";

type Props = {
  recipientId: string;
};

export default function ScheduleAssignmentPage({ recipientId }: Props) {
  const {
    year,
    month,
    view,
    setYear,
    setMonth,
    setView,
    navigateRecipient,
  } = useScheduleAssignmentParams(recipientId);

  const [showAllActive, setShowAllActive] = useState(
    () => readCachedShowAllActive() ?? true,
  );
  const [highlightedRowKey, setHighlightedRowKey] = useState<string | null>(
    null,
  );
  const hlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [assignMode, setAssignMode] = useState(false);
  const [batchType, setBatchType] = useState<BatchAssignType>("");
  const [memoOpen, setMemoOpen] = useState(false);
  const [memoCount, setMemoCount] = useState(0);
  const [formData, setFormData] = useState<ScheduleAddFormData | null>(null);
  const [cardPopover, setCardPopover] = useState<{
    schedule: ScheduleAssignmentEntry;
    x: number;
    y: number;
  } | null>(null);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [reductionModalOpen, setReductionModalOpen] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    split: "",
    before: "",
    after: "",
    reason: "",
  });
  const [reductionForm, setReductionForm] = useState({
    split: "",
    before: "",
    after: "",
    reason: "",
  });
  const [schedViewWorker, setSchedViewWorker] = useState<string | null>(null);

  const [reloadToken, setReloadToken] = useState(0);
  const refetch = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  const { workers: careWorkers } = useCareWorkers();
  const { holidayDates } = useHolidays(year);
  const [consultationVisits, setConsultationVisits] = useState<
    ConsultationVisitDto[]
  >([]);

  const { items, loading: listLoading, updateItemCounts } =
    useScheduleAssignmentList(year, month, showAllActive);
  const { data, yearMonthCounts: baseCounts, loading, refreshing, error } =
    useScheduleAssignmentMonth(recipientId, year, month, view, reloadToken);

  useEffect(() => {
    let cancelled = false;
    fetchConsultationVisits({ year, month, recipientId })
      .then((list) => {
        if (!cancelled) setConsultationVisits(list);
      })
      .catch(() => {
        if (!cancelled) setConsultationVisits([]);
      });
    return () => {
      cancelled = true;
    };
  }, [recipientId, year, month, reloadToken]);

  const workerIdForAssign =
    assignMode && formData?.careWorkerId ? formData.careWorkerId : null;
  const { entries: workerPlanSchedules } = useWorkerPlanSchedules(
    workerIdForAssign,
    year,
    month,
    assignMode && view === "plan",
    reloadToken,
  );

  const {
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
  } = useScheduleEditor(data, baseCounts, year, month, view, recipientId, {
    onRefetch: refetch,
    workerPlanSchedules,
    holidayDates,
  });

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
  const defaultSplit = monthStart;
  const fallbackGrade =
    parseInt(data?.recipient?.gradeText.match(/^(\d)/)?.[1] ?? "3", 10) || 3;

  // 수급자 전환 시에만 폼·배정 모드 초기화 (월 데이터 refetch 로는 리셋하지 않음)
  useEffect(() => {
    if (!data?.recipient || String(data.recipient.id) !== String(recipientId)) {
      return;
    }
    setFormData(defaultAddForm(data.recipient));
    resetEditor();
    setShowAddForm(false);
    setAssignMode(false);
    setShowBulkDelete(false);
    setMemoOpen(false);
  }, [recipientId, data?.recipient?.id, resetEditor]);

  const reloadMemoCount = useCallback(async () => {
    try {
      const list = await fetchRecipientMemos(recipientId);
      setMemoCount(list.length);
    } catch {
      setMemoCount(0);
    }
  }, [recipientId]);

  useEffect(() => {
    reloadMemoCount();
  }, [reloadMemoCount]);

  // 월 일정 로드/변경 후 왼쪽 목록 — 현재 view(kind) 건수만 갱신
  useEffect(() => {
    if (!data || String(data.recipient.id) !== String(recipientId)) return;
    const count = schedules.filter((s) => s.scheduleKind === view).length;
    updateItemCounts(
      recipientId,
      view === "plan" ? { planCount: count } : { claimCount: count },
    );
  }, [data, schedules, recipientId, view, updateItemCounts]);

  const handleRowClick = (rowKey: string) => {
    if (hlTimerRef.current) clearTimeout(hlTimerRef.current);
    setHighlightedRowKey(rowKey);
    hlTimerRef.current = setTimeout(() => setHighlightedRowKey(null), 5000);
  };

  useEffect(() => {
    return () => {
      if (hlTimerRef.current) clearTimeout(hlTimerRef.current);
    };
  }, []);

  const closeAddForm = () => {
    setShowAddForm(false);
    setAssignMode(false);
    setBatchType("");
  };

  const openAddFormFromSummaryRow = useCallback(
    (row: ScheduleSummaryRow) => {
      setFormData((prev) =>
        prev ? applySummaryRowToAddForm(prev, row) : prev,
      );
      setAssignMode(false);
      setBatchType("");
      setShowBulkDelete(false);
      setShowAddForm(true);
    },
    [],
  );

  const handleFormChange = (
    updater: (prev: ScheduleAddFormData) => ScheduleAddFormData,
  ) => {
    if (assignMode) {
      setAssignMode(false);
      setBatchType("");
    }
    setFormData((prev) => (prev ? updater(prev) : prev));
  };

  const handleStartAssign = () => {
    setView("plan");
    setAssignMode(true);
    setBatchType("");
    setCardPopover(null);
  };

  useEffect(() => {
    setCardPopover(null);
  }, [view]);

  useEffect(() => {
    if (assignMode) setCardPopover(null);
  }, [assignMode]);

  const handleRunBatch = async (
    type: BatchAssignType,
    selectedDays: Set<number>,
  ): Promise<boolean> => {
    if (!formData || !data?.recipient) return false;

    if (!type) {
      window.alert("일괄 배정 방식을 선택하세요.");
      return false;
    }

    if (formData.serviceType !== "day_care" && !formData.careWorkerId) {
      window.alert("요양보호사를 선택하세요.");
      return false;
    }

    if (formData.serviceType === "visit_bath" && !formData.careWorkerId2) {
      window.alert("방문목욕은 요양보호사 2명을 선택해야 합니다.");
      return false;
    }

    if (formData.serviceType === "family_care" && !formData.familyRelation) {
      window.alert("가족관계를 선택하세요.");
      return false;
    }

    const duration = computeDurationMinutes(
      formData.startHour,
      formData.startMin,
      formData.endHour,
      formData.endMin,
    );
    const validationError = validateScheduleForm(formData, duration);
    if (validationError) {
      window.alert(validationError);
      return false;
    }

    const opts =
      type === "all_month"
        ? {}
        : type === "weekday_only"
          ? { allowedDows: new Set([1, 2, 3, 4, 5]), excludeHoliday: true }
          : type === "no_holiday_only"
            ? { excludeHoliday: true }
            : type === "no_weekend"
              ? { allowedDows: new Set([1, 2, 3, 4, 5]) }
              : type === "specific_day"
                ? { allowedDows: selectedDays }
                : {};

    try {
      const count = await runBatchAssign(formData, opts);
      if (count === 0) {
        window.alert("배정할 날짜가 없습니다. (겹치는 일정·이미 배정된 날·요일/공휴일 필터 확인)");
        return false;
      }
      window.alert(`${count}건 일괄 배정 완료`);
      return true;
    } catch {
      window.alert("일괄 배정 저장에 실패했습니다.");
      return false;
    }
  };

  const handleCalendarDayClick = async (dateStr: string) => {
    if (!assignMode || !formData || !data?.recipient || saving) return;
    const result = await assignToDate(dateStr, formData);
    if (!result.ok) window.alert(result.reason);
  };

  const handleBulkDelete = async (types: Set<string>) => {
    try {
      await bulkDeletePlanByTypes(types);
    } catch {
      window.alert("삭제에 실패했습니다.");
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await deleteScheduleById(scheduleId);
    } catch {
      window.alert("일정 삭제에 실패했습니다.");
    }
  };

  const handleCardClick = (
    schedule: ScheduleAssignmentEntry,
    e: React.MouseEvent,
  ) => {
    if (assignMode) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pw = 520;
    const ph = 140;
    let x =
      rect.right + 6 + pw > window.innerWidth
        ? rect.left - pw - 6
        : rect.right + 6;
    x = Math.max(4, Math.min(x, window.innerWidth - pw - 4));
    const y = Math.max(4, Math.min(rect.top, window.innerHeight - ph));
    setCardPopover({ schedule, x, y });
  };

  const handleApplyGradeChange = async () => {
    try {
      await applyPeriodChange(
        gradeForm.split,
        "grade",
        gradeForm.before,
        gradeForm.after,
        fallbackGrade,
        data!.recipient.reduction,
      );
      setGradeModalOpen(false);
    } catch {
      window.alert("등급 변경 저장에 실패했습니다.");
    }
  };

  const handleApplyReductionChange = async () => {
    try {
      await applyPeriodChange(
        reductionForm.split,
        "reduction",
        reductionForm.before,
        reductionForm.after,
        fallbackGrade,
        data!.recipient.reduction,
      );
      setReductionModalOpen(false);
    } catch {
      window.alert("감경구분 변경 저장에 실패했습니다.");
    }
  };

  const reductionOptions = [
    { value: "일반", label: "일반", sub: "15%" },
    { value: "감경9%", label: "9%", sub: "감경" },
    { value: "감경6%", label: "6%", sub: "감경" },
    { value: "기초", label: "기초", sub: "0%" },
  ];

  const detailLoading = loading && !data;
  const detailError = error || (!detailLoading && (!data || !formData || !paymentStatus));

  return (
    <div
      style={{
        height: "100%",
        overflow: "hidden",
        display: "flex",
        background: "#ffffff",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "relative",
          flexShrink: 0,
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <RecipientListPanel
          year={year}
          month={month}
          selectedId={recipientId}
          items={items}
          loading={listLoading}
          showAllActive={showAllActive}
          onToggleShowAllActive={() => setShowAllActive((v) => !v)}
          onSelect={navigateRecipient}
          view={view}
        />

        {showAddForm && data && formData && (
          <>
            {!assignMode && (
              <div
                onClick={closeAddForm}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: 258,
                  zIndex: 40,
                  background: "rgba(10, 25, 50, 0.18)",
                }}
              />
            )}
            <ScheduleAddPanel
              recipient={data.recipient}
              form={formData}
              assignMode={assignMode}
              batchType={batchType}
              schedules={schedules}
              careWorkers={careWorkers}
              onFormChange={handleFormChange}
              onClose={closeAddForm}
              onStartAssign={handleStartAssign}
              onCancelAssign={() => {
                setAssignMode(false);
                setBatchType("");
              }}
              onBatchTypeChange={setBatchType}
              onRunBatch={handleRunBatch}
              onViewWorkerSchedule={setSchedViewWorker}
            />
          </>
        )}
      </div>

      {detailLoading ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "#94a3b8",
          }}
        >
          불러오는 중…
        </div>
      ) : detailError ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "#94a3b8",
          }}
        >
          {error ?? "수급자를 찾을 수 없습니다."}
        </div>
      ) : data && formData && paymentStatus ? (
        <>
      <RecipientInfoSidebar
        recipient={data.recipient}
        paymentStatus={paymentStatus}
        view={view}
        schedules={schedules}
        careWorkers={careWorkers}
        onViewWorkerSchedule={setSchedViewWorker}
        addFormSlot={
          view !== "claim" && !showAddForm ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 4,
                  paddingBottom: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    const cur = String(fallbackGrade);
                    setGradeForm({
                      split: defaultSplit,
                      before: cur,
                      after: cur,
                      reason: "",
                    });
                    setGradeModalOpen(true);
                  }}
                  style={secondaryActionBtn}
                >
                  <Award size={12} color="#2563eb" /> 등급변경
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cur = data.recipient.reduction;
                    setReductionForm({
                      split: defaultSplit,
                      before: cur,
                      after: cur,
                      reason: "",
                    });
                    setReductionModalOpen(true);
                  }}
                  style={secondaryActionBtn}
                >
                  <Percent size={12} color="#d97706" /> 감경구분변경
                </button>
              </div>
              {(() => {
                const gSegs = deriveGradeSegments(
                  schedules,
                  view,
                  fallbackGrade,
                  data.recipient.reduction,
                );
                const rSegs = deriveReductionSegments(
                  schedules,
                  view,
                  fallbackGrade,
                  data.recipient.reduction,
                );
                if (gSegs.length === 0 && rSegs.length === 0) return null;
                return (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 4,
                      paddingBottom: 4,
                    }}
                  >
                    {gSegs.map((s, i) => (
                      <span
                        key={`g${i}`}
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 4,
                          background: "#dbeafe",
                          color: "#1d4ed8",
                          fontWeight: 600,
                        }}
                      >
                        {fmtMd(s.from)}~{fmtMd(s.to)} {s.value}등급
                      </span>
                    ))}
                    {rSegs.map((s, i) => (
                      <span
                        key={`r${i}`}
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 4,
                          background: "#fff7ed",
                          color: "#c2410c",
                          fontWeight: 600,
                        }}
                      >
                        {fmtMd(s.from)}~{fmtMd(s.to)} {s.value}
                      </span>
                    ))}
                  </div>
                );
              })()}
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(true);
                  setShowBulkDelete(false);
                  setAssignMode(false);
                  setBatchType("");
                  const monthWorkerIds = deriveMonthAssignedWorkerIds(
                    schedules,
                    "plan",
                  );
                  const firstWorker =
                    monthWorkerIds[0] ??
                    data.recipient.assignedCareWorkerIds[0] ??
                    careWorkers[0]?.id;
                  if (firstWorker && formData && !formData.careWorkerId) {
                    setFormData((f) =>
                      f ? { ...f, careWorkerId: firstWorker } : f,
                    );
                  }
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  padding: "7px 12px",
                  fontSize: 11,
                  borderRadius: 7,
                  fontWeight: 700,
                  backgroundImage: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  border: "none",
                  color: "#ffffff",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                }}
              >
                <Plus size={11} />
                일정추가
              </button>
              <BulkDeleteToggle
                open={showBulkDelete}
                onToggle={() => {
                  setShowBulkDelete((v) => !v);
                  setShowAddForm(false);
                }}
              />
              {showBulkDelete && (
                <BulkDeletePanel
                  schedules={schedules}
                  onDelete={handleBulkDelete}
                  onClose={() => setShowBulkDelete(false)}
                />
              )}
            </>
          ) : null
        }
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <RecipientCalendarHeader
          year={year}
          month={month}
          view={view}
          yearMonthCounts={yearMonthCounts}
          assignMode={assignMode}
          statusLabel={
            saving ? "저장 중…" : refreshing ? "동기화 중…" : undefined
          }
          memoOpen={memoOpen}
          memoCount={memoCount}
          onMemoToggle={() => setMemoOpen((v) => !v)}
          onYearChange={setYear}
          onMonthChange={setMonth}
          onViewChange={setView}
        />

        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <RecipientMonthlyCalendar
            year={year}
            month={month}
            view={view}
            schedules={schedules}
            highlightedRowKey={highlightedRowKey}
            onHighlight={setHighlightedRowKey}
            recipientGrade={fallbackGrade}
            recipientReduction={data.recipient.reduction}
            assignMode={assignMode}
            formData={assignMode ? formData : null}
            canAssignDate={(dateStr) =>
              formData
                ? canAssignDate(
                    schedules,
                    dateStr,
                    formData,
                    recipientId,
                    workerPlanSchedules,
                  )
                : false
            }
            workerPlanSchedules={workerPlanSchedules}
            recipientId={recipientId}
            onAssignDay={handleCalendarDayClick}
            onDeleteSchedule={view === "plan" ? handleDeleteSchedule : undefined}
            onCardClick={handleCardClick}
            selectedScheduleId={cardPopover?.schedule.id ?? null}
            holidayDates={holidayDates}
            consultationVisits={consultationVisits}
          />
          <RecipientScheduleSummaryTable
            schedules={schedules}
            view={view}
            highlightedRowKey={highlightedRowKey}
            onRowClick={handleRowClick}
            onAddFromRow={
              view === "plan" ? openAddFormFromSummaryRow : undefined
            }
          />
        </div>
      </div>

      <RecipientMemoPanel
        recipientId={recipientId}
        recipientName={data.recipient.name}
        open={memoOpen}
        onClose={() => setMemoOpen(false)}
        onCountChange={setMemoCount}
      />

      {cardPopover && (
        <ScheduleCardPopover
          recipientName={data.recipient.name}
          schedule={
            schedules.find((s) => s.id === cardPopover.schedule.id) ??
            cardPopover.schedule
          }
          position={{ x: cardPopover.x, y: cardPopover.y }}
          holidayDates={holidayDates}
          onClose={() => setCardPopover(null)}
          onSaveFee={async (id, unitCost, surchargeAmount) => {
            try {
              await updateScheduleFee(id, unitCost, surchargeAmount);
              setCardPopover(null);
            } catch {
              window.alert("수가 저장에 실패했습니다.");
            }
          }}
        />
      )}

      {gradeModalOpen && (
        <PeriodChangeModal
          icon={<Award size={13} color="#93c5fd" />}
          title="등급 변경"
          recipientName={data.recipient.name}
          monthLabel={`${year}년 ${month}월`}
          monthStart={monthStart}
          monthEnd={monthEnd}
          splitDate={gradeForm.split}
          onSplitChange={(v) => setGradeForm((f) => ({ ...f, split: v }))}
          options={[1, 2, 3, 4, 5].map((g) => ({
            value: String(g),
            label: `${g}등급`,
          }))}
          beforeValue={gradeForm.before}
          onBeforeChange={(v) => setGradeForm((f) => ({ ...f, before: v }))}
          afterValue={gradeForm.after}
          onAfterChange={(v) => setGradeForm((f) => ({ ...f, after: v }))}
          reason={gradeForm.reason}
          onReasonChange={(v) => setGradeForm((f) => ({ ...f, reason: v }))}
          accent="#2563eb"
          onClose={() => setGradeModalOpen(false)}
          onSave={handleApplyGradeChange}
        />
      )}

      {reductionModalOpen && (
        <PeriodChangeModal
          icon={<Percent size={13} color="#fdba74" />}
          title="감경구분 변경"
          recipientName={data.recipient.name}
          monthLabel={`${year}년 ${month}월`}
          monthStart={monthStart}
          monthEnd={monthEnd}
          splitDate={reductionForm.split}
          onSplitChange={(v) => setReductionForm((f) => ({ ...f, split: v }))}
          options={reductionOptions}
          beforeValue={reductionForm.before}
          onBeforeChange={(v) =>
            setReductionForm((f) => ({ ...f, before: v }))
          }
          afterValue={reductionForm.after}
          onAfterChange={(v) => setReductionForm((f) => ({ ...f, after: v }))}
          reason={reductionForm.reason}
          onReasonChange={(v) =>
            setReductionForm((f) => ({ ...f, reason: v }))
          }
          accent="#d97706"
          onClose={() => setReductionModalOpen(false)}
          onSave={handleApplyReductionChange}
        />
      )}

      {schedViewWorker && (
        <WorkerScheduleModal
          workerId={schedViewWorker}
          careWorkers={careWorkers}
          initYear={year}
          initMonth={month}
          todayStr={new Date().toISOString().slice(0, 10)}
          onClose={() => setSchedViewWorker(null)}
        />
      )}
        </>
      ) : null}
    </div>
  );
}

const secondaryActionBtn = {
  padding: "5px 4px",
  fontSize: 11,
  borderRadius: 6,
  border: "1px solid #e2e8f0",
  backgroundColor: "#ffffff",
  color: "#64748b",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
} as const;
