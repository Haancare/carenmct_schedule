"use client";

import ScheduleAssignmentPage from "@/features/schedule-assignment/ScheduleAssignmentPage";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams<{ recipientId: string }>();
  const recipientId = String(params.recipientId ?? "");

  if (!recipientId) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: "#94a3b8",
        }}
      >
        수급자를 선택하세요.
      </div>
    );
  }

  return <ScheduleAssignmentPage recipientId={recipientId} />;
}
