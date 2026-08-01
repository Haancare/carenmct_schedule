/**
 * RecipientHelpers.tsx
 * RecipientDetail 에서 분리된 순수 헬퍼 함수·상수·소형 UI 컴포넌트
 */
import { useState, useRef, useEffect } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { X, Check, Calendar, Info, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import {
  careWorkers, getEmployeeBirth, POSITION_CODES,
  getSchedules, getCalendarWeeks, recipients, getSchedulesForRecipient,
  toDateStr, formatKRW, SERVICE_LABELS,
  ScheduleEntry, ReductionType,
  calcSurcharge, getFeeMinMinutes,
} from './mockData';

// ── 날짜 헬퍼 ──────────────────────────────────────────────────────────────
export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}
export function fmtMD(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}.${Number(d)}`;
}

// ── 감경구분 헬퍼 ──────────────────────────────────────────────────────────
export function copayLabel(type: string): string {
  if (type === '일반대상자' || type === '일반') return '일반';
  if (type === '감경9%' || type === '감경대상자') return '9%';
  if (type === '감경7.5%') return '7.5%';
  if (type === '감경6%')   return '6%';
  if (type === '기초수급자' || type === '기초') return '기초';
  return type;
}
export function normalizeType(type: string): string {
  if (type === '일반대상자') return '일반';
  if (type === '기초수급자') return '기초';
  if (type === '감경대상자') return '감경9%';
  return type;
}
export function copayStyle(type: string): { bg: string; color: string; border: string } {
  const t = normalizeType(type);
  if (t === '기초')     return { bg: '#fefce8', color: '#854d0e', border: '#fde047' };
  if (t === '감경9%')   return { bg: '#fff7ed', color: '#c2410c', border: '#fdba74' };
  if (t === '감경7.5%') return { bg: '#fff7ed', color: '#b45309', border: '#fde68a' };
  if (t === '감경6%')   return { bg: '#f0fdf4', color: '#059669', border: '#6ee7b7' };
  return                       { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
}
export const RATE_BY_REDUCTION: Record<ReductionType, number> = {
  '일반': 15, '감경9%': 9, '감경7.5%': 7.5, '감경6%': 6, '기초': 0,
};

// ── 서비스 색상 ────────────────────────────────────────────────────────────
export const SVC_STYLE: Record<string, { bg: string; color: string; border: string; accent: string }> = {
  visit_care:    { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd', accent: '#3b82f6' },
  visit_bath:    { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7', accent: '#10b981' },
  visit_nursing: { bg: '#fff7ed', color: '#c2410c', border: '#fdba74', accent: '#f97316' },
  day_care:      { bg: '#f3e8ff', color: '#6d28d9', border: '#c4b5fd', accent: '#8b5cf6' },
  family_care:   { bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc', accent: '#0ea5e9' },
  full_day_visit:{ bg: '#e0e7ff', color: '#4338ca', border: '#a5b4fc', accent: '#6366f1' },
};

// ── 집계 / 급여액 헬퍼 ────────────────────────────────────────────────────
export function getScheduleTotalFee(s: ScheduleEntry, year: number): number {
  if (s.surchargeAmount !== undefined) return s.unitCost + s.surchargeAmount;
  const sur = calcSurcharge({
    year, serviceType: s.serviceType, date: s.date,
    startTime: s.startTime, endTime: s.endTime,
    durationMinutes: s.durationMinutes,
    gradeNum: (s.grade ?? 5) as number,
    feeAmount: s.unitCost, copaymentRate: s.copaymentRate ?? 15,
  });
  return s.unitCost + sur.amount;
}

export function buildSummary(schedules: ScheduleEntry[], year: number) {
  const map: Record<string, {
    careWorkerId: string; serviceType: string;
    startTime: string; endTime: string;
    durationMinutes: number; unitCost: number; benefitTotalSum: number; count: number;
    kind: 'plan' | 'claim';
  }> = {};
  schedules.forEach(s => {
    const totalFee = getScheduleTotalFee(s, year);
    // 청구는 실제 서비스 시간대가 매일 다르므로(예: 8:31~11:32), 시작/종료시간 대신
    // 수가 최저시작분 단위로 묶어 제공직원/급여종류/제공시간(최저분)/급여액(1회)별로 그룹핑한다.
    // 계획은 기존대로 제공직원/시작시간/종료시간/급여종류로 그룹핑한다.
    const isClaim  = s.kind === 'claim';
    const minMins  = isClaim ? getFeeMinMinutes(year, s.serviceType, s.durationMinutes) : s.durationMinutes;
    const key = isClaim
      ? `${s.careWorkerId}|${s.serviceType}|${minMins}|${totalFee}|claim`
      : `${s.careWorkerId}|${s.serviceType}|${s.startTime}|${s.endTime}|${totalFee}|plan`;
    if (!map[key]) {
      map[key] = { careWorkerId: s.careWorkerId, serviceType: s.serviceType,
        // 청구 행은 시작/종료시간을 표시하지 않는다(실제 시간대가 매일 달라 의미 없음).
        startTime: isClaim ? '' : s.startTime,
        endTime:   isClaim ? '' : s.endTime,
        durationMinutes: minMins, unitCost: totalFee,
        benefitTotalSum: 0, count: 0, kind: s.kind };
    }
    map[key].count++;
    map[key].benefitTotalSum += totalFee;
  });
  return Object.values(map).sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'claim' ? 1 : -1;
    return a.careWorkerId.localeCompare(b.careWorkerId);
  });
}

// ── 팝오버 헬퍼 ───────────────────────────────────────────────────────────
export function parseWorkerDOB(registrationId: string): string {
  const raw = registrationId.replace('-', '');
  const yy = raw.slice(0, 2), mm = raw.slice(2, 4), dd = raw.slice(4, 6);
  const g = parseInt(raw[6] ?? '1', 10);
  return `${g <= 2 ? '19' : '20'}${yy}.${mm}.${dd}`;
}
export function checkSurcharge(startTime: string): string {
  const h = parseInt(startTime.split(':')[0], 10);
  if (h >= 22 || h < 6) return '심야가산';
  if (h >= 18 || h < 8) return '야간가산';
  return '가산미적용';
}

// ── 디자인 토큰 ───────────────────────────────────────────────────────────
export const TH: CSSProperties = {
  background: '#152e50',
  color: 'rgba(255,255,255,0.88)',
  fontSize: 11, fontWeight: 600,
  height: 30, padding: '0 8px',
  whiteSpace: 'nowrap', textAlign: 'center' as const,
};

// ── 요양보호사 검색형 콤보박스 ────────────────────────────────────────────
export function CareWorkerCombo({ value, onChange, placeholder = '요양보호사 선택', allowedPositions = ['ST_08'] }: {
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  allowedPositions?: string[];
}) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const [showAll, setShowAll]     = useState(false);
  const [showAllPos, setShowAllPos] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);
  const q = query.trim().toLowerCase();
  const pool = careWorkers.filter(w => {
    if (!showAllPos && !allowedPositions.includes(w.positionCode)) return false;
    if (!showAll && w.status !== 'active') return false;
    if (!q) return true;
    return w.name.toLowerCase().includes(q) ||
      (w.nickname ?? '').toLowerCase().includes(q) ||
      getEmployeeBirth(w).includes(q);
  }).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  const selected = careWorkers.find(w => w.id === value);
  const birth = (w: typeof careWorkers[0]) => getEmployeeBirth(w);
  const label = (w: typeof careWorkers[0]) => `${w.name}${w.nickname ? `(${w.nickname})` : ''}`;
  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', height: 28, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 6,
        border: `1px solid ${value ? '#93c5fd' : '#e2e8f0'}`, borderRadius: 5,
        background: value ? '#eff6ff' : '#fff', color: value ? '#1d4ed8' : '#94a3b8',
        fontSize: 12, cursor: 'pointer', textAlign: 'left',
      }}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? `${label(selected)}  ${birth(selected)}` : placeholder}
        </span>
        {value && <X size={12} color="#94a3b8" onClick={e => { e.stopPropagation(); onChange(''); }} />}
        <ChevronDown size={12} color="#94a3b8" />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 31, left: 0, right: 0, zIndex: 9999, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 7, boxShadow: '0 8px 24px rgba(15,39,68,0.16)', overflow: 'hidden' }}>
          <div style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 4 }}>
            <Search size={12} color="#94a3b8" style={{ flexShrink: 0, marginTop: 4 }} />
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder="이름·별칭·생년월일 검색"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, background: 'transparent' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '3px 8px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} style={{ accentColor: '#2563eb' }} />
              <span style={{ fontSize: 11, color: '#64748b' }}>퇴직자 포함</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input type="checkbox" checked={showAllPos} onChange={e => setShowAllPos(e.target.checked)} style={{ accentColor: '#7c3aed' }} />
              <span style={{ fontSize: 11, color: '#64748b' }}>전체직종</span>
            </label>
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {pool.map(w => {
              const on = w.id === value;
              return (
                <div key={w.id} onClick={() => { onChange(w.id); setOpen(false); setQuery(''); }}
                  style={{ padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: 8, background: on ? '#eff6ff' : '#fff', borderTop: '1px solid #f8fafc' }}>
                  <span style={{ fontSize: 12, fontWeight: on ? 700 : 600, color: on ? '#1d4ed8' : '#0f172a' }}>
                    {w.name}{w.nickname ? <span style={{ color: '#64748b', fontWeight: 400, fontSize: 11 }}>({w.nickname})</span> : null}
                  </span>
                  {showAllPos && <span style={{ fontSize: 10, padding: '1px 4px', borderRadius: 3, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', whiteSpace: 'nowrap' }}>{POSITION_CODES[w.positionCode] ?? w.positionCode}</span>}
                  <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{birth(w)}</span>
                  {w.status !== 'active' && <span style={{ fontSize: 10, padding: '1px 4px', borderRadius: 3, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>퇴직</span>}
                </div>
              );
            })}
            {pool.length === 0 && <div style={{ padding: '14px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>검색 결과 없음</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 등급/감경구분 변경 팝업 ───────────────────────────────────────────────
interface ChangeOption { value: string; label: string; sub?: string; }
export interface PeriodChangeModalProps {
  icon: ReactNode; title: string; recipientName: string; monthLabel: string;
  monthStart: string; monthEnd: string; splitDate: string; onSplitChange: (v: string) => void;
  options: ChangeOption[]; beforeValue: string; onBeforeChange: (v: string) => void;
  afterValue: string; onAfterChange: (v: string) => void; reason: string;
  onReasonChange: (v: string) => void; accent: string; onClose: () => void; onSave: () => void;
}
export function PeriodChangeModal({
  icon, title, recipientName, monthLabel, monthStart, monthEnd,
  splitDate, onSplitChange, options, beforeValue, onBeforeChange,
  afterValue, onAfterChange, reason, onReasonChange, accent, onClose, onSave,
}: PeriodChangeModalProps) {
  const label: CSSProperties = { fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.03em', marginBottom: 6 };
  const splitValid  = splitDate >= monthStart && splitDate <= monthEnd;
  const wholeMonth  = splitValid && splitDate === monthStart;
  const beforeEnd   = splitValid ? addDays(splitDate, -1) : monthEnd;
  const canSave     = splitValid && (wholeMonth || beforeValue !== afterValue);
  const valueChips  = (selected: string, onSelect: (v: string) => void) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {options.map(o => {
        const active = o.value === selected;
        return (
          <button key={o.value} onClick={() => onSelect(o.value)} style={{
            fontSize: 12, padding: '4px 9px', borderRadius: 6, cursor: 'pointer',
            fontWeight: active ? 700 : 400,
            background: active ? `${accent}14` : '#fff', color: active ? accent : '#64748b',
            border: `1px solid ${active ? accent : '#e2e8f0'}`,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {o.label}{o.sub && <span style={{ fontSize: 10, color: active ? accent : '#94a3b8' }}>{o.sub}</span>}
          </button>
        );
      })}
    </div>
  );
  const periodHead = (range: string, tag: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: accent, background: `${accent}14`, padding: '2px 8px', borderRadius: 4 }}>{tag}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{range}</span>
    </div>
  );
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,39,68,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 10, width: 460, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(15,39,68,0.22)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(90deg,#0f2744,#1a3a5c)', borderRadius: '10px 10px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {icon}<span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{title}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{recipientName} · {monthLabel}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}><X size={15} color="rgba(255,255,255,0.6)" /></button>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={label}>변경 적용일 <span style={{ fontWeight: 400, color: '#94a3b8' }}>(이 날부터 변경 후 값 적용 · 1일 선택 시 월 전체)</span></div>
            <div style={{ position: 'relative' }}>
              <Calendar size={13} color="#94a3b8" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="date" value={splitDate} min={monthStart} max={monthEnd} onChange={e => onSplitChange(e.target.value)}
                style={{ width: '100%', fontSize: 12, padding: '7px 9px 7px 28px', border: `1px solid ${splitValid ? '#d1d5db' : '#fca5a5'}`, borderRadius: 6, color: '#1e293b', background: '#f9fbff', fontFamily: "'Noto Sans KR', sans-serif", boxSizing: 'border-box' }} />
            </div>
            {!splitValid && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 4 }}>해당 월 내의 날짜를 선택하세요.</div>}
          </div>
          {!wholeMonth && (
            <div style={{ padding: '11px 12px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fafbfd' }}>
              {periodHead(`${fmtMD(monthStart)} ~ ${fmtMD(beforeEnd)}`, '변경 전')}
              {valueChips(beforeValue, onBeforeChange)}
            </div>
          )}
          <div style={{ padding: '11px 12px', border: `1px solid ${accent}66`, borderRadius: 8, background: `${accent}08` }}>
            {periodHead(`${splitValid ? fmtMD(splitDate) : '-'} ~ ${fmtMD(monthEnd)}`, wholeMonth ? '월 전체' : '변경 후')}
            {valueChips(afterValue, onAfterChange)}
          </div>
          <div>
            <div style={label}>변경사유</div>
            <textarea value={reason} onChange={e => onReasonChange(e.target.value)} rows={2}
              placeholder="예) 등급 재판정 결과 반영, 감경 인정 변경 등"
              style={{ width: '100%', fontSize: 12, padding: '7px 9px', border: '1px solid #d1d5db', borderRadius: 6, resize: 'vertical', fontFamily: "'Noto Sans KR', sans-serif", boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 7, padding: '9px 11px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6 }}>
            <Info size={13} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 11, color: '#92400e', lineHeight: 1.5 }}>저장하면 각 기간의 값이 일정카드에 <strong>스냅샷으로 명시 저장</strong>됩니다.</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 7, padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '0 0 10px 10px' }}>
          <button onClick={onClose} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer' }}>취소</button>
          <button onClick={onSave} disabled={!canSave} style={{ fontSize: 12, fontWeight: 700, padding: '7px 16px', borderRadius: 6, border: 'none', background: canSave ? accent : '#cbd5e1', color: '#fff', cursor: canSave ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Check size={13} /> 기간 저장
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 공통 레이아웃 컴포넌트 ───────────────────────────────────────────────
export function InfoCard({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: '#ffffff', borderRadius: 8, boxShadow: '0 0 0 1px #e2e8f0', padding: '8px 10px' }}>
      {children}
    </div>
  );
}
export function SectionTitle({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 6, ...style }}>
      {children}
    </div>
  );
}
export function ContactRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 28, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 12, color: '#1e293b', lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}
export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: 12, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 4 }}>{children}</span>
    </div>
  );
}

// ── 요양보호사 월간 일정조회 모달 ─────────────────────────────────────────
export function WorkerScheduleModal({ workerId, initYear, initMonth, todayStr, onClose }: {
  workerId: string; initYear: number; initMonth: number; todayStr: string; onClose: () => void;
}) {
  const [yr, setYr] = useState(initYear);
  const [mo, setMo] = useState(initMonth);
  const [viewKind, setViewKind] = useState<'plan' | 'claim'>('plan');
  const w = careWorkers.find(x => x.id === workerId);
  if (!w) return null;
  const birth = getEmployeeBirth(w);
  const schedEntries = getSchedules(yr, mo).filter(s => s.careWorkerId === workerId && s.kind === viewKind);
  const byDate = new Map<string, ScheduleEntry[]>();
  schedEntries.forEach(s => { const arr = byDate.get(s.date) ?? []; arr.push(s); byDate.set(s.date, arr); });

  const calWeeks = getCalendarWeeks(yr, mo);
  const prevM = () => { if (mo === 1) { setYr(y => y-1); setMo(12); } else setMo(m => m-1); };
  const nextM = () => { if (mo === 12) { setYr(y => y+1); setMo(1); } else setMo(m => m+1); };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:10, width:'min(94vw,1100px)', maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 12px 40px rgba(0,0,0,0.22)', overflow:'hidden' }} onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div style={{ background:'linear-gradient(90deg,#0f2744,#1a3a5c)', padding:'8px 16px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <span style={{ color:'#fff', fontSize:13, fontWeight:700 }}>{w.name}</span>
          <span style={{ color:'#94a3b8', fontSize:12 }}>{birth}</span>
          <span style={{ color:'#cbd5e1', fontSize:11 }}>방문일정 조회</span>
          {/* 계획/청구 토글 */}
          <div style={{ display:'flex', alignItems:'center', background:'rgba(0,0,0,0.25)', borderRadius:6, padding:2, gap:1, marginLeft:8 }}>
            {([['plan','계획보기','#2563eb','#dbeafe','#93c5fd'],['claim','청구보기','#059669','#d1fae5','#6ee7b7']] as const).map(([key,label,col,bg,bd]) => {
              const on = viewKind === key;
              return (
                <button key={key} onClick={() => setViewKind(key)} style={{
                  padding:'3px 10px', borderRadius:4, border:'none', cursor:'pointer',
                  fontSize:11, fontWeight: on?700:400, whiteSpace:'nowrap',
                  backgroundImage: on ? `linear-gradient(135deg,${col},${col}cc)` : 'none',
                  backgroundColor: 'transparent',
                  color: on?'#fff':'rgba(196,181,253,0.6)',
                  transition:'all 0.15s',
                }}>
                  {label}
                </button>
              );
            })}
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4 }}>
            <button onClick={prevM} style={{ width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #1e3d62', borderRadius:4, background:'#1c3a60', cursor:'pointer' }}>
              <ChevronLeft size={12} color="#fff" />
            </button>
            <span style={{ color:'#fff', fontSize:13, fontWeight:700, minWidth:80, textAlign:'center' }}>{yr}년 {mo}월</span>
            <button onClick={nextM} style={{ width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #1e3d62', borderRadius:4, background:'#1c3a60', cursor:'pointer' }}>
              <ChevronRight size={12} color="#fff" />
            </button>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#94a3b8', cursor:'pointer', marginLeft:8 }}><X size={14}/></button>
        </div>

        {/* 달력 */}
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
          {/* 요일 헤더 */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'2px solid #e2e8f0', flexShrink:0 }}>
            {['일요일','월요일','화요일','수요일','목요일','금요일','토요일'].map((d,i) => (
              <div key={d} style={{
                textAlign:'center', fontSize:12, fontWeight:700, padding:'8px 0',
                color: i===0?'#dc2626':i===6?'#2563eb':'#475569',
                borderRight: i<6?'1px solid #e4eaf3':'none',
                background:'#f8fafc',
              }}>{d}</div>
            ))}
          </div>
          {/* 주 격자 */}
          {calWeeks.map((week, wi) => (
            <div key={wi} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid #e4eaf3', minHeight:100, flex:1 }}>
              {week.map((day, di) => {
                if (!day) return <div key={di} style={{ background:'#f8fafc', borderRight: di<6?'1px solid #e4eaf3':'none' }} />;
                const dateStr = toDateStr(day);
                const entries = byDate.get(dateStr) ?? [];
                const isSun = di===0, isSat=di===6;
                const isToday = dateStr === todayStr;
                return (
                  <div key={di} style={{ padding:'5px 6px', background:'#fff', borderRight: di<6?'1px solid #e4eaf3':'none', minHeight:100 }}>
                    <div style={{ marginBottom:5 }}>
                      <span style={{
                        display:'inline-flex', alignItems:'center', justifyContent:'center',
                        width:20, height:20, borderRadius:'50%', fontSize:12,
                        fontWeight: isToday?700:400,
                        background: isToday?'#2563eb':'transparent',
                        color: isToday?'#fff':isSun?'#dc2626':isSat?'#2563eb':'#475569',
                      }}>{day.getDate()}</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                      {entries.map((e, ei) => {
                        const recip = recipients.find(x => x.id === e.recipientId);
                        const sc = SVC_STYLE[e.serviceType] ?? SVC_STYLE.visit_care;
                        return (
                          <div key={ei} style={{
                            background: sc.bg,
                            borderLeft: `3px solid ${e.kind === 'claim' ? '#16a34a' : '#2563eb'}`,
                            borderRadius:3, padding:'3px 5px', fontSize:12,
                          }}>
                            <div style={{ fontWeight:700, color:sc.color }}>
                              {SERVICE_LABELS[e.serviceType as keyof typeof SERVICE_LABELS] ?? e.serviceType} {e.durationMinutes}분
                            </div>
                            <div style={{ color:'#475569', fontSize:11 }}>{e.startTime}~{e.endTime}</div>
                            <div style={{ color:'#0f172a', fontWeight:600, fontSize:12 }}>{recip?.name ?? e.recipientId}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
