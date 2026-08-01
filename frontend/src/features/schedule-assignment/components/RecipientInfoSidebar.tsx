"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, User } from "lucide-react";

import type { CareWorkerDto } from "@/lib/api/paymentAssignment.types";
import type {
  ScheduleAssignmentEntry,
  ScheduleAssignmentRecipient,
  SchedulePaymentStatusDto,
} from "@/lib/api/scheduleAssignment.types";
import { reductionPillDisplay } from "@/features/payment-assignment/utils/recipientDisplay";

import { SERVICE_TYPE_LABELS, SVC_STYLE, type PlanClaimView } from "../constants";
import { formatKrw } from "../utils/calendar";
import { resolveMonthAssignedWorkers } from "../utils/monthAssignedWorkers";
import ContactModal from "./ContactModal";

type Props = {
  recipient: ScheduleAssignmentRecipient;
  paymentStatus: SchedulePaymentStatusDto;
  view: PlanClaimView;
  schedules: ScheduleAssignmentEntry[];
  careWorkers: CareWorkerDto[];
  onViewWorkerSchedule?: (workerId: string) => void;
  addFormSlot?: React.ReactNode;
};

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 8,
        boxShadow: "0 0 0 1px #e2e8f0",
        padding: "8px 10px",
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: "#94a3b8",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: 6,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function RecipientInfoSidebar({
  recipient,
  paymentStatus,
  view,
  schedules,
  careWorkers,
  onViewWorkerSchedule,
  addFormSlot,
}: Props) {
  const [contactOpen, setContactOpen] = useState(false);
  const isLow = paymentStatus.remaining < 300_000;

  const assignedWorkers = useMemo(
    () => resolveMonthAssignedWorkers(schedules, "plan", careWorkers),
    [schedules, careWorkers],
  );

  return (
    <>
      <aside
        style={{
          width: 200,
          flexShrink: 0,
          borderRight: "1px solid #e2e8f0",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            borderBottom: "1px solid #e2e8f0",
            background: "#ffffff",
          }}
        >
          <Link
            href="/payment-assignment"
            style={{
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #e2e8f0",
              borderRadius: 5,
              backgroundColor: "#f8fafc",
            }}
          >
            <ArrowLeft size={11} color="#64748b" />
          </Link>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>
            일정 배정
          </span>
        </div>

        <div
          style={{
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            flex: 1,
          }}
        >
          <InfoCard>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingBottom: 8,
                borderBottom: "1px solid #e2e8f0",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: "#dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <User size={12} color="#1d4ed8" />
              </div>
              <div>
                <div
                  style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}
                >
                  {recipient.name}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  {recipient.certNo || "-"}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  background: "#dbeafe",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontWeight: 700,
                }}
              >
                {recipient.gradeText}
              </span>
              <span
                style={{
                  background: "#f8fafc",
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontWeight: 600,
                }}
              >
                {reductionPillDisplay(recipient.reduction)}
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#94a3b8",
                display: "flex",
                gap: 4,
                alignItems: "center",
              }}
            >
              <span>{recipient.validFrom ?? "-"}</span>
              <span>~</span>
              <span>{recipient.validTo ?? "-"}</span>
            </div>
          </InfoCard>

          <InfoCard>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                padding: "5px 0",
                borderRadius: 5,
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
                color: "#1d4ed8",
                background: "#eff6ff",
                border: "none",
                borderBottom: "1px solid #bfdbfe",
              }}
            >
              <Phone size={11} color="#1d4ed8" />
              연락처 보기
            </button>
          </InfoCard>

          <InfoCard>
            <SectionTitle>급여제공(일정배정)직원</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {assignedWorkers.map((w) => (
                <div
                  key={w.id}
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#0f172a",
                      flexShrink: 0,
                    }}
                  >
                    {w.name}
                  </span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    {w.birth?.trim() || "-"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onViewWorkerSchedule?.(w.id)}
                    style={{
                      marginLeft: "auto",
                      fontSize: 10,
                      padding: "2px 7px",
                      borderRadius: 4,
                      cursor: "pointer",
                      border: "1px solid #e2e8f0",
                      background: "#f1f5f9",
                      color: "#64748b",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    일정조회
                  </button>
                </div>
              ))}
              {assignedWorkers.length === 0 && (
                <div style={{ fontSize: 11, color: "#cbd5e1" }}>
                  이번 달 계획 일정에 배정된 직원이 없습니다.
                </div>
              )}
            </div>
          </InfoCard>

          <InfoCard>
            <SectionTitle>제공서비스</SectionTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {recipient.serviceTypes.length === 0 ? (
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  등록된 제공서비스 없음
                </span>
              ) : (
                recipient.serviceTypes.map((svc) => {
                  const c = SVC_STYLE[svc] ?? SVC_STYLE.visit_care;
                  return (
                    <span
                      key={svc}
                      style={{
                        background: c.bg,
                        color: c.color,
                        border: `1px solid ${c.border}`,
                        fontSize: 11,
                        padding: "1px 6px",
                        borderRadius: 3,
                        fontWeight: 600,
                      }}
                    >
                      {SERVICE_TYPE_LABELS[svc] ?? svc}
                    </span>
                  );
                })
              )}
            </div>
          </InfoCard>

          <InfoCard>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <SectionTitle style={{ marginBottom: 0 }}>급여 현황</SectionTitle>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "1px 5px",
                  borderRadius: 3,
                  background: view === "plan" ? "#dbeafe" : "#d1fae5",
                  color: view === "plan" ? "#1e40af" : "#065f46",
                  border: `1px solid ${view === "plan" ? "#93c5fd" : "#6ee7b7"}`,
                }}
              >
                {view === "plan" ? "계획기준" : "청구기준"}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <StatRow
                label="급여한도"
                value={formatKrw(paymentStatus.monthlyLimit)}
              />
              <StatRow
                label="기사용액"
                value={formatKrw(paymentStatus.activeUsed)}
                color={view === "claim" ? "#065f46" : undefined}
                bold={view === "claim"}
              />
              <StatRow
                label="잔액"
                value={formatKrw(paymentStatus.remaining)}
                color={isLow ? "#dc2626" : "#059669"}
                bold
              />
              <div
                style={{
                  height: 5,
                  background: "#e4eaf3",
                  borderRadius: 3,
                  overflow: "hidden",
                  marginTop: 2,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 3,
                    width: `${paymentStatus.usageRate}%`,
                    background: isLow
                      ? "#dc2626"
                      : view === "claim"
                        ? "linear-gradient(90deg, #059669, #10b981)"
                        : "#2563eb",
                    transition: "width 0.3s ease, background 0.3s ease",
                  }}
                />
              </div>
              <div
                style={{
                  textAlign: "right",
                  fontSize: 12,
                  color: view === "claim" ? "#059669" : "#94a3b8",
                  fontWeight: view === "claim" ? 600 : 400,
                }}
              >
                {paymentStatus.usageRate.toFixed(1)}%{" "}
                {view === "claim" ? "청구" : "사용"}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: 4,
                }}
              >
                <span style={{ color: "#94a3b8" }}>본인부담</span>
                <span
                  style={{
                    color: view === "claim" ? "#065f46" : "#64748b",
                    fontWeight: view === "claim" ? 600 : 400,
                    fontSize: 13,
                  }}
                >
                  {formatKrw(paymentStatus.activeSelfPay)}
                </span>
              </div>
              {paymentStatus.limitExcess > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "#dc2626" }}>한도초과액</span>
                  <span
                    style={{
                      color: "#dc2626",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {formatKrw(paymentStatus.limitExcess)}
                  </span>
                </div>
              )}
              {paymentStatus.serviceAmounts.length > 0 && (
                <div
                  style={{
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: 4,
                    marginTop: 2,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "#94a3b8",
                      marginBottom: 2,
                    }}
                  >
                    서비스별 급여금액
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    {paymentStatus.serviceAmounts.map(({ label, amount }) => (
                      <div
                        key={label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11,
                        }}
                      >
                        <span style={{ color: "#64748b" }}>{label}</span>
                        <span style={{ color: "#1e293b" }}>
                          {formatKrw(amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </InfoCard>

          {addFormSlot}
        </div>
      </aside>

      <ContactModal
        recipientName={recipient.name}
        mobile={recipient.mobile}
        contacts={recipient.contacts}
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </>
  );
}

function StatRow({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 12,
      }}
    >
      <span style={{ color: "#94a3b8" }}>{label}</span>
      <span
        style={{
          color: color ?? "#1e293b",
          fontWeight: bold ? 600 : 400,
          fontSize: 13,
        }}
      >
        {value}
      </span>
    </div>
  );
}
