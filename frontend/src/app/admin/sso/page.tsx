"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { exchangeAdminSsoCode } from "@/lib/api/auth";
import { setAdminAccessToken } from "@/lib/auth/admin-token";
import { setAdminUserSession } from "@/lib/auth/admin-user-session";

type SsoStatus = "loading" | "error";

function AdminSsoHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<SsoStatus>("loading");
  const [message, setMessage] = useState("통합관리 포털 관리자 연동 중…");

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setStatus("error");
      setMessage(
        "SSO 인증 코드가 없습니다. 통합관리 포털에서 다시 이동해 주세요.",
      );
      return;
    }

    let cancelled = false;

    exchangeAdminSsoCode(code)
      .then((res) => {
        if (cancelled) return;

        setAdminAccessToken(res.token);
        setAdminUserSession(res.user);

        const url = new URL(window.location.href);
        url.searchParams.delete("code");
        window.history.replaceState({}, "", url.pathname);

        router.replace("/admin");
      })
      .catch((err: unknown) => {
        if (cancelled) return;

        setStatus("error");
        const detail =
          axiosErrorMessage(err) ??
          "관리자 SSO 인증에 실패했습니다. 코드가 만료되었거나 이미 사용되었을 수 있습니다. 통합관리 포털에서 다시 이동해 주세요.";
        setMessage(detail);
      });

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

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
            color: status === "error" ? "#dc2626" : "#1e0a3c",
            marginBottom: 8,
          }}
        >
          {status === "error" ? "연동 실패" : "한케어 관리자시스템"}
        </div>
        <p
          style={{
            fontSize: 13,
            color: "#64748b",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

function axiosErrorMessage(err: unknown): string | null {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response?: { data?: { message?: string } } }).response
      ?.data?.message === "string"
  ) {
    return (err as { response: { data: { message: string } } }).response.data
      .message;
  }
  return null;
}

export default function AdminSsoPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8f5ff",
            fontSize: 13,
            color: "#64748b",
          }}
        >
          관리자 SSO 연동 준비 중…
        </div>
      }
    >
      <AdminSsoHandler />
    </Suspense>
  );
}
