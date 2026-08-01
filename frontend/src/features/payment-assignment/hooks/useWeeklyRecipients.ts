"use client";

import { useEffect, useState } from "react";

import { fetchWeeklyRecipients } from "@/lib/api/paymentAssignment";
import type {
  PaymentAssignmentRecipientDto,
  WeeklyRecipientListQuery,
} from "@/lib/api/paymentAssignment.types";

export function useWeeklyRecipients(query: WeeklyRecipientListQuery) {
  const [recipients, setRecipients] = useState<PaymentAssignmentRecipientDto[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchWeeklyRecipients(query)
      .then(({ recipients: data }) => {
        if (!cancelled) setRecipients(data);
      })
      .catch(() => {
        if (!cancelled) setRecipients([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query.year, query.query, query.contractStatus, query.groupId, query.subgroupId]);

  return { recipients, loading };
}
