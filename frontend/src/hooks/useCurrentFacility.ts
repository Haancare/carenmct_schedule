"use client";

import { useEffect, useState } from "react";

import { fetchCurrentFacility } from "@/lib/api/session";
import type { CurrentFacilityDto } from "@/lib/api/session.types";
import { getUserSession } from "@/lib/auth/user-session";

export function useCurrentFacility() {
  const [facility, setFacility] = useState<CurrentFacilityDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionDisplayName, setSessionDisplayName] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const user = getUserSession();
    setSessionDisplayName(user?.facilityName?.trim() || null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchCurrentFacility()
      .then((data) => {
        if (!cancelled) setFacility(data);
      })
      .catch(() => {
        if (!cancelled) setFacility(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { facility, loading, sessionDisplayName };
}
