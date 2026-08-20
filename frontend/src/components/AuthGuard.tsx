"use client";

import { useEffect, useState } from "react";

import { SSO_REQUIRED } from "@/lib/auth/constants";
import { hasAccessToken } from "@/lib/auth/token";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  /** SSR·첫 클라이언트 렌더를 동일하게 — 쿠키는 useEffect에서만 확인 */
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(!SSO_REQUIRED || hasAccessToken());
    setChecked(true);
  }, []);

  if (!checked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f0f4f8",
        }}
      />
    );
  }

  if (allowed) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f4f8",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          padding: "32px 40px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          textAlign: "center",
          maxWidth: 440,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: "#152e50", marginBottom: 8 }}>
          로그인이 필요합니다
        </div>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
          통합관리 포털에서 급여제공(일정)관리 메뉴를 통해
          <br />
          다시 이동해 주세요.
        </p>
      </div>
    </div>
  );
}
