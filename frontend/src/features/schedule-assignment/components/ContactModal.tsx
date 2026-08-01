"use client";

import { Phone, X } from "lucide-react";

import type { ScheduleAssignmentContactDto } from "@/lib/api/scheduleAssignment.types";

type Props = {
  recipientName: string;
  mobile?: string;
  contacts: ScheduleAssignmentContactDto[];
  open: boolean;
  onClose: () => void;
};

function PhoneCell({ phone }: { phone?: string | null }) {
  return (
    <span
      style={{
        fontSize: 13,
        color: "#0f172a",
        marginLeft: "auto",
      }}
    >
      {phone?.trim() ? phone : <span style={{ color: "#94a3b8" }}>-</span>}
    </span>
  );
}

export default function ContactModal({
  recipientName,
  mobile,
  contacts,
  open,
  onClose,
}: Props) {
  if (!open) return null;

  const selfContact = contacts.find((c) => c.role === "self");
  const guardians = contacts.filter((c) => c.role === "guardian");
  const workers = contacts.filter((c) => c.role === "worker");
  const selfPhone = selfContact?.phone ?? mobile;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15,39,68,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          width: 420,
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 8px 32px rgba(15,39,68,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid #e2e8f0",
            background: "linear-gradient(90deg,#0f2744,#1a3a5c)",
            borderRadius: "10px 10px 0 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Phone size={13} color="#93c5fd" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
              연락처 정보
            </span>
            <span
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.5)",
                marginLeft: 2,
              }}
            >
              {recipientName}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
          >
            <X size={15} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        <div
          style={{
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 0",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#0f172a",
                minWidth: 80,
              }}
            >
              {recipientName}
            </span>
            <span
              style={{
                fontSize: 11,
                padding: "1px 6px",
                borderRadius: 3,
                background: "#eff6ff",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe",
                flexShrink: 0,
              }}
            >
              본인
            </span>
            <PhoneCell phone={selfPhone} />
          </div>

          {guardians.map((g, i) => (
            <div
              key={`guardian-${g.name}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 0",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#0f172a",
                  minWidth: 80,
                }}
              >
                {g.name}
                {g.relation && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      fontWeight: 400,
                      marginLeft: 4,
                    }}
                  >
                    ({g.relation})
                  </span>
                )}
              </span>
              <span
                style={{
                  fontSize: 11,
                  padding: "1px 6px",
                  borderRadius: 3,
                  background: "#f0fdf4",
                  color: "#16a34a",
                  border: "1px solid #bbf7d0",
                  flexShrink: 0,
                }}
              >
                보호자
              </span>
              <PhoneCell phone={g.phone} />
            </div>
          ))}

          {workers.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#94a3b8",
                  padding: "8px 0 4px",
                  letterSpacing: "0.04em",
                }}
              >
                급여제공직원
              </div>
              {workers.map((w, i) => (
                <div
                  key={`worker-${w.name}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#0f172a",
                      minWidth: 80,
                    }}
                  >
                    {w.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "1px 6px",
                      borderRadius: 3,
                      background: "#faf5ff",
                      color: "#7c3aed",
                      border: "1px solid #e9d5ff",
                      flexShrink: 0,
                    }}
                  >
                    직원
                  </span>
                  <PhoneCell phone={w.phone} />
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
