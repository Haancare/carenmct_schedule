"use client";

import { useEffect } from "react";

import { captureTokenFromUrl } from "@/lib/auth/capture-token";

export default function AuthInitializer() {
  useEffect(() => {
    captureTokenFromUrl();
  }, []);

  return null;
}
