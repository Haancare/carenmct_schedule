"use client";

import { useEffect, useState } from "react";

import AnnualExcelUploadControls from "./components/AnnualExcelUploadControls";
import PaymentAssignmentFilterBar from "./components/PaymentAssignmentFilterBar";
import { buildPaymentAssignmentListQuery } from "./hooks/buildPaymentAssignmentListQuery";
import { usePaymentAssignmentFilters } from "./hooks/usePaymentAssignmentFilters";
import { usePaymentAssignmentParams } from "./hooks/usePaymentAssignmentParams";
import { usePaymentAssignmentRecipients } from "./hooks/usePaymentAssignmentRecipients";
import { useRecipientGroups } from "./hooks/useRecipientGroups";
import PaymentAssignmentTabBar from "./PaymentAssignmentTabBar";
import {
  PaymentAssignmentProvider,
  type PaymentAssignmentContextValue,
} from "./context/PaymentAssignmentContext";
import AnnualScheduleTab from "./tabs/AnnualScheduleTab";
import MonthlyScheduleTab from "./tabs/MonthlyScheduleTab";
import WeeklyScheduleTab from "./tabs/WeeklyScheduleTab";

export default function PaymentAssignmentPage() {
  const { tab, year, month, view, recipient, setTab, setYear } =
    usePaymentAssignmentParams();
  const filters = usePaymentAssignmentFilters();
  const listQuery = buildPaymentAssignmentListQuery(year, filters);
  const { recipients, loading: recipientsLoading } =
    usePaymentAssignmentRecipients(listQuery);
  const { groups: recipientGroups, loading: recipientGroupsLoading } =
    useRecipientGroups();

  const [flashId, setFlashId] = useState(recipient);
  const [annualReloadKey, setAnnualReloadKey] = useState(0);
  const [monthlyTotalCount, setMonthlyTotalCount] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!recipient) return;
    setFlashId(recipient);
    const timer = setTimeout(() => setFlashId(""), 3000);
    return () => clearTimeout(timer);
  }, [recipient]);

  useEffect(() => {
    if (recipientGroupsLoading) return;
    if (filters.selGroup === "all") return;
    const exists = recipientGroups.some((g) => g.id === filters.selGroup);
    if (!exists) {
      filters.setSelGroup("all");
      filters.setSelSubGroup("all");
    }
  }, [
    recipientGroups,
    recipientGroupsLoading,
    filters.selGroup,
    filters.setSelGroup,
    filters.setSelSubGroup,
  ]);

  const contextValue: PaymentAssignmentContextValue = {
    year,
    month,
    view,
    recipient,
    flashId,
    filtered: recipients,
    recipientsLoading,
    recipientGroups,
    recipientGroupsLoading,
    listQuery,
    filters,
    annualReloadKey,
    monthlyTotalCount,
    setMonthlyTotalCount,
  };

  const filterTotalCount =
    tab === "monthly" && monthlyTotalCount != null
      ? monthlyTotalCount
      : recipients.length;

  return (
    <PaymentAssignmentProvider value={contextValue}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          background: "#f0f4f8",
        }}
      >
        <PaymentAssignmentTabBar tab={tab} onTabChange={setTab} />

        {tab !== "weekly" && (
          <PaymentAssignmentFilterBar
            year={year}
            onYearChange={setYear}
            filters={filters}
            totalCount={filterTotalCount}
          />
        )}

        {tab === "annual" && (
          <AnnualExcelUploadControls
            onImported={() => setAnnualReloadKey((v) => v + 1)}
          />
        )}

        {tab === "annual" && <AnnualScheduleTab />}
        {tab === "monthly" && <MonthlyScheduleTab />}
        {tab === "weekly" && <WeeklyScheduleTab />}
      </div>
    </PaymentAssignmentProvider>
  );
}
