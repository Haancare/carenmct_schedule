"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";

import type { ScheduleAssignmentListItem } from "@/lib/api/scheduleAssignment.types";
import { formatLegalDob } from "@/features/payment-assignment/utils/recipientDisplay";
import { scrollChildIntoContainer } from "@/lib/dom/scrollChildIntoContainer";

import {
  getListScrollTop,
  setListScrollTop,
} from "../utils/recipientListCache";
import PlanClaimBadge from "./PlanClaimBadge";

type Props = {
  year: number;
  month: number;
  selectedId: string;
  items: ScheduleAssignmentListItem[];
  loading: boolean;
  showAllActive: boolean;
  onToggleShowAllActive: () => void;
  onSelect: (id: string) => void;
  view: "plan" | "claim";
};

export default function RecipientListPanel({
  year,
  month,
  selectedId,
  items,
  loading,
  showAllActive,
  onToggleShowAllActive,
  onSelect,
  view,
}: Props) {
  const listScrollRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);
  const focusedForRef = useRef<string | null>(null);

  useEffect(() => {
    const container = listScrollRef.current;
    const selected = selectedItemRef.current;
    if (!container || items.length === 0) return;

    if (!restoredRef.current) {
      container.scrollTop = getListScrollTop();
      restoredRef.current = true;
    }

    if (!selectedId || !selected) return;
    if (focusedForRef.current === selectedId) return;

    const frame = requestAnimationFrame(() => {
      scrollChildIntoContainer(container, selected);
      setListScrollTop(container.scrollTop);
      focusedForRef.current = selectedId;
    });
    return () => cancelAnimationFrame(frame);
  }, [items, selectedId]);

  return (
    <aside
      style={{
        width: 258,
        height: "100%",
        minHeight: 0,
        flexShrink: 0,
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        background: "#f8fafc",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          padding: "5px 8px",
          background: "#f1f5f9",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          gap: 5,
        }}
      >
        {[
          {
            label: "(전체)연간급여일정",
            href: `/payment-assignment?tab=annual&year=${year}&view=${view}&recipient=${selectedId}`,
          },
          {
            label: `(전체)${month}월 급여일정`,
            href: `/payment-assignment?tab=monthly&year=${year}&month=${month}&view=${view}&recipient=${selectedId}`,
          },
        ].map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            scroll={false}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              padding: "4px 0",
              borderRadius: 5,
              fontSize: 11,
              fontWeight: 600,
              color: "#475569",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {label}
            <ArrowUpRight size={10} />
          </Link>
        ))}
      </div>

      <div
        style={{
          flexShrink: 0,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px",
          background: "linear-gradient(90deg, #0f2744 0%, #1a3a5c 100%)",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: "#ffffff" }}>
          수급자 목록
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
            {year}년 {month}월 · {items.length}명
          </span>
          <button
            type="button"
            onClick={onToggleShowAllActive}
            title={showAllActive ? "수급중 수급자 숨기기" : "수급중 수급자 모두 보기"}
            style={{
              fontSize: 10,
              padding: "1px 6px",
              borderRadius: 10,
              cursor: "pointer",
              border: showAllActive
                ? "1px solid #6ee7b7"
                : "1px solid rgba(255,255,255,0.2)",
              backgroundColor: showAllActive
                ? "rgba(16,185,129,0.25)"
                : "transparent",
              color: showAllActive ? "#6ee7b7" : "rgba(255,255,255,0.35)",
              fontWeight: showAllActive ? 700 : 400,
            }}
          >
            수급중
          </button>
        </div>
      </div>

      <div
        ref={listScrollRef}
        onScroll={(e) => setListScrollTop(e.currentTarget.scrollTop)}
        style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}
      >
        {loading && items.length === 0 && (
          <div
            style={{
              padding: 16,
              fontSize: 11,
              color: "#94a3b8",
              textAlign: "center",
            }}
          >
            불러오는 중…
          </div>
        )}
        {items.map((item, idx) => {
          const { recipient, planCount, claimCount } = item;
          const isSelected = recipient.id === selectedId;
          const bg = isSelected
            ? "#dbeafe"
            : idx % 2 === 0
              ? "#ffffff"
              : "#f4f7fb";

          return (
            <div
              key={recipient.id}
              ref={isSelected ? selectedItemRef : undefined}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(recipient.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSelect(recipient.id);
              }}
              style={{
                padding: "0 6px 0 4px",
                height: 30,
                display: "flex",
                alignItems: "center",
                gap: 3,
                borderBottom: "1px solid #e4eaf3",
                background: bg,
                cursor: "pointer",
                borderLeft: isSelected
                  ? "3px solid #2563eb"
                  : "3px solid transparent",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? "#1d4ed8" : "#0f172a",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {recipient.name}({formatLegalDob(recipient.legalDob)})
              </span>
              <PlanClaimBadge planCount={planCount} claimCount={claimCount} />
            </div>
          );
        })}
      </div>
    </aside>
  );
}
