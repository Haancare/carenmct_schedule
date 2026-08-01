"use client";

import { Lock, X, Zap } from "lucide-react";

import type { ScheduleAssignmentEntry } from "@/lib/api/scheduleAssignment.types";
import type { ScheduleAddFormData } from "@/lib/api/scheduleAssignment.types";
import { getCareWorkerName } from "@/lib/api/careWorkers";
import type { WorkerScheduleEntry } from "@/lib/api/scheduleAssignment";
import type { ConsultationVisitDto } from "@/lib/api/consultation.types";
import {
  copayLabel,
  copayStyle,
} from "@/features/payment-assignment/utils/recipientDisplay";

import { DAY_LABELS, SERVICE_LABELS, SVC_STYLE } from "../constants";
import { getCalendarWeeks, toDateStr } from "../utils/calendar";
import { scheduleCardKey } from "../utils/buildScheduleSummary";
import { getHolidayName } from "@/lib/api/holidays";
import { hasAssignConflict, isHolidayDate } from "../utils/scheduleEditor";
import {
  getScheduleSelectionFrame,
  selectionDoubleBorderStyle,
} from "../utils/scheduleSelectionFrame";

type Props = {
  year: number;
  month: number;
  view: "plan" | "claim";
  schedules: ScheduleAssignmentEntry[];
  highlightedRowKey: string | null;
  onHighlight: (key: string | null) => void;
  recipientGrade?: number;
  recipientReduction?: string;
  assignMode?: boolean;
  formData?: ScheduleAddFormData | null;
  canAssignDate?: (dateStr: string) => boolean;
  onAssignDay?: (dateStr: string) => void;
  onDeleteSchedule?: (scheduleId: string) => void;
  workerPlanSchedules?: WorkerScheduleEntry[];
  recipientId?: string;
  onCardClick?: (
    schedule: ScheduleAssignmentEntry,
    e: React.MouseEvent,
  ) => void;
  selectedScheduleId?: string | null;
  holidayDates?: ReadonlySet<string>;
  consultationVisits?: ConsultationVisitDto[];
};

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function RecipientMonthlyCalendar({
  year,
  month,
  view,
  schedules,
  highlightedRowKey,
  onHighlight,
  recipientGrade = 3,
  recipientReduction = "일반",
  assignMode = false,
  formData = null,
  canAssignDate,
  onAssignDay,
  onDeleteSchedule,
  workerPlanSchedules = [],
  recipientId = "",
  onCardClick,
  selectedScheduleId = null,
  holidayDates = new Set<string>(),
  consultationVisits = [],
}: Props) {
  const weeks = getCalendarWeeks(year, month);
  const filtered = schedules.filter((s) => s.scheduleKind === view);
  const todayStr = todayDateStr();

  const getDaySchedules = (day: Date | null) => {
    if (!day) return [];
    const dStr = toDateStr(day);
    return filtered.filter((s) => s.date === dStr);
  };

  const getDayConsults = (day: Date | null) => {
    if (!day) return [];
    const dStr = toDateStr(day);
    return consultationVisits.filter((v) => v.date === dStr);
  };

  const getAssignConflict = (dateStr: string) => {
    if (!assignMode || !formData) return false;
    const startTime = `${formData.startHour}:${formData.startMin}`;
    const endTime = `${formData.endHour}:${formData.endMin}`;
    return hasAssignConflict(
      schedules,
      workerPlanSchedules,
      recipientId,
      dateStr,
      startTime,
      endTime,
      formData.serviceType,
    );
  };

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          borderBottom: "1px solid #e4eaf3",
          height: 26,
          background: "#f8fafc",
        }}
      >
        {DAY_LABELS.map((label, idx) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 600,
              borderRight: idx < 6 ? "1px solid #e4eaf3" : "none",
              color:
                idx === 0 ? "#dc2626" : idx === 6 ? "#2563eb" : "#64748b",
            }}
          >
            {label}요일
          </div>
        ))}
      </div>

      <div>
        {weeks.map((week, weekIdx) => (
          <div
            key={weekIdx}
            style={{
              display: "flex",
              minHeight: 62,
              borderBottom:
                weekIdx < weeks.length - 1 ? "1px solid #e4eaf3" : "none",
            }}
          >
            {week.map((day, dayIdx) => {
              const dayScheds = getDaySchedules(day);
              const dateStr = day ? toDateStr(day) : "";
              const isToday = dateStr === todayStr;
              const isSun = dayIdx === 0;
              const isSat = dayIdx === 6;
              const isHol = !!day && isHolidayDate(dateStr, holidayDates);
              const isRedDay = isSun || isHol;
              const holidayName = isHol ? getHolidayName(year, dateStr) : undefined;

              const hasDuplicate =
                assignMode && !!day && !!dateStr && getAssignConflict(dateStr);
              const isAssignable =
                assignMode && !!day && !!dateStr && !hasDuplicate;

              const cellBg = !day
                ? "#f8fafc"
                : assignMode
                  ? hasDuplicate
                    ? "#fee2e2"
                    : "#f0fdf4"
                  : isRedDay
                    ? "rgba(254,242,242,0.4)"
                    : isSat
                      ? "rgba(239,246,255,0.4)"
                      : "#ffffff";

              return (
                <div
                  key={dayIdx}
                  onClick={() => {
                    if (
                      isAssignable &&
                      (canAssignDate?.(dateStr) ?? true) &&
                      onAssignDay
                    ) {
                      onAssignDay(dateStr);
                    }
                  }}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    borderRight: dayIdx < 6 ? "1px solid #e4eaf3" : "none",
                    borderLeft:
                      assignMode && day
                        ? hasDuplicate
                          ? "3px solid #fca5a5"
                          : isAssignable
                            ? "3px solid #10b981"
                            : "none"
                        : "none",
                    backgroundColor: cellBg,
                    cursor: day
                      ? assignMode
                        ? hasDuplicate
                          ? "not-allowed"
                          : "cell"
                        : "default"
                      : "default",
                    boxShadow: assignMode && isAssignable
                      ? "inset 0 0 0 1px rgba(16,185,129,0.28), inset 2px 0 6px rgba(16,185,129,0.08)"
                      : assignMode && hasDuplicate
                        ? "inset 0 0 0 1px rgba(248,113,113,0.25)"
                        : "none",
                    transition: "box-shadow 0.12s ease, background 0.12s ease",
                  }}
                >
                  {day && (
                    <>
                      <div
                        style={{
                          flexShrink: 0,
                          padding: "2px 3px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 2,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: 17,
                              height: 17,
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "50%",
                              fontSize: 11,
                              background:
                                assignMode && isAssignable
                                  ? isToday
                                    ? "#059669"
                                    : "transparent"
                                  : isToday
                                    ? "#2563eb"
                                    : "transparent",
                              color:
                                assignMode && isAssignable
                                  ? isToday
                                    ? "#ffffff"
                                    : "#047857"
                                  : assignMode && hasDuplicate
                                    ? "#ef4444"
                                    : isToday
                                      ? "#ffffff"
                                      : isRedDay
                                        ? "#dc2626"
                                        : isSat
                                          ? "#2563eb"
                                          : "#475569",
                              fontWeight: isToday ? 700 : assignMode ? 600 : 400,
                            }}
                          >
                            {day.getDate()}
                          </div>
                          {holidayName ? (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 600,
                                color: "#dc2626",
                                lineHeight: 1.1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              {holidayName}
                            </span>
                          ) : null}
                        </div>

                        {assignMode ? (
                          hasDuplicate ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 1,
                                flexShrink: 0,
                                fontSize: 8,
                                padding: "1px 3px",
                                borderRadius: 3,
                                fontWeight: 700,
                                background: "#fee2e2",
                                color: "#dc2626",
                                border: "1px solid #fca5a5",
                                lineHeight: 1,
                              }}
                            >
                              <Lock size={6} strokeWidth={2.5} />
                              불가
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 1,
                                flexShrink: 0,
                                fontSize: 8,
                                padding: "1px 3px",
                                borderRadius: 3,
                                fontWeight: 700,
                                background: "#dcfce7",
                                color: "#15803d",
                                border: "1px solid #6ee7b7",
                                lineHeight: 1,
                              }}
                            >
                              <Zap size={6} strokeWidth={2.5} />
                              가능
                            </span>
                          )
                        ) : null}
                      </div>

                      {assignMode && isAssignable && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: 3,
                            left: "50%",
                            transform: "translateX(-50%)",
                            fontSize: 8,
                            color: "#059669",
                            fontWeight: 700,
                            opacity: 0.55,
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                          }}
                        >
                          + 클릭 배정
                        </div>
                      )}

                      <div
                        style={{
                          padding: "0 2px 3px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        {dayScheds.map((s) => {
                          const c =
                            SVC_STYLE[s.serviceType] ?? SVC_STYLE.visit_care;
                          const cardKey = scheduleCardKey(s);
                          const isHL = highlightedRowKey === cardKey;
                          const isSelected = selectedScheduleId === s.id;
                          const workerName = getCareWorkerName(s.careWorkerId);
                          const displayGrade = s.grade ?? recipientGrade;
                          const displayType = s.reduction ?? recipientReduction;
                          const cs = copayStyle(displayType);
                          const kindBorder =
                            s.scheduleKind === "claim" ? "#16a34a" : "#2563eb";
                          const selectionFrame = getScheduleSelectionFrame(
                            s.scheduleKind,
                          );

                          return (
                            <div
                              key={s.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onCardClick) {
                                  onCardClick(s, e);
                                  return;
                                }
                                onHighlight(isHL ? null : cardKey);
                              }}
                              style={{
                                borderRadius: 3,
                                padding: "2px 3px",
                                cursor: "pointer",
                                position: "relative",
                                zIndex: isSelected ? 10 : isHL ? 5 : undefined,
                                ...(isSelected
                                  ? selectionDoubleBorderStyle(selectionFrame, {
                                      borderRadius: 3,
                                      surface: "card",
                                    })
                                  : {
                                      background: isHL ? "#fef9c3" : c.bg,
                                      borderTop: `1px solid ${isHL ? "#f59e0b" : c.border}`,
                                      borderRight: `1px solid ${isHL ? "#f59e0b" : c.border}`,
                                      borderBottom: `1px solid ${isHL ? "#f59e0b" : c.border}`,
                                      borderLeft: `2px solid ${isHL ? "#f59e0b" : kindBorder}`,
                                    }),
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 2,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 13,
                                    color: "#0f172a",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                    minWidth: 0,
                                    fontWeight: 600,
                                  }}
                                >
                                  {SERVICE_LABELS[s.serviceType] ??
                                    s.serviceType}{" "}
                                  {s.durationMinutes}분
                                  {s.feeEdited && (
                                    <span
                                      style={{
                                        fontSize: 8,
                                        fontWeight: 700,
                                        padding: "1px 3px",
                                        borderRadius: 2,
                                        background: "#fffbeb",
                                        color: "#d97706",
                                        border: "1px solid #fde68a",
                                        marginLeft: 3,
                                        verticalAlign: "middle",
                                      }}
                                    >
                                      급여수정
                                    </span>
                                  )}
                                </span>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    flexShrink: 0,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 9,
                                      fontWeight: 700,
                                      lineHeight: 1,
                                      padding: "1px 3px",
                                      borderRadius: 2,
                                      background:
                                        s.scheduleKind === "claim"
                                          ? "#dcfce7"
                                          : "#dbeafe",
                                      color:
                                        s.scheduleKind === "claim"
                                          ? "#15803d"
                                          : "#1d4ed8",
                                      border: `1px solid ${s.scheduleKind === "claim" ? "#86efac" : "#93c5fd"}`,
                                    }}
                                  >
                                    {s.scheduleKind === "claim" ? "청" : "계"}
                                  </span>
                                  {view === "plan" && onDeleteSchedule && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteSchedule(s.id);
                                      }}
                                      style={{
                                        width: 13,
                                        height: 13,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: "rgba(220,38,38,0.1)",
                                        border: "1px solid rgba(220,38,38,0.3)",
                                        borderRadius: 2,
                                        cursor: "pointer",
                                        padding: 0,
                                      }}
                                      title="삭제"
                                    >
                                      <X size={7} color="#dc2626" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div
                                style={{
                                  fontSize: 13,
                                  color: "#0f172a",
                                  opacity: 0.75,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {s.startTime}~{s.endTime}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  overflow: "hidden",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 13,
                                    color: "#0f172a",
                                    opacity: 0.6,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                    minWidth: 0,
                                  }}
                                >
                                  {workerName}
                                </span>
                                <span
                                  style={{
                                    display: "flex",
                                    gap: 2,
                                    flexShrink: 0,
                                    alignItems: "center",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 9,
                                      padding: "0px 3px",
                                      borderRadius: 2,
                                      fontWeight: 700,
                                      lineHeight: 1.6,
                                      background: "#dbeafe",
                                      color: "#1d4ed8",
                                      border: "1px solid #bfdbfe",
                                    }}
                                  >
                                    {displayGrade}등
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 9,
                                      padding: "0px 3px",
                                      borderRadius: 2,
                                      fontWeight: 700,
                                      lineHeight: 1.6,
                                      background: cs.bg,
                                      color: cs.color,
                                      border: `1px solid ${cs.border}`,
                                    }}
                                  >
                                    {copayLabel(displayType)}
                                  </span>
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* 방문상담 카드 (피그마 RecipientDetail과 동일) */}
                        {getDayConsults(day).map((consult) => {
                          const startTime = consult.plannedStartTime || "";
                          const endTime = consult.plannedEndTime || "";
                          const [startH, startM] = startTime
                            .split(":")
                            .map(Number);
                          const [endH, endM] = (endTime || "00:00")
                            .split(":")
                            .map(Number);
                          const durationMin =
                            Number.isFinite(startH) &&
                            Number.isFinite(startM) &&
                            Number.isFinite(endH) &&
                            Number.isFinite(endM) &&
                            endTime
                              ? endH * 60 + endM - (startH * 60 + startM)
                              : 0;
                          const isDone = consult.consultStatus === "completed";
                          const isUnable = consult.consultStatus === "unable";
                          const badgeLabel = isDone
                            ? "완"
                            : isUnable
                              ? "불"
                              : "예";
                          const workerName =
                            consult.employeeName ||
                            getCareWorkerName(consult.employeeId);
                          return (
                            <div
                              key={`consult-${consult.id}`}
                              style={{
                                borderRadius: 3,
                                padding: "2px 3px",
                                background: "transparent",
                                borderTop: "1px dashed #d8b4fe",
                                borderRight: "1px dashed #d8b4fe",
                                borderBottom: "1px dashed #d8b4fe",
                                borderLeft: `2px solid ${isDone ? "#a855f7" : isUnable ? "#e879f9" : "#c084fc"}`,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 2,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 13,
                                    color: "#0f172a",
                                    fontWeight: 600,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                    minWidth: 0,
                                  }}
                                >
                                  {durationMin > 0
                                    ? `방문상담 ${durationMin}분`
                                    : "방문상담"}
                                </span>
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    lineHeight: 1,
                                    padding: "1px 3px",
                                    borderRadius: 2,
                                    flexShrink: 0,
                                    background: isDone
                                      ? "#f3e8ff"
                                      : isUnable
                                        ? "#fdf4ff"
                                        : "#faf5ff",
                                    color: isDone
                                      ? "#7e22ce"
                                      : isUnable
                                        ? "#a21caf"
                                        : "#9333ea",
                                    border: "1px solid #d8b4fe",
                                  }}
                                >
                                  {badgeLabel}
                                </span>
                              </div>
                              {(startTime || endTime) && (
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: "#0f172a",
                                    opacity: 0.75,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {startTime}
                                  {endTime ? `~${endTime}` : ""}
                                </div>
                              )}
                              <div
                                style={{
                                  fontSize: 13,
                                  color: "#581c87",
                                  opacity: 0.8,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {workerName}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
