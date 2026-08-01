import type { Metadata } from "next";

import AuthInitializer from "@/components/AuthInitializer";

import "./globals.css";

export const metadata: Metadata = {
  title: "한케어 급여제공(일정)관리",
  description: "통합관리 프로그램 연동 일정관리 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body
        style={{
          margin: 0,
          height: "100%",
          overflow: "hidden",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        <AuthInitializer />
        {children}
      </body>
    </html>
  );
}
