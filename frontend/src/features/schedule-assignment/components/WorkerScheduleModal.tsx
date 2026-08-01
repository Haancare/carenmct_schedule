"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { CareWorkerDto } from "@/lib/api/paymentAssignment.types";
import { getCareWorkerBirth } from "@/lib/api/careWorkers";
import {
  fetchWorkerMonthSchedules,
  type WorkerScheduleEntry,
} from "@/lib/api/scheduleAssignment";

import { getHolidayName } from "@/lib/api/holidays";

import { SERVICE_LABELS, SVC_STYLE, type PlanClaimView } from "../constants";
import { useHolidays } from "../hooks/useHolidays";
import { getCalendarWeeks, toDateStr } from "../utils/calendar";
import { isHolidayDate } from "../utils/scheduleEditor";

type Props = {
  workerId: string;
  careWorkers: CareWorkerDto[];
  initYear: number;
  initMonth: number;
  todayStr: string;
  onClose: () => void;
};

export default function WorkerScheduleModal({
  workerId,
  careWorkers,
  initYear,
  initMonth,
  todayStr,
  onClose,
}: Props) {
  const [yr, setYr] = useState(initYear);
  const [mo, setMo] = useState(initMonth);
  const [viewKind, setViewKind] = useState<PlanClaimView>("plan");
  const [entries, setEntries] = useState<WorkerScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { holidayDates } = useHolidays(yr);

  const worker = careWorkers.find((w) => w.id === workerId);
  const birth = worker?.birth?.trim() || getCareWorkerBirth(workerId) || "-";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchWorkerMonthSchedules(workerId, yr, mo, viewKind);
      setEntries(list);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [workerId, yr, mo, viewKind]);

  useEffect(() => {
    load();
  }, [load]);

  if (!worker) return null;

  const byDate = new Map<string, WorkerScheduleEntry[]>();
  entries.forEach((s) => {
    const arr = byDate.get(s.serviceDate) ?? [];
    arr.push(s);
    byDate.set(s.serviceDate, arr);
  });

  const calWeeks = getCalendarWeeks(yr, mo);
  const prevM = () => {
    if (mo === 1) {
      setYr((y) => y - 1);
      setMo(12);
    } else setMo((m) => m - 1);
  };
  const nextM = () => {
    if (mo === 12) {
      setYr((y) => y + 1);
      setMo(1);
    } else setMo((m) => m + 1);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          width: "min(94vw,1100px)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: "linear-gradient(90deg,#0f2744,#1a3a5c)",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
            {worker.name}
          </span>
          <span style={{ color: "#94a3b8", fontSize: 12 }}>{birth}</span>
          <span style={{ color: "#cbd5e1", fontSize: 11 }}>방문일정 조회</span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(0,0,0,0.25)",
              borderRadius: 6,
              padding: 2,
              gap: 1,
              marginLeft: 8,
            }}
          >
            {(
              [
                ["plan", "계획보기", "#2563eb"],
                ["claim", "청구보기", "#059669"],
              ] as const
            ).map(([key, label, col]) => {
              const on = viewKind === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setViewKind(key)}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 4,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: on ? 700 : 400,
                    whiteSpace: "nowrap",
                    backgroundImage: on
                      ? `linear-gradient(135deg,${col},${col}cc)`
                      : "none",
                    backgroundColor: "transparent",
                    color: on ? "#fff" : "rgba(196,181,253,0.6)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <button
              type="button"
              onClick={prevM}
              style={{
                width: 22,
                height: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #1e3d62",
                borderRadius: 4,
                background: "#1c3a60",
                cursor: "pointer",
              }}
            >
              <ChevronLeft size={12} color="#fff" />
            </button>
            <span
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                minWidth: 80,
                textAlign: "center",
              }}
            >
              {yr}년 {mo}월
            </span>
            <button
              type="button"
              onClick={nextM}
              style={{
                width: 22,
                height: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #1e3d62",
                borderRadius: 4,
                background: "#1c3a60",
                cursor: "pointer",
              }}
            >
              <ChevronRight size={12} color="#fff" />
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              marginLeft: 8,
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {loading && (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                fontSize: 12,
                color: "#94a3b8",
              }}
            >
              불러오는 중…
            </div>
          )}
          {!loading && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7,1fr)",
                  borderBottom: "2px solid #e2e8f0",
                  flexShrink: 0,
                }}
              >
                {[
                  "일요일",
                  "월요일",
                  "화요일",
                  "수요일",
                  "목요일",
                  "금요일",
                  "토요일",
                ].map((d, i) => (
                  <div
                    key={d}
                    style={{
                      textAlign: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "8px 0",
                      color:
                        i === 0 ? "#dc2626" : i === 6 ? "#2563eb" : "#475569",
                      borderRight: i < 6 ? "1px solid #e4eaf3" : "none",
                      background: "#f8fafc",
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>
              {calWeeks.map((week, wi) => (
                <div
                  key={wi}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7,1fr)",
                    borderBottom: "1px solid #e4eaf3",
                    minHeight: 100,
                    flex: 1,
                  }}
                >
                  {week.map((day, di) => {
                    if (!day) {
                      return (
                        <div
                          key={di}
                          style={{
                            background: "#f8fafc",
                            borderRight:
                              di < 6 ? "1px solid #e4eaf3" : "none",
                          }}
                        />
                      );
                    }
                    const dateStr = toDateStr(day);
                    const dayEntries = byDate.get(dateStr) ?? [];
                    const isSun = di === 0;
                    const isSat = di === 6;
                    const isToday = dateStr === todayStr;
                    const isHol = isHolidayDate(dateStr, holidayDates);
                    const isRedDay = isSun || isHol;
                    const holidayName = isHol
                      ? getHolidayName(yr, dateStr)
                      : undefined;
                    return (
                      <div
                        key={di}
                        style={{
                          padding: "5px 6px",
                          background: "#fff",
                          borderRight:
                            di < 6 ? "1px solid #e4eaf3" : "none",
                          minHeight: 100,
                        }}
                      >
                        <div
                          style={{
                            marginBottom: 5,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              fontSize: 12,
                              fontWeight: isToday ? 700 : 400,
                              flexShrink: 0,
                              background: isToday ? "#2563eb" : "transparent",
                              color: isToday
                                ? "#fff"
                                : isRedDay
                                  ? "#dc2626"
                                  : isSat
                                    ? "#2563eb"
                                    : "#475569",
                            }}
                          >
                            {day.getDate()}
                          </span>
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
                                minWidth: 0,
                              }}
                            >
                              {holidayName}
                            </span>
                          ) : null}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                          }}
                        >
                          {dayEntries.map((e) => {
                            const sc =
                              SVC_STYLE[e.serviceType] ?? SVC_STYLE.visit_care;
                            return (
                              <div
                                key={e.id}
                                style={{
                                  background: sc.bg,
                                  borderLeft: `3px solid ${e.scheduleKind === "claim" ? "#16a34a" : "#2563eb"}`,
                                  borderRadius: 3,
                                  padding: "3px 5px",
                                  fontSize: 12,
                                }}
                              >
                                <div style={{ fontWeight: 700, color: sc.color }}>
                                  {SERVICE_LABELS[e.serviceType] ??
                                    e.serviceType}{" "}
                                  {e.durationMinutes}분
                                </div>
                                <div style={{ color: "#475569", fontSize: 11 }}>
                                  {e.startTime}~{e.endTime}
                                </div>
                                <div
                                  style={{
                                    color: "#0f172a",
                                    fontWeight: 600,
                                    fontSize: 12,
                                  }}
                                >
                                  {e.recipientName}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
