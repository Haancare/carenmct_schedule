import { Suspense } from "react";

import PaymentAssignmentPage from "@/features/payment-assignment/PaymentAssignmentPage";

function PaymentAssignmentFallback() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: "#f0f4f8",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          height: 40,
        }}
      />
    </div>
  );
}

export default function PaymentAssignmentRoute() {
  return (
    <Suspense fallback={<PaymentAssignmentFallback />}>
      <PaymentAssignmentPage />
    </Suspense>
  );
}
