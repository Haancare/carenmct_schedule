"use client";

import { useEffect, useState } from "react";

import {
  fetchScheduleAssignmentMonth,
  fetchScheduleYearMonthCounts,
} from "@/lib/api/scheduleAssignment";
import type { ScheduleAssignmentMonthResponse } from "@/lib/api/scheduleAssignment.types";
import type { ScheduleYearMonthCounts } from "@/lib/api/scheduleAssignment.types";
import type { ScheduleKind } from "@/lib/api/paymentAssignment.types";

export function useScheduleAssignmentMonth(
  recipientId: string,
  year: number,
  month: number,
  scheduleKind: ScheduleKind,
  reloadToken = 0,
) {
  const [data, setData] = useState<ScheduleAssignmentMonthResponse | null>(
    null,
  );
  const [yearMonthCounts, setYearMonthCounts] =
    useState<ScheduleYearMonthCounts>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const isInitial = data === null;
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    setError(null);

    Promise.all([
      fetchScheduleAssignmentMonth(recipientId, year, month, scheduleKind),
      fetchScheduleYearMonthCounts(recipientId, year),
    ])
      .then(([detail, counts]) => {
        if (cancelled) return;
        if (!detail) {
          setError("수급자를 찾을 수 없습니다.");
          setData(null);
        } else {
          setData(detail);
        }
        setYearMonthCounts(counts);
      })
      .catch(() => {
        if (!cancelled) setError("데이터를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reloadToken triggers refetch
  }, [recipientId, year, month, scheduleKind, reloadToken]);

  return { data, yearMonthCounts, loading, refreshing, error };
}
