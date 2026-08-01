"use client";

import { useEffect, useState } from "react";

import { fetchWeeklySchedule } from "@/lib/api/paymentAssignment";
import type {
  PaymentAssignmentRecipientDto,
  WeeklyCalendarWeekDto,
  WeeklyScheduleEntryDto,
  WeeklyScheduleQuery,
} from "@/lib/api/paymentAssignment.types";

export function useWeeklySchedule(query: WeeklyScheduleQuery | null) {
  const [recipient, setRecipient] = useState<PaymentAssignmentRecipientDto | null>(
    null,
  );
  const [weeks, setWeeks] = useState<WeeklyCalendarWeekDto[]>([]);
  const [entriesByDate, setEntriesByDate] = useState<
    Record<string, WeeklyScheduleEntryDto[]>
  >({});
  const [dayMemos, setDayMemos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query?.recipientId) {
      setRecipient(null);
      setWeeks([]);
      setEntriesByDate({});
      setDayMemos({});
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchWeeklySchedule(query)
      .then((data) => {
        if (cancelled) return;
        setRecipient(data.recipient);
        setWeeks(data.weeks);
        setEntriesByDate(data.entriesByDate);
        setDayMemos(data.dayMemos);
      })
      .catch(() => {
        if (cancelled) return;
        setRecipient(null);
        setWeeks([]);
        setEntriesByDate({});
        setDayMemos({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query?.recipientId, query?.year, query?.scheduleKind]);

  return { recipient, weeks, entriesByDate, dayMemos, loading };
}
