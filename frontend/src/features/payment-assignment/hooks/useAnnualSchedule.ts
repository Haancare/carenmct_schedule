"use client";

import { useEffect, useState } from "react";

import { fetchAnnualSchedule } from "@/lib/api/paymentAssignment";
import type {
  AnnualScheduleRowDto,
  PaymentAssignmentListQuery,
} from "@/lib/api/paymentAssignment.types";

export function useAnnualSchedule(
  listQuery: PaymentAssignmentListQuery,
  reloadKey = 0,
) {
  const [rows, setRows] = useState<AnnualScheduleRowDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchAnnualSchedule(listQuery)
      .then(({ rows: data }) => {
        if (!cancelled) setRows(data);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    listQuery.year,
    listQuery.query,
    listQuery.grade,
    listQuery.reductionType,
    listQuery.serviceType,
    listQuery.workerId,
    listQuery.showAllActive,
    listQuery.groupId,
    listQuery.subgroupId,
    reloadKey,
  ]);

  return { rows, loading };
}
