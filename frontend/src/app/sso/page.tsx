"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { exchangeSsoCode } from "@/lib/api/auth";
import { setAccessToken } from "@/lib/auth/token";
import { setUserSession } from "@/lib/auth/user-session";

type SsoStatus = "loading" | "error";

function SsoHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<SsoStatus>("loading");
  const [message, setMessage] = useState("통합관리 포털 연동 중…");

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setStatus("error");
      setMessage("SSO 인증 코드가 없습니다. 통합관리 포털에서 다시 이동해 주세요.");
      return;
    }

    let cancelled = false;

    exchangeSsoCode(code)
      .then((res) => {
        if (cancelled) return;

        setAccessToken(res.token);
        setUserSession(res.user);

        const url = new URL(window.location.href);
        url.searchParams.delete("code");
        window.history.replaceState({}, "", url.pathname);

        router.replace("/dashboard");
      })
      .catch((err: unknown) => {
        if (cancelled) return;

        setStatus("error");
        const detail =
          axiosErrorMessage(err) ??
          "SSO 인증에 실패했습니다. 통합관리 포털에서 다시 이동해 주세요.";
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
          maxWidth: 420,
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: status === "error" ? "#dc2626" : "#152e50",
            marginBottom: 8,
          }}
        >
          {status === "error" ? "연동 실패" : "한케어 급여제공(일정)관리"}
        </div>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
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
    typeof (err as { response?: { data?: { message?: string } } }).response?.data
      ?.message === "string"
  ) {
    return (err as { response: { data: { message: string } } }).response.data
      .message;
  }
  return null;
}

export default function SsoPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f0f4f8",
            fontSize: 13,
            color: "#64748b",
          }}
        >
          SSO 연동 준비 중…
        </div>
      }
    >
      <SsoHandler />
    </Suspense>
  );
}
