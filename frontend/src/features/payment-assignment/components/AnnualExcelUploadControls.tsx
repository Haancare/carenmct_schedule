"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, Upload, X } from "lucide-react";
import type { AxiosError } from "axios";

import {
  uploadClaimScheduleExcel,
  uploadPlanScheduleExcel,
} from "@/lib/api/scheduleImport";

export type ExcelUploadKind = "plan" | "claim";

type FileSlot = {
  key: string;
  label: string;
  hint: string;
};

const PLAN_SLOTS: FileSlot[] = [
  {
    key: "plan",
    label: "일정계획",
    hint: "공단메뉴: 엑셀다운로드 > 일정계획",
  },
];

const CLAIM_SLOTS: FileSlot[] = [
  {
    key: "claimList",
    label: "청구서목록",
    hint: "공단메뉴: 청구서목록조회",
  },
  {
    key: "claimDetail",
    label: "청구내역/상세",
    hint: "공단메뉴: 엑셀다운로드 > 청구내역/상세",
  },
];

const EXCEL_ACCEPT =
  ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";

function kindBtnStyle(active: boolean, tone: "plan" | "claim") {
  const activeStyle =
    tone === "plan"
      ? {
          border: "1px solid #93c5fd",
          background: "#dbeafe",
          color: "#1d4ed8",
        }
      : {
          border: "1px solid #6ee7b7",
          background: "#d1fae5",
          color: "#059669",
        };

  return {
    height: 24,
    padding: "0 9px",
    fontSize: 12,
    borderRadius: 6,
    cursor: "pointer" as const,
    fontWeight: active ? 700 : 500,
    border: active ? activeStyle.border : "1px solid #e2e8f0",
    background: active ? activeStyle.background : "#f8fafc",
    color: active ? activeStyle.color : "#94a3b8",
  };
}

function FilePickButton({
  slot,
  file,
  onPick,
  onClear,
  disabled,
}: {
  slot: FileSlot;
  file: File | null;
  onPick: (file: File | null) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <input
        ref={inputRef}
        type="file"
        accept={EXCEL_ACCEPT}
        style={{ display: "none" }}
        onChange={(e) => {
          const next = e.target.files?.[0] ?? null;
          onPick(next);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        title={slot.hint}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        style={{
          height: 24,
          maxWidth: file ? 168 : 118,
          padding: "0 8px",
          fontSize: 12,
          borderRadius: 6,
          cursor: disabled ? "not-allowed" : "pointer",
          border: file ? "1px solid #93c5fd" : "1px solid #e2e8f0",
          background: file ? "#eff6ff" : "#f8fafc",
          color: file ? "#1e40af" : "#64748b",
          fontWeight: file ? 600 : 500,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          overflow: "hidden",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <FileSpreadsheet size={12} style={{ flexShrink: 0 }} />
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {file ? file.name : `${slot.label} 선택`}
        </span>
      </button>
      {file && (
        <button
          type="button"
          title="파일 제거"
          disabled={disabled}
          onClick={onClear}
          style={{
            width: 20,
            height: 20,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #e2e8f0",
            borderRadius: 4,
            background: "#f8fafc",
            cursor: disabled ? "not-allowed" : "pointer",
            color: "#94a3b8",
            padding: 0,
          }}
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}

type Props = {
  onImported?: () => void;
};

/** 연간급여일정 — 검색조건 아래 우측 엑셀 일괄 등록 */
export default function AnnualExcelUploadControls({ onImported }: Props) {
  const [kind, setKind] = useState<ExcelUploadKind>("plan");
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [uploading, setUploading] = useState(false);

  const slots = kind === "plan" ? PLAN_SLOTS : CLAIM_SLOTS;
  const ready = slots.every((s) => !!files[s.key]) && !uploading;

  const setKindAndReset = (next: ExcelUploadKind) => {
    setKind(next);
    setFiles({});
  };

  const handleUpload = async () => {
    if (!ready) return;

    setUploading(true);
    try {
      const result =
        kind === "plan"
          ? await uploadPlanScheduleExcel(files.plan!)
          : await uploadClaimScheduleExcel(files.claimList!, files.claimDetail!);

      const lines = [
        `상태: ${result.status}`,
        `대상 ${result.totalRows}건 / 성공 ${result.successRows}건 / 건너뜀 ${result.skippedRows}건 / 오류 ${result.errorRows}건`,
      ];
      if (result.errors?.length) {
        lines.push("", "오류 예시:");
        lines.push(...result.errors.slice(0, 10));
      }
      window.alert(lines.join("\n"));
      if (result.successRows > 0) {
        onImported?.();
      }
      setFiles({});
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      const detail =
        ax.response?.data?.message ??
        (typeof ax.response?.data === "string" ? ax.response.data : null) ??
        ax.message ??
        "업로드에 실패했습니다.";
      window.alert(String(detail));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        flexShrink: 0,
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: "5px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
        엑셀등록
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          type="button"
          disabled={uploading}
          onClick={() => setKindAndReset("plan")}
          style={kindBtnStyle(kind === "plan", "plan")}
        >
          계획
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={() => setKindAndReset("claim")}
          style={kindBtnStyle(kind === "claim", "claim")}
        >
          청구
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {slots.map((slot) => (
          <FilePickButton
            key={slot.key}
            slot={slot}
            file={files[slot.key] ?? null}
            disabled={uploading}
            onPick={(file) =>
              setFiles((prev) => ({ ...prev, [slot.key]: file }))
            }
            onClear={() =>
              setFiles((prev) => ({ ...prev, [slot.key]: null }))
            }
          />
        ))}
      </div>

      <button
        type="button"
        disabled={!ready}
        onClick={() => void handleUpload()}
        title={
          uploading
            ? "업로드 중…"
            : ready
              ? "선택한 엑셀로 일정 일괄 등록"
              : "필요한 엑셀 파일을 모두 선택해 주세요"
        }
        style={{
          height: 24,
          padding: "0 10px",
          fontSize: 12,
          borderRadius: 6,
          cursor: ready ? "pointer" : "not-allowed",
          border: ready ? "1px solid #152e50" : "1px solid #e2e8f0",
          background: ready ? "#152e50" : "#f1f5f9",
          color: ready ? "#fff" : "#94a3b8",
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          opacity: ready ? 1 : 0.85,
        }}
      >
        <Upload size={12} />
        {uploading ? "업로드 중…" : "업로드"}
      </button>
    </div>
  );
}
