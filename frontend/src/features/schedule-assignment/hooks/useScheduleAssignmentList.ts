"use client";

import { useEffect, useState } from "react";

import { fetchScheduleAssignmentList } from "@/lib/api/scheduleAssignment";
import type { ScheduleAssignmentListItem } from "@/lib/api/scheduleAssignment.types";

import {
  listCacheKey,
  patchListItemCounts,
  readListCache,
  writeListItems,
} from "../utils/recipientListCache";

export function useScheduleAssignmentList(
  year: number,
  month: number,
  showAllActive: boolean,
) {
  const key = listCacheKey(year, month, showAllActive);
  const cached = readListCache(key);

  const [items, setItems] = useState<ScheduleAssignmentListItem[]>(
    () => cached?.items ?? [],
  );
  const [loading, setLoading] = useState(() => !cached);

  useEffect(() => {
    const existing = readListCache(key);
    if (existing) {
      setItems(existing.items);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchScheduleAssignmentList({ year, month, showAllActive })
      .then((list) => {
        if (cancelled) return;
        writeListItems(key, list, showAllActive);
        setItems(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key, year, month, showAllActive]);

  const updateItemCounts = (
    recipientId: string,
    counts: { planCount?: number; claimCount?: number },
  ) => {
    const next = patchListItemCounts(recipientId, counts);
    if (next) setItems(next);
  };

  return {
    items,
    loading,
    updateItemCounts,
  };
}
