"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart2,
  Bell,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Download,
  FileSignature,
  FileText,
  Heart,
  Home,
  KeyRound,
  LayoutDashboard,
  List,
  Radio,
  Receipt,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import {
  buildFacilityTooltip,
  getFacilityDisplayName,
} from "@/lib/api/session.types";
import { useCurrentFacility } from "@/hooks/useCurrentFacility";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "대시보드" },
  { to: "/payment-assignment", icon: BarChart2, label: "급여일정관리" },
  { to: "/copayment-confirmation", icon: Receipt, label: "본인부담금확정" },
  { to: "/care-plan", icon: ClipboardList, label: "급여제공계획관리" },
  { to: "/consultation", icon: CalendarDays, label: "방문상담관리" },
] as const;

function getBreadcrumbs(pathname: string): string[] {
  if (pathname.startsWith("/schedule-assignment/")) return ["급여일정관리", "일정 배정"];
  if (pathname.startsWith("/payment-assignment")) return ["급여일정관리"];
  if (pathname.startsWith("/copayment-confirmation")) return ["본인부담금확정"];
  if (pathname.startsWith("/care-plan")) return ["급여제공계획관리"];
  if (pathname.startsWith("/consultation")) return ["방문상담관리"];
  return ["대시보드"];
}

const IMPORT_ITEMS = [
  {
    id: "recipient",
    icon: Users,
    label: "공단수급자 가져오기",
    sub: "공단메뉴: 수급자조회",
    needsYm: false,
  },
  {
    id: "worker",
    icon: UserCheck,
    label: "공단종사자 가져오기",
    sub: "공단메뉴: 엑셀다운로드 > 요양보호사정보",
    needsYm: false,
  },
  {
    id: "plan_schedule",
    icon: CalendarCheck,
    label: "공단계획 가져오기",
    sub: "공단메뉴: 엑셀다운로드 > 일정계획",
    needsYm: true,
  },
  {
    id: "plan_contract",
    icon: FileSignature,
    label: "공단계획 가져오기",
    sub: "공단메뉴: 급여계약내용 등록변경",
    needsYm: true,
  },
  {
    id: "claim_excel",
    icon: FileText,
    label: "공단청구 가져오기",
    sub: "공단메뉴: 엑셀다운로드 > 청구내역/상세",
    needsYm: true,
  },
  {
    id: "claim_list",
    icon: List,
    label: "공단청구 가져오기",
    sub: "공단메뉴: 청구서목록조회",
    needsYm: true,
  },
  {
    id: "rfid",
    icon: Radio,
    label: "공단RFID 가져오기",
    sub: "공단메뉴: 엑셀다운로드 > RFID전송내용",
    needsYm: true,
  },
  {
    id: "changes",
    icon: Bell,
    label: "공단변경내역 가져오기",
    sub: "공단메뉴: 확인사항 조회",
    needsYm: false,
  },
] as const;

type CertInfo = {
  name: string;
  expiry: string;
  subject?: string;
  issuer?: string;
};

const MOCK_CERTS: CertInfo[] = [
  {
    name: "즐거운재가센터",
    subject: "CN=즐거운재가센터, OU=사업자, O=즐거운재가센터, C=KR",
    issuer: "SignKorea CA Class 2",
    expiry: "2026-11-30",
  },
  {
    name: "즐거운재가센터(백업)",
    subject: "CN=즐거운재가센터, OU=사업자, O=즐거운재가센터, C=KR",
    issuer: "yessignCA Class 2",
    expiry: "2025-12-31",
  },
  {
    name: "홍길동(대표자)",
    subject: "CN=홍길동, OU=개인, O=한국정보인증, C=KR",
    issuer: "KICA Class 1",
    expiry: "2027-03-15",
  },
];

type SelectedItem = (typeof IMPORT_ITEMS)[number];

function isNavActive(pathname: string, to: string): boolean {
  if (to === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(to);
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { facility, loading: facilityLoading, sessionDisplayName } =
    useCurrentFacility();
  const facilityDisplayName =
    sessionDisplayName ??
    (facility
      ? getFacilityDisplayName(facility)
      : facilityLoading
        ? "…"
        : "사업장");
  const facilityTooltip = facility
    ? buildFacilityTooltip(facility)
    : "로그인한 사업장 정보를 불러올 수 없습니다.";
  const crumbs = getBreadcrumbs(pathname);
  const [importOpen, setImportOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const now = new Date();
  const [ymYear, setYmYear] = useState(String(now.getFullYear()));
  const [ymMonth, setYmMonth] = useState(
    String(now.getMonth() + 1).padStart(2, "0"),
  );

  const [cert, setCert] = useState<CertInfo | null>(null);
  const [certPickerOpen, setCertPickerOpen] = useState(false);
  const [pickedCert, setPickedCert] = useState<CertInfo | null>(null);
  const [certPassword, setCertPassword] = useState("");

  const certExpired = cert ? new Date(cert.expiry) < new Date() : false;
  const certDaysLeft = cert
    ? Math.ceil((new Date(cert.expiry).getTime() - Date.now()) / 86400000)
    : 0;

  const openItem = (item: SelectedItem) => {
    setSelectedItem(item);
    setImportOpen(false);
  };

  const closeDetail = () => {
    setSelectedItem(null);
    setPickedCert(null);
    setCertPassword("");
    setCertPickerOpen(false);
  };

  const saveCert = () => {
    if (!pickedCert || !certPassword) return;
    setCert(pickedCert);
    setPickedCert(null);
    setCertPassword("");
    setCertPickerOpen(false);
  };

  useEffect(() => {
    if (!importOpen) return;
    const fn = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setImportOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [importOpen]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          height: 44,
          flexShrink: 0,
          background: "linear-gradient(90deg, #0f2744 0%, #1a3a5c 100%)",
          display: "flex",
          alignItems: "center",
          paddingLeft: 16,
          paddingRight: 16,
          gap: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginRight: 16,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              flexShrink: 0,
              background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Heart size={13} color="white" />
          </div>
          <div
            style={{ lineHeight: 1, cursor: "help" }}
            title={facilityTooltip}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "white" }}>
              한케어 급여제공(일정)관리
            </div>
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.4)",
                marginTop: 2,
              }}
            >
              {facilityDisplayName}
            </div>
          </div>
        </div>

        <div
          style={{
            width: 1,
            height: 20,
            background: "rgba(255,255,255,0.1)",
            marginRight: 12,
          }}
        />

        <nav style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = isNavActive(pathname, to);
            return (
              <Link
                key={to}
                href={to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  height: 28,
                  paddingLeft: 10,
                  paddingRight: 10,
                  borderRadius: 6,
                  fontSize: 12,
                  textDecoration: "none",
                  transition: "background 0.15s, color 0.15s, border-color 0.15s",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(59,130,246,0.38), rgba(37,99,235,0.28))"
                    : "transparent",
                  border: isActive
                    ? "1px solid rgba(59,130,246,0.4)"
                    : "1px solid transparent",
                  color: isActive ? "#ffffff" : "rgba(147,197,253,0.55)",
                }}
              >
                <Icon size={13} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div ref={popupRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setImportOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              height: 28,
              paddingLeft: 11,
              paddingRight: 11,
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              background: importOpen
                ? "linear-gradient(135deg,#16a34a,#15803d)"
                : "linear-gradient(135deg,#22c55e,#16a34a)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "#ffffff",
              boxShadow: "0 1px 4px rgba(22,163,74,0.45)",
              whiteSpace: "nowrap",
            }}
          >
            <Download size={12} />
            <span>공단일정 가져오기</span>
          </button>

          {importOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                zIndex: 2000,
                background: "#ffffff",
                borderRadius: 8,
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                border: "1px solid #e2e8f0",
                width: 320,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "linear-gradient(135deg,#0f2744,#1a3a5c)",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Download size={12} color="#86efac" />
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: "#ffffff" }}
                  >
                    공단 데이터 가져오기
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setImportOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.5)",
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  <X size={13} />
                </button>
              </div>

              <div style={{ padding: "6px 0" }}>
                {IMPORT_ITEMS.map(({ id, icon: Icon, label, sub }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      openItem(IMPORT_ITEMS.find((i) => i.id === id)!)
                    }
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 14px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f0fdf4";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "none";
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        flexShrink: 0,
                        background: "#dcfce7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={13} color="#16a34a" />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#94a3b8",
                          marginTop: 1,
                        }}
                      >
                        {sub}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <div
        style={{
          height: 26,
          flexShrink: 0,
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          paddingLeft: 16,
          paddingRight: 16,
          gap: 4,
        }}
      >
        <Home size={10} color="#94a3b8" />
        <ChevronRight size={10} color="#94a3b8" />
        {crumbs.map((crumb, i) => (
          <span
            key={crumb}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            {i > 0 && <ChevronRight size={9} color="#94a3b8" />}
            <span
              style={{
                fontSize: 10,
                color: i === crumbs.length - 1 ? "#1e293b" : "#64748b",
                fontWeight: i === crumbs.length - 1 ? 600 : 400,
              }}
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      <main style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {children}
      </main>

      {selectedItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 3000,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={closeDetail}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              width: 440,
              boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "linear-gradient(135deg,#0f2744,#1a3a5c)",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: "rgba(134,239,172,0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <selectedItem.icon size={14} color="#86efac" />
                </div>
                <div>
                  <div
                    style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}
                  >
                    {selectedItem.label}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.45)",
                      marginTop: 1,
                    }}
                  >
                    {selectedItem.sub}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.45)",
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div
              style={{
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {selectedItem.needsYm && (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#475569",
                      marginBottom: 7,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <CalendarDays size={12} color="#3b82f6" />
                    급여제공연월
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <select
                      value={ymYear}
                      onChange={(e) => setYmYear(e.target.value)}
                      style={{
                        padding: "5px 8px",
                        fontSize: 13,
                        border: "1px solid #cbd5e1",
                        borderRadius: 5,
                        outline: "none",
                        color: "#0f172a",
                      }}
                    >
                      {[2023, 2024, 2025, 2026, 2027].map((y) => (
                        <option key={y} value={String(y)}>
                          {y}년
                        </option>
                      ))}
                    </select>
                    <select
                      value={ymMonth}
                      onChange={(e) => setYmMonth(e.target.value)}
                      style={{
                        padding: "5px 8px",
                        fontSize: 13,
                        border: "1px solid #cbd5e1",
                        borderRadius: 5,
                        outline: "none",
                        color: "#0f172a",
                      }}
                    >
                      {Array.from({ length: 12 }, (_, i) =>
                        String(i + 1).padStart(2, "0"),
                      ).map((m) => (
                        <option key={m} value={m}>
                          {Number(m)}월
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      {ymYear}년 {Number(ymMonth)}월
                    </span>
                  </div>
                </div>
              )}

              <div style={{ height: 1, background: "#f1f5f9" }} />

              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#475569",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <KeyRound size={12} color="#f59e0b" />
                  공인인증서
                </div>

                {cert ? (
                  <div
                    style={{
                      background: certExpired ? "#fff7ed" : "#f0fdf4",
                      border: `1px solid ${certExpired ? "#fed7aa" : "#bbf7d0"}`,
                      borderRadius: 7,
                      padding: "10px 12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 7 }}
                      >
                        {certExpired ? (
                          <ShieldAlert size={16} color="#f97316" />
                        ) : (
                          <ShieldCheck size={16} color="#16a34a" />
                        )}
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#0f172a",
                            }}
                          >
                            {cert.name}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              marginTop: 2,
                              color: certExpired
                                ? "#c2410c"
                                : certDaysLeft <= 30
                                  ? "#b45309"
                                  : "#15803d",
                            }}
                          >
                            유효기간: {cert.expiry}
                            {certExpired ? " · 만료됨" : ` · D-${certDaysLeft}`}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCert(null)}
                        style={{
                          fontSize: 10,
                          color: "#94a3b8",
                          background: "none",
                          border: "1px solid #e2e8f0",
                          borderRadius: 4,
                          padding: "2px 7px",
                          cursor: "pointer",
                        }}
                      >
                        변경
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        background: "#fafafa",
                        border: "1px solid #e2e8f0",
                        borderRadius: 7,
                        padding: "10px 12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        등록된 공인인증서가 없습니다. 인증서를 조회하여 선택하고
                        비밀번호를 입력하세요.
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setCertPickerOpen(true)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            border: "1px solid #3b82f6",
                            borderRadius: 5,
                            background: "#eff6ff",
                            cursor: "pointer",
                            color: "#1d4ed8",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Search size={12} />
                          인증서 조회
                        </button>
                        {pickedCert ? (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#0f172a",
                            }}
                          >
                            {pickedCert.name}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>
                            인증서를 선택하세요
                          </span>
                        )}
                      </div>

                      <input
                        type="password"
                        placeholder="인증서 비밀번호"
                        value={certPassword}
                        onChange={(e) => setCertPassword(e.target.value)}
                        style={{
                          padding: "6px 10px",
                          fontSize: 12,
                          border: "1px solid #cbd5e1",
                          borderRadius: 5,
                          outline: "none",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                      />
                      <button
                        type="button"
                        onClick={saveCert}
                        disabled={!pickedCert || !certPassword}
                        style={{
                          padding: "5px 12px",
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 5,
                          cursor:
                            pickedCert && certPassword
                              ? "pointer"
                              : "not-allowed",
                          border: "none",
                          background:
                            pickedCert && certPassword
                              ? "linear-gradient(135deg,#f59e0b,#d97706)"
                              : "#f1f5f9",
                          color:
                            pickedCert && certPassword ? "#fff" : "#94a3b8",
                          alignSelf: "flex-start",
                        }}
                      >
                        인증서 등록
                      </button>
                    </div>

                    {certPickerOpen && (
                      <div
                        style={{
                          position: "fixed",
                          inset: 0,
                          zIndex: 4000,
                          background: "rgba(0,0,0,0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onClick={() => setCertPickerOpen(false)}
                      >
                        <div
                          style={{
                            background: "#fff",
                            borderRadius: 9,
                            width: 480,
                            boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
                            overflow: "hidden",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            style={{
                              background:
                                "linear-gradient(135deg,#1e3a5f,#1a3a5c)",
                              padding: "11px 16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                              }}
                            >
                              <KeyRound size={13} color="#fde68a" />
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: "#fff",
                                }}
                              >
                                공인인증서 선택
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCertPickerOpen(false)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "rgba(255,255,255,0.5)",
                                padding: 0,
                              }}
                            >
                              <X size={13} />
                            </button>
                          </div>

                          <div style={{ padding: "8px 0" }}>
                            {MOCK_CERTS.map((c, i) => {
                              const exp = new Date(c.expiry) < new Date();
                              const days = Math.ceil(
                                (new Date(c.expiry).getTime() - Date.now()) /
                                  86400000,
                              );
                              const isSelected = pickedCert?.name === c.name;
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    setPickedCert(c);
                                    setCertPickerOpen(false);
                                  }}
                                  style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "10px 16px",
                                    background: isSelected ? "#eff6ff" : "none",
                                    border: "none",
                                    borderBottom: "1px solid #f1f5f9",
                                    cursor: "pointer",
                                    textAlign: "left",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isSelected) {
                                      e.currentTarget.style.background =
                                        "#f8fafc";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isSelected) {
                                      e.currentTarget.style.background = "none";
                                    }
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: 7,
                                      background: exp ? "#fff7ed" : "#f0fdf4",
                                      border: `1px solid ${exp ? "#fed7aa" : "#bbf7d0"}`,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {exp ? (
                                      <ShieldAlert size={16} color="#f97316" />
                                    ) : (
                                      <ShieldCheck size={16} color="#16a34a" />
                                    )}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: "#0f172a",
                                      }}
                                    >
                                      {c.name}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 10,
                                        color: "#64748b",
                                        marginTop: 1,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {c.subject}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 10,
                                        color: "#94a3b8",
                                        marginTop: 1,
                                      }}
                                    >
                                      발급기관: {c.issuer}
                                    </div>
                                  </div>
                                  <div
                                    style={{ textAlign: "right", flexShrink: 0 }}
                                  >
                                    <div
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: exp
                                          ? "#f97316"
                                          : days <= 30
                                            ? "#b45309"
                                            : "#15803d",
                                      }}
                                    >
                                      {exp ? "만료" : `D-${days}`}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 10,
                                        color: "#94a3b8",
                                        marginTop: 1,
                                      }}
                                    >
                                      {c.expiry}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <div
                            style={{
                              padding: "10px 16px",
                              borderTop: "1px solid #f1f5f9",
                              display: "flex",
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setCertPickerOpen(false)}
                              style={{
                                padding: "5px 16px",
                                fontSize: 12,
                                borderRadius: 5,
                                border: "1px solid #e2e8f0",
                                background: "#f8fafc",
                                color: "#64748b",
                                cursor: "pointer",
                              }}
                            >
                              닫기
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div
              style={{
                padding: "10px 18px",
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={closeDetail}
                style={{
                  padding: "6px 16px",
                  fontSize: 12,
                  borderRadius: 5,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                type="button"
                disabled={!cert}
                style={{
                  padding: "6px 20px",
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 5,
                  border: "none",
                  background: cert
                    ? "linear-gradient(135deg,#22c55e,#16a34a)"
                    : "#f1f5f9",
                  color: cert ? "#fff" : "#94a3b8",
                  cursor: cert ? "pointer" : "not-allowed",
                  boxShadow: cert ? "0 2px 6px rgba(22,163,74,0.3)" : "none",
                }}
              >
                가져오기 실행
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
