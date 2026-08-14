"use client";

import { Calendar, Check, ChevronLeft, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import WorkerCombo from "@/features/payment-assignment/components/WorkerCombo";
import {
  DEFAULT_CARE_WORKER_POSITIONS,
  NURSING_WORKER_POSITIONS,
} from "@/features/payment-assignment/constants";
import type { CareWorkerDto } from "@/lib/api/paymentAssignment.types";
import type {
  BatchAssignType,
  ScheduleAddFormData,
  ScheduleAssignmentEntry,
  ScheduleAssignmentRecipient,
} from "@/lib/api/scheduleAssignment.types";
import { fetchRecipientFamilyWorkers } from "@/lib/api/scheduleAssignment";

import {
  BATH_TYPE_OPTIONS,
  COPAY_BUTTON_OPTIONS,
  FAMILY_RELATIONS,
  QUICK_DURATION_PRESETS,
  SERVICE_LABELS,
  SVC_STYLE,
} from "../constants";
import {
  loadAssignedWorkers,
  saveAssignedWorkers,
} from "../utils/assignedWorkersStorage";
import {
  applyServiceTypeDurationDefaults,
  computeDurationMinutes,
  validateScheduleForm,
} from "../utils/scheduleEditor";

type Props = {
  recipient: ScheduleAssignmentRecipient;
  form: ScheduleAddFormData;
  assignMode: boolean;
  batchType: BatchAssignType;
  schedules: ScheduleAssignmentEntry[];
  onFormChange: (
    updater: (prev: ScheduleAddFormData) => ScheduleAddFormData,
  ) => void;
  onClose: () => void;
  onStartAssign: () => void;
  onCancelAssign: () => void;
  onBatchTypeChange: (type: BatchAssignType) => void;
  onRunBatch: (
    type: BatchAssignType,
    selectedDays: Set<number>,
  ) => Promise<boolean>;
  careWorkers: CareWorkerDto[];
  onViewWorkerSchedule?: (workerId: string) => void;
};

const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0"),
);
const MINS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

export default function ScheduleAddPanel({
  recipient,
  form,
  assignMode,
  batchType,
  onFormChange,
  onClose,
  onStartAssign,
  onCancelAssign,
  onBatchTypeChange,
  onRunBatch,
  careWorkers,
  onViewWorkerSchedule,
}: Props) {
  const workers = careWorkers;
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const duration = useMemo(
    () =>
      computeDurationMinutes(
        form.startHour,
        form.startMin,
        form.endHour,
        form.endMin,
      ),
    [form.startHour, form.startMin, form.endHour, form.endMin],
  );

  const [assignedWorkerMap, setAssignedWorkerMap] = useState<
    Record<string, string[]>
  >({});
  const [familyRelationMap, setFamilyRelationMap] = useState<
    Record<string, string>
  >({});
  const [showAddWorkerPicker, setShowAddWorkerPicker] = useState(false);
  const [addWorkerPickVal, setAddWorkerPickVal] = useState("");
  const [addWorkerRelation, setAddWorkerRelation] = useState("");

  useEffect(() => {
    let cancelled = false;
    setShowAddWorkerPicker(false);
    setAddWorkerPickVal("");
    setAddWorkerRelation("");
    void loadAssignedWorkers(
      recipient.id,
      recipient.assignedCareWorkerIds ?? [],
    ).then((store) => {
      if (cancelled) return;
      setAssignedWorkerMap(store.workers);
      setFamilyRelationMap(store.familyRelations);
    });
    return () => {
      cancelled = true;
    };
  }, [recipient.id, recipient.assignedCareWorkerIds]);

  const persistAssigned = useCallback(
    (
      nextWorkers: Record<string, string[]>,
      nextRelations: Record<string, string>,
    ) => {
      setAssignedWorkerMap(nextWorkers);
      setFamilyRelationMap(nextRelations);
      void saveAssignedWorkers(recipient.id, nextWorkers, nextRelations).catch(
        () => {
          window.alert("담당 요양보호사 저장에 실패했습니다.");
        },
      );
    },
    [recipient.id],
  );

  const curSvcWorkers = (svc: string) => assignedWorkerMap[svc] ?? [];

  const setCurSvcWorkers = (
    svc: string,
    fn: (prev: string[]) => string[],
  ) => {
    const next = {
      ...assignedWorkerMap,
      [svc]: fn(assignedWorkerMap[svc] ?? []),
    };
    persistAssigned(next, familyRelationMap);
  };

  const saveFamilyRelation = (workerId: string, relation: string) => {
    const next = { ...familyRelationMap, [workerId]: relation };
    persistAssigned(assignedWorkerMap, next);
  };

  const updateForm = (
    updater: (prev: ScheduleAddFormData) => ScheduleAddFormData,
  ) => {
    onFormChange(updater);
  };

  const providerLabel =
    form.serviceType === "visit_nursing" ? "간호(조무)사" : "요양보호사";
  const careWorkerPositions =
    form.serviceType === "visit_nursing"
      ? [...NURSING_WORKER_POSITIONS]
      : [...DEFAULT_CARE_WORKER_POSITIONS];

  const applyDuration = (mins: number) => {
    const sh = parseInt(form.startHour, 10) || 0;
    const sm = parseInt(form.startMin, 10) || 0;
    const total = sh * 60 + sm + mins;
    const eh = Math.floor(total / 60) % 24;
    const em = total % 60;
    updateForm((f) => ({
      ...f,
      endHour: String(eh).padStart(2, "0"),
      endMin: String(em).padStart(2, "0"),
    }));
  };

  const quickButtons = QUICK_DURATION_PRESETS[form.serviceType] ?? [];

  const handleStartAssignClick = () => {
    if (form.serviceType !== "day_care" && !form.careWorkerId) {
      window.alert("요양보호사를 선택하세요.");
      return;
    }
    if (form.serviceType === "visit_bath" && !form.careWorkerId2) {
      window.alert("방문목욕은 요양보호사 2명을 선택해야 합니다.");
      return;
    }
    if (form.serviceType === "family_care" && !form.familyRelation) {
      window.alert("가족관계를 선택하세요.");
      return;
    }
    const validationError = validateScheduleForm(form, duration);
    if (validationError) {
      window.alert(validationError);
      return;
    }
    if (duration <= 0) {
      window.alert("시간을 확인하세요.");
      return;
    }
    onStartAssign();
  };

  const registerAssignedWorker = () => {
    if (!addWorkerPickVal) return;
    if (form.serviceType === "family_care" && !addWorkerRelation) return;
    if (!curSvcWorkers(form.serviceType).includes(addWorkerPickVal)) {
      setCurSvcWorkers(form.serviceType, (prev) => [...prev, addWorkerPickVal]);
    }
    if (form.serviceType === "family_care" && addWorkerRelation) {
      saveFamilyRelation(addWorkerPickVal, addWorkerRelation);
    }
    setAddWorkerPickVal("");
    setAddWorkerRelation("");
    setShowAddWorkerPicker(false);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        width: 258,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #f0f6ff 0%, #ffffff 60px)",
        borderRight: "2px solid #bfdbfe",
        boxShadow:
          "8px 0 32px rgba(10,25,60,0.28), 2px 0 6px rgba(37,99,235,0.12)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px 8px",
          background: "linear-gradient(135deg, #1d4ed8 0%, #0f2744 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Calendar size={11} color="#ffffff" />
          </div>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1,
              }}
            >
              일정 추가
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.6)",
                marginTop: 2,
              }}
            >
              {recipient.name}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            cursor: "pointer",
            backgroundColor: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={11} color="rgba(255,255,255,0.85)" />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <FieldLabel>등급</FieldLabel>
        <div style={{ display: "flex", gap: 3 }}>
          {[1, 2, 3, 4, 5].map((g) => {
            const active = form.grade === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => updateForm((f) => ({ ...f, grade: g }))}
                style={{
                  flex: 1,
                  padding: "4px 0",
                  fontSize: 11,
                  borderRadius: 4,
                  cursor: "pointer",
                  fontWeight: active ? 700 : 400,
                  backgroundColor: active ? "#dbeafe" : "#ffffff",
                  color: active ? "#1d4ed8" : "#94a3b8",
                  border: `1px solid ${active ? "#93c5fd" : "#e2e8f0"}`,
                  boxShadow: active ? "0 1px 4px rgba(37,99,235,0.15)" : "none",
                }}
              >
                {g}등급
              </button>
            );
          })}
        </div>

        <FieldLabel>감경구분</FieldLabel>
        <div style={{ display: "flex", gap: 3 }}>
          {COPAY_BUTTON_OPTIONS.map(
            ({
              type,
              rate,
              short,
              sub,
              activeBg,
              activeColor,
              activeBorder,
            }) => {
              const active = form.copaymentType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    updateForm((f) => ({
                      ...f,
                      copaymentType: type,
                      copaymentRate: rate,
                    }))
                  }
                  style={{
                    flex: 1,
                    padding: "4px 0",
                    fontSize: 11,
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: active ? 700 : 400,
                    backgroundColor: active ? activeBg : "#ffffff",
                    color: active ? activeColor : "#94a3b8",
                    border: `1px solid ${active ? activeBorder : "#e2e8f0"}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    lineHeight: 1.3,
                    boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  <span style={{ fontWeight: active ? 700 : 500 }}>{short}</span>
                  <span style={{ fontSize: 10, opacity: 0.75 }}>{sub}</span>
                </button>
              );
            },
          )}
        </div>

        <FieldLabel>급여종류</FieldLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {Object.keys(SERVICE_LABELS).map((st) => {
            const c = SVC_STYLE[st] ?? SVC_STYLE.visit_care;
            const active = form.serviceType === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => {
                  const serviceType = st as ScheduleAddFormData["serviceType"];
                  const defaults =
                    serviceType === "family_care" || serviceType === "full_day_visit"
                      ? applyServiceTypeDurationDefaults(
                          serviceType,
                          form.startHour,
                          form.startMin,
                        )
                      : null;
                  updateForm((f) => ({
                    ...f,
                    serviceType,
                    careWorkerId: "",
                    careWorkerId2: "",
                    familyRelation: "",
                    ...(defaults ?? {}),
                  }));
                  if (serviceType !== "family_care") return;
                  void fetchRecipientFamilyWorkers(recipient.id).then((rows) => {
                    const preferred = rows[0];
                    if (!preferred?.employeeId) return;
                    const empId = preferred.employeeId;
                    const relation = preferred.familyRelation || "";
                    updateForm((f) => {
                      if (f.serviceType !== "family_care" || f.careWorkerId) {
                        return f;
                      }
                      return {
                        ...f,
                        careWorkerId: empId,
                        familyRelation: relation,
                      };
                    });
                    setAssignedWorkerMap((prevWorkers) => {
                      const list = prevWorkers.family_care ?? [];
                      const nextWorkers = {
                        ...prevWorkers,
                        family_care: list.includes(empId)
                          ? list
                          : [...list, empId],
                      };
                      setFamilyRelationMap((prevRel) => {
                        const nextRel = relation
                          ? { ...prevRel, [empId]: relation }
                          : prevRel;
                        void saveAssignedWorkers(
                          recipient.id,
                          nextWorkers,
                          nextRel,
                        ).catch(() => {
                          window.alert(
                            "담당 요양보호사 저장에 실패했습니다.",
                          );
                        });
                        return nextRel;
                      });
                      return nextWorkers;
                    });
                  });
                }}
                style={{
                  fontSize: 11,
                  padding: "3px 7px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontWeight: active ? 700 : 400,
                  backgroundColor: active ? c.bg : "#ffffff",
                  color: active ? c.color : "#94a3b8",
                  border: `1px solid ${active ? c.border : "#e2e8f0"}`,
                  boxShadow: active ? `0 1px 4px ${c.border}80` : "none",
                }}
              >
                {SERVICE_LABELS[st]}
              </button>
            );
          })}
        </div>

        {form.serviceType !== "day_care" && (
          <div>
            <FieldLabel required>
              급여제공(일정배정) {providerLabel}
              {form.serviceType === "visit_bath" ? " (1번)" : ""}
            </FieldLabel>
            <WorkerCombo
              workers={workers}
              value={form.careWorkerId}
              emptyValue=""
              placeholder={
                form.serviceType === "visit_nursing"
                  ? "간호사/간호조무사를 선택하세요"
                  : "요양보호사를 선택하세요"
              }
              pickerMode
              fullWidth
              allowedPositions={careWorkerPositions}
              onChange={(id) => {
                updateForm((f) => ({ ...f, careWorkerId: id }));
                if (id && !curSvcWorkers(form.serviceType).includes(id)) {
                  setCurSvcWorkers(form.serviceType, (prev) => [...prev, id]);
                }
                if (
                  form.serviceType === "family_care" &&
                  id &&
                  form.familyRelation
                ) {
                  saveFamilyRelation(id, form.familyRelation);
                }
              }}
            />

            {form.serviceType === "visit_bath" && (
              <div style={{ marginTop: 6 }}>
                <FieldLabel required>요양보호사 (2번)</FieldLabel>
                <WorkerCombo
                  workers={workers}
                  value={form.careWorkerId2}
                  emptyValue=""
                  placeholder="두번째 요양보호사를 선택하세요"
                  pickerMode
                  fullWidth
                  allowedPositions={[...DEFAULT_CARE_WORKER_POSITIONS]}
                  onChange={(id) => {
                    updateForm((f) => ({ ...f, careWorkerId2: id }));
                    if (id && !curSvcWorkers("visit_bath").includes(id)) {
                      setCurSvcWorkers("visit_bath", (prev) => [...prev, id]);
                    }
                  }}
                />
              </div>
            )}

            {form.serviceType === "family_care" && (
              <div style={{ marginTop: 6 }}>
                <FieldLabel required>가족관계</FieldLabel>
                <select
                  value={form.familyRelation}
                  onChange={(e) => {
                    const rel = e.target.value;
                    updateForm((f) => ({ ...f, familyRelation: rel }));
                    if (form.careWorkerId && rel) {
                      saveFamilyRelation(form.careWorkerId, rel);
                    }
                  }}
                  style={selectFullStyle}
                >
                  <option value="">선택</option>
                  {FAMILY_RELATIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.serviceType === "visit_bath" && (
              <div style={{ marginTop: 6 }}>
                <FieldLabel required>차량이용 구분</FieldLabel>
                <select
                  value={form.bathType}
                  onChange={(e) =>
                    updateForm((f) => ({ ...f, bathType: e.target.value }))
                  }
                  style={selectFullStyle}
                >
                  {BATH_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <FieldLabel>시간</FieldLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <TimeSelect
            hour={form.startHour}
            min={form.startMin}
            onHour={(h) => updateForm((f) => ({ ...f, startHour: h }))}
            onMin={(m) => updateForm((f) => ({ ...f, startMin: m }))}
          />
          <span style={{ fontSize: 12, color: "#94a3b8" }}>~</span>
          <TimeSelect
            hour={form.endHour}
            min={form.endMin}
            onHour={(h) => updateForm((f) => ({ ...f, endHour: h }))}
            onMin={(m) => updateForm((f) => ({ ...f, endMin: m }))}
          />
        </div>
        {quickButtons.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
            {quickButtons.map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={() => applyDuration(b.mins)}
                style={{
                  fontSize: 11,
                  padding: "3px 7px",
                  borderRadius: 4,
                  cursor: "pointer",
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {b.label}
              </button>
            ))}
          </div>
        )}
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
          {duration > 0
            ? `${Math.floor(duration / 60)}시간 ${duration % 60}분 (${duration}분)${duration >= 24 * 60 ? " ⚠ 24시간 초과" : ""}`
            : "시간을 확인하세요"}
        </div>

        {form.serviceType !== "day_care" && (
          <div style={{ marginTop: 4 }}>
            <div
              style={{ height: 1, background: "#e2e8f0", marginBottom: 10 }}
            />
            <div style={{ marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  fontWeight: 700,
                  letterSpacing: "0.03em",
                }}
              >
                ※ 담당 {providerLabel}
              </span>
            </div>
            {curSvcWorkers(form.serviceType).length === 0 ? (
              <div style={{ fontSize: 11, color: "#cbd5e1", padding: "6px 0" }}>
                등록된 {providerLabel}가 없습니다.
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                {curSvcWorkers(form.serviceType).map((wid) => {
                  const w = workers.find((x) => x.id === wid);
                  if (!w) return null;
                  const isSel = form.careWorkerId === wid;
                  return (
                    <div
                      key={wid}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "4px 6px",
                        borderRadius: 5,
                        border: `1px solid ${isSel ? "#bfdbfe" : "#e2e8f0"}`,
                        background: isSel ? "#eff6ff" : "#f8fafc",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          updateForm((f) => ({
                            ...f,
                            careWorkerId: wid,
                            familyRelation:
                              form.serviceType === "family_care"
                                ? (familyRelationMap[wid] ?? "")
                                : f.familyRelation,
                          }))
                        }
                        title="이 요양보호사를 위의 선택칸에 입력"
                        style={{
                          fontSize: 12,
                          fontWeight: isSel ? 700 : 500,
                          color: isSel ? "#1d4ed8" : "#94a3b8",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          textAlign: "left",
                        }}
                      >
                        {w.name}
                      </button>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {w.birth || "-"}
                      </span>
                      {form.serviceType === "family_care" &&
                        familyRelationMap[wid] && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "1px 5px",
                              borderRadius: 3,
                              background: "#f0fdf4",
                              color: "#16a34a",
                              border: "1px solid #bbf7d0",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {familyRelationMap[wid]}
                          </span>
                        )}
                      <button
                        type="button"
                        onClick={() => onViewWorkerSchedule?.(wid)}
                        style={{
                          marginLeft: "auto",
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 4,
                          cursor: "pointer",
                          border: "1px solid #e2e8f0",
                          background: "#f1f5f9",
                          color: "#64748b",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        일정조회
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCurSvcWorkers(form.serviceType, (prev) =>
                            prev.filter((x) => x !== wid),
                          )
                        }
                        style={{
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 4,
                          cursor: "pointer",
                          border: "1px solid #fecaca",
                          background: "#fff1f2",
                          color: "#dc2626",
                        }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {!showAddWorkerPicker && (
              <button
                type="button"
                onClick={() => {
                  setShowAddWorkerPicker(true);
                  setAddWorkerPickVal("");
                  setAddWorkerRelation("");
                }}
                style={{
                  marginTop: 6,
                  width: "100%",
                  fontSize: 11,
                  padding: "4px 0",
                  borderRadius: 5,
                  cursor: "pointer",
                  border: "1px dashed #cbd5e1",
                  background: "#f8fafc",
                  color: "#94a3b8",
                  fontWeight: 500,
                }}
              >
                + 추가
              </button>
            )}
            {showAddWorkerPicker && (
              <div
                style={{
                  marginTop: 6,
                  padding: 8,
                  background: "#f8fafc",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <WorkerCombo
                  workers={workers}
                  value={addWorkerPickVal}
                  emptyValue=""
                  placeholder={`추가할 ${providerLabel}를 검색하세요`}
                  pickerMode
                  fullWidth
                  allowedPositions={careWorkerPositions}
                  onChange={(wid) => {
                    setAddWorkerPickVal(wid);
                    setAddWorkerRelation("");
                  }}
                />
                {form.serviceType === "family_care" && addWorkerPickVal && (
                  <select
                    value={addWorkerRelation}
                    onChange={(e) => setAddWorkerRelation(e.target.value)}
                    style={selectFullStyle}
                  >
                    <option value="">가족관계 선택</option>
                    {FAMILY_RELATIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddWorkerPicker(false);
                      setAddWorkerPickVal("");
                      setAddWorkerRelation("");
                    }}
                    style={{
                      padding: "4px 12px",
                      fontSize: 12,
                      borderRadius: 5,
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
                    disabled={
                      !addWorkerPickVal ||
                      (form.serviceType === "family_care" && !addWorkerRelation)
                    }
                    onClick={registerAssignedWorker}
                    style={{
                      padding: "4px 14px",
                      fontSize: 12,
                      borderRadius: 5,
                      cursor:
                        addWorkerPickVal &&
                        (form.serviceType !== "family_care" || addWorkerRelation)
                          ? "pointer"
                          : "not-allowed",
                      border: "1px solid #152e50",
                      background:
                        addWorkerPickVal &&
                        (form.serviceType !== "family_care" || addWorkerRelation)
                          ? "#152e50"
                          : "#e2e8f0",
                      color:
                        addWorkerPickVal &&
                        (form.serviceType !== "family_care" || addWorkerRelation)
                          ? "#fff"
                          : "#94a3b8",
                      fontWeight: 700,
                    }}
                  >
                    등록
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: "10px 12px",
          borderTop: "1px solid #e2e8f0",
          background: "#ffffff",
          boxShadow: "0 -4px 12px rgba(0,0,0,0.06)",
        }}
      >
        {!assignMode ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                fontSize: 11,
                color: "#64748b",
                padding: "4px 8px",
                background: "#f8fafc",
                borderRadius: 5,
                border: "1px solid #e2e8f0",
                lineHeight: 1.5,
              }}
            >
              값 설정 후{" "}
              <span style={{ color: "#1d4ed8", fontWeight: 700 }}>중복검사</span>
              를 실행하면 배정 가능한 날짜가 캘린더에 표시됩니다.
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: 7,
                  fontSize: 12,
                  borderRadius: 7,
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  color: "#64748b",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleStartAssignClick}
                style={{
                  flex: 2,
                  padding: 7,
                  fontSize: 12,
                  borderRadius: 7,
                  fontWeight: 700,
                  backgroundImage: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  boxShadow: "0 2px 8px rgba(37,99,235,0.30)",
                }}
              >
                <Search size={11} strokeWidth={2.5} />
                중복검사
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <div
              style={{
                padding: "6px 9px",
                background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                borderRadius: 7,
                border: "1px solid #6ee7b7",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginBottom: 2,
                }}
              >
                <Check size={11} color="#059669" />
                중복검사 완료 · 배정 모드
              </div>
              <div style={{ fontSize: 11, color: "#065f46", lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700 }}>초록 날짜</span> 클릭 → 개별
                배정 &nbsp;·&nbsp; 일괄은 아래{" "}
                <span style={{ fontWeight: 700, color: "#1d4ed8" }}>
                  파란 「일괄 배정 실행」
                </span>
                버튼
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              <span
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                일괄설정
              </span>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: "6px 8px",
                background: "#f8fafc",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
              }}
            >
              <select
                value={batchType}
                onChange={(e) => {
                  onBatchTypeChange(e.target.value as BatchAssignType);
                  setSelectedDays(new Set());
                }}
                style={{
                  width: "100%",
                  fontSize: 12,
                  padding: "4px 5px",
                  borderRadius: 5,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#0f172a",
                  cursor: "pointer",
                }}
              >
                <option value="">방식 선택</option>
                <option value="all_month">한달모두일괄 (모든 날짜)</option>
                <option value="weekday_only">
                  (공휴일아닌) 평일일괄 (공휴일·토·일 제외)
                </option>
                <option value="no_holiday_only">공휴일만제외 일괄적용</option>
                <option value="no_weekend">토일일괄제외 (월~금)</option>
                <option value="specific_day">특정요일 일괄적용</option>
              </select>

              {batchType === "specific_day" && (
                <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                  {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => {
                    const on = selectedDays.has(i);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          setSelectedDays((prev) => {
                            const next = new Set(prev);
                            if (next.has(i)) next.delete(i);
                            else next.add(i);
                            return next;
                          })
                        }
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: on ? "none" : "1px solid #e2e8f0",
                          fontSize: 11,
                          fontWeight: on ? 700 : 400,
                          cursor: "pointer",
                          background: on
                            ? i === 0
                              ? "#dc2626"
                              : i === 6
                                ? "#2563eb"
                                : "#152e50"
                            : "#fff",
                          color: on
                            ? "#fff"
                            : i === 0
                              ? "#dc2626"
                              : i === 6
                                ? "#2563eb"
                                : "#64748b",
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                disabled={!batchType}
                onClick={async () => {
                  if (!batchType) {
                    window.alert("방식을 선택하세요.");
                    return;
                  }
                  if (batchType === "specific_day" && selectedDays.size === 0) {
                    window.alert("요일을 하나 이상 선택하세요.");
                    return;
                  }
                  const ok = await onRunBatch(batchType, selectedDays);
                  // 일괄 배정 성공 시 배정 모드 종료(배정완료와 동일)
                  if (ok) onClose();
                }}
                style={{
                  padding: "6px 0",
                  fontSize: 12,
                  borderRadius: 5,
                  fontWeight: 700,
                  backgroundImage: batchType
                    ? "linear-gradient(135deg,#2563eb,#1d4ed8)"
                    : "none",
                  backgroundColor: batchType ? "transparent" : "#e4eaf3",
                  border: "none",
                  color: batchType ? "#fff" : "#94a3b8",
                  cursor: batchType ? "pointer" : "default",
                  boxShadow: batchType
                    ? "0 2px 6px rgba(37,99,235,0.25)"
                    : "none",
                }}
              >
                일괄 배정 실행
              </button>
            </div>

            <div style={{ height: 1, background: "#e2e8f0" }} />

            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={onCancelAssign}
                style={{
                  flex: 1,
                  padding: 6,
                  fontSize: 12,
                  borderRadius: 7,
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  color: "#64748b",
                  cursor: "pointer",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                }}
              >
                <ChevronLeft size={11} />
                다시설정
              </button>
              <button
                type="button"
                onClick={() => {
                  // 일괄 방식을 고르고 실행하지 않은 채 완료하려는 경우만 확인
                  if (batchType) {
                    const proceed = window.confirm(
                      "일괄 방식을 선택했지만 「일괄 배정 실행」은 하지 않았습니다.\n개별 배정만 반영하고 배정을 완료할까요?",
                    );
                    if (!proceed) return;
                  }
                  onClose();
                }}
                style={{
                  flex: 2,
                  padding: 6,
                  fontSize: 12,
                  borderRadius: 7,
                  fontWeight: 700,
                  backgroundImage: "linear-gradient(135deg, #059669, #047857)",
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  boxShadow: "0 2px 8px rgba(5,150,105,0.25)",
                }}
              >
                <Check size={11} />
                배정 완료
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div
      style={{
        fontSize: 11,
        color: "#94a3b8",
        marginBottom: 4,
        fontWeight: 700,
        letterSpacing: "0.03em",
      }}
    >
      {children}
      {required && <span style={{ color: "#ef4444" }}> *</span>}
    </div>
  );
}

function TimeSelect({
  hour,
  min,
  onHour,
  onMin,
}: {
  hour: string;
  min: string;
  onHour: (v: string) => void;
  onMin: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      <select
        value={hour}
        onChange={(e) => onHour(e.target.value)}
        style={timeSelectStyle}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span style={{ fontSize: 12, color: "#94a3b8" }}>:</span>
      <select
        value={min}
        onChange={(e) => onMin(e.target.value)}
        style={timeSelectStyle}
      >
        {MINS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}

const timeSelectStyle = {
  width: 40,
  fontSize: 12,
  padding: "3px 2px",
  borderRadius: 4,
  border: "1px solid #e2e8f0",
  background: "#ffffff",
} as const;

const selectFullStyle = {
  width: "100%",
  fontSize: 12,
  padding: "5px 8px",
  borderRadius: 5,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#0f172a",
  outline: "none",
} as const;
