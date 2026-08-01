"use client";

import { useEffect, useState } from "react";

import { fetchRecipientGroups } from "@/lib/api/paymentAssignment";
import type { RecipientGroupDto } from "@/lib/api/paymentAssignment.types";

export function useRecipientGroups() {
  const [groups, setGroups] = useState<RecipientGroupDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchRecipientGroups()
      .then((list) => {
        if (!cancelled) setGroups(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { groups, loading };
}
