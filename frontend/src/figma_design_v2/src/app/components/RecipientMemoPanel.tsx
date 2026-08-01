/**
 * RecipientMemoPanel
 * ─────────────────────────────────────────────────────────────────
 * 수급자 메모 슬라이드 패널 (독립 컴포넌트)
 *
 * 디자인 시스템 규격 (즐거운재가센터 통합 규격):
 *   · 헤더  : linear-gradient(135deg, #78350f, #92400e)  다크브라운
 *   · 서브바: #fffbeb 노란 배경 + #fde68a 노란 테두리
 *   · textarea border: #fcd34d
 *   · 저장 버튼: linear-gradient(135deg, #d97706, #b45309)
 *   · 고정 메모: #fffbeb bg + #f59e0b 왼쪽 강조 테두리
 *   · 패널 너비: 288px 슬라이드 오버레이
 *
 * Props:
 *   · recipientId   — 수급자 ID (메모 저장소 키)
 *   · recipientName — 수급자 이름 (헤더 표시)
 *   · serviceYear   — 서비스 연도 (컨텍스트 바)
 *   · serviceMonth  — 서비스 월  (컨텍스트 바)
 *   · open          — 패널 열림 여부
 *   · onClose       — 닫기 콜백
 *   · onCountChange — 메모 건수 변경 시 콜백 (부모 버튼 뱃지 갱신용, optional)
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { X, StickyNote, Plus, Clock, Pin, PinOff } from 'lucide-react';

// ── 메모 타입 (다른 시스템에서도 import 가능하도록 export) ──
export interface MemoEntry {
  id: string;
  content: string;
  timestamp: string;
  serviceMonth?: string; // 'YYYY-MM'
  pinned: boolean;
}

// ── 세션 내 메모 스토어 (모듈 레벨 — 컴포넌트 언마운트 후에도 유지) ──
const _store: Record<string, MemoEntry[]> = {};
const _listeners = new Map<string, Set<() => void>>();

function getStore(id: string): MemoEntry[] {
  return _store[id] ?? [];
}
function setStore(id: string, memos: MemoEntry[]) {
  _store[id] = memos;
  _listeners.get(id)?.forEach(fn => fn());
}
function subscribe(id: string, fn: () => void) {
  if (!_listeners.has(id)) _listeners.set(id, new Set());
  _listeners.get(id)!.add(fn);
  return () => _listeners.get(id)?.delete(fn);
}

/** 수급자 메모 건수를 조회하는 유틸 (외부 버튼 뱃지용) */
export function getRecipientMemoCount(recipientId: string): number {
  return getStore(recipientId).length;
}

// ── 날짜 포맷 헬퍼 ───────────────────────────────────────────────
function formatMemoTime(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${mi}`;
}

// ── 컴포넌트 Props ───────────────────────────────────────────────
interface RecipientMemoPanelProps {
  recipientId: string;
  recipientName: string;
  serviceYear: number;
  serviceMonth: number;
  open: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

// ── 컴포넌트 ─────────────────────────────────────────────────────
export function RecipientMemoPanel({
  recipientId,
  recipientName,
  serviceYear,
  serviceMonth,
  open,
  onClose,
  onCountChange,
}: RecipientMemoPanelProps) {

  // ── 메모 목록 상태 (스토어 구독) ──────────────────────────────
  const [memos, setMemos] = useState<MemoEntry[]>(() => getStore(recipientId));

  useEffect(() => {
    setMemos(getStore(recipientId));
    const unsub = subscribe(recipientId, () => {
      const next = getStore(recipientId);
      setMemos(next);
      onCountChange?.(next.length);
    });
    return unsub;
  }, [recipientId, onCountChange]);

  // 초기 카운트 동기화
  useEffect(() => {
    onCountChange?.(getStore(recipientId).length);
  }, [recipientId, onCountChange]);

  // ── 입력 / 편집 상태 ─────────────────────────────────────────
  const [newText,       setNewText]       = useState('');
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [editingText,   setEditingText]   = useState('');

  // 수급자가 바뀌면 입력 상태 초기화
  useEffect(() => {
    setNewText('');
    setEditingId(null);
    setEditingText('');
  }, [recipientId]);

  // ESC 로 패널 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // ── 메모 CRUD ─────────────────────────────────────────────────
  const addMemo = useCallback(() => {
    if (!newText.trim()) return;
    const entry: MemoEntry = {
      id: `memo-${Date.now()}`,
      content: newText.trim(),
      timestamp: new Date().toISOString(),
      serviceMonth: `${serviceYear}-${String(serviceMonth).padStart(2, '0')}`,
      pinned: false,
    };
    setStore(recipientId, [entry, ...getStore(recipientId)]);
    setNewText('');
  }, [newText, recipientId, serviceYear, serviceMonth]);

  const saveEdit = useCallback(() => {
    if (!editingId || !editingText.trim()) { setEditingId(null); return; }
    setStore(
      recipientId,
      getStore(recipientId).map(m =>
        m.id === editingId ? { ...m, content: editingText.trim() } : m,
      ),
    );
    setEditingId(null);
    setEditingText('');
  }, [editingId, editingText, recipientId]);

  const togglePin = useCallback((memoId: string) => {
    setStore(
      recipientId,
      getStore(recipientId).map(m => m.id === memoId ? { ...m, pinned: !m.pinned } : m),
    );
  }, [recipientId]);

  const deleteMemo = useCallback((memoId: string) => {
    setStore(recipientId, getStore(recipientId).filter(m => m.id !== memoId));
  }, [recipientId]);

  // ── 정렬: 고정 메모 상단 ─────────────────────────────────────
  const sorted = [...memos.filter(m => m.pinned), ...memos.filter(m => !m.pinned)];

  // ── 렌더 ─────────────────────────────────────────────────────
  return (
    <>
      {/* 딤드 오버레이 (패널 열릴 때만) */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.08)',
            zIndex: 59,
          }}
        />
      )}

      {/* 슬라이드 패널 */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 288,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        background: 'white',
        borderLeft: '1px solid #fde68a',
        boxShadow: open ? '-6px 0 24px rgba(0,0,0,0.10)' : 'none',
        display: 'flex', flexDirection: 'column',
        zIndex: 60,
      }}>

        {/* ── 헤더 ─────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 10px',
          background: 'linear-gradient(135deg,#78350f,#92400e)',
          flexShrink: 0,
        }}>
          <StickyNote size={13} style={{ color: '#fde68a' }} />
          <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#fef9c3' }}>
            {recipientName} 메모
          </span>
          {memos.length > 0 && (
            <span style={{
              fontSize: 10, color: '#fde68a',
              background: 'rgba(253,230,138,0.15)',
              border: '1px solid rgba(253,230,138,0.3)',
              padding: '1px 7px', borderRadius: 10, fontWeight: 600,
            }}>
              {memos.length}건
            </span>
          )}
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 20, height: 20, border: 'none',
              background: 'rgba(255,255,255,0.15)', borderRadius: 4,
              cursor: 'pointer', padding: 0,
            }}
          >
            <X size={12} style={{ color: 'white' }} />
          </button>
        </div>

        {/* ── 서비스 월 컨텍스트 바 + 입력 영역 ───────────────── */}
        <div style={{
          padding: '8px 10px',
          background: '#fffbeb',
          borderBottom: '1px solid #fde68a',
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: 9, color: '#92400e', fontWeight: 600,
            marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Clock size={9} style={{ color: '#d97706' }} />
            {serviceYear}년 {serviceMonth}월 서비스 작업 중
          </div>
          <textarea
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addMemo(); }}
            placeholder={'메모를 입력하세요\n(Ctrl+Enter로 저장)'}
            rows={3}
            style={{
              width: '100%', padding: '5px 7px',
              border: '1px solid #fcd34d', borderRadius: 5,
              fontSize: 11, color: '#1e293b',
              background: 'white', outline: 'none',
              resize: 'none', boxSizing: 'border-box',
              lineHeight: 1.5, fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              onClick={addMemo}
              disabled={!newText.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '4px 12px',
                background: newText.trim()
                  ? 'linear-gradient(135deg,#d97706,#b45309)' : '#f1f5f9',
                color: newText.trim() ? 'white' : '#94a3b8',
                border: 'none', borderRadius: 5,
                cursor: newText.trim() ? 'pointer' : 'default',
                fontSize: 11, fontWeight: 600,
              }}
            >
              <Plus size={11} />저장
            </button>
          </div>
        </div>

        {/* ── 메모 목록 ─────────────────────────────────────────── */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '6px 8px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {sorted.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: '100%', gap: 8, opacity: 0.5,
            }}>
              <StickyNote size={28} style={{ color: '#d1d5db' }} />
              <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>메모가 없습니다</p>
            </div>
          ) : (
            sorted.map(m => (
              <div
                key={m.id}
                style={{
                  background: m.pinned ? '#fffbeb' : '#f8fafc',
                  border: `1px solid ${m.pinned ? '#fde68a' : '#e2e8f0'}`,
                  borderLeft: `3px solid ${m.pinned ? '#f59e0b' : '#e2e8f0'}`,
                  borderRadius: 6, padding: '6px 8px',
                }}
              >
                {/* 메타 행 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  {m.serviceMonth && (
                    <span style={{
                      fontSize: 9, background: '#dbeafe', color: '#1d4ed8',
                      padding: '0 5px', borderRadius: 8, fontWeight: 600, flexShrink: 0,
                    }}>
                      {m.serviceMonth}
                    </span>
                  )}
                  {m.pinned && (
                    <span style={{
                      fontSize: 9, background: '#fef3c7', color: '#d97706',
                      padding: '0 5px', borderRadius: 8, fontWeight: 700, flexShrink: 0,
                    }}>
                      📌 고정
                    </span>
                  )}
                  <span style={{ flex: 1, fontSize: 9, color: '#94a3b8', textAlign: 'right' }}>
                    {formatMemoTime(m.timestamp)}
                  </span>
                </div>

                {/* 내용 */}
                {editingId === m.id ? (
                  <div>
                    <textarea
                      autoFocus
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveEdit();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      rows={3}
                      style={{
                        width: '100%', padding: '4px 6px',
                        border: '1px solid #fbbf24', borderRadius: 4,
                        fontSize: 11, color: '#1e293b', outline: 'none',
                        resize: 'none', boxSizing: 'border-box',
                        lineHeight: 1.5, fontFamily: 'inherit',
                        background: '#fffbeb',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          padding: '2px 8px', border: '1px solid #e2e8f0',
                          borderRadius: 4, background: 'white',
                          fontSize: 10, cursor: 'pointer', color: '#64748b',
                        }}
                      >취소</button>
                      <button
                        onClick={saveEdit}
                        style={{
                          padding: '2px 8px', border: 'none', borderRadius: 4,
                          background: '#d97706', color: 'white',
                          fontSize: 10, fontWeight: 600, cursor: 'pointer',
                        }}
                      >저장</button>
                    </div>
                  </div>
                ) : (
                  <p
                    onDoubleClick={() => { setEditingId(m.id); setEditingText(m.content); }}
                    title="더블클릭하여 편집"
                    style={{
                      fontSize: 11, color: '#1e293b',
                      lineHeight: 1.6, margin: 0,
                      whiteSpace: 'pre-wrap', cursor: 'text',
                    }}
                  >
                    {m.content}
                  </p>
                )}

                {/* 액션 버튼 */}
                {editingId !== m.id && (
                  <div style={{ display: 'flex', gap: 3, marginTop: 5, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => { setEditingId(m.id); setEditingText(m.content); }}
                      style={{
                        fontSize: 9, color: '#64748b', background: 'white',
                        border: '1px solid #e2e8f0', borderRadius: 3,
                        padding: '1px 6px', cursor: 'pointer',
                      }}
                    >편집</button>
                    <button
                      onClick={() => togglePin(m.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 2, fontSize: 9,
                        color: m.pinned ? '#d97706' : '#64748b',
                        background: m.pinned ? '#fef3c7' : 'white',
                        border: `1px solid ${m.pinned ? '#fde68a' : '#e2e8f0'}`,
                        borderRadius: 3, padding: '1px 6px', cursor: 'pointer',
                      }}
                    >
                      {m.pinned ? <PinOff size={9} /> : <Pin size={9} />}
                      {m.pinned ? '고정해제' : '고정'}
                    </button>
                    <button
                      onClick={() => deleteMemo(m.id)}
                      style={{
                        fontSize: 9, color: '#dc2626', background: '#fff1f2',
                        border: '1px solid #fecaca', borderRadius: 3,
                        padding: '1px 6px', cursor: 'pointer',
                      }}
                    >삭제</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* ── 하단 단축키 안내 ─────────────────────────────────── */}
        <div style={{
          padding: '5px 10px',
          background: '#fffbeb',
          borderTop: '1px solid #fde68a',
          flexShrink: 0,
        }}>
          <p style={{ fontSize: 9, color: '#92400e', lineHeight: 1.5, margin: 0 }}>
            💡 더블클릭으로 편집 · 📌 핀으로 중요 메모 고정 · Ctrl+Enter로 빠른 저장
          </p>
        </div>
      </div>
    </>
  );
}
