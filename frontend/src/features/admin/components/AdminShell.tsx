"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  ChevronRight,
  DollarSign,
  Home,
  LayoutDashboard,
  LogOut,
  Shield,
} from "lucide-react";

import { removeAdminAccessToken } from "@/lib/auth/admin-token";
import {
  clearAdminUserSession,
  getAdminUserSession,
} from "@/lib/auth/admin-user-session";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "관리 홈", end: true },
  {
    to: "/admin/annual-benefit-limit",
    icon: CalendarDays,
    label: "연도별급여한도",
    end: false,
  },
  {
    to: "/admin/annual-fee-rate",
    icon: DollarSign,
    label: "연도별수가",
    end: false,
  },
] as const;

function getBreadcrumbs(pathname: string): string[] {
  if (pathname === "/admin" || pathname === "/admin/") return ["관리 홈"];
  if (pathname.startsWith("/admin/annual-benefit-limit")) {
    return ["기준관리", "연도별급여한도"];
  }
  if (pathname.startsWith("/admin/annual-fee-rate")) {
    return ["기준관리", "연도별수가"];
  }
  return ["관리 홈"];
}

function isNavActive(pathname: string, to: string, end: boolean): boolean {
  if (end) return pathname === to || pathname === `${to}/`;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const crumbs = getBreadcrumbs(pathname);
  const adminUser = useMemo(() => getAdminUserSession(), []);
  const displayName = adminUser?.name?.trim() || "관리자";

  const handleAdminLogout = () => {
    removeAdminAccessToken();
    clearAdminUserSession();
    window.alert(
      "관리자 세션이 종료되었습니다.\n통합관리 포털에서 다시 이동해 주세요.",
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      <header
        style={{
          height: 44,
          flexShrink: 0,
          background: "linear-gradient(90deg, #1e0a3c 0%, #2d1566 100%)",
          display: "flex",
          alignItems: "center",
          paddingLeft: 16,
          paddingRight: 16,
          gap: 0,
          boxShadow: "0 1px 0 rgba(139,92,246,0.3)",
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
              background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={13} color="white" />
          </div>
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "white" }}>
              한케어 관리자시스템
            </div>
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.4)",
                marginTop: 2,
              }}
            >
              HanCare Admin
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

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flex: 1,
          }}
        >
          {navItems.map(({ to, icon: Icon, label, end }) => {
            const active = isNavActive(pathname, to, end);
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
                  transition: "background 0.15s, color 0.15s",
                  background: active
                    ? "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(109,40,217,0.3))"
                    : "transparent",
                  border: active
                    ? "1px solid rgba(139,92,246,0.45)"
                    : "1px solid transparent",
                  color: active ? "#ffffff" : "rgba(196,181,253,0.6)",
                }}
              >
                <Icon size={13} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              height: 22,
              paddingLeft: 8,
              paddingRight: 8,
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              background: "rgba(59,130,246,0.18)",
              border: "1px solid rgba(59,130,246,0.3)",
              color: "rgba(147,197,253,0.85)",
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            <ArrowLeft size={10} />
            <span>급여제공관리로</span>
          </button>
          <Bell size={14} color="rgba(255,255,255,0.45)" />
          <div
            style={{
              width: 1,
              height: 16,
              background: "rgba(255,255,255,0.1)",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                flexShrink: 0,
                background: "rgba(139,92,246,0.3)",
                border: "1px solid rgba(139,92,246,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                color: "white",
                fontWeight: 700,
              }}
            >
              관
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>
              {displayName}
            </span>
          </div>
          <button
            type="button"
            onClick={handleAdminLogout}
            title="관리자 로그아웃"
            style={{
              display: "flex",
              alignItems: "center",
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <LogOut size={13} color="rgba(255,255,255,0.35)" />
          </button>
        </div>
      </header>

      <div
        style={{
          height: 26,
          flexShrink: 0,
          background: "#faf7ff",
          borderBottom: "1px solid #e9d5ff",
          display: "flex",
          alignItems: "center",
          paddingLeft: 16,
          paddingRight: 16,
          gap: 4,
        }}
      >
        <Home size={10} color="#a78bfa" />
        <ChevronRight size={10} color="#a78bfa" />
        {crumbs.map((crumb, i) => (
          <span
            key={`${crumb}-${i}`}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            {i > 0 && <ChevronRight size={9} color="#c4b5fd" />}
            <span
              style={{
                fontSize: 10,
                color: i === crumbs.length - 1 ? "#4c1d95" : "#7c3aed",
                fontWeight: i === crumbs.length - 1 ? 600 : 400,
              }}
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          background: "#f8f5ff",
        }}
      >
        {children}
      </main>
    </div>
  );
}
