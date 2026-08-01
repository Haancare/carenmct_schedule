"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Pin, PinOff, Plus, StickyNote, X } from "lucide-react";

import {
  createRecipientMemo,
  deleteRecipientMemo,
  fetchRecipientMemos,
  toggleRecipientMemoPin,
  updateRecipientMemo,
  type RecipientMemoEntry,
} from "@/lib/api/scheduleAssignment";

type Props = {
  recipientId: string;
  recipientName: string;
  open: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
};

function formatMemoTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

export default function RecipientMemoPanel({
  recipientId,
  recipientName,
  open,
  onClose,
  onCountChange,
}: Props) {
  const [memos, setMemos] = useState<RecipientMemoEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingSaving, setEditingSaving] = useState(false);
  const prevRecipientId = useRef<string | null>(null);

  const loadMemos = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchRecipientMemos(recipientId);
      setMemos(list);
      onCountChange?.(list.length);
    } catch {
      setMemos([]);
      onCountChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [recipientId, onCountChange]);

  useEffect(() => {
    if (!open) return;
    if (prevRecipientId.current === recipientId && memos.length > 0) return;
    prevRecipientId.current = recipientId;
    loadMemos();
  }, [recipientId, open, loadMemos, memos.length]);

  useEffect(() => {
    setNewText("");
    setEditingId(null);
    setEditingText("");
    setMemos([]);
    prevRecipientId.current = null;
  }, [recipientId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const addMemo = useCallback(async () => {
    if (!newText.trim() || saving) return;
    setSaving(true);
    try {
      const created = await createRecipientMemo(recipientId, newText.trim());
      const next = [created, ...memos];
      setMemos(next);
      onCountChange?.(next.length);
      setNewText("");
    } catch {
      window.alert("메모 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }, [newText, saving, recipientId, memos, onCountChange]);

  const saveEdit = useCallback(async () => {
    if (!editingId || !editingText.trim() || editingSaving) return;
    setEditingSaving(true);
    try {
      const updated = await updateRecipientMemo(editingId, editingText.trim());
      setMemos((prev) => prev.map((m) => (m.id === editingId ? updated : m)));
      setEditingId(null);
      setEditingText("");
    } catch {
      window.alert("메모 수정에 실패했습니다.");
    } finally {
      setEditingSaving(false);
    }
  }, [editingId, editingText, editingSaving]);

  const togglePin = useCallback(
    async (memoId: string) => {
      try {
        const updated = await toggleRecipientMemoPin(memoId);
        setMemos((prev) => {
          const next = prev.map((m) => (m.id === memoId ? updated : m));
          return [
            ...next.filter((m) => m.pinned),
            ...next.filter((m) => !m.pinned),
          ];
        });
      } catch {
        window.alert("고정 설정에 실패했습니다.");
      }
    },
    [],
  );

  const deleteMemo = useCallback(
    async (memoId: string) => {
      if (!window.confirm("메모를 삭제하시겠습니까?")) return;
      try {
        await deleteRecipientMemo(memoId);
        const next = memos.filter((m) => m.id !== memoId);
        setMemos(next);
        onCountChange?.(next.length);
      } catch {
        window.alert("메모 삭제에 실패했습니다.");
      }
    },
    [memos, onCountChange],
  );

  const sorted = [
    ...memos.filter((m) => m.pinned),
    ...memos.filter((m) => !m.pinned),
  ];

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.08)",
            zIndex: 59,
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: 288,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          background: "white",
          borderLeft: "1px solid #fde68a",
          boxShadow: open ? "-6px 0 24px rgba(0,0,0,0.10)" : "none",
          display: "flex",
          flexDirection: "column",
          zIndex: 60,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 10px",
            background: "linear-gradient(135deg,#78350f,#92400e)",
            flexShrink: 0,
          }}
        >
          <StickyNote size={13} style={{ color: "#fde68a" }} />
          <span
            style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#fef9c3" }}
          >
            {recipientName} 메모
          </span>
          {memos.length > 0 && (
            <span
              style={{
                fontSize: 10,
                color: "#fde68a",
                background: "rgba(253,230,138,0.15)",
                border: "1px solid rgba(253,230,138,0.3)",
                padding: "1px 7px",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              {memos.length}건
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 20,
              height: 20,
              border: "none",
              background: "rgba(255,255,255,0.15)",
              borderRadius: 4,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <X size={12} style={{ color: "white" }} />
          </button>
        </div>

        <div
          style={{
            padding: "8px 10px",
            background: "#fffbeb",
            borderBottom: "1px solid #fde68a",
            flexShrink: 0,
          }}
        >
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addMemo();
            }}
            placeholder={"메모를 입력하세요\n(Ctrl+Enter로 저장)"}
            rows={3}
            style={{
              width: "100%",
              padding: "5px 7px",
              border: "1px solid #fcd34d",
              borderRadius: 5,
              fontSize: 13,
              color: "#1e293b",
              background: "white",
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
              lineHeight: 1.5,
              fontFamily: "inherit",
            }}
          />
          <div
            style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}
          >
            <button
              type="button"
              onClick={addMemo}
              disabled={!newText.trim() || saving}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                padding: "4px 12px",
                background:
                  newText.trim() && !saving
                    ? "linear-gradient(135deg,#d97706,#b45309)"
                    : "#f1f5f9",
                color: newText.trim() && !saving ? "white" : "#94a3b8",
                border: "none",
                borderRadius: 5,
                cursor: newText.trim() && !saving ? "pointer" : "default",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {saving ? (
                <Loader2
                  size={11}
                  style={{ animation: "recipientMemoSpin 1s linear infinite" }}
                />
              ) : (
                <Plus size={11} />
              )}
              저장
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "6px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Loader2
                size={22}
                style={{
                  color: "#d97706",
                  animation: "recipientMemoSpin 1s linear infinite",
                }}
              />
            </div>
          ) : sorted.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 8,
                opacity: 0.5,
              }}
            >
              <StickyNote size={28} style={{ color: "#d1d5db" }} />
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                메모가 없습니다
              </p>
            </div>
          ) : (
            sorted.map((m) => (
              <div
                key={m.id}
                style={{
                  background: m.pinned ? "#fffbeb" : "#f8fafc",
                  border: `1px solid ${m.pinned ? "#fde68a" : "#e2e8f0"}`,
                  borderLeft: `3px solid ${m.pinned ? "#f59e0b" : "#e2e8f0"}`,
                  borderRadius: 6,
                  padding: "6px 8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    marginBottom: 4,
                  }}
                >
                  {m.pinned && (
                    <span
                      style={{
                        fontSize: 9,
                        background: "#fef3c7",
                        color: "#d97706",
                        padding: "0 5px",
                        borderRadius: 8,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      📌 고정
                    </span>
                  )}
                  <span
                    style={{
                      flex: 1,
                      fontSize: 9,
                      color: "#94a3b8",
                      textAlign: "right",
                    }}
                  >
                    {m.authorName ?? "-"} · {formatMemoTime(m.timestamp)}
                  </span>
                </div>

                {editingId === m.id ? (
                  <div>
                    <textarea
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                          saveEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "4px 6px",
                        border: "1px solid #fbbf24",
                        borderRadius: 4,
                        fontSize: 13,
                        color: "#1e293b",
                        outline: "none",
                        resize: "none",
                        boxSizing: "border-box",
                        lineHeight: 1.5,
                        fontFamily: "inherit",
                        background: "#fffbeb",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        marginTop: 4,
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        style={{
                          padding: "2px 8px",
                          border: "1px solid #e2e8f0",
                          borderRadius: 4,
                          background: "white",
                          fontSize: 10,
                          cursor: "pointer",
                          color: "#64748b",
                        }}
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={editingSaving}
                        style={{
                          padding: "2px 8px",
                          border: "none",
                          borderRadius: 4,
                          background: "#d97706",
                          color: "white",
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: editingSaving ? "default" : "pointer",
                          opacity: editingSaving ? 0.7 : 1,
                        }}
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    onDoubleClick={() => {
                      setEditingId(m.id);
                      setEditingText(m.content);
                    }}
                    title="더블클릭하여 편집"
                    style={{
                      fontSize: 13,
                      color: "#1e293b",
                      lineHeight: 1.6,
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      cursor: "text",
                    }}
                  >
                    {m.content}
                  </p>
                )}

                {editingId !== m.id && (
                  <div
                    style={{
                      display: "flex",
                      gap: 3,
                      marginTop: 5,
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(m.id);
                        setEditingText(m.content);
                      }}
                      style={{
                        fontSize: 10,
                        color: "#64748b",
                        background: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: 3,
                        padding: "2px 8px",
                        cursor: "pointer",
                      }}
                    >
                      편집
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePin(m.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        fontSize: 10,
                        color: m.pinned ? "#d97706" : "#64748b",
                        background: m.pinned ? "#fef3c7" : "white",
                        border: `1px solid ${m.pinned ? "#fde68a" : "#e2e8f0"}`,
                        borderRadius: 3,
                        padding: "2px 8px",
                        cursor: "pointer",
                      }}
                    >
                      {m.pinned ? <PinOff size={10} /> : <Pin size={10} />}
                      {m.pinned ? "고정해제" : "고정"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMemo(m.id)}
                      style={{
                        fontSize: 10,
                        color: "#dc2626",
                        background: "#fff1f2",
                        border: "1px solid #fecaca",
                        borderRadius: 3,
                        padding: "2px 8px",
                        cursor: "pointer",
                      }}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div
          style={{
            padding: "5px 10px",
            background: "#fffbeb",
            borderTop: "1px solid #fde68a",
            flexShrink: 0,
          }}
        >
          <p
            style={{
              fontSize: 9,
              color: "#92400e",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            💡 더블클릭으로 편집 · 📌 핀으로 중요 메모 고정
          </p>
        </div>

        <style>{`@keyframes recipientMemoSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
}
