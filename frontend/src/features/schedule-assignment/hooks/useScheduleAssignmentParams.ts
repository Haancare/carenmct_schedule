"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CUR_MONTH, CUR_YEAR, type PlanClaimView } from "../constants";

function parseView(value: string | null): PlanClaimView {
  return value === "claim" ? "claim" : "plan";
}

export function useScheduleAssignmentParams(recipientId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const year = useMemo(
    () => parseInt(searchParams.get("year") ?? String(CUR_YEAR), 10),
    [searchParams],
  );
  const month = useMemo(
    () => parseInt(searchParams.get("month") ?? String(CUR_MONTH), 10),
    [searchParams],
  );
  const view = useMemo(
    () => parseView(searchParams.get("view")),
    [searchParams],
  );

  const replaceParams = useCallback(
    (
      patch: Partial<{ year: number; month: number; view: PlanClaimView }>,
    ) => {
      const next = { year, month, view, ...patch };
      const params = new URLSearchParams();
      params.set("year", String(next.year));
      params.set("month", String(next.month));
      params.set("view", next.view);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, year, month, view],
  );

  const setYear = useCallback(
    (y: number) => replaceParams({ year: y }),
    [replaceParams],
  );
  const setMonth = useCallback(
    (m: number) => replaceParams({ month: m }),
    [replaceParams],
  );
  const setView = useCallback(
    (v: PlanClaimView) => replaceParams({ view: v }),
    [replaceParams],
  );

  const navigateRecipient = useCallback(
    (id: string) => {
      const params = new URLSearchParams();
      params.set("year", String(year));
      params.set("month", String(month));
      params.set("view", view);
      router.push(`/schedule-assignment/${id}?${params.toString()}`, {
        scroll: false,
      });
    },
    [router, year, month, view],
  );

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (
      !searchParams.has("year") ||
      !searchParams.has("month") ||
      !searchParams.has("view")
    ) {
      replaceParams({});
    }
  }, [searchParams, replaceParams]);

  return {
    recipientId,
    year,
    month,
    view,
    setYear,
    setMonth,
    setView,
    navigateRecipient,
    replaceParams,
  };
}
