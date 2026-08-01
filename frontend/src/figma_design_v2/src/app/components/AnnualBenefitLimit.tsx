import { useState } from 'react';
import { annualBenefitLimitsStore, setBenefitLimitRow, type BenefitLimitRow } from './mockData';

const GRADE_KEYS = ['1','2','3','4','5','인지지원'] as const;
type GKey = typeof GRADE_KEYS[number];
const GRADE_LABELS: Record<GKey, string> = {
  '1':'1등급','2':'2등급','3':'3등급','4':'4등급','5':'5등급','인지지원':'인지지원등급',
};
const SVC_TARGETS = '방문요양(가족요양 포함) · 방문목욕 · 주간보호';

const fmt   = (n: number) => n.toLocaleString('ko-KR');
const parse = (s: string) => parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;

function makeDefault(): BenefitLimitRow {
  return { '1':2512900,'2':2331200,'3':1528200,'4':1409700,'5':1208900,'인지지원':676320 };
}

export function AnnualBenefitLimit() {
  // 저장소를 로컬 state로 미러링 — 저장 시 전역 store에도 반영
  const [years, setYears] = useState<Record<number, BenefitLimitRow & { note?: string }>>(() => {
    const init: Record<number, BenefitLimitRow & { note?: string }> = {};
    Object.entries(annualBenefitLimitsStore).forEach(([y, row]) => { init[Number(y)] = { ...row, note: '' }; });
    return init;
  });
  const [selectedYear, setSelectedYear] = useState(2026);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<(BenefitLimitRow & { note?: string }) | null>(null);

  const yearList = Object.keys(years).map(Number).sort((a, b) => b - a);
  const cur = years[selectedYear] ?? { ...makeDefault(), note: '' };

  const startEdit = () => { setDraft({ ...cur }); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setDraft(null); };
  const saveEdit = () => {
    if (!draft) return;
    setYears(prev => ({ ...prev, [selectedYear]: { ...draft } }));
    setBenefitLimitRow(selectedYear, draft);
    setEditing(false); setDraft(null);
  };
  const addYear = () => {
    const maxY = Math.max(...yearList);
    const newY = maxY + 1;
    const base = years[maxY] ?? makeDefault();
    const newRow = { ...base, note: '' };
    setYears(y => ({ ...y, [newY]: newRow }));
    setBenefitLimitRow(newY, newRow);
    setSelectedYear(newY); setEditing(false); setDraft(null);
  };

  const data = editing && draft ? draft : cur;

  const TH: React.CSSProperties = {
    padding: '9px 14px', textAlign: 'center', fontSize: 13, fontWeight: 700,
    background: '#1e0a3c', color: '#e9d5ff', border: '1px solid #4c1d95',
  };
  const TD = (center = true): React.CSSProperties => ({
    padding: '9px 14px', textAlign: center ? 'center' : 'left', fontSize: 13,
    border: '1px solid #e9d5ff', color: '#1e293b',
  });

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '24px 32px', background: '#f8f5ff', fontFamily: "'Noto Sans KR', sans-serif" }}>
      {/* 타이틀 */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e0a3c', margin: 0 }}>연도별 급여한도</h2>
        <span style={{ fontSize: 12, color: '#7c3aed', background: '#ede9fe', padding: '2px 10px', borderRadius: 10, border: '1px solid #c4b5fd' }}>
          {SVC_TARGETS}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16, padding: '7px 12px', background: '#faf7ff', border: '1px solid #ddd6fe', borderRadius: 6 }}>
        ※ 월중 등급 변경이 있을 경우 <strong style={{ color: '#7c3aed' }}>더 높은 등급(낮은 번호)의 한도</strong>를 적용합니다.
      </div>

      {/* 연도 탭 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {yearList.map(y => (
          <button key={y} onClick={() => { setSelectedYear(y); setEditing(false); setDraft(null); }}
            style={{ padding: '5px 18px', fontSize: 13, borderRadius: 6, cursor: 'pointer', fontWeight: y === selectedYear ? 700 : 400,
              border: y === selectedYear ? '2px solid #7c3aed' : '1px solid #c4b5fd',
              background: y === selectedYear ? '#7c3aed' : '#fff', color: y === selectedYear ? '#fff' : '#7c3aed' }}>
            {y}년
          </button>
        ))}
        <button onClick={addYear}
          style={{ padding: '5px 14px', fontSize: 12, borderRadius: 6, cursor: 'pointer', border: '1px dashed #a78bfa', background: '#faf7ff', color: '#7c3aed' }}>
          + 연도 추가
        </button>
      </div>

      {/* 테이블 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, background: '#fff', borderRadius: 10, overflow: 'hidden' }}>
          <thead>
            <tr>
              <th style={{ ...TH, width: 150, textAlign: 'left' }}>구분</th>
              {GRADE_KEYS.map(k => <th key={k} style={{ ...TH, minWidth: 120 }}>{GRADE_LABELS[k]}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...TD(false), background: '#faf7ff', fontWeight: 600, color: '#4c1d95' }}>월 한도액 (원)</td>
              {GRADE_KEYS.map(k => (
                <td key={k} style={{ ...TD(), background: '#fff' }}>
                  {editing && draft ? (
                    <input type="text" value={fmt(draft[k] as number ?? 0)}
                      onChange={e => setDraft(d => d ? { ...d, [k]: parse(e.target.value) } : d)}
                      style={{ width: '100%', fontSize: 13, padding: '3px 6px', border: '1px solid #a78bfa', borderRadius: 4, outline: 'none', textAlign: 'right', background: '#faf7ff', boxSizing: 'border-box' }} />
                  ) : (
                    <span style={{ fontWeight: 600 }}>{fmt((data[k] as number) ?? 0)}</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ ...TD(false), background: '#faf7ff', fontWeight: 600, color: '#4c1d95' }}>적용 급여종류</td>
              <td colSpan={GRADE_KEYS.length} style={{ ...TD(false), color: '#475569', fontSize: 12 }}>{SVC_TARGETS}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 비고 */}
      <div style={{ marginTop: 16, maxWidth: 700 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 4 }}>비고</div>
        {editing && draft ? (
          <textarea value={draft.note ?? ''} onChange={e => setDraft(d => d ? { ...d, note: e.target.value } : d)}
            rows={3} placeholder="연도별 특이사항 입력"
            style={{ width: '100%', fontSize: 12, padding: '6px 10px', border: '1px solid #a78bfa', borderRadius: 6, outline: 'none', resize: 'vertical', fontFamily: "'Noto Sans KR', sans-serif", boxSizing: 'border-box', background: '#faf7ff' }} />
        ) : (
          <div style={{ fontSize: 12, color: cur.note ? '#475569' : '#cbd5e1', padding: '6px 10px', background: '#faf7ff', borderRadius: 6, border: '1px solid #e9d5ff', minHeight: 42 }}>
            {cur.note || '비고 없음'}
          </div>
        )}
      </div>

      {/* 버튼 */}
      <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
        {editing ? (
          <>
            <button onClick={cancelEdit}
              style={{ padding: '7px 20px', fontSize: 13, borderRadius: 6, cursor: 'pointer', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b' }}>취소</button>
            <button onClick={saveEdit}
              style={{ padding: '7px 24px', fontSize: 13, borderRadius: 6, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontWeight: 700 }}>저장</button>
          </>
        ) : (
          <button onClick={startEdit}
            style={{ padding: '7px 24px', fontSize: 13, borderRadius: 6, cursor: 'pointer', border: '1px solid #7c3aed', background: '#faf7ff', color: '#7c3aed', fontWeight: 700 }}>수정</button>
        )}
      </div>
    </div>
  );
}
