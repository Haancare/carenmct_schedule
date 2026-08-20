"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createNextAnnualBenefitLimitYear,
  fetchAnnualBenefitLimits,
  upsertAnnualBenefitLimit,
  type AnnualBenefitLimitDto,
} from "@/lib/api/adminAnnualBenefitLimits";

const GRADE_KEYS = [
  "limitGrade1",
  "limitGrade2",
  "limitGrade3",
  "limitGrade4",
  "limitGrade5",
  "limitGradeCognitive",
] as const;

type GradeKey = (typeof GRADE_KEYS)[number];

const GRADE_LABELS: Record<GradeKey, string> = {
  limitGrade1: "1등급",
  limitGrade2: "2등급",
  limitGrade3: "3등급",
  limitGrade4: "4등급",
  limitGrade5: "5등급",
  limitGradeCognitive: "인지지원등급",
};

const SVC_TARGETS = "방문요양(가족요양 포함) · 방문목욕 · 주간보호";

type DraftRow = {
  limitGrade1: number;
  limitGrade2: number;
  limitGrade3: number;
  limitGrade4: number;
  limitGrade5: number;
  limitGradeCognitive: number;
  note: string;
};

const fmt = (n: number) => n.toLocaleString("ko-KR");
const parseAmount = (s: string) => parseInt(s.replace(/[^0-9]/g, ""), 10) || 0;

function toDraft(row: AnnualBenefitLimitDto): DraftRow {
  return {
    limitGrade1: row.limitGrade1,
    limitGrade2: row.limitGrade2,
    limitGrade3: row.limitGrade3,
    limitGrade4: row.limitGrade4,
    limitGrade5: row.limitGrade5,
    limitGradeCognitive: row.limitGradeCognitive,
    note: row.note ?? "",
  };
}

export default function AnnualBenefitLimitPanel() {
  const [rows, setRows] = useState<AnnualBenefitLimitDto[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DraftRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (preferYear?: number) => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAnnualBenefitLimits();
      setRows(list);
      setSelectedYear((prev) => {
        if (preferYear != null && list.some((r) => r.benefitYear === preferYear)) {
          return preferYear;
        }
        if (prev != null && list.some((r) => r.benefitYear === prev)) return prev;
        return list[0]?.benefitYear ?? null;
      });
    } catch {
      setError("연도별 급여한도를 불러오지 못했습니다.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const yearList = useMemo(
    () => rows.map((r) => r.benefitYear).sort((a, b) => b - a),
    [rows],
  );

  const current = useMemo(
    () => rows.find((r) => r.benefitYear === selectedYear) ?? null,
    [rows, selectedYear],
  );

  const data: DraftRow | null = editing && draft ? draft : current ? toDraft(current) : null;

  const startEdit = () => {
    if (!current) return;
    setDraft(toDraft(current));
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(null);
  };

  const saveEdit = async () => {
    if (!draft || selectedYear == null) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await upsertAnnualBenefitLimit(selectedYear, {
        ...draft,
        note: draft.note.trim() || null,
      });
      setRows((prev) => {
        const others = prev.filter((r) => r.benefitYear !== saved.benefitYear);
        return [...others, saved].sort((a, b) => b.benefitYear - a.benefitYear);
      });
      setEditing(false);
      setDraft(null);
    } catch {
      setError("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const addYear = async () => {
    setSaving(true);
    setError(null);
    try {
      const created = await createNextAnnualBenefitLimitYear();
      setEditing(false);
      setDraft(null);
      await load(created.benefitYear);
    } catch {
      setError("연도 추가에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const TH: React.CSSProperties = {
    padding: "9px 14px",
    textAlign: "center",
    fontSize: 13,
    fontWeight: 700,
    background: "#1e0a3c",
    color: "#e9d5ff",
    border: "1px solid #4c1d95",
  };
  const TD = (center = true): React.CSSProperties => ({
    padding: "9px 14px",
    textAlign: center ? "center" : "left",
    fontSize: 13,
    border: "1px solid #e9d5ff",
    color: "#1e293b",
  });

  return (
    <div
      style={{
        height: "100%",
        overflow: "auto",
        padding: "24px 32px",
        background: "#f8f5ff",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#1e0a3c",
            margin: 0,
          }}
        >
          연도별 급여한도
        </h2>
        <span
          style={{
            fontSize: 12,
            color: "#7c3aed",
            background: "#ede9fe",
            padding: "2px 10px",
            borderRadius: 10,
            border: "1px solid #c4b5fd",
          }}
        >
          {SVC_TARGETS}
        </span>
      </div>

      <div
        style={{
          fontSize: 12,
          color: "#64748b",
          marginBottom: 16,
          padding: "7px 12px",
          background: "#faf7ff",
          border: "1px solid #ddd6fe",
          borderRadius: 6,
        }}
      >
        ※ 월중 등급 변경이 있을 경우{" "}
        <strong style={{ color: "#7c3aed" }}>
          더 높은 등급(낮은 번호)의 한도
        </strong>
        를 적용합니다.
      </div>

      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 12px",
            borderRadius: 6,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {yearList.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => {
              setSelectedYear(y);
              setEditing(false);
              setDraft(null);
            }}
            style={{
              padding: "5px 18px",
              fontSize: 13,
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: y === selectedYear ? 700 : 400,
              border:
                y === selectedYear ? "2px solid #7c3aed" : "1px solid #c4b5fd",
              background: y === selectedYear ? "#7c3aed" : "#fff",
              color: y === selectedYear ? "#fff" : "#7c3aed",
            }}
          >
            {y}년
          </button>
        ))}
        <button
          type="button"
          onClick={() => void addYear()}
          disabled={saving || loading}
          style={{
            padding: "5px 14px",
            fontSize: 12,
            borderRadius: 6,
            cursor: saving || loading ? "not-allowed" : "pointer",
            border: "1px dashed #a78bfa",
            background: "#faf7ff",
            color: "#7c3aed",
            opacity: saving || loading ? 0.6 : 1,
          }}
        >
          + 연도 추가
        </button>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: "#94a3b8" }}>불러오는 중…</div>
      ) : !data ? (
        <div style={{ fontSize: 13, color: "#94a3b8" }}>
          등록된 연도별 급여한도가 없습니다. &quot;+ 연도 추가&quot;로
          생성해 주세요.
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                borderCollapse: "collapse",
                fontSize: 13,
                background: "#fff",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <thead>
                <tr>
                  <th style={{ ...TH, width: 150, textAlign: "left" }}>구분</th>
                  {GRADE_KEYS.map((k) => (
                    <th key={k} style={{ ...TH, minWidth: 120 }}>
                      {GRADE_LABELS[k]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    style={{
                      ...TD(false),
                      background: "#faf7ff",
                      fontWeight: 600,
                      color: "#4c1d95",
                    }}
                  >
                    월 한도액 (원)
                  </td>
                  {GRADE_KEYS.map((k) => (
                    <td key={k} style={{ ...TD(), background: "#fff" }}>
                      {editing && draft ? (
                        <input
                          type="text"
                          value={fmt(draft[k])}
                          onChange={(e) =>
                            setDraft((d) =>
                              d ? { ...d, [k]: parseAmount(e.target.value) } : d,
                            )
                          }
                          style={{
                            width: "100%",
                            fontSize: 13,
                            padding: "3px 6px",
                            border: "1px solid #a78bfa",
                            borderRadius: 4,
                            outline: "none",
                            textAlign: "right",
                            background: "#faf7ff",
                            boxSizing: "border-box",
                          }}
                        />
                      ) : (
                        <span style={{ fontWeight: 600 }}>{fmt(data[k])}</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td
                    style={{
                      ...TD(false),
                      background: "#faf7ff",
                      fontWeight: 600,
                      color: "#4c1d95",
                    }}
                  >
                    적용 급여종류
                  </td>
                  <td
                    colSpan={GRADE_KEYS.length}
                    style={{ ...TD(false), color: "#475569", fontSize: 12 }}
                  >
                    {SVC_TARGETS}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16, maxWidth: 700 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#7c3aed",
                marginBottom: 4,
              }}
            >
              비고
            </div>
            {editing && draft ? (
              <textarea
                value={draft.note}
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, note: e.target.value } : d))
                }
                rows={3}
                placeholder="연도별 특이사항 입력"
                style={{
                  width: "100%",
                  fontSize: 12,
                  padding: "6px 10px",
                  border: "1px solid #a78bfa",
                  borderRadius: 6,
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  boxSizing: "border-box",
                  background: "#faf7ff",
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: 12,
                  color: data.note ? "#475569" : "#cbd5e1",
                  padding: "6px 10px",
                  background: "#faf7ff",
                  borderRadius: 6,
                  border: "1px solid #e9d5ff",
                  minHeight: 42,
                }}
              >
                {data.note || "비고 없음"}
              </div>
            )}
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  style={{
                    padding: "7px 20px",
                    fontSize: 13,
                    borderRadius: 6,
                    cursor: "pointer",
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    color: "#64748b",
                  }}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => void saveEdit()}
                  disabled={saving}
                  style={{
                    padding: "7px 24px",
                    fontSize: 13,
                    borderRadius: 6,
                    cursor: saving ? "not-allowed" : "pointer",
                    border: "none",
                    background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                    color: "#fff",
                    fontWeight: 700,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "저장 중…" : "저장"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={startEdit}
                disabled={!current}
                style={{
                  padding: "7px 24px",
                  fontSize: 13,
                  borderRadius: 6,
                  cursor: current ? "pointer" : "not-allowed",
                  border: "1px solid #7c3aed",
                  background: "#faf7ff",
                  color: "#7c3aed",
                  fontWeight: 700,
                }}
              >
                수정
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
