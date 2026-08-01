"use client";

import { useEffect, useState } from "react";

import { fetchPaymentAssignmentRecipients } from "@/lib/api/paymentAssignment";
import type {
  PaymentAssignmentListQuery,
  PaymentAssignmentRecipientDto,
} from "@/lib/api/paymentAssignment.types";

export function usePaymentAssignmentRecipients(
  listQuery: PaymentAssignmentListQuery,
) {
  const [recipients, setRecipients] = useState<PaymentAssignmentRecipientDto[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchPaymentAssignmentRecipients(listQuery)
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
  ]);

  return { recipients, loading };
}
