"use client";

import { usePathname } from "next/navigation";

import AdminAuthGuard from "@/components/AdminAuthGuard";
import AdminShell from "@/features/admin/components/AdminShell";

/**
 * /admin/sso 는 셸·가드 없이 코드 교환만 수행.
 * 그 외 /admin/* 는 관리자 SSO 토큰 필요 (기관 SSO와 분리).
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSsoEntry = pathname === "/admin/sso" || pathname.startsWith("/admin/sso/");

  if (isSsoEntry) {
    return <>{children}</>;
  }

  return (
    <AdminAuthGuard>
      <AdminShell>{children}</AdminShell>
    </AdminAuthGuard>
  );
}
