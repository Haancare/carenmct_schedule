"use client";

import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
} from "lucide-react";

import { GRADE_OPTIONS } from "@/lib/mock/paymentAssignmentSeed";

import { useCareWorkers } from "@/features/schedule-assignment/hooks/useCareWorkers";

import {
  btnNav,
  selStyle,
  SVC_META,
  SVC_ORDER,
} from "../constants";
import { usePaymentAssignmentContext } from "../context/PaymentAssignmentContext";
import type { PaymentAssignmentFilters } from "../hooks/usePaymentAssignmentFilters";
import FilterDivider from "./FilterDivider";
import WorkerCombo from "./WorkerCombo";

type Props = {
  year: number;
  onYearChange: (year: number) => void;
  filters: PaymentAssignmentFilters;
  totalCount: number;
};

export default function PaymentAssignmentFilterBar({
  year,
  onYearChange,
  filters,
  totalCount,
}: Props) {
  const {
    query,
    queryDraft,
    filterGrade,
    filterType,
    filterSvc,
    filterWorker,
    showAllActive,
    selGroup,
    selSubGroup,
    setFilterGrade,
    setFilterType,
    setFilterSvc,
    setFilterWorker,
    setSelGroup,
    setSelSubGroup,
    setShowAllActive,
    setQueryDraft,
    submitQuery,
    clearQuery,
  } = filters;

  const { workers: careWorkers } = useCareWorkers();
  const { recipientGroups, recipientGroupsLoading } =
    usePaymentAssignmentContext();

  const activeGroup =
    selGroup === "all"
      ? undefined
      : recipientGroups.find((g) => g.id === selGroup);

  return (
    <div
      style={{
        flexShrink: 0,
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: "5px 16px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Filter size={12} color="#94a3b8" />

      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <button
          type="button"
          onClick={() => onYearChange(year - 1)}
          style={btnNav}
        >
          <ChevronLeft size={12} color="#64748b" />
        </button>
        <div
          style={{
            minWidth: 60,
            textAlign: "center",
            fontSize: 12,
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          {year}년
        </div>
        <button
          type="button"
          onClick={() => onYearChange(year + 1)}
          style={btnNav}
        >
          <ChevronRight size={12} color="#64748b" />
        </button>
      </div>

      <FilterDivider />

      <select
        value={filterGrade}
        onChange={(e) => setFilterGrade(e.target.value)}
        style={selStyle}
      >
        <option value="all">전체 등급</option>
        {GRADE_OPTIONS.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
        style={selStyle}
      >
        <option value="all">전체 감경</option>
        <option value="감경">감경</option>
        <option value="기초">기초</option>
        <option value="일반">일반</option>
      </select>

      <select
        value={filterSvc}
        onChange={(e) => setFilterSvc(e.target.value)}
        style={selStyle}
      >
        <option value="all">전체 종류</option>
        {SVC_ORDER.map((k) => (
          <option key={k} value={k}>
            {SVC_META[k]?.short ?? k}
          </option>
        ))}
      </select>

      <FilterDivider />

      <WorkerCombo
        workers={careWorkers}
        value={filterWorker}
        onChange={setFilterWorker}
      />

      <div style={{ display: "flex", gap: 4 }}>
        <div style={{ position: "relative" }}>
          <Search
            size={11}
            color="#94a3b8"
            style={{
              position: "absolute",
              left: 7,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
          <input
            value={queryDraft}
            onChange={(e) => setQueryDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitQuery();
            }}
            placeholder="수급자명 검색"
            style={{
              paddingLeft: 24,
              paddingRight: 8,
              height: 24,
              width: 130,
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 12,
              outline: "none",
              background: "#f8fafc",
              color: "#1e293b",
            }}
          />
        </div>
        <button
          type="button"
          onClick={submitQuery}
          title="검색 (Enter)"
          style={{
            height: 24,
            padding: "0 10px",
            fontSize: 12,
            borderRadius: 6,
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
            onClick={clearQuery}
            title="검색 초기화"
            style={{
              height: 24,
              padding: "0 8px",
              fontSize: 12,
              borderRadius: 6,
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

      <FilterDivider />

      <select
        value={selGroup}
        onChange={(e) => {
          setSelGroup(e.target.value);
          setSelSubGroup("all");
        }}
        disabled={recipientGroupsLoading}
        style={selStyle}
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
          onChange={(e) => setSelSubGroup(e.target.value)}
          style={{
            ...selStyle,
            borderColor: "#93c5fd",
            color: "#1d4ed8",
            background: "#eff6ff",
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

      <FilterDivider />

      <button
        type="button"
        onClick={() => setShowAllActive((v) => !v)}
        title={
          showAllActive
            ? "수급중 수급자 숨기기"
            : "수급중 수급자 모두 보기"
        }
        style={{
          height: 24,
          padding: "0 9px",
          fontSize: 12,
          borderRadius: 6,
          cursor: "pointer",
          border: showAllActive ? "1px solid #6ee7b7" : "1px solid #e2e8f0",
          background: showAllActive ? "#ecfdf5" : "#f8fafc",
          color: showAllActive ? "#059669" : "#94a3b8",
          fontWeight: showAllActive ? 700 : 500,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        수급중
      </button>

      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 12, color: "#64748b" }}>
          총 <strong style={{ color: "#1d4ed8" }}>{totalCount}</strong>명
        </span>
      </div>
    </div>
  );
}
