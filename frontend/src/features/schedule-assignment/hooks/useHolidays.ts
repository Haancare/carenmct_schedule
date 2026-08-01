"use client";

import { useEffect, useState } from "react";

import {
  ensureHolidaysLoaded,
  getHolidayDateSet,
} from "@/lib/api/holidays";

export function useHolidays(year: number) {
  const [holidayDates, setHolidayDates] = useState<Set<string>>(() =>
    getHolidayDateSet(year),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    ensureHolidaysLoaded(year)
      .then((dates) => {
        if (!cancelled) setHolidayDates(dates);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  return { holidayDates, loading };
}
