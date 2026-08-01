"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";

import { scrollChildIntoContainer } from "@/lib/dom/scrollChildIntoContainer";

import {
  ANNUAL_FIXED_W,
  ANNUAL_MONTHS,
  ANNUAL_S,
  ANNUAL_TH_BASE,
  ANNUAL_W,
  isQuarterStart,
  monthColBg,
  toMonthCellInfo,
} from "../constants/annualTable";
import { useAnnualSchedule } from "../hooks/useAnnualSchedule";
import { usePaymentAssignmentContext } from "../context/PaymentAssignmentContext";
import {
  formatLegalDob,
  typeDisplay,
  typeLabel,
  typeStyle,
} from "../utils/recipientDisplay";
import AnnualScheduleLegendBar from "../components/AnnualScheduleLegendBar";
import PlanClaimCell from "../components/PlanClaimCell";

export default function AnnualScheduleTab() {
  const router = useRouter();
  const { listQuery, flashId, recipient, year, view, annualReloadKey } =
    usePaymentAssignmentContext();
  const { rows, loading } = useAnnualSchedule(listQuery, annualReloadKey);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const focusRowRef = useRef<HTMLTableRowElement>(null);
  const scrolledForRef = useRef<string | null>(null);

  const focusId = flashId || recipient;

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

  const handlePlan = (recipientId: string, month: number) => {
    router.push(
      `/schedule-assignment/${recipientId}?year=${year}&month=${month}&view=plan`,
      { scroll: false },
    );
  };

  const handleClaim = (recipientId: string, month: number) => {
    router.push(
      `/schedule-assignment/${recipientId}?year=${year}&month=${month}&view=claim`,
      { scroll: false },
    );
  };

  const handleRecipientClick = (recipientId: string) => {
    router.push(
      `/schedule-assignment/${recipientId}?year=${year}&month=3&view=${view}`,
      { scroll: false },
    );
  };

  return (
    <>
      <AnnualScheduleLegendBar />

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
              minWidth: ANNUAL_FIXED_W + ANNUAL_W.month * 12,
            }}
          >
            <colgroup>
              <col style={{ width: ANNUAL_W.seq }} />
              <col style={{ width: ANNUAL_W.name }} />
              <col style={{ width: ANNUAL_W.birth }} />
              <col style={{ width: ANNUAL_W.grade }} />
              <col style={{ width: ANNUAL_W.type }} />
              <col style={{ width: ANNUAL_W.regId }} />
              {ANNUAL_MONTHS.map((_, i) => (
                <col key={i} style={{ width: ANNUAL_W.month }} />
              ))}
            </colgroup>

            <thead>
              <tr>
                <th
                  style={{
                    ...ANNUAL_TH_BASE,
                    background: "#152e50",
                    left: ANNUAL_S.seq,
                    zIndex: 30,
                    width: ANNUAL_W.seq,
                  }}
                >
                  순번
                </th>
                <th
                  style={{
                    ...ANNUAL_TH_BASE,
                    background: "#152e50",
                    left: ANNUAL_S.name,
                    zIndex: 30,
                    width: ANNUAL_W.name,
                    textAlign: "left",
                    padding: "0 4px 0 8px",
                  }}
                >
                  수급자명
                </th>
                <th
                  style={{
                    ...ANNUAL_TH_BASE,
                    background: "#152e50",
                    left: ANNUAL_S.birth,
                    zIndex: 30,
                    width: ANNUAL_W.birth,
                  }}
                >
                  생년월일
                </th>
                <th
                  style={{
                    ...ANNUAL_TH_BASE,
                    background: "#152e50",
                    left: ANNUAL_S.grade,
                    zIndex: 30,
                    width: ANNUAL_W.grade,
                  }}
                >
                  등급
                </th>
                <th
                  style={{
                    ...ANNUAL_TH_BASE,
                    background: "#152e50",
                    left: ANNUAL_S.type,
                    zIndex: 30,
                    width: ANNUAL_W.type,
                  }}
                >
                  감경
                </th>
                <th
                  style={{
                    ...ANNUAL_TH_BASE,
                    background: "#152e50",
                    left: ANNUAL_S.regId,
                    zIndex: 30,
                    width: ANNUAL_W.regId,
                    textAlign: "left",
                    padding: "0 4px 0 8px",
                  }}
                >
                  인정번호
                </th>

                {ANNUAL_MONTHS.map((ml, i) => {
                  const isEven = i % 2 === 1;
                  const qStart = isQuarterStart(i);
                  return (
                    <th
                      key={i}
                      style={{
                        ...ANNUAL_TH_BASE,
                        background: isEven ? "#253f6a" : "#1e3a5f",
                        zIndex: 20,
                        width: ANNUAL_W.month,
                        color: "rgba(255,255,255,0.82)",
                        borderLeft: qStart
                          ? "2px solid rgba(255,255,255,0.22)"
                          : undefined,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 700 }}>
                          {ml}
                        </span>
                        <div style={{ display: "flex", gap: 3 }}>
                          <span style={{ fontSize: 11, opacity: 0.55 }}>계</span>
                          <span style={{ fontSize: 11, opacity: 0.55 }}>청</span>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6 + 12}
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
                    colSpan={6 + 12}
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
                rows.map(({ recipient: r, months }, rowIdx) => {
                  const isEvenRow = rowIdx % 2 === 0;
                  const isFlash = flashId === r.id;
                  const isFocus = focusId === r.id;
                  const bgFix = isFlash
                    ? "#fef9c3"
                    : isEvenRow
                      ? "#ffffff"
                      : "#f4f7fb";
                  const tl = typeLabel(r.reduction);

                  const tdFix: CSSProperties = {
                    position: "sticky",
                    zIndex: 10,
                    height: 30,
                    padding: "0 6px",
                    borderBottom: "1px solid #e4eaf3",
                    background: bgFix,
                    fontSize: 12,
                    borderRight: "1px solid rgba(21,46,80,0.1)",
                    borderTopColor: "#e4eaf3",
                    borderLeftColor: "rgba(21,46,80,0.1)",
                    textAlign: "center",
                    verticalAlign: "middle",
                    overflow: "hidden",
                  };

                  return (
                    <tr
                      key={r.id}
                      ref={isFocus ? focusRowRef : undefined}
                    >
                      <td
                        style={{
                          ...tdFix,
                          left: ANNUAL_S.seq,
                          width: ANNUAL_W.seq,
                          color: "#94a3b8",
                        }}
                      >
                        {rowIdx + 1}
                      </td>

                      <td
                        style={{
                          ...tdFix,
                          left: ANNUAL_S.name,
                          width: ANNUAL_W.name,
                          textAlign: "left",
                          padding: "0 6px 0 8px",
                          cursor: "pointer",
                        }}
                        onClick={() => handleRecipientClick(r.id)}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#0f172a",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontSize: 13,
                          }}
                        >
                          {r.name}
                        </div>
                      </td>

                      <td
                        style={{
                          ...tdFix,
                          left: ANNUAL_S.birth,
                          width: ANNUAL_W.birth,
                          fontFamily: "'Noto Sans KR', sans-serif",
                          color: "#64748b",
                        }}
                      >
                        {formatLegalDob(r.legalDob)}
                      </td>

                      <td
                        style={{
                          ...tdFix,
                          left: ANNUAL_S.grade,
                          width: ANNUAL_W.grade,
                        }}
                      >
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
                          {r.gradeText}
                        </span>
                      </td>

                      <td
                        style={{
                          ...tdFix,
                          left: ANNUAL_S.type,
                          width: ANNUAL_W.type,
                        }}
                      >
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
                          {typeDisplay(r.reduction)}
                        </span>
                      </td>

                      <td
                        style={{
                          ...tdFix,
                          left: ANNUAL_S.regId,
                          width: ANNUAL_W.regId,
                          textAlign: "left",
                          padding: "0 6px 0 8px",
                          fontFamily: "'Noto Sans KR', sans-serif",
                          color: "#475569",
                        }}
                      >
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "block",
                          }}
                        >
                          {r.certNo}
                        </span>
                      </td>

                      {months.map((summary, mi) => {
                        const isEvenCol = mi % 2 === 1;
                        const qStart = isQuarterStart(mi);
                        const bg = isFlash
                          ? "#fef9c3"
                          : monthColBg(isEvenRow, isEvenCol);
                        const month = mi + 1;
                        const info = toMonthCellInfo(summary);

                        return (
                          <td
                            key={mi}
                            style={{
                              height: 30,
                              width: ANNUAL_W.month,
                              borderBottom: "1px solid #e4eaf3",
                              borderRight: `1px solid ${isEvenCol ? "rgba(21,46,80,0.10)" : "rgba(21,46,80,0.06)"}`,
                              borderLeft: qStart
                                ? "2px solid rgba(21,46,80,0.16)"
                                : undefined,
                              textAlign: "center",
                              verticalAlign: "middle",
                              padding: 0,
                              background: bg,
                            }}
                          >
                            <PlanClaimCell
                              info={info}
                              onPlan={() => handlePlan(r.id, month)}
                              onClaim={() => handleClaim(r.id, month)}
                            />
                          </td>
                        );
                      })}
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
