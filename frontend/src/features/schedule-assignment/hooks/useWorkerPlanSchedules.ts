"use client";

import { useEffect, useState } from "react";

import {
  fetchWorkerMonthSchedules,
  type WorkerScheduleEntry,
} from "@/lib/api/scheduleAssignment";

export function useWorkerPlanSchedules(
  workerId: string | null | undefined,
  year: number,
  month: number,
  enabled: boolean,
  reloadToken = 0,
) {
  const [entries, setEntries] = useState<WorkerScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !workerId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchWorkerMonthSchedules(workerId, year, month, "plan")
      .then((list) => {
        if (!cancelled) setEntries(list);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [workerId, year, month, enabled, reloadToken]);

  return { entries, loading };
}
