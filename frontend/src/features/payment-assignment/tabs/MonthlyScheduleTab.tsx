"use client";

import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";

import { scrollChildIntoContainer } from "@/lib/dom/scrollChildIntoContainer";

import { SVC_META } from "../constants";
import {
  formatDurationMinutes,
  MONTHLY_COUNT_COL_W,
  MONTHLY_DAY_COL_W,
  MONTHLY_FIXED_W,
  MONTHLY_S,
  MONTHLY_TH_BASE,
  MONTHLY_TIME_COL_W,
  MONTHLY_W,
  monthlyTableMinWidth,
} from "../constants/monthlyTable";
import { usePaymentAssignmentContext } from "../context/PaymentAssignmentContext";
import {
  buildMonthlyScheduleQuery,
} from "../hooks/buildPaymentAssignmentListQuery";
import { useMonthlySchedule } from "../hooks/useMonthlySchedule";
import { usePaymentAssignmentParams } from "../hooks/usePaymentAssignmentParams";
import {
  formatLegalDob,
  typeDisplay,
  typeLabel,
  typeStyle,
} from "../utils/recipientDisplay";
import MonthlyScheduleSubBar from "../components/MonthlyScheduleSubBar";

export default function MonthlyScheduleTab() {
  const router = useRouter();
  const {
    year,
    month,
    view,
    flashId,
    recipient,
    filters,
    setMonthlyTotalCount,
  } = usePaymentAssignmentContext();
  const { setMonth, setView } = usePaymentAssignmentParams();

  const monthlyQuery = useMemo(
    () => buildMonthlyScheduleQuery(year, month, view, filters),
    [year, month, view, filters],
  );
  const { rows, lastDay, totalCount, loading } =
    useMonthlySchedule(monthlyQuery);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const focusRowRef = useRef<HTMLTableRowElement>(null);
  const scrolledForRef = useRef<string | null>(null);

  const focusId = flashId || recipient;

  useEffect(() => {
    if (loading) return;
    setMonthlyTotalCount(totalCount);
  }, [loading, totalCount, setMonthlyTotalCount]);

  useEffect(() => {
    return () => setMonthlyTotalCount(null);
  }, [setMonthlyTotalCount]);

  useEffect(() => {
    if (!focusId || loading || rows.length === 0) return;
    if (scrolledForRef.current === focusId) return;

    const frame = requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      const row = focusRowRef.current;
      if (!container || !row) return;
      scrollChildIntoContainer(container, row);
      scrolledForRef.current = focusId;
    });
    return () => cancelAnimationFrame(frame);
  }, [focusId, loading, rows]);

  const handleRowClick = (recipientId: string) => {
    router.push(
      `/schedule-assignment/${recipientId}?year=${year}&month=${month}&view=${view}`,
      { scroll: false },
    );
  };

  const onBox: CSSProperties =
    view === "plan"
      ? { background: "#93c5fd", border: "1px solid #60a5fa" }
      : { background: "#6ee7b7", border: "1px solid #34d399" };

  let recIdx = -1;

  return (
    <>
      <MonthlyScheduleSubBar
        year={year}
        month={month}
        scheduleKind={view}
        onMonthChange={setMonth}
        onScheduleKindChange={setView}
      />

      <div style={{ flex: 1, overflow: "hidden", padding: "10px 16px" }}>
        <div
          ref={scrollContainerRef}
          style={{
            height: "100%",
            background: "#ffffff",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            overflow: "auto",
          }}
        >
          <table
            style={{
              borderCollapse: "collapse",
              fontSize: 12,
              tableLayout: "fixed",
              minWidth: monthlyTableMinWidth(lastDay),
            }}
          >
            <colgroup>
              <col style={{ width: MONTHLY_W.seq }} />
              <col style={{ width: MONTHLY_W.name }} />
              <col style={{ width: MONTHLY_W.birth }} />
              <col style={{ width: MONTHLY_W.svc }} />
              <col style={{ width: MONTHLY_W.grade }} />
              <col style={{ width: MONTHLY_W.red }} />
              {Array.from({ length: lastDay }, (_, i) => (
                <col key={i} style={{ width: MONTHLY_DAY_COL_W }} />
              ))}
              <col style={{ width: MONTHLY_TIME_COL_W }} />
              <col style={{ width: MONTHLY_COUNT_COL_W }} />
            </colgroup>

            <thead>
              <tr>
                <th
                  style={{
                    ...MONTHLY_TH_BASE,
                    background: "#152e50",
                    left: MONTHLY_S.seq,
                    zIndex: 30,
                    width: MONTHLY_W.seq,
                  }}
                >
                  순번
                </th>
                <th
                  style={{
                    ...MONTHLY_TH_BASE,
                    background: "#152e50",
                    left: MONTHLY_S.name,
                    zIndex: 30,
                    width: MONTHLY_W.name,
                    textAlign: "left",
                    padding: "0 4px 0 8px",
                  }}
                >
                  수급자명
                </th>
                <th
                  style={{
                    ...MONTHLY_TH_BASE,
                    background: "#152e50",
                    left: MONTHLY_S.birth,
                    zIndex: 30,
                    width: MONTHLY_W.birth,
                  }}
                >
                  생년월일
                </th>
                <th
                  style={{
                    ...MONTHLY_TH_BASE,
                    background: "#152e50",
                    left: MONTHLY_S.svc,
                    zIndex: 30,
                    width: MONTHLY_W.svc,
                  }}
                >
                  종류
                </th>
                <th
                  style={{
                    ...MONTHLY_TH_BASE,
                    background: "#152e50",
                    left: MONTHLY_S.grade,
                    zIndex: 30,
                    width: MONTHLY_W.grade,
                  }}
                >
                  등급
                </th>
                <th
                  style={{
                    ...MONTHLY_TH_BASE,
                    background: "#152e50",
                    left: MONTHLY_S.red,
                    zIndex: 30,
                    width: MONTHLY_W.red,
                  }}
                >
                  감경
                </th>
                {Array.from({ length: lastDay }, (_, i) => {
                  const dnum = i + 1;
                  const dow = new Date(year, month - 1, dnum).getDay();
                  const isSun = dow === 0;
                  const isSat = dow === 6;
                  return (
                    <th
                      key={i}
                      style={{
                        ...MONTHLY_TH_BASE,
                        background: isSun
                          ? "#3a2540"
                          : isSat
                            ? "#1e3a5f"
                            : "#253f6a",
                        zIndex: 20,
                        width: MONTHLY_DAY_COL_W,
                        padding: 0,
                        color: isSun
                          ? "#fca5a5"
                          : isSat
                            ? "#93c5fd"
                            : "rgba(255,255,255,0.82)",
                      }}
                    >
                      {dnum}
                    </th>
                  );
                })}
                <th
                  style={{
                    ...MONTHLY_TH_BASE,
                    background: "#1e3a5f",
                    zIndex: 20,
                    width: MONTHLY_TIME_COL_W,
                  }}
                >
                  급여제공시간
                </th>
                <th
                  style={{
                    ...MONTHLY_TH_BASE,
                    background: "#1e3a5f",
                    zIndex: 20,
                    width: MONTHLY_COUNT_COL_W,
                  }}
                >
                  제공횟수
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6 + lastDay + 2}
                    style={{
                      padding: "32px",
                      textAlign: "center",
                      fontSize: 12,
                      color: "#94a3b8",
                    }}
                  >
                    불러오는 중…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6 + lastDay + 2}
                    style={{
                      padding: "32px",
                      textAlign: "center",
                      fontSize: 12,
                      color: "#94a3b8",
                    }}
                  >
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  if (row.firstOfRecipient) recIdx++;
                  const bandEven = recIdx % 2 === 0;
                  const isFlash = flashId === row.recipient.id;
                  const isFocus = focusId === row.recipient.id;
                  const bgFix = isFlash
                    ? "#fef9c3"
                    : bandEven
                      ? "#ffffff"
                      : "#f4f7fb";
                  const meta = row.serviceType
                    ? SVC_META[row.serviceType]
                    : null;
                  const tl = row.reduction
                    ? typeLabel(row.reduction)
                    : "일반";
                  const daySet = new Set(row.days);

                  const tdFix: CSSProperties = {
                    position: "sticky",
                    zIndex: 10,
                    height: 30,
                    padding: "0 6px",
                    borderBottom: "1px solid #e4eaf3",
                    background: bgFix,
                    fontSize: 12,
                    borderRight: "1px solid rgba(21,46,80,0.1)",
                    textAlign: "center",
                    verticalAlign: "middle",
                    overflow: "hidden",
                  };

                  const sumStyle: CSSProperties = {
                    ...tdFix,
                    background: bgFix,
                    fontWeight: 600,
                    borderLeft: "1px solid rgba(21,46,80,0.12)",
                    verticalAlign: "middle",
                  };

                  return (
                    <tr
                      key={row.key}
                      ref={isFocus && row.firstOfRecipient ? focusRowRef : undefined}
                      onClick={() => handleRowClick(row.recipient.id)}
                      style={{ cursor: "pointer" }}
                    >
                      {row.firstOfRecipient && (
                        <td
                          rowSpan={row.recRowSpan}
                          style={{
                            ...tdFix,
                            left: MONTHLY_S.seq,
                            width: MONTHLY_W.seq,
                            color: "#94a3b8",
                            verticalAlign: "middle",
                          }}
                        >
                          {recIdx + 1}
                        </td>
                      )}
                      {row.firstOfRecipient && (
                        <td
                          rowSpan={row.recRowSpan}
                          style={{
                            ...tdFix,
                            left: MONTHLY_S.name,
                            width: MONTHLY_W.name,
                            textAlign: "left",
                            padding: "0 6px 0 8px",
                            verticalAlign: "middle",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              color: "#0f172a",
                              fontSize: 13,
                            }}
                          >
                            {row.recipient.name}
                          </span>
                        </td>
                      )}
                      {row.firstOfRecipient && (
                        <td
                          rowSpan={row.recRowSpan}
                          style={{
                            ...tdFix,
                            left: MONTHLY_S.birth,
                            width: MONTHLY_W.birth,
                            color: "#64748b",
                            verticalAlign: "middle",
                          }}
                        >
                          {formatLegalDob(row.recipient.legalDob)}
                        </td>
                      )}

                      {row.firstOfPeriod && (
                        <td
                          rowSpan={row.periodRowSpan}
                          style={{
                            ...tdFix,
                            left: MONTHLY_S.svc,
                            width: MONTHLY_W.svc,
                            verticalAlign: "middle",
                          }}
                        >
                          {meta ? (
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                padding: "1px 6px",
                                borderRadius: 3,
                                background: `${meta.color}15`,
                                color: meta.color,
                                border: `1px solid ${meta.color}40`,
                              }}
                            >
                              {meta.short}
                            </span>
                          ) : (
                            <span style={{ color: "#cbd5e1" }}>-</span>
                          )}
                        </td>
                      )}

                      <td
                        style={{
                          ...tdFix,
                          left: MONTHLY_S.grade,
                          width: MONTHLY_W.grade,
                        }}
                      >
                        {row.gradeNum != null ? (
                          <span
                            style={{
                              background: "#dbeafe",
                              color: "#1d4ed8",
                              border: "1px solid #bfdbfe",
                              fontSize: 12,
                              padding: "1px 5px",
                              borderRadius: 3,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              display: "inline-block",
                            }}
                          >
                            {row.gradeNum}등급
                          </span>
                        ) : (
                          <span style={{ color: "#cbd5e1" }}>-</span>
                        )}
                      </td>

                      <td
                        style={{
                          ...tdFix,
                          left: MONTHLY_S.red,
                          width: MONTHLY_W.red,
                        }}
                      >
                        {row.reduction != null ? (
                          <span
                            style={{
                              ...typeStyle(tl),
                              fontSize: 12,
                              padding: "1px 5px",
                              borderRadius: 3,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              display: "inline-block",
                            }}
                          >
                            {typeDisplay(row.reduction)}
                          </span>
                        ) : (
                          <span style={{ color: "#cbd5e1" }}>-</span>
                        )}
                      </td>

                      {Array.from({ length: lastDay }, (_, i) => {
                        const dnum = i + 1;
                        const has = daySet.has(dnum);
                        const dow = new Date(year, month - 1, dnum).getDay();
                        const colBg = isFlash
                          ? "#fef9c3"
                          : dow === 0
                            ? "rgba(254,242,242,0.5)"
                            : dow === 6
                              ? "rgba(239,246,255,0.5)"
                              : bgFix;

                        return (
                          <td
                            key={i}
                            style={{
                              height: 30,
                              width: MONTHLY_DAY_COL_W,
                              padding: 0,
                              borderBottom: "1px solid #e4eaf3",
                              borderRight: "1px solid rgba(21,46,80,0.06)",
                              textAlign: "center",
                              verticalAlign: "middle",
                              background: colBg,
                            }}
                          >
                            {has && (
                              <div
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: 3,
                                  margin: "0 auto",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  ...onBox,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    lineHeight: 1,
                                    color:
                                      view === "plan" ? "#1d4ed8" : "#065f46",
                                    userSelect: "none",
                                  }}
                                >
                                  {row.serviceType
                                    ? (SVC_META[row.serviceType]?.first ?? "")
                                    : ""}
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      <td style={{ ...sumStyle, whiteSpace: "nowrap" }}>
                        {formatDurationMinutes(row.totalMinutes)}
                      </td>
                      <td
                        style={{
                          ...sumStyle,
                          borderLeft: "1px solid rgba(21,46,80,0.06)",
                        }}
                      >
                        {row.count > 0 ? `${row.count}회` : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
