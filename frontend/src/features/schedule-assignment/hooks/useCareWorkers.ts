"use client";

import { useEffect, useState } from "react";

import {
  ensureCareWorkersLoaded,
  getCareWorkerName,
  getCareWorkersList,
} from "@/lib/api/careWorkers";
import type { CareWorkerDto } from "@/lib/api/paymentAssignment.types";
import { SEED_CARE_WORKERS } from "@/lib/mock/paymentAssignmentSeed";

export function useCareWorkers() {
  const [workers, setWorkers] = useState<CareWorkerDto[]>(SEED_CARE_WORKERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    ensureCareWorkersLoaded()
      .then((list) => {
        if (!cancelled) setWorkers(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    workers,
    loading,
    getCareWorkerName,
    careWorkers: getCareWorkersList(),
  };
}
