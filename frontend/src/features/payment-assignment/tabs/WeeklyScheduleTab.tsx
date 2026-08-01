"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useCareWorkers } from "@/features/schedule-assignment/hooks/useCareWorkers";

import { SVC_META } from "../constants";
import { ANNUAL_TH_BASE } from "../constants/annualTable";
import { usePaymentAssignmentContext } from "../context/PaymentAssignmentContext";
import { usePaymentAssignmentParams } from "../hooks/usePaymentAssignmentParams";
import { useWeeklyRecipients } from "../hooks/useWeeklyRecipients";
import { useWeeklySchedule } from "../hooks/useWeeklySchedule";
import {
  formatWeeklyDuration,
  isHoliday,
  parseLocalDate,
} from "../utils/weekCalendar";
import WeeklyRecipientPanel from "../components/WeeklyRecipientPanel";
import WeeklyScheduleControlBar from "../components/WeeklyScheduleControlBar";

const DOW_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;

export default function WeeklyScheduleTab() {
  const router = useRouter();
  const { year, view, recipient, filters } = usePaymentAssignmentContext();
  const { setYear, setView, setRecipient } = usePaymentAssignmentParams();

  const [weekQuery, setWeekQuery] = useState("");
  const [weekQueryDraft, setWeekQueryDraft] = useState("");
  const [weekContract, setWeekContract] = useState("all");

  const panelQuery = useMemo(
    () => ({
      year,
      query: weekQuery || undefined,
      contractStatus: weekContract,
      groupId: filters.selGroup !== "all" ? filters.selGroup : undefined,
      subgroupId: filters.selSubGroup !== "all" ? filters.selSubGroup : undefined,
    }),
    [year, weekQuery, weekContract, filters.selGroup, filters.selSubGroup],
  );

  const { recipients, loading: panelLoading } = useWeeklyRecipients(panelQuery);

  const scheduleQuery = useMemo(
    () =>
      recipient
        ? { recipientId: recipient, year, scheduleKind: view }
        : null,
    [recipient, year, view],
  );

  const {
    recipient: selectedRecipient,
    weeks,
    entriesByDate,
    dayMemos,
    loading: scheduleLoading,
  } = useWeeklySchedule(scheduleQuery);

  const { workers: careWorkers } = useCareWorkers();

  const workerMap = useMemo(
    () => new Map(careWorkers.map((w) => [w.id, w])),
    [careWorkers],
  );

  const handleCellClick = (dateStr: string) => {
    if (!recipient) return;
    const d = parseLocalDate(dateStr);
    router.push(
      `/schedule-assignment/${recipient}?year=${d.getFullYear()}&month=${d.getMonth() + 1}&view=${view}`,
      { scroll: false },
    );
  };

  const today = new Date();

  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
      <WeeklyRecipientPanel
        recipients={recipients}
        loading={panelLoading}
        selectedId={recipient}
        onSelect={setRecipient}
        query={weekQuery}
        queryDraft={weekQueryDraft}
        onQueryDraftChange={setWeekQueryDraft}
        onSubmitQuery={() => setWeekQuery(weekQueryDraft.trim())}
        onClearQuery={() => {
          setWeekQueryDraft("");
          setWeekQuery("");
        }}
        contractStatus={weekContract}
        onContractStatusChange={setWeekContract}
        selGroup={filters.selGroup}
        selSubGroup={filters.selSubGroup}
        onSelGroupChange={filters.setSelGroup}
        onSelSubGroupChange={filters.setSelSubGroup}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <WeeklyScheduleControlBar
          recipient={selectedRecipient}
          year={year}
          scheduleKind={view}
          onYearChange={setYear}
          onScheduleKindChange={setView}
        />

        <div style={{ flex: 1, overflow: "auto", padding: "10px 16px" }}>
          {!recipient ? (
            <div
              style={{
                height: "100%",
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              좌측에서 수급자를 선택하면 주간 급여일정이 표시됩니다.
            </div>
          ) : scheduleLoading ? (
            <div
              style={{
                height: "100%",
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              불러오는 중…
            </div>
          ) : (
            <table
              style={{
                borderCollapse: "collapse",
                fontSize: 12,
                tableLayout: "fixed",
                width: "100%",
                minWidth: 720,
                background: "#fff",
              }}
            >
              <colgroup>
                <col style={{ width: 96 }} />
                {Array.from({ length: 7 }, (_, i) => (
                  <col key={i} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th
                    style={{
                      ...ANNUAL_TH_BASE,
                      position: "sticky",
                      top: 0,
                      left: 0,
                      zIndex: 20,
                      background: "#152e50",
                    }}
                  >
                    주
                  </th>
                  {DOW_LABELS.map((d, i) => (
                    <th
                      key={d}
                      style={{
                        ...ANNUAL_TH_BASE,
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background:
                          i === 5 ? "#1e3a5f" : i === 6 ? "#3a2540" : "#253f6a",
                        color:
                          i === 6
                            ? "#fca5a5"
                            : i === 5
                              ? "#93c5fd"
                              : "rgba(255,255,255,0.85)",
                      }}
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        fontSize: 13,
                        color: "#94a3b8",
                      }}
                    >
                      {year}년에 표시할 {view === "plan" ? "계획" : "청구"}{" "}
                      일정이 없습니다.
                    </td>
                  </tr>
                ) : (
                  weeks.map((wk, wi) => {
                    const bg = "#ffffff";
                    const weekHasToday = wk.days.some((dateStr) => {
                      const d = parseLocalDate(dateStr);
                      return (
                        d.getFullYear() === today.getFullYear() &&
                        d.getMonth() === today.getMonth() &&
                        d.getDate() === today.getDate()
                      );
                    });

                    return (
                      <tr key={wi}>
                        <td
                          style={{
                            padding: "4px 6px",
                            textAlign: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#334155",
                            background: weekHasToday ? "#fef9c3" : bg,
                            borderBottom: "1px solid #e4eaf3",
                            borderRight: "1px solid #e2e8f0",
                            position: "sticky",
                            left: 0,
                            zIndex: 5,
                            verticalAlign: "middle",
                          }}
                        >
                          {wk.label}
                        </td>
                        {wk.days.map((dateStr, di) => {
                          const entries = entriesByDate[dateStr] ?? [];
                          const d = parseLocalDate(dateStr);
                          const inRange = d.getFullYear() === year;
                          const isHol = isHoliday(dateStr);
                          const isSun = di === 6 || isHol;
                          const isSat = di === 5;
                          const cellBg = !inRange
                            ? "#f1f5f9"
                            : isSun
                              ? "rgba(254,242,242,0.6)"
                              : isSat
                                ? "rgba(239,246,255,0.5)"
                                : bg;
                          const memo = dayMemos[dateStr];

                          return (
                            <td
                              key={dateStr}
                              onClick={() => handleCellClick(dateStr)}
                              style={{
                                padding: "3px 4px",
                                verticalAlign: "top",
                                background: cellBg,
                                borderBottom: "1px solid #e4eaf3",
                                borderRight: "1px solid rgba(21,46,80,0.06)",
                                cursor: "pointer",
                              }}
                              onMouseEnter={(e) => {
                                if (inRange) {
                                  e.currentTarget.style.outline =
                                    "2px solid #93c5fd";
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.outline = "none";
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  marginBottom: 2,
                                  lineHeight: 1.2,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: isSun
                                      ? "#dc2626"
                                      : isSat
                                        ? "#2563eb"
                                        : "#475569",
                                    flexShrink: 0,
                                  }}
                                >
                                  {d.getMonth() + 1}/{d.getDate()}
                                </span>
                                {memo && (
                                  <span
                                    title={memo}
                                    style={{
                                      fontSize: 12,
                                      color: "#b45309",
                                      background: "#fef9c3",
                                      borderLeft: "2px solid #f59e0b",
                                      padding: "0 4px",
                                      borderRadius: 2,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      minWidth: 0,
                                    }}
                                  >
                                    {memo}
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 3,
                                }}
                              >
                                {entries.length === 0 && (
                                  <div style={{ height: 18 }} />
                                )}
                                {entries.map((s, si) => {
                                  const meta = SVC_META[s.serviceType];
                                  const w = workerMap.get(s.careWorkerId);
                                  return (
                                    <div
                                      key={si}
                                      title={`${meta?.short ?? s.serviceType} ${s.startTime}~${s.endTime} ${w?.name ?? ""}`}
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr 1fr",
                                        alignItems: "center",
                                        columnGap: 3,
                                        padding: "1px 2px",
                                        borderRadius: 3,
                                        fontSize: 12,
                                        lineHeight: 1.2,
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: 12,
                                          fontWeight: 700,
                                          textAlign: "center",
                                          padding: "1px 0",
                                          borderRadius: 3,
                                          background: meta
                                            ? `${meta.color}15`
                                            : "#f1f5f9",
                                          color: meta?.color ?? "#64748b",
                                          border: `1px solid ${meta ? `${meta.color}40` : "#e2e8f0"}`,
                                        }}
                                      >
                                        {meta?.short ?? "-"}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: 12,
                                          color: "#475569",
                                          textAlign: "center",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {formatWeeklyDuration(
                                          s.durationMinutes,
                                        )}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: 12,
                                          color: "#0f172a",
                                          fontWeight: 500,
                                          textAlign: "center",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {w?.name ?? "-"}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
