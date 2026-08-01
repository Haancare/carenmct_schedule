import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // LAN IP 로 dev 접속 시 HMR·/_next 리소스 차단 방지
  allowedDevOrigins: ["192.168.10.54", "localhost", "127.0.0.1"],
};

export default nextConfig;
