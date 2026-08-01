"use client";

import { useMemo, useState } from "react";

export type PaymentAssignmentFilters = {
  query: string;
  queryDraft: string;
  filterGrade: string;
  filterType: string;
  filterSvc: string;
  filterWorker: string;
  showAllActive: boolean;
  selGroup: string;
  selSubGroup: string;
  setFilterGrade: (value: string) => void;
  setFilterType: (value: string) => void;
  setFilterSvc: (value: string) => void;
  setFilterWorker: (value: string) => void;
  setSelGroup: (value: string) => void;
  setSelSubGroup: (value: string) => void;
  setShowAllActive: (value: boolean | ((prev: boolean) => boolean)) => void;
  setQueryDraft: (value: string) => void;
  submitQuery: () => void;
  clearQuery: () => void;
};

export function usePaymentAssignmentFilters(): PaymentAssignmentFilters {
  const [filterGrade, setFilterGrade] = useState("all");
  const [selGroup, setSelGroup] = useState("all");
  const [selSubGroup, setSelSubGroup] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterSvc, setFilterSvc] = useState("all");
  const [filterWorker, setFilterWorker] = useState("all");
  const [query, setQuery] = useState("");
  const [queryDraft, setQueryDraft] = useState("");
  const [showAllActive, setShowAllActive] = useState(true);

  const submitQuery = () => setQuery(queryDraft.trim());
  const clearQuery = () => {
    setQueryDraft("");
    setQuery("");
  };

  return useMemo(
    () => ({
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
    }),
    [
      query,
      queryDraft,
      filterGrade,
      filterType,
      filterSvc,
      filterWorker,
      showAllActive,
      selGroup,
      selSubGroup,
    ],
  );
}
