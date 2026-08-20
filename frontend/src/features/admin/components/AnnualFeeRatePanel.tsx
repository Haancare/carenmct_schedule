"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createNextAnnualFeeRateYear,
  fetchAnnualFeeRateYear,
  fetchAnnualFeeRateYears,
  upsertAnnualFeeRateService,
  type AnnualFeeRateItem,
  type AnnualFeeRateService,
} from "@/lib/api/adminAnnualFeeRates";

type FeeItem = AnnualFeeRateItem;
type ServiceFeeTable = AnnualFeeRateService;

const SVC_TABS: { serviceType: string; serviceLabel: string }[] = [
  { serviceType: "visit_care", serviceLabel: "방문요양" },
  { serviceType: "full_day_visit", serviceLabel: "종일방문" },
  { serviceType: "visit_bath", serviceLabel: "방문목욕" },
  { serviceType: "visit_nursing", serviceLabel: "방문간호" },
  { serviceType: "day_care", serviceLabel: "주간보호" },
];

const emptyTable = (serviceType: string, serviceLabel: string): ServiceFeeTable => ({
  serviceType,
  serviceLabel,
  note: "",
  partialRule: null,
  items: [],
});

const fmt = (n: number) => n.toLocaleString("ko-KR");
const parse = (s: string) => parseInt(s.replace(/[^0-9]/g, ""), 10) || 0;

export default function AnnualFeeRatePanel() {
  const [yearList, setYearList] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [yearData, setYearData] = useState<Record<string, ServiceFeeTable>>({});
  const [selectedSvc, setSelectedSvc] = useState("visit_care");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ServiceFeeTable | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadYears = useCallback(async (preferYear?: number) => {
    setLoading(true);
    setError(null);
    try {
      const years = await fetchAnnualFeeRateYears();
      setYearList(years);
      const year =
        preferYear != null && years.includes(preferYear)
          ? preferYear
          : (years[0] ?? null);
      setSelectedYear(year);
      if (year == null) {
        setYearData({});
        return;
      }
      const detail = await fetchAnnualFeeRateYear(year);
      const map: Record<string, ServiceFeeTable> = {};
      for (const svc of detail.services) {
        map[svc.serviceType] = {
          ...svc,
          note: svc.note ?? "",
          partialRule: svc.partialRule
            ? {
                ...svc.partialRule,
                rate: Number(svc.partialRule.rate),
              }
            : null,
          items: svc.items.map((it) => ({
            ...it,
            amount: it.amount ?? 0,
            applyFamily: it.applyFamily ?? false,
            maxInclusive: it.maxInclusive ?? false,
            gradeAmounts: it.gradeAmounts ?? null,
          })),
        };
      }
      setYearData(map);
    } catch {
      setError("연도별 수가를 불러오지 못했습니다.");
      setYearList([]);
      setYearData({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadYears();
  }, [loadYears]);

  const loadYearDetail = async (year: number) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchAnnualFeeRateYear(year);
      const map: Record<string, ServiceFeeTable> = {};
      for (const svc of detail.services) {
        map[svc.serviceType] = {
          ...svc,
          note: svc.note ?? "",
          partialRule: svc.partialRule
            ? {
                ...svc.partialRule,
                rate: Number(svc.partialRule.rate),
              }
            : null,
          items: svc.items.map((it) => ({
            ...it,
            amount: it.amount ?? 0,
            applyFamily: it.applyFamily ?? false,
            maxInclusive: it.maxInclusive ?? false,
            gradeAmounts: it.gradeAmounts ?? null,
          })),
        };
      }
      setYearData(map);
      setSelectedYear(year);
    } catch {
      setError("연도별 수가를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const tabMeta = useMemo(
    () => SVC_TABS.find((s) => s.serviceType === selectedSvc) ?? SVC_TABS[0],
    [selectedSvc],
  );

  const cur: ServiceFeeTable =
    yearData[selectedSvc] ??
    emptyTable(tabMeta.serviceType, tabMeta.serviceLabel);

  const startEdit = () => {
    setDraft(JSON.parse(JSON.stringify(cur)) as ServiceFeeTable);
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
      const saved = await upsertAnnualFeeRateService(
        selectedYear,
        selectedSvc,
        {
          note: draft.note?.trim() || null,
          partialRule: draft.partialRule ?? null,
          items: draft.items.map((it) => ({
            code: it.code,
            label: it.label,
            amount: it.amount ?? 0,
            applyFamily: it.applyFamily ?? false,
            minMinutes: it.minMinutes ?? 0,
            maxMinutes: it.maxMinutes ?? null,
            maxInclusive: it.maxInclusive ?? false,
            gradeAmounts: it.gradeAmounts ?? null,
          })),
        },
      );
      setYearData((prev) => ({
        ...prev,
        [selectedSvc]: {
          ...saved,
          note: saved.note ?? "",
          partialRule: saved.partialRule
            ? {
                ...saved.partialRule,
                rate: Number(saved.partialRule.rate),
              }
            : null,
        },
      }));
      // 방문요양 저장 시 family_care 동기화 → 연도 데이터 재조회
      if (selectedSvc === "visit_care") {
        await loadYearDetail(selectedYear);
      }
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
      const created = await createNextAnnualFeeRateYear();
      setEditing(false);
      setDraft(null);
      await loadYears(created.benefitYear);
    } catch {
      setError("연도 추가에 실패했습니다. 복사할 기존 연도 데이터가 있는지 확인하세요.");
    } finally {
      setSaving(false);
    }
  };

  const data = editing && draft ? draft : cur;

  const setDraftItem = (
    idx: number,
    field: keyof FeeItem,
    val: string | number | boolean | null,
  ) =>
    setDraft((d) => {
      if (!d) return d;
      const items = d.items.map((it, i) =>
        i === idx ? { ...it, [field]: val } : it,
      );
      return { ...d, items };
    });

  const addItem = () =>
    setDraft((d) => {
      if (!d) return d;
      const n = d.items.length + 1;
      return {
        ...d,
        items: [
          ...d.items,
          {
            code: `가-${n}`,
            label: "",
            amount: 0,
            applyFamily: false,
            minMinutes: 0,
            maxMinutes: null,
            maxInclusive: false,
            gradeAmounts: null,
          },
        ],
      };
    });

  const removeItem = (idx: number) =>
    setDraft((d) => {
      if (!d) return d;
      return { ...d, items: d.items.filter((_, i) => i !== idx) };
    });

  const TH: React.CSSProperties = {
    padding: "8px 14px",
    textAlign: "center",
    fontSize: 13,
    fontWeight: 700,
    background: "#1e0a3c",
    color: "#e9d5ff",
    border: "1px solid #4c1d95",
    whiteSpace: "nowrap",
  };
  const TD = (center = true): React.CSSProperties => ({
    padding: "8px 14px",
    textAlign: center ? "center" : "left",
    fontSize: 13,
    border: "1px solid #e9d5ff",
    color: "#1e293b",
  });
  const inputSt: React.CSSProperties = {
    width: "100%",
    fontSize: 13,
    padding: "3px 6px",
    border: "1px solid #a78bfa",
    borderRadius: 4,
    outline: "none",
    background: "#faf7ff",
    boxSizing: "border-box",
  };

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
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#1e0a3c",
            margin: 0,
          }}
        >
          연도별 수가
        </h2>
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
              setEditing(false);
              setDraft(null);
              void loadYearDetail(y);
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

      <div
        style={{
          display: "flex",
          gap: 2,
          marginBottom: 16,
          borderBottom: "2px solid #e9d5ff",
        }}
      >
        {SVC_TABS.map((s) => {
          const on = selectedSvc === s.serviceType;
          const hasData =
            (yearData[s.serviceType]?.items?.length ?? 0) > 0;
          return (
            <button
              key={s.serviceType}
              type="button"
              onClick={() => {
                setSelectedSvc(s.serviceType);
                setEditing(false);
                setDraft(null);
              }}
              style={{
                padding: "7px 16px",
                fontSize: 13,
                cursor: "pointer",
                background: "transparent",
                border: "none",
                borderBottom: on
                  ? "3px solid #7c3aed"
                  : "3px solid transparent",
                color: on ? "#7c3aed" : "#94a3b8",
                fontWeight: on ? 700 : 500,
                marginBottom: -2,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {s.serviceLabel}
              {!hasData && (
                <span style={{ fontSize: 10, color: "#e2e8f0" }}>●</span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: "#94a3b8" }}>불러오는 중…</div>
      ) : (
        <>
          {data.note && (
            <div
              style={{
                fontSize: 12,
                color: "#7c3aed",
                background: "#ede9fe",
                border: "1px solid #c4b5fd",
                borderRadius: 6,
                padding: "6px 12px",
                marginBottom: 8,
              }}
            >
              ※ {data.note}
            </div>
          )}
          {data.partialRule && (
            <div
              style={{
                fontSize: 12,
                color: "#b45309",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 6,
                padding: "6px 12px",
                marginBottom: 12,
              }}
            >
              ※ 서비스 제공시간이{" "}
              <strong>
                {data.partialRule.minMinutes}분 이상 {data.partialRule.maxMinutes}
                분 미만
              </strong>
              인 경우 <strong>{data.partialRule.rate * 100}%</strong>만 적용
              {!editing && data.items.length > 0 && (
                <span style={{ color: "#94a3b8", marginLeft: 8 }}>
                  (예: 나-1 기준{" "}
                  {fmt(
                    Math.ceil(
                      ((data.items[0]?.amount ?? 0) * data.partialRule.rate) /
                        10,
                    ) * 10,
                  )}
                  원)
                </span>
              )}
            </div>
          )}

          {data.items.length === 0 && !editing ? (
            <div
              style={{
                padding: "32px",
                textAlign: "center",
                color: "#94a3b8",
                fontSize: 13,
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #e9d5ff",
              }}
            >
              수가 데이터가 없습니다. [수정]을 눌러 입력하세요.
            </div>
          ) : data.items.some((i) => i.gradeAmounts) && !editing ? (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  borderCollapse: "collapse",
                  fontSize: 13,
                  background: "#fff",
                }}
              >
                <thead>
                  <tr>
                    <th style={{ ...TH, width: 80 }}>분류번호</th>
                    <th style={{ ...TH, minWidth: 180, textAlign: "left" }}>
                      구분 (제공시간)
                    </th>
                    {[
                      "1등급",
                      "2등급",
                      "3등급",
                      "4등급",
                      "5등급",
                      "인지지원등급",
                    ].map((g) => (
                      <th key={g} style={{ ...TH, minWidth: 90 }}>
                        {g}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, idx) => {
                    const ga = item.gradeAmounts ?? {};
                    const keyMap: Record<string, string> = {
                      "1등급": "1",
                      "2등급": "2",
                      "3등급": "3",
                      "4등급": "4",
                      "5등급": "5",
                      인지지원등급: "인지지원",
                    };
                    return (
                      <tr
                        key={idx}
                        style={{
                          background: idx % 2 === 0 ? "#fff" : "#faf7ff",
                        }}
                      >
                        <td style={{ ...TD() }}>{item.code}</td>
                        <td style={{ ...TD(false) }}>{item.label}</td>
                        {[
                          "1등급",
                          "2등급",
                          "3등급",
                          "4등급",
                          "5등급",
                          "인지지원등급",
                        ].map((g) => (
                          <td key={g} style={{ ...TD(), fontWeight: 600 }}>
                            {fmt(ga[keyMap[g]] ?? 0)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  borderCollapse: "collapse",
                  fontSize: 13,
                  background: "#fff",
                }}
              >
                <thead>
                  <tr>
                    <th style={{ ...TH, width: 90 }}>분류번호</th>
                    <th style={{ ...TH, minWidth: 150, textAlign: "left" }}>
                      분류
                    </th>
                    {editing && <th style={{ ...TH, width: 80 }}>이상(분)</th>}
                    {editing && <th style={{ ...TH, width: 80 }}>미만(분)</th>}
                    {data.items.some((i) => i.gradeAmounts) ? (
                      [
                        "1등급",
                        "2등급",
                        "3등급",
                        "4등급",
                        "5등급",
                        "인지지원등급",
                      ].map((g) => (
                        <th key={g} style={{ ...TH, minWidth: 90 }}>
                          {g}
                        </th>
                      ))
                    ) : (
                      <th style={{ ...TH, minWidth: 130 }}>금액(원)</th>
                    )}
                    {data.partialRule && !editing && (
                      <th style={{ ...TH, minWidth: 130, color: "#fde68a" }}>
                        {data.partialRule.minMinutes}~
                        {data.partialRule.maxMinutes}분 미만
                        <br />({data.partialRule.rate * 100}% 적용)
                      </th>
                    )}
                    {selectedSvc === "visit_care" && (
                      <th style={{ ...TH, minWidth: 110 }}>가족요양 적용</th>
                    )}
                    {editing && <th style={{ ...TH, width: 60 }}>삭제</th>}
                  </tr>
                </thead>
                <tbody>
                  {(editing ? draft!.items : data.items).map((item, idx) => (
                    <tr
                      key={idx}
                      style={{
                        background: idx % 2 === 0 ? "#fff" : "#faf7ff",
                      }}
                    >
                      <td style={{ ...TD() }}>
                        {editing ? (
                          <input
                            value={item.code}
                            onChange={(e) =>
                              setDraftItem(idx, "code", e.target.value)
                            }
                            style={{
                              ...inputSt,
                              textAlign: "center",
                              width: 70,
                            }}
                          />
                        ) : (
                          item.code
                        )}
                      </td>
                      <td style={{ ...TD(false) }}>
                        {editing ? (
                          <input
                            value={item.label}
                            onChange={(e) =>
                              setDraftItem(idx, "label", e.target.value)
                            }
                            style={inputSt}
                          />
                        ) : (
                          item.label
                        )}
                      </td>
                      {editing && (
                        <td style={{ ...TD() }}>
                          <input
                            type="number"
                            value={item.minMinutes ?? ""}
                            min={0}
                            onChange={(e) =>
                              setDraftItem(
                                idx,
                                "minMinutes",
                                parseInt(e.target.value, 10) || 0,
                              )
                            }
                            style={{
                              ...inputSt,
                              width: 60,
                              textAlign: "right",
                            }}
                          />
                        </td>
                      )}
                      {editing && (
                        <td style={{ ...TD() }}>
                          <input
                            type="number"
                            value={item.maxMinutes ?? ""}
                            min={0}
                            placeholder="없음"
                            onChange={(e) =>
                              setDraftItem(
                                idx,
                                "maxMinutes",
                                e.target.value === ""
                                  ? null
                                  : parseInt(e.target.value, 10) || 0,
                              )
                            }
                            style={{
                              ...inputSt,
                              width: 60,
                              textAlign: "right",
                            }}
                          />
                        </td>
                      )}
                      {item.gradeAmounts ? (
                        (["1", "2", "3", "4", "5", "인지지원"] as const).map(
                          (k) => {
                            const glabel =
                              k === "인지지원" ? "인지지원등급" : `${k}등급`;
                            const val = (item.gradeAmounts ?? {})[k] ?? 0;
                            return (
                              <td key={k} style={{ ...TD(), minWidth: 90 }}>
                                {editing ? (
                                  <input
                                    value={fmt(val)}
                                    onChange={(e) =>
                                      setDraft((d) => {
                                        if (!d) return d;
                                        const items = d.items.map((it, i) =>
                                          i === idx
                                            ? {
                                                ...it,
                                                gradeAmounts: {
                                                  ...(it.gradeAmounts ?? {}),
                                                  [k]: parse(e.target.value),
                                                },
                                              }
                                            : it,
                                        );
                                        return { ...d, items };
                                      })
                                    }
                                    title={glabel}
                                    style={{
                                      ...inputSt,
                                      textAlign: "right",
                                      width: 80,
                                    }}
                                  />
                                ) : (
                                  <strong>{fmt(val)}</strong>
                                )}
                              </td>
                            );
                          },
                        )
                      ) : (
                        <td style={{ ...TD() }}>
                          {editing ? (
                            <input
                              value={fmt(item.amount)}
                              onChange={(e) =>
                                setDraftItem(
                                  idx,
                                  "amount",
                                  parse(e.target.value),
                                )
                              }
                              style={{
                                ...inputSt,
                                textAlign: "right",
                                width: 110,
                              }}
                            />
                          ) : (
                            <strong>{fmt(item.amount)}</strong>
                          )}
                        </td>
                      )}
                      {data.partialRule && !editing && (
                        <td
                          style={{
                            ...TD(),
                            background:
                              idx % 2 === 0 ? "#fffbeb" : "#fef9e7",
                          }}
                        >
                          <strong style={{ color: "#b45309" }}>
                            {fmt(
                              Math.ceil(
                                (item.amount * data.partialRule!.rate) / 10,
                              ) * 10,
                            )}
                          </strong>
                        </td>
                      )}
                      {selectedSvc === "visit_care" && (
                        <td style={{ ...TD() }}>
                          {editing ? (
                            <input
                              type="checkbox"
                              checked={item.applyFamily ?? false}
                              onChange={(e) =>
                                setDraftItem(
                                  idx,
                                  "applyFamily",
                                  e.target.checked,
                                )
                              }
                              style={{
                                accentColor: "#7c3aed",
                                width: 14,
                                height: 14,
                              }}
                            />
                          ) : item.applyFamily ? (
                            <span
                              style={{
                                fontSize: 11,
                                padding: "1px 6px",
                                borderRadius: 3,
                                background: "#ede9fe",
                                color: "#7c3aed",
                                border: "1px solid #c4b5fd",
                                fontWeight: 600,
                              }}
                            >
                              적용
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: "#cbd5e1" }}>
                              -
                            </span>
                          )}
                        </td>
                      )}
                      {editing && (
                        <td style={{ ...TD() }}>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            style={{
                              fontSize: 11,
                              padding: "2px 6px",
                              borderRadius: 3,
                              cursor: "pointer",
                              border: "1px solid #fecaca",
                              background: "#fff1f2",
                              color: "#dc2626",
                            }}
                          >
                            삭제
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {editing && (
                    <tr>
                      <td
                        colSpan={selectedSvc === "visit_care" ? 5 : 4}
                        style={{
                          padding: "6px 8px",
                          borderTop: "1px solid #e9d5ff",
                        }}
                      >
                        <button
                          type="button"
                          onClick={addItem}
                          style={{
                            fontSize: 12,
                            padding: "4px 14px",
                            borderRadius: 5,
                            cursor: "pointer",
                            border: "1px dashed #a78bfa",
                            background: "#faf7ff",
                            color: "#7c3aed",
                          }}
                        >
                          + 항목 추가
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {editing && draft && (
            <div style={{ marginTop: 12, maxWidth: 600 }}>
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
              <textarea
                value={draft.note ?? ""}
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, note: e.target.value } : d))
                }
                rows={2}
                placeholder="유형별 특이사항"
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
            </div>
          )}

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
                disabled={selectedYear == null}
                style={{
                  padding: "7px 24px",
                  fontSize: 13,
                  borderRadius: 6,
                  cursor: selectedYear != null ? "pointer" : "not-allowed",
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
