"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  CUR_MONTH,
  CUR_YEAR,
  type PaymentAssignmentTab,
  type PlanClaimView,
} from "../types";

function parseTab(value: string | null): PaymentAssignmentTab {
  if (value === "monthly") return "monthly";
  if (value === "weekly") return "weekly";
  return "annual";
}

function parseView(value: string | null): PlanClaimView {
  return value === "claim" ? "claim" : "plan";
}

export function usePaymentAssignmentParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab = useMemo(
    () => parseTab(searchParams.get("tab")),
    [searchParams],
  );
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
  const recipient = useMemo(
    () => searchParams.get("recipient") ?? "",
    [searchParams],
  );

  const replaceParams = useCallback(
    (
      patch: Partial<{
        tab: PaymentAssignmentTab;
        year: number;
        month: number;
        view: PlanClaimView;
        recipient: string;
      }>,
    ) => {
      const next = {
        tab,
        year,
        month,
        view,
        recipient,
        ...patch,
      };

      const params = new URLSearchParams();
      params.set("tab", next.tab);
      params.set("year", String(next.year));
      params.set("month", String(next.month));
      params.set("view", next.view);
      if (next.recipient) {
        params.set("recipient", next.recipient);
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, tab, year, month, view, recipient],
  );

  const setTab = useCallback(
    (nextTab: PaymentAssignmentTab) => replaceParams({ tab: nextTab }),
    [replaceParams],
  );

  const setYear = useCallback(
    (nextYear: number) => replaceParams({ year: nextYear }),
    [replaceParams],
  );

  const setMonth = useCallback(
    (nextMonth: number) => replaceParams({ month: nextMonth }),
    [replaceParams],
  );

  const setView = useCallback(
    (nextView: PlanClaimView) => replaceParams({ view: nextView }),
    [replaceParams],
  );

  const setRecipient = useCallback(
    (nextRecipient: string) => replaceParams({ recipient: nextRecipient }),
    [replaceParams],
  );

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const needsSync =
      !searchParams.has("tab") ||
      !searchParams.has("year") ||
      !searchParams.has("month") ||
      !searchParams.has("view");

    if (needsSync) {
      replaceParams({});
    }
  }, [searchParams, replaceParams]);

  return {
    tab,
    year,
    month,
    view,
    recipient,
    setTab,
    setYear,
    setMonth,
    setView,
    setRecipient,
    replaceParams,
  };
}
