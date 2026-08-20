"use client";

import { useEffect, useState } from "react";

import { ADMIN_SSO_REQUIRED } from "@/lib/auth/constants";
import { hasAdminAccessToken } from "@/lib/auth/admin-token";

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(!ADMIN_SSO_REQUIRED || hasAdminAccessToken());
    setChecked(true);
  }, []);

  if (!checked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8f5ff",
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
        background: "#f8f5ff",
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
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#1e0a3c",
            marginBottom: 8,
          }}
        >
          관리자 로그인이 필요합니다
        </div>
        <p
          style={{
            fontSize: 13,
            color: "#64748b",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          통합관리 포털의 관리자 메뉴를 통해
          <br />
          다시 이동해 주세요.
        </p>
      </div>
    </div>
  );
}
