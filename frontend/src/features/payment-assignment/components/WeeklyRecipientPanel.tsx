"use client";

import { Search } from "lucide-react";
import { useEffect, useRef } from "react";

import type { PaymentAssignmentRecipientDto } from "@/lib/api/paymentAssignment.types";
import { scrollChildIntoContainer } from "@/lib/dom/scrollChildIntoContainer";
import {
  CONTRACT_STATUSES,
} from "@/lib/mock/paymentAssignmentSeed";

import { usePaymentAssignmentContext } from "../context/PaymentAssignmentContext";
import {
  contractStyle,
  formatLegalDob,
  typeDisplay,
  typeLabel,
  typeStyle,
} from "../utils/recipientDisplay";

type Props = {
  recipients: PaymentAssignmentRecipientDto[];
  loading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  query: string;
  queryDraft: string;
  onQueryDraftChange: (value: string) => void;
  onSubmitQuery: () => void;
  onClearQuery: () => void;
  contractStatus: string;
  onContractStatusChange: (value: string) => void;
  selGroup: string;
  selSubGroup: string;
  onSelGroupChange: (value: string) => void;
  onSelSubGroupChange: (value: string) => void;
};

export default function WeeklyRecipientPanel({
  recipients,
  loading,
  selectedId,
  onSelect,
  query,
  queryDraft,
  onQueryDraftChange,
  onSubmitQuery,
  onClearQuery,
  contractStatus,
  onContractStatusChange,
  selGroup,
  selSubGroup,
  onSelGroupChange,
  onSelSubGroupChange,
}: Props) {
  const listScrollRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);
  const scrolledForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedId || loading || recipients.length === 0) return;
    if (scrolledForRef.current === selectedId) return;

    const frame = requestAnimationFrame(() => {
      const container = listScrollRef.current;
      const item = selectedItemRef.current;
      if (!container || !item) return;
      scrollChildIntoContainer(container, item);
      scrolledForRef.current = selectedId;
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedId, loading, recipients]);

  const { recipientGroups, recipientGroupsLoading } =
    usePaymentAssignmentContext();

  const activeGroup =
    selGroup === "all"
      ? undefined
      : recipientGroups.find((g) => g.id === selGroup);

  return (
    <aside
      style={{
        width: 258,
        flexShrink: 0,
        borderRight: "1px solid #e2e8f0",
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px",
          background: "linear-gradient(90deg,#0f2744 0%,#1a3a5c 100%)",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
          수급자 선택
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
          {recipients.length}명
        </span>
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: "6px 6px",
          borderBottom: "1px solid #e2e8f0",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ display: "flex", gap: 3 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={11}
              color="#94a3b8"
              style={{
                position: "absolute",
                left: 6,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <input
              value={queryDraft}
              onChange={(e) => onQueryDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmitQuery();
              }}
              placeholder="수급자명 검색"
              style={{
                width: "100%",
                boxSizing: "border-box",
                paddingLeft: 22,
                paddingRight: 6,
                height: 22,
                border: "1px solid #e2e8f0",
                borderRadius: 4,
                fontSize: 11,
                outline: "none",
                background: "#f8fafc",
                color: "#1e293b",
              }}
            />
          </div>
          <button
            type="button"
            onClick={onSubmitQuery}
            title="검색 (Enter)"
            style={{
              height: 22,
              padding: "0 8px",
              fontSize: 11,
              borderRadius: 4,
              cursor: "pointer",
              border: "1px solid #152e50",
              background: "#152e50",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            검색
          </button>
          {query && (
            <button
              type="button"
              onClick={onClearQuery}
              title="검색 초기화"
              style={{
                height: 22,
                padding: "0 6px",
                fontSize: 11,
                borderRadius: 4,
                cursor: "pointer",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                color: "#64748b",
              }}
            >
              초기화
            </button>
          )}
        </div>

        <select
          value={contractStatus}
          onChange={(e) => onContractStatusChange(e.target.value)}
          style={{
            height: 22,
            padding: "0 4px",
            fontSize: 11,
            borderRadius: 4,
            outline: "none",
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            color: "#1e293b",
            cursor: "pointer",
          }}
        >
          <option value="all">전체 계약구분</option>
          {CONTRACT_STATUSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={selGroup}
          onChange={(e) => {
            onSelGroupChange(e.target.value);
            onSelSubGroupChange("all");
          }}
          disabled={recipientGroupsLoading}
          style={{
            height: 22,
            padding: "0 4px",
            fontSize: 11,
            borderRadius: 4,
            outline: "none",
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            color: "#1e293b",
            cursor: "pointer",
          }}
        >
          <option value="all">전체 그룹</option>
          {recipientGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        {activeGroup && activeGroup.subgroups.length > 0 && (
          <select
            value={selSubGroup}
            onChange={(e) => onSelSubGroupChange(e.target.value)}
            style={{
              height: 22,
              padding: "0 4px",
              fontSize: 11,
              borderRadius: 4,
              outline: "none",
              border: "1px solid #93c5fd",
              background: "#eff6ff",
              color: "#1d4ed8",
              cursor: "pointer",
            }}
          >
            <option value="all">전체</option>
            {activeGroup.subgroups.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div ref={listScrollRef} style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div
            style={{
              padding: "20px 10px",
              textAlign: "center",
              fontSize: 12,
              color: "#94a3b8",
            }}
          >
            불러오는 중…
          </div>
        ) : (
          recipients.map((r, idx) => {
            const on = r.id === selectedId;
            const bg = on ? "#dbeafe" : idx % 2 === 0 ? "#ffffff" : "#f4f7fb";
            const dob = formatLegalDob(r.legalDob);
            const tl = typeLabel(r.reduction);

            return (
              <div
                key={r.id}
                ref={on ? selectedItemRef : undefined}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(r.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelect(r.id);
                }}
                style={{
                  padding: "0 6px 0 4px",
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  borderBottom: "1px solid #e4eaf3",
                  cursor: "pointer",
                  background: bg,
                  borderLeft: on
                    ? "3px solid #2563eb"
                    : "3px solid transparent",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: on ? 700 : 500,
                    color: on ? "#1d4ed8" : "#0f172a",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flexShrink: 1,
                    minWidth: 0,
                  }}
                >
                  {r.name}
                  <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                    ({dob === "-" ? "" : dob})
                  </span>
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 4px",
                    borderRadius: 3,
                    ...contractStyle(r.contractStatus),
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.contractStatus}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 4px",
                    borderRadius: 3,
                    background: "#dbeafe",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.gradeText}
                </span>
                <span
                  style={{
                    ...typeStyle(tl),
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 4px",
                    borderRadius: 3,
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {typeDisplay(r.reduction)}
                </span>
              </div>
            );
          })
        )}
        {!loading && recipients.length === 0 && (
          <div
            style={{
              padding: "20px 10px",
              textAlign: "center",
              fontSize: 12,
              color: "#94a3b8",
            }}
          >
            표시할 수급자가 없습니다.
          </div>
        )}
      </div>
    </aside>
  );
}
