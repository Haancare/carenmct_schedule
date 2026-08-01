"use client";

import { useEffect, useState } from "react";

import { fetchMonthlySchedule } from "@/lib/api/paymentAssignment";
import type {
  MonthlyScheduleQuery,
  MonthlyScheduleRowDto,
} from "@/lib/api/paymentAssignment.types";

export function useMonthlySchedule(query: MonthlyScheduleQuery) {
  const [rows, setRows] = useState<MonthlyScheduleRowDto[]>([]);
  const [lastDay, setLastDay] = useState(31);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchMonthlySchedule(query)
      .then(({ rows: data, lastDay: day, totalCount: total }) => {
        if (!cancelled) {
          setRows(data);
          setLastDay(day);
          setTotalCount(total);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRows([]);
          setLastDay(new Date(query.year, query.month, 0).getDate());
          setTotalCount(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    query.year,
    query.month,
    query.scheduleKind,
    query.query,
    query.grade,
    query.reductionType,
    query.serviceType,
    query.workerId,
    query.showAllActive,
    query.groupId,
    query.subgroupId,
  ]);

  return { rows, lastDay, totalCount, loading };
}
