"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { CSSProperties } from 'react';
import {
  ChevronLeft, ChevronRight, Search, Check, X,
  Edit3, CheckSquare, Square, Info, Pencil,
} from 'lucide-react';
import {
  addNonBenefitCategory,
  applyRecipientConfirm as applyRecipientConfirmApi,
  bulkCancelCopay,
  bulkConfirmCopay,
  deleteNonBenefitCategory,
  fetchCopayMonthSummary,
  fetchCopayRows,
  fetchNonBenefitBulk,
  fetchNonBenefitCategories,
  saveNonBenefitBulk,
} from '@/lib/api/copaymentConfirmation';
import type {
  ConfirmTypeCode,
  CopayConfirmationRowDto,
  CopayMonthSummaryItemDto,
  NonBenefitRecipientEntryDto,
  ServiceTypeCode,
  StatusFilterCode,
} from '@/lib/api/copaymentConfirmation.types';

interface Recipient {
  id: string;
  name: string;
  legalDob?: string | null;
  gradeText?: string;
}

interface PeriodSegment {
  gradeNum: number;
  reduction: string;
  copaymentRate: number;
  dateFrom: string;
  dateTo: string;
  plan: ServiceAmounts;
  claim: ServiceAmounts;
}

function getLegalDob(r: Recipient): string | null {
  return r.legalDob ?? null;
}

function getGradeText(r: Recipient): string {
  return r.gradeText ?? '-';
}

function rowToRecipient(row: CopayConfirmationRowDto): Recipient {
  return {
    id: row.recipientId,
    name: row.recipientName,
    legalDob: row.legalDob,
    gradeText: `${row.gradeNum}등급`,
  };
}

function nbEntryFromDto(e: NonBenefitRecipientEntryDto): NonBenefitEntry {
  const otherItems: OtherItem[] = Object.entries(e.otherAmounts ?? {})
    .filter(([, amount]) => amount > 0)
    .map(([label, amount], idx) => ({
      id: `oi-${idx}-${label}`,
      label,
      amount,
    }));
  return { meal: e.meal, room: e.room, beauty: e.beauty, otherItems };
}

function nbToSaveEntry(recipientId: string, entry: NonBenefitEntry) {
  const otherAmounts: Record<string, number> = {};
  entry.otherItems.forEach((item) => {
    if (item.label && item.amount > 0) otherAmounts[item.label] = item.amount;
  });
  return {
    recipientId,
    meal: entry.meal,
    room: entry.room,
    beauty: entry.beauty,
    otherAmounts,
  };
}

// ── 사업 유형 탭 ───────────────────────────────────────────────────────
type ServiceType = ServiceTypeCode;
type ServiceTab = ServiceType;

const SERVICE_TABS: {
  key: ServiceTab; label: string; short: string; color: string;
  planHeadBg: string; claimHeadBg: string; diffHeadBg: string; confHeadBg: string;
}[] = [
  { key:'visit_care',    label:'방문요양', short:'요양', color:'#2563eb', planHeadBg:'#1a3a6e', claimHeadBg:'#0f4c2a', diffHeadBg:'#3a3060', confHeadBg:'#3d2a08' },
  { key:'visit_bath',    label:'방문목욕', short:'목욕', color:'#059669', planHeadBg:'#0d3d27', claimHeadBg:'#14432e', diffHeadBg:'#2e3060', confHeadBg:'#3d2a08' },
  { key:'visit_nursing', label:'방문간호', short:'간호', color:'#d97706', planHeadBg:'#4a2a06', claimHeadBg:'#3d2200', diffHeadBg:'#3a3060', confHeadBg:'#3d2a08' },
  { key:'day_care',      label:'주간보호', short:'주간', color:'#7c3aed', planHeadBg:'#3b1a6e', claimHeadBg:'#2e1260', diffHeadBg:'#2e2060', confHeadBg:'#3d2a08' },
];

// ── 틀고정 컬럼 오프셋 (수급자 정보 5열 + 급여유형) ───────────────────
const COL_W = { chk:30, no:32, name:68, grade:76, tab:44 } as const;
const SL = {
  chk:   0,
  no:    COL_W.chk,
  name:  COL_W.chk + COL_W.no,
  grade: COL_W.chk + COL_W.no + COL_W.name,
  tab:   COL_W.chk + COL_W.no + COL_W.name + COL_W.grade,
} as const;

// 마지막 틀고정 컬럼(등급/감경구분) 우측 구분선
const FRZ: CSSProperties = { borderRight:'2px solid rgba(21,46,80,0.22)', boxShadow:'4px 0 8px -3px rgba(21,46,80,0.12)' };
const FRZ_TH: CSSProperties = { boxShadow:'inset -2px 0 0 #3a5f8a, 4px 0 6px -3px rgba(0,0,0,0.25)' };

// ── 비급여 타입 (주간보호 전용) ────────────────────────────────────────
interface OtherItem {
  id:     string;
  label:  string;
  amount: number;
}
interface NonBenefitEntry {
  meal:       number;
  room:       number;
  beauty:     number;
  otherItems: OtherItem[];
}
type NBField = 'meal' | 'room' | 'beauty';
const NB_DEFAULT: NonBenefitEntry = { meal:0, room:0, beauty:0, otherItems:[] };
const NB_LABELS: Record<NBField,string> = {
  meal:  '식사재료비',
  room:  '상급침실비',
  beauty:'이·미용비',
};
const otherTotal = (items: OtherItem[]) => items.reduce((s,i)=>s+i.amount,0);
const nbTotal = (nb: NonBenefitEntry) => nb.meal + nb.room + nb.beauty + otherTotal(nb.otherItems);
type AllNonBenefitData = Record<string, Record<string, NonBenefitEntry>>; // outer: "YYYY-M"

// ── 확정 타입 ──────────────────────────────────────────────────────────
type ConfirmType = ConfirmTypeCode;
interface ConfirmEntry {
  type: ConfirmType;
  count: number;
  insuranceAmount: number;
  copayAmount: number;
  limitExcessAmount: number; // 확정 시점 한도초과액 스냅샷
  confirmedAt: string;
}
type ConfirmMap = Record<string, ConfirmEntry>;
type AllConfirmData = Record<string, ConfirmMap>;

interface ServiceAmounts {
  count:number; benefit:number; insurance:number; copay:number;
}

// ── 스타일 ────────────────────────────────────────────────────────────
const TH_BASE: CSSProperties = {
  color:'#dde4ef', fontSize:11, fontWeight:600, height:34,
  whiteSpace:'nowrap', textAlign:'center',
  boxShadow:'inset -1px 0 0 #1e3d62',
  padding:'0 5px', verticalAlign:'middle', userSelect:'none',
};
const TH = (extra?: CSSProperties): CSSProperties => {
  const {boxShadow: baseBS, ...baseRest} = {...TH_BASE, background:'#152e50'};
  if (!extra) return {...baseRest, boxShadow: baseBS};
  const {boxShadow: extraBS, ...extraRest} = extra;
  if (extraBS === 'none' || extraBS === '') return {...baseRest, ...extraRest, boxShadow: extraBS};
  const merged = [extraBS, baseBS].filter(Boolean).join(', ');
  return {...baseRest, ...extraRest, boxShadow: merged};
};
const TD = (even:boolean, extra?: CSSProperties): CSSProperties => ({
  fontSize:13, height:30, maxHeight:30, padding:'0 6px', textAlign:'right',
  verticalAlign:'middle',
  borderRight:'1px solid rgba(21,46,80,0.10)',
  borderBottom:'1px solid #e4eaf3',
  background: even ? '#ffffff' : '#f4f7fb',
  whiteSpace:'nowrap', overflow:'hidden', ...extra,
});

// ── 뱃지 ─────────────────────────────────────────────────────────────
function ConfirmBadge({entry,size=10}:{entry:ConfirmEntry|undefined;size?:number}) {
  if (!entry) return <span style={{fontSize:size,padding:'1px 5px',borderRadius:3,background:'#f1f5f9',color:'#94a3b8',border:'1px solid #e2e8f0'}}>미확정</span>;
  const M:Record<ConfirmType,{lbl:string;bg:string;cl:string;bd:string}> = {
    plan:  {lbl:'계획확정',bg:'#eff6ff',cl:'#2563eb',bd:'#bfdbfe'},
    claim: {lbl:'청구확정',bg:'#f0fdf4',cl:'#16a34a',bd:'#bbf7d0'},
    manual:{lbl:'수동확정',bg:'#fefce8',cl:'#b45309',bd:'#fde68a'},
  };
  const s=M[entry.type];
  return <span style={{fontSize:size,padding:'1px 5px',borderRadius:3,background:s.bg,color:s.cl,border:`1px solid ${s.bd}`}}>{s.lbl}</span>;
}
// 감경구분 표시용 — 감경은 감경률(9% / 7.5% / 6%)로 표기한다.
function typeDisplay(reduction:string):string{
  if(reduction.includes('9'))return '9%';
  if(reduction.includes('7.5'))return '7.5%';
  if(reduction.includes('6'))return '6%';
  if(reduction.includes('기초'))return '기초';
  return '일반';
}
function TypeBadge({t,label,size=10}:{t:'감경'|'기초'|'일반';label?:string;size?:number}) {
  const M:Record<string,CSSProperties>={
    감경:{background:'#fffbeb',color:'#d97706',border:'1px solid #fde68a'},
    기초:{background:'#fff1f2',color:'#dc2626',border:'1px solid #fecaca'},
    일반:{background:'#f8fafc',color:'#64748b',border:'1px solid #e2e8f0'},
  };
  return <span style={{fontSize:size,padding:'1px 5px',borderRadius:3,...M[t]}}>{label??t}</span>;
}

// ── 헬퍼 ─────────────────────────────────────────────────────────────
const fmt=(n:number)=>n.toLocaleString('ko-KR');
function fmtDiff(d:number){
  if(d===0)return <span style={{color:'#94a3b8'}}>동일</span>;
  return <span style={{color:'#ea580c'}}>{d>0?'+':''}{fmt(d)}</span>;
}
function typeLabel(t:string):'감경'|'기초'|'일반'{
  if(t.includes('감경'))return '감경';if(t.includes('기초'))return '기초';return '일반';
}
// ── 비급여명세 모달 ─────────────────────────────────────────────────
// 수급자 단위로 식사재료비/상급침실비/이·미용비(고정 3종) + 요양기관에서
// 추가한 기타 비급여 항목들을 한 번에 정리한다. 합계가 본인부담금확정의
// 비급여 컬럼에 그대로 반영된다.
interface NBDetailModalProps {
  r: Recipient;
  entry: NonBenefitEntry;
  facilityOtherCategories: string[]; // 요양기관 정의 기타 항목명들
  onAddCategory: (name: string) => void;
  onRemoveCategory: (name: string) => void;
  onSave: (next: NonBenefitEntry) => void;
  onClose: () => void;
}
function NBDetailModal({
  r, entry, facilityOtherCategories,
  onAddCategory, onRemoveCategory, onSave, onClose,
}: NBDetailModalProps) {
  const [meal,   setMeal]   = useState<number>(entry.meal);
  const [room,   setRoom]   = useState<number>(entry.room);
  const [beauty, setBeauty] = useState<number>(entry.beauty);
  // 수급자별 기타 금액 — 항목명 → 금액 (요양기관 카테고리에 매핑)
  const seedOther: Record<string, number> = {};
  entry.otherItems.forEach(i => { if (i.label) seedOther[i.label] = i.amount; });
  const [otherAmts, setOtherAmts] = useState<Record<string, number>>(seedOther);
  const [newCatName, setNewCatName] = useState('');

  const fmt = (n: number) => n>0 ? n.toLocaleString('ko-KR') : '';
  const parseN = (raw: string) => parseInt(raw.replace(/[^0-9]/g,''),10) || 0;

  const otherSum = facilityOtherCategories.reduce((s,c)=>s+(otherAmts[c]||0),0);
  const total    = meal + room + beauty + otherSum;

  const handleSave = () => {
    const otherItems: OtherItem[] = facilityOtherCategories
      .filter(c => (otherAmts[c]||0) > 0)
      .map((c,idx) => ({ id: `oi-${idx}-${c}`, label: c, amount: otherAmts[c]||0 }));
    onSave({ meal, room, beauty, otherItems });
  };

  const addCat = () => {
    const name = newCatName.trim();
    if (!name) return;
    if (facilityOtherCategories.includes(name)) { setNewCatName(''); return; }
    onAddCategory(name);
    setNewCatName('');
  };

  return (
    <div style={{position:'fixed',inset:0,zIndex:1100,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:10,width:280,maxHeight:'82vh',display:'flex',flexDirection:'column',boxShadow:'0 12px 40px rgba(0,0,0,0.28)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>

        {/* 헤더 */}
        <div style={{background:'linear-gradient(135deg,#78350f,#92400e)',padding:'11px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <span style={{color:'#fff',fontSize:13,fontWeight:700}}>비급여명세</span>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#fde68a',cursor:'pointer',lineHeight:1}}><X size={14}/></button>
        </div>

        {/* 수급자 정보 */}
        <div style={{padding:'7px 16px',background:'#fffbeb',borderBottom:'1px solid #fde68a',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <span style={{fontSize:13,fontWeight:700,color:'#1e293b'}}>{r.name}</span>
          <span style={{fontSize:11,color:'#92400e',background:'#fef3c7',border:'1px solid #fcd34d',padding:'1px 7px',borderRadius:3}}>
            {getGradeText(r)}
          </span>
          <span style={{fontSize:11,color:'#78350f'}}>수급자 단위로 비급여 항목·금액을 정리합니다.</span>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'12px 16px'}}>
          {/* 고정 3종 */}
          <div style={{fontSize:10,fontWeight:700,color:'#78350f',letterSpacing:'0.03em',marginBottom:6}}>기본 항목</div>
          {([
            ['meal','식사재료비',meal,setMeal],
            ['room','상급침실비',room,setRoom],
            ['beauty','이·미용비',beauty,setBeauty],
          ] as const).map(([key,label,val,setter])=>(
            <div key={key} style={{display:'grid',gridTemplateColumns:'140px 1fr',gap:8,alignItems:'center',marginBottom:6,padding:'7px 10px',borderRadius:6,background:'#fffbeb',border:'1px solid #fde68a'}}>
              <span style={{fontSize:12,fontWeight:600,color:'#92400e'}}>{label}</span>
              <input
                value={fmt(val)}
                onChange={e=>setter(parseN(e.target.value))}
                placeholder="0"
                style={{fontSize:12,padding:'4px 8px',border:'1px solid #fcd34d',borderRadius:4,outline:'none',background:'#fff',color:'#92400e',fontWeight:600,textAlign:'right'}}
              />
            </div>
          ))}

          {/* 기타 카테고리 (요양기관 정의) */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:14,marginBottom:6}}>
            <div style={{fontSize:10,fontWeight:700,color:'#78350f',letterSpacing:'0.03em'}}>기타 항목 (요양기관 공용 카테고리)</div>
            <span style={{fontSize:10,color:'#a16207'}}>{facilityOtherCategories.length}개 등록됨</span>
          </div>

          {facilityOtherCategories.length===0 && (
            <div style={{textAlign:'center',padding:'18px 0',color:'#cbd5e1',fontSize:11,border:'1px dashed #fde68a',borderRadius:6,marginBottom:8}}>
              요양기관에 등록된 기타 카테고리가 없습니다.<br/>
              <span style={{fontSize:10,color:'#fcd34d'}}>아래에서 새 카테고리를 추가하세요.</span>
            </div>
          )}

          {facilityOtherCategories.map((cat,idx)=>(
            <div key={cat} style={{display:'grid',gridTemplateColumns:'140px 1fr 32px',gap:8,alignItems:'center',marginBottom:6,padding:'7px 10px',borderRadius:6,background: idx%2===0 ? '#fff8f0' : '#fffbeb',border:'1px solid #fde68a'}}>
              <span style={{fontSize:12,fontWeight:600,color:'#92400e',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cat}</span>
              <input
                value={fmt(otherAmts[cat]||0)}
                onChange={e=>setOtherAmts(prev=>({...prev,[cat]:parseN(e.target.value)}))}
                placeholder="0"
                style={{fontSize:12,padding:'4px 8px',border:'1px solid #fcd34d',borderRadius:4,outline:'none',background:'#fff',color:'#92400e',fontWeight:600,textAlign:'right'}}
              />
              <button onClick={()=>{
                if (window.confirm(`'${cat}' 카테고리를 삭제할까요? (모든 수급자에서 제거됨)`)) onRemoveCategory(cat);
              }}
                title="요양기관 카테고리 삭제"
                style={{width:28,height:28,borderRadius:4,border:'1px solid #fecaca',background:'#fff1f2',color:'#ef4444',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <X size={12}/>
              </button>
            </div>
          ))}

          {/* 새 카테고리 입력 */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 88px',gap:6,marginTop:8}}>
            <input
              value={newCatName}
              onChange={e=>setNewCatName(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter') addCat(); }}
              placeholder="새 카테고리명 (예: 물품비, 차량운행비)"
              style={{fontSize:12,padding:'6px 10px',border:'2px dashed #fcd34d',borderRadius:6,outline:'none',background:'#fffbeb',color:'#92400e'}}
            />
            <button onClick={addCat} style={{padding:'6px 0',fontSize:12,fontWeight:700,border:'1px solid #92400e',background:'#fffbeb',color:'#92400e',borderRadius:6,cursor:'pointer'}}>
              + 추가
            </button>
          </div>
        </div>

        {/* 합계 */}
        <div style={{padding:'9px 16px',borderTop:'1px solid #fde68a',background:'#fef9e7',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <span style={{fontSize:12,color:'#78350f',fontWeight:600}}>비급여 합계</span>
          <span style={{fontSize:16,fontWeight:700,color:'#7c2d12'}}>
            {total>0 ? `${total.toLocaleString('ko-KR')}원` : '-'}
          </span>
        </div>

        {/* 푸터 */}
        <div style={{padding:'10px 16px',borderTop:'1px solid #e2e8f0',display:'flex',gap:8,justifyContent:'flex-end',flexShrink:0}}>
          <button onClick={onClose} style={{padding:'6px 16px',fontSize:12,borderRadius:5,cursor:'pointer',border:'1px solid #e2e8f0',background:'#f8fafc',color:'#64748b'}}>
            취소
          </button>
          <button onClick={handleSave} style={{padding:'6px 20px',fontSize:12,borderRadius:5,cursor:'pointer',border:'none',background:'linear-gradient(135deg,#78350f,#92400e)',color:'#fff',fontWeight:700,boxShadow:'0 2px 6px rgba(120,53,15,0.3)'}}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 비급여액입력 (일괄) 모달 ────────────────────────────────────────
// 표 형태로 모든(필터된) 수급자의 비급여 항목 금액을 한 화면에서 정리한다.
interface NBBulkModalProps {
  recipients: Recipient[];
  data: Record<string, NonBenefitEntry>;          // 현재 월의 NB 데이터
  facilityOtherCategories: string[];
  onAddCategory: (name: string) => void;
  onRemoveCategory: (name: string) => void;
  onSave: (next: Record<string, NonBenefitEntry>) => void;
  onClose: () => void;
}
function NBBulkModal({
  recipients, data, facilityOtherCategories,
  onAddCategory, onRemoveCategory, onSave, onClose,
}: NBBulkModalProps) {
  // 로컬 편집 상태 — recipients × { meal, room, beauty, otherAmts }
  type Edit = { meal: number; room: number; beauty: number; other: Record<string, number> };
  const initEdit = (): Record<string, Edit> => {
    const out: Record<string, Edit> = {};
    recipients.forEach(r => {
      const e = data[r.id] ?? NB_DEFAULT;
      const other: Record<string, number> = {};
      e.otherItems.forEach(i => { if (i.label) other[i.label] = i.amount; });
      out[r.id] = { meal: e.meal, room: e.room, beauty: e.beauty, other };
    });
    return out;
  };
  const [edits, setEdits] = useState<Record<string, Edit>>(initEdit);
  const [newCatName, setNewCatName] = useState('');

  const fmtV = (n: number) => n>0 ? n.toLocaleString('ko-KR') : '';
  const parseN = (raw: string) => parseInt(raw.replace(/[^0-9]/g,''),10) || 0;

  const FIXED = ['식사재료비','상급침실 이용에 따른 추가비용','이·미용비'] as const;
  // "기타" 그룹은 항상 기본 '기 타' 열을 가지며, 그 뒤에 요양기관이 추가한
  // 카테고리들이 따라 나온다 (PDF 명세 ⑦의 첫 줄 = '기 타').
  const DEFAULT_OTHER = '기타';
  const NB_COL_W = 100;

  const setField = (rid: string, key: 'meal'|'room'|'beauty', val: number) =>
    setEdits(prev => ({...prev, [rid]: { ...prev[rid], [key]: val }}));
  const setOther = (rid: string, cat: string, val: number) =>
    setEdits(prev => ({...prev, [rid]: { ...prev[rid], other: { ...prev[rid].other, [cat]: val } }}));

  const rowTotal = (rid: string): number => {
    const e = edits[rid]; if (!e) return 0;
    const def = e.other[DEFAULT_OTHER] || 0;
    const o = facilityOtherCategories.reduce((s,c)=>s+(e.other[c]||0),0);
    return e.meal + e.room + e.beauty + def + o;
  };
  const grandTotal = recipients.reduce((s,r)=>s+rowTotal(r.id), 0);

  const MAX_OTHER_CATS = 4;
  const canAddCat = facilityOtherCategories.length < MAX_OTHER_CATS;
  const addCat = () => {
    const name = newCatName.trim();
    // 기본 '기타' 열은 별도이므로 같은 이름의 카테고리 추가는 방지
    if (!name || name === DEFAULT_OTHER || facilityOtherCategories.includes(name)) { setNewCatName(''); return; }
    if (!canAddCat) {
      window.alert(`기타 카테고리는 최대 ${MAX_OTHER_CATS}개까지 추가할 수 있습니다.`);
      return;
    }
    onAddCategory(name);
    setNewCatName('');
  };

  const handleSave = () => {
    const next: Record<string, NonBenefitEntry> = {};
    recipients.forEach(r => {
      const e = edits[r.id]; if (!e) return;
      const cats = [DEFAULT_OTHER, ...facilityOtherCategories];
      const otherItems: OtherItem[] = cats
        .filter(c => (e.other[c]||0) > 0)
        .map((c,idx) => ({ id: `oi-${r.id}-${idx}`, label: c, amount: e.other[c] }));
      next[r.id] = { meal: e.meal, room: e.room, beauty: e.beauty, otherItems };
    });
    onSave(next);
  };

  return (
    <div style={{position:'fixed',inset:0,zIndex:1100,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:10,width:'min(90vw,1100px)',maxHeight:'88vh',display:'flex',flexDirection:'column',boxShadow:'0 12px 40px rgba(0,0,0,0.28)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>

        {/* 헤더 */}
        <div style={{background:'linear-gradient(135deg,#78350f,#92400e)',padding:'7px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:9}}>
            <span style={{color:'#fff',fontSize:13,fontWeight:700}}>비급여액입력</span>
            <span style={{fontSize:11,padding:'1px 8px',borderRadius:10,background:'#1f4070',color:'#fde68a'}}>{recipients.length}명</span>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#fde68a',cursor:'pointer',lineHeight:1}}><X size={14}/></button>
        </div>

        {/* 카테고리 관리 */}
        <div style={{padding:'5px 12px',background:'#fffbeb',borderBottom:'1px solid #fde68a',display:'flex',alignItems:'center',gap:6,flexShrink:0,flexWrap:'wrap'}}>
          <span style={{fontSize:11,color:'#92400e',fontWeight:700}}>요양기관 기타 카테고리</span>
          <span style={{fontSize:10,padding:'1px 6px',borderRadius:8,background:'#fef3c7',color:'#92400e',border:'1px solid #fde68a',fontWeight:600}}>
            {facilityOtherCategories.length} / {MAX_OTHER_CATS}
          </span>
          {facilityOtherCategories.length===0 ? (
            <span style={{fontSize:11,color:'#a16207'}}>(최대 {MAX_OTHER_CATS}개까지 등록 가능)</span>
          ) : facilityOtherCategories.map(cat=>(
            <span key={cat} style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:11,padding:'1px 4px 1px 7px',background:'#fef3c7',color:'#92400e',border:'1px solid #fde68a',borderRadius:10}}>
              {cat}
              <button onClick={()=>{
                if (window.confirm(`'${cat}' 카테고리를 삭제할까요? (모든 수급자에서 제거됨)`)) onRemoveCategory(cat);
              }} style={{width:14,height:14,padding:0,border:'none',background:'transparent',cursor:'pointer',color:'#92400e',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <X size={10}/>
              </button>
            </span>
          ))}
          <div style={{display:'flex',gap:4,marginLeft:'auto'}}>
            <input
              value={newCatName}
              onChange={e=>setNewCatName(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter') addCat(); }}
              disabled={!canAddCat}
              placeholder={canAddCat ? "새로운 기타비급여명" : `최대 ${MAX_OTHER_CATS}개까지 등록됨`}
              style={{fontSize:11,padding:'2px 7px',border:'1px dashed #fcd34d',borderRadius:4,outline:'none',background:canAddCat?'#fff':'#f1f5f9',color:'#92400e',width:150,opacity:canAddCat?1:0.6}}
            />
            <button onClick={addCat} disabled={!canAddCat} style={{padding:'2px 9px',fontSize:11,fontWeight:700,border:'1px solid #92400e',background:canAddCat?'#fff':'#f1f5f9',color:'#92400e',borderRadius:4,cursor:canAddCat?'pointer':'not-allowed',opacity:canAddCat?1:0.5}}>+ 추가</button>
          </div>
        </div>

        {/* 테이블 */}
        <div style={{flex:1,overflow:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              {/* 1행: 그룹 헤더 — 식사/상급/이미용은 rowSpan, 기타 그룹은 기본 '기 타' + 요양기관 카테고리 묶음 */}
              <tr>
                <th rowSpan={2} style={{position:'sticky',top:0,left:0,zIndex:3,background:'#152e50',color:'#fff',padding:'3px 6px',fontSize:11,fontWeight:700,textAlign:'center',width:80}}>수급자명</th>
                <th rowSpan={2} style={{position:'sticky',top:0,zIndex:2,background:'#152e50',color:'#fff',padding:'3px 6px',fontSize:11,fontWeight:700,textAlign:'center',width:64}}>등급</th>
                {FIXED.map(c=>(
                  <th key={c} rowSpan={2} style={{position:'sticky',top:0,zIndex:2,background:'#78350f',color:'#fff',padding:'3px 6px',fontSize:11,fontWeight:700,textAlign:'center',width:NB_COL_W}}>{c}</th>
                ))}
                {/* 기타 그룹 — 항상 기본 '기 타' 1칸 + 요양기관 추가 카테고리 N칸 */}
                <th colSpan={1 + facilityOtherCategories.length} style={{position:'sticky',top:0,zIndex:2,background:'#5c3300',color:'#fde68a',padding:'3px 6px',fontSize:11,fontWeight:700,textAlign:'center'}}>기타</th>
                <th rowSpan={2} style={{position:'sticky',top:0,zIndex:2,background:'#92400e',color:'#fde68a',padding:'3px 6px',fontSize:11,fontWeight:700,textAlign:'center',width:NB_COL_W}}>합계</th>
              </tr>
              {/* 2행: 기타 그룹의 첫 칸은 '기 타'(기본), 이어서 요양기관 카테고리명 */}
              <tr>
                <th style={{position:'sticky',top:22,zIndex:2,background:'#7a4500',color:'#fff',padding:'2px 6px',fontSize:11,fontWeight:600,textAlign:'center',width:NB_COL_W}}>기 타</th>
                {facilityOtherCategories.map(c=>(
                  <th key={c} style={{position:'sticky',top:22,zIndex:2,background:'#7a4500',color:'#fff',padding:'2px 6px',fontSize:11,fontWeight:600,textAlign:'center',width:NB_COL_W}}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recipients.map((r,idx)=>{
                const e = edits[r.id] ?? { meal:0, room:0, beauty:0, other:{} };
                const total = rowTotal(r.id);
                const isEven = idx%2===0;
                const bg = isEven ? '#ffffff' : '#f8fafc';
                const inputStyle: React.CSSProperties = {
                  width:'100%',boxSizing:'border-box',
                  fontSize:12,padding:'2px 4px',
                  border:'1px solid #fde68a',borderRadius:3,outline:'none',
                  background:'#fffbeb',color:'#92400e',fontWeight:600,textAlign:'right',
                };
                return (
                  <tr key={r.id} style={{background:bg}}>
                    <td style={{position:'sticky',left:0,zIndex:1,background:bg,padding:'2px 6px',borderBottom:'1px solid #e2e8f0',fontWeight:700,color:'#0f172a'}}>{r.name}</td>
                    <td style={{padding:'2px 6px',borderBottom:'1px solid #e2e8f0',textAlign:'center',color:'#1d4ed8',fontWeight:600}}>{getGradeText(r)}</td>
                    {/* 식사 */}
                    <td style={{padding:'2px 4px',borderBottom:'1px solid #e2e8f0'}}>
                      <input value={fmtV(e.meal)} onChange={ev=>setField(r.id,'meal',parseN(ev.target.value))} placeholder="0" style={inputStyle}/>
                    </td>
                    {/* 상급 */}
                    <td style={{padding:'2px 4px',borderBottom:'1px solid #e2e8f0'}}>
                      <input value={fmtV(e.room)} onChange={ev=>setField(r.id,'room',parseN(ev.target.value))} placeholder="0" style={inputStyle}/>
                    </td>
                    {/* 이미용 */}
                    <td style={{padding:'2px 4px',borderBottom:'1px solid #e2e8f0'}}>
                      <input value={fmtV(e.beauty)} onChange={ev=>setField(r.id,'beauty',parseN(ev.target.value))} placeholder="0" style={inputStyle}/>
                    </td>
                    {/* 기타 그룹 — 기본 '기 타' 1칸 + 요양기관 추가 카테고리 */}
                    <td style={{padding:'2px 4px',borderBottom:'1px solid #e2e8f0'}}>
                      <input value={fmtV(e.other[DEFAULT_OTHER]||0)} onChange={ev=>setOther(r.id,DEFAULT_OTHER,parseN(ev.target.value))} placeholder="0" style={inputStyle}/>
                    </td>
                    {facilityOtherCategories.map(cat=>(
                      <td key={cat} style={{padding:'2px 4px',borderBottom:'1px solid #e2e8f0'}}>
                        <input value={fmtV(e.other[cat]||0)} onChange={ev=>setOther(r.id,cat,parseN(ev.target.value))} placeholder="0" style={inputStyle}/>
                      </td>
                    ))}
                    {/* 합계 */}
                    <td style={{padding:'2px 6px',borderBottom:'1px solid #e2e8f0',textAlign:'right',fontWeight:700,color:'#7c2d12',background:total>0?'#fef9e7':bg}}>
                      {total>0 ? total.toLocaleString('ko-KR') : <span style={{color:'#cbd5e1'}}>-</span>}
                    </td>
                  </tr>
                );
              })}
              {recipients.length===0 && (
                <tr>
                  <td colSpan={7 + facilityOtherCategories.length} style={{padding:32,textAlign:'center',color:'#94a3b8',fontSize:12}}>대상 수급자가 없습니다.</td>
                </tr>
              )}
            </tbody>
            {/* 컬럼별 합계 행 */}
            {recipients.length>0 && (()=>{
              const sumOf = (pick:(e:typeof edits[string])=>number) =>
                recipients.reduce((s,r)=>{
                  const e = edits[r.id]; return s + (e ? pick(e) : 0);
                },0);
              const sMeal   = sumOf(e=>e.meal);
              const sRoom   = sumOf(e=>e.room);
              const sBeauty = sumOf(e=>e.beauty);
              const sDef    = sumOf(e=>e.other[DEFAULT_OTHER]||0);
              const sCats   = facilityOtherCategories.map(c => sumOf(e=>e.other[c]||0));
              const sTotal  = sMeal+sRoom+sBeauty+sDef+sCats.reduce((s,n)=>s+n,0);
              const cell = (n:number, extra?: React.CSSProperties): React.CSSProperties => ({
                position:'sticky',bottom:0,zIndex:1,
                padding:'3px 6px',background:'#fef3c7',color:'#7c2d12',
                fontWeight:700,textAlign:'right',
                borderTop:'2px solid #fcd34d',
                ...extra,
              });
              const fmtN = (n:number) => n>0 ? n.toLocaleString('ko-KR') : '-';
              return (
                <tfoot>
                  <tr>
                    <td style={cell(0,{position:'sticky',left:0,zIndex:2,textAlign:'left',color:'#78350f'})}>합계</td>
                    <td style={cell(0,{textAlign:'center',color:'#78350f'})}>{recipients.length}명</td>
                    <td style={cell(sMeal)}>{fmtN(sMeal)}</td>
                    <td style={cell(sRoom)}>{fmtN(sRoom)}</td>
                    <td style={cell(sBeauty)}>{fmtN(sBeauty)}</td>
                    <td style={cell(sDef)}>{fmtN(sDef)}</td>
                    {sCats.map((v,i)=>(
                      <td key={i} style={cell(v)}>{fmtN(v)}</td>
                    ))}
                    <td style={cell(sTotal,{background:'#fde68a',color:'#7c2d12'})}>{fmtN(sTotal)}</td>
                  </tr>
                </tfoot>
              );
            })()}
          </table>
        </div>

        {/* 합계 + 푸터 */}
        <div style={{padding:'5px 12px',borderTop:'1px solid #fde68a',background:'#fef9e7',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <span style={{fontSize:12,color:'#78350f',fontWeight:600}}>전체 비급여 합계</span>
          <span style={{fontSize:16,fontWeight:700,color:'#7c2d12'}}>
            {grandTotal>0 ? `${grandTotal.toLocaleString('ko-KR')}원` : '-'}
          </span>
        </div>
        <div style={{padding:'6px 12px',borderTop:'1px solid #e2e8f0',display:'flex',gap:8,justifyContent:'flex-end',flexShrink:0}}>
          <button onClick={onClose} style={{padding:'4px 14px',fontSize:12,borderRadius:5,cursor:'pointer',border:'1px solid #e2e8f0',background:'#f8fafc',color:'#64748b'}}>
            취소
          </button>
          <button onClick={handleSave} style={{padding:'4px 18px',fontSize:12,borderRadius:5,cursor:'pointer',border:'none',background:'linear-gradient(135deg,#78350f,#92400e)',color:'#fff',fontWeight:700,boxShadow:'0 2px 6px rgba(120,53,15,0.3)'}}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 수급자 단위 확정 모달 ─────────────────────────────────────────────
// 한 수급자의 모든 행(급여유형 × 기간세그먼트)을 한 화면에 나열하고,
// 행마다 미확정/계획/청구/수동을 개별 선택해 한 번에 확정한다.
type RowAction = 'none' | ConfirmType; // 'none' = 미확정(확정 해제)
interface RecRow {
  tab: ServiceTab;
  tabLabel: string;
  period: PeriodSegment;
  periodKey: string;
  current: ConfirmEntry | undefined;
}
interface RecSelection { tab: ServiceTab; periodKey: string; action: RowAction; count: number; ins: number; cop: number; }
interface RecipientConfirmModalProps {
  r: Recipient;
  rows: RecRow[];
  onApply: (sels: RecSelection[]) => void;
  onClose: () => void;
}
function RecipientConfirmModal({ r, rows, onApply, onClose }: RecipientConfirmModalProps) {
  // 행별 확정 기준 — 계획/청구/수동 중 하나. (수급자 단위로 전부 확정/전부 해제만 존재)
  type RowState = { action: ConfirmType; mIns: string; mCop: string; mCount: string };
  const rowKeyOf = (row: RecRow) => `${row.tab}::${row.periodKey}`;
  const initState = (): Record<string, RowState> => {
    const out: Record<string, RowState> = {};
    rows.forEach(row => {
      const cur = row.current;
      out[rowKeyOf(row)] = {
        action: cur ? cur.type : 'plan',
        mIns:   cur?.type==='manual' ? cur.insuranceAmount.toLocaleString('ko-KR') : '',
        mCop:   cur?.type==='manual' ? cur.copayAmount.toLocaleString('ko-KR') : '',
        mCount: cur?.type==='manual' && (cur.count??0)>0 ? String(cur.count) : '',
      };
    });
    return out;
  };
  const [st, setSt] = useState<Record<string, RowState>>(initState);
  const parseNum = (v:string)=>parseInt(v.replace(/,/g,''),10)||0;
  const fmtMoney = (raw:string)=>{const n=raw.replace(/[^0-9]/g,'');return n?parseInt(n,10).toLocaleString('ko-KR'):'';};
  const setAction = (key:string, action:ConfirmType) => setSt(p=>({...p,[key]:{...p[key],action}}));
  const setM = (key:string, field:'mIns'|'mCop'|'mCount', val:string) => setSt(p=>({...p,[key]:{...p[key],[field]:val}}));

  const periodRange = (period:PeriodSegment) => {
    const [, mF, dF]=period.dateFrom.split('-');
    const [, mT, dT]=period.dateTo.split('-');
    const fromStr=`${parseInt(mF,10)}.${parseInt(dF,10)}`;
    const toStr=mF===mT?`${parseInt(dT,10)}`:`${parseInt(mT,10)}.${parseInt(dT,10)}`;
    return period.dateFrom===period.dateTo?`${fromStr}일`:`${fromStr}~${toStr}일`;
  };
  const rowResult = (row:RecRow, s:RowState) => {
    const noCharge = row.period.copaymentRate===0;
    if(s.action==='plan')  return {count:row.period.plan.count,  ins:noCharge?0:row.period.plan.insurance,  cop:noCharge?0:row.period.plan.copay};
    if(s.action==='claim') return {count:row.period.claim.count, ins:noCharge?0:row.period.claim.insurance, cop:noCharge?0:row.period.claim.copay};
    if(s.action==='manual')return {count:parseInt(s.mCount)||0,  ins:parseNum(s.mIns),                      cop:parseNum(s.mCop)};
    return {count:0, ins:0, cop:0};
  };

  // 수급자 단위 — 전부 확정 또는 전부 미확정만 존재(부분 저장 없음).
  const hasConfirmed = rows.some(row => !!row.current);
  const totalCop = rows.reduce((sum,row)=>{
    const s=st[rowKeyOf(row)]; if(!s) return sum;
    return sum + rowResult(row,s).cop;
  },0);

  // confirm=true → 모든 행을 선택 기준으로 확정 / false → 모든 행 확정 해제(미확정)
  const applyAll = (confirm:boolean) => {
    const sels: RecSelection[] = rows.map(row=>{
      const s=st[rowKeyOf(row)];
      const res=rowResult(row,s);
      return confirm
        ? {tab:row.tab, periodKey:row.periodKey, action:s.action as RowAction, count:res.count, ins:res.ins, cop:res.cop}
        : {tab:row.tab, periodKey:row.periodKey, action:'none' as RowAction, count:0, ins:0, cop:0};
    });
    onApply(sels);
  };

  // 선택지 메타 — 계획/청구/수동 (미확정은 행 단위로 두지 않는다)
  const OPTS: {key:ConfirmType;label:string;color:string;bg:string}[] = [
    {key:'plan',  label:'계획',   color:'#2563eb', bg:'#eff6ff'},
    {key:'claim', label:'청구',   color:'#16a34a', bg:'#f0fdf4'},
    {key:'manual',label:'수동',   color:'#d97706', bg:'#fffbeb'},
  ];
  const ld = getLegalDob(r);

  return(
    <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:8,width:640,maxHeight:'88vh',display:'flex',flexDirection:'column',boxShadow:'0 8px 32px rgba(0,0,0,0.22)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
        {/* 헤더 */}
        <div style={{background:'#152e50',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{color:'#fff',fontSize:13,fontWeight:700}}>본인부담금 확정</span>
            <span style={{fontSize:13,fontWeight:700,color:'#dbeafe'}}>{r.name}</span>
            <span style={{fontSize:13,color:'#94a3b8'}}>{ld?`${ld.slice(2,4)}.${ld.slice(5,7)}.${ld.slice(8,10)}`:'-'}</span>
            <span style={{fontSize:13,padding:'1px 8px',borderRadius:10,background:'#1f4070',color:'#cbd5e1'}}>{rows.length}건</span>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer'}}><X size={14}/></button>
        </div>

        {/* 안내 */}
        <div style={{padding:'7px 16px',background:'#f8fafc',borderBottomWidth:1,borderBottomStyle:'solid',borderBottomColor:'#e2e8f0',display:'flex',alignItems:'center',gap:5,fontSize:13,flexShrink:0}}>
          <Info size={13} color="#64748b"/> <span style={{color:'#64748b'}}>급여유형/등급/감경구분별로 본인부담금확정 기준을 선택 후 <strong style={{color:'#475569'}}>확정 저장</strong>을 눌러주세요</span>
        </div>

        {/* 행 목록 */}
        <div style={{flex:1,overflowY:'auto',padding:'10px 16px',display:'flex',flexDirection:'column',gap:8}}>
          {rows.map(row=>{
            const key=rowKeyOf(row);
            const s=st[key] ?? {action:'plan' as ConfirmType,mIns:'',mCop:'',mCount:''};
            const p=row.period;
            const noCharge=p.copaymentRate===0;
            const tl: '감경'|'기초'|'일반' = p.reduction.includes('감경')?'감경':p.reduction.includes('기초')?'기초':'일반';
            const rl = p.reduction.includes('9')?'9%':p.reduction.includes('7.5')?'7.5%':p.reduction.includes('6')?'6%':p.reduction.includes('기초')?'기초':'일반';
            const tabDef = SERVICE_TABS.find(t=>t.key===row.tab)!;
            return(
              <div key={key} style={{border:'1px solid #e2e8f0',borderRadius:8,padding:'9px 11px',background:'#fbfdff'}}>
                {/* 헤더 라인 */}
                <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8,flexWrap:'wrap'}}>
                  <span style={{fontSize:13,fontWeight:700,padding:'2px 7px',borderRadius:3,background:`${tabDef.color}15`,color:tabDef.color,border:`1px solid ${tabDef.color}40`}}>{tabDef.label}</span>
                  <span style={{fontSize:13,padding:'1px 5px',background:'#dbeafe',color:'#1d4ed8',border:'1px solid #bfdbfe',borderRadius:3}}>{p.gradeNum}등급</span>
                  <TypeBadge t={tl} label={rl} size={13}/>
                  <span style={{fontSize:13,color:'#94a3b8'}}>부담률 {noCharge?'면제':`${p.copaymentRate}%`}</span>
                  <span style={{marginLeft:'auto'}}><ConfirmBadge entry={row.current} size={13}/></span>
                </div>

                {/* 선택 세그먼트 — 계획/청구/수동 */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
                  {OPTS.map(opt=>{
                    const on = s.action===opt.key;
                    const isPlan=opt.key==='plan', isClaim=opt.key==='claim';
                    const amt = isPlan?p.plan.copay:isClaim?p.claim.copay:0;
                    const cnt = isPlan?p.plan.count:isClaim?p.claim.count:0;
                    return(
                      <button key={opt.key} onClick={()=>setAction(key,opt.key)} style={{
                        display:'flex',flexDirection:'column',alignItems:'center',gap:2,
                        padding:'6px 4px',borderRadius:6,cursor:'pointer',
                        border:on?`2px solid ${opt.color}`:'1px solid #e2e8f0',
                        background:on?opt.bg:'#fff',
                      }}>
                        <span style={{fontSize:13,fontWeight:700,color:on?opt.color:'#64748b'}}>{opt.label}</span>
                        {(isPlan||isClaim)&&(
                          <span style={{fontSize:13,color:on?opt.color:'#94a3b8'}}>
                            {noCharge?'면제':`본인 ${fmt(amt)}`}{!noCharge&&<span style={{color:'#cbd5e1'}}> · {cnt}회</span>}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 수동 입력 */}
                {s.action==='manual'&&(
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'flex-end',marginTop:8,padding:'8px 10px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:6}}>
                    <div style={{display:'flex',flexDirection:'column',gap:3}}>
                      <label style={{fontSize:13,color:'#92400e',fontWeight:600}}>횟수</label>
                      <input type="text" inputMode="numeric" value={s.mCount} onChange={e=>setM(key,'mCount',e.target.value.replace(/[^0-9]/g,''))} placeholder="0" style={{width:56,padding:'4px 8px',fontSize:13,fontWeight:600,border:'1px solid #fde68a',borderRadius:4,background:'#fff',outline:'none',color:'#1e293b',textAlign:'right'}}/>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:3}}>
                      <label style={{fontSize:13,color:'#92400e',fontWeight:600}}>(공단)급여</label>
                      <input type="text" value={s.mIns} onChange={e=>setM(key,'mIns',fmtMoney(e.target.value))} placeholder="(공단)급여" style={{width:120,padding:'4px 8px',fontSize:13,fontWeight:600,border:'1px solid #fde68a',borderRadius:4,background:'#fff',outline:'none',color:'#1e293b',textAlign:'right'}}/>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:3}}>
                      <label style={{fontSize:13,color:'#92400e',fontWeight:600}}>본인부담금 (원)</label>
                      <input type="text" value={s.mCop} onChange={e=>setM(key,'mCop',fmtMoney(e.target.value))} placeholder="본인부담금" style={{width:120,padding:'4px 8px',fontSize:13,fontWeight:600,border:'1px solid #fde68a',borderRadius:4,background:'#fff',outline:'none',color:'#1e293b',textAlign:'right'}}/>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {rows.length===0&&(
            <div style={{textAlign:'center',padding:'28px 0',color:'#94a3b8',fontSize:13}}>확정할 일정이 없습니다.</div>
          )}
        </div>

        {/* 푸터 */}
        <div style={{padding:'9px 16px',borderTop:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <span style={{fontSize:13,color:'#64748b'}}>전체 <strong style={{color:'#1e293b'}}>{rows.length}</strong>건 일괄 확정</span>
          <span style={{fontSize:13,color:'#64748b'}}>본인부담금 합계 <strong style={{color:'#152e50'}}>{fmt(totalCop)}</strong>원</span>
          <div style={{marginLeft:'auto',display:'flex',gap:8}}>
            <button onClick={onClose} style={{padding:'5px 14px',fontSize:13,borderRadius:4,cursor:'pointer',border:'1px solid #e2e8f0',background:'#f8fafc',color:'#64748b'}}>취소</button>
            {hasConfirmed&&(
              <button onClick={()=>applyAll(false)} style={{padding:'5px 14px',fontSize:13,borderRadius:4,cursor:'pointer',border:'1px solid #fca5a5',background:'#fff1f2',color:'#dc2626',fontWeight:600}}>확정 해제</button>
            )}
            <button onClick={()=>applyAll(true)} disabled={rows.length===0} style={{padding:'5px 18px',fontSize:13,borderRadius:4,cursor:rows.length===0?'not-allowed':'pointer',border:'none',background:'#152e50',color:'#fff',fontWeight:700,opacity:rows.length===0?0.5:1}}>확정 저장</button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── 전체 일괄확정 모달 ────────────────────────────────────────────────
interface BulkAllModalProps {
  tabLabel: string;
  totalCount: number;
  unconfirmedCount: number;
  confirmedCount: number;
  onConfirm: (basis:'plan'|'claim', scope:'unconfirmed'|'all') => void;
  onClose: () => void;
}
function BulkAllModal({tabLabel,totalCount,unconfirmedCount,confirmedCount,onConfirm,onClose}:BulkAllModalProps) {
  const [basis,setBasis]=useState<'plan'|'claim'>('plan');
  const [scope,setScope]=useState<'unconfirmed'|'all'>('unconfirmed');
  const targetCount = scope==='unconfirmed' ? unconfirmedCount : totalCount;
  const basisColor = basis==='plan' ? '#2563eb' : '#16a34a';
  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:8,width:520,boxShadow:'0 8px 32px rgba(0,0,0,0.22)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
        <div style={{background:'#152e50',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{color:'#fff',fontSize:13,fontWeight:700}}>본인부담금 일괄확정</span>
            <span style={{fontSize:13,padding:'1px 8px',borderRadius:10,background:'#1f4070',color:'#cbd5e1'}}>{tabLabel}</span>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer'}}><X size={14}/></button>
        </div>

        <div style={{padding:'10px 16px',background:'#f8fafc',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:12,fontSize:12,color:'#475569'}}>
          <span>전체 <strong style={{color:'#1e293b'}}>{totalCount}명</strong></span>
          <span style={{color:'#cbd5e1'}}>·</span>
          <span>미확정 <strong style={{color:'#dc2626'}}>{unconfirmedCount}명</strong></span>
          <span style={{color:'#cbd5e1'}}>·</span>
          <span>확정 <strong style={{color:'#16a34a'}}>{confirmedCount}명</strong></span>
        </div>

        {/* ① 기준 */}
        <div style={{padding:'12px 16px 6px'}}>
          <div style={{fontSize:12,fontWeight:700,color:'#1e293b',marginBottom:8,display:'flex',alignItems:'center',gap:5}}>
            <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:18,height:18,borderRadius:9,background:'#152e50',color:'#fff',fontSize:10,fontWeight:700}}>1</span>
            확정 기준 선택
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <label style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:6,cursor:'pointer',border:basis==='plan'?'2px solid #2563eb':'1px solid #e2e8f0',background:basis==='plan'?'#eff6ff':'#f8fafc'}}>
              <input type="radio" checked={basis==='plan'} onChange={()=>setBasis('plan')} style={{accentColor:'#2563eb'}}/>
              <span style={{fontSize:12,fontWeight:600,color:'#1e40af'}}>계획자료기반</span>
              <span style={{fontSize:11,color:'#64748b'}}>해당 월 계획된 일정을 기준으로 확정</span>
            </label>
            <label style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:6,cursor:'pointer',border:basis==='claim'?'2px solid #16a34a':'1px solid #e2e8f0',background:basis==='claim'?'#f0fdf4':'#f8fafc'}}>
              <input type="radio" checked={basis==='claim'} onChange={()=>setBasis('claim')} style={{accentColor:'#16a34a'}}/>
              <span style={{fontSize:12,fontWeight:600,color:'#15803d'}}>청구자료기반</span>
              <span style={{fontSize:11,color:'#64748b'}}>실제 완료(청구) 일정을 기준으로 확정</span>
            </label>
          </div>
        </div>

        {/* ② 대상 */}
        <div style={{padding:'6px 16px 12px'}}>
          <div style={{fontSize:12,fontWeight:700,color:'#1e293b',marginBottom:8,display:'flex',alignItems:'center',gap:5}}>
            <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:18,height:18,borderRadius:9,background:'#152e50',color:'#fff',fontSize:10,fontWeight:700}}>2</span>
            적용 대상 선택
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <label style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:6,cursor:'pointer',border:scope==='unconfirmed'?'2px solid #d97706':'1px solid #e2e8f0',background:scope==='unconfirmed'?'#fffbeb':'#f8fafc'}}>
              <input type="radio" checked={scope==='unconfirmed'} onChange={()=>setScope('unconfirmed')} style={{accentColor:'#d97706'}}/>
              <span style={{fontSize:12,fontWeight:600,color:'#b45309'}}>미확정 수급자만</span>
              <span style={{fontSize:11,color:'#64748b'}}>이미 확정된 수급자는 그대로 유지</span>
              <span style={{marginLeft:'auto',fontSize:11,fontWeight:700,color:'#b45309'}}>{unconfirmedCount}명</span>
            </label>
            <label style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:6,cursor:'pointer',border:scope==='all'?'2px solid #dc2626':'1px solid #e2e8f0',background:scope==='all'?'#fef2f2':'#f8fafc'}}>
              <input type="radio" checked={scope==='all'} onChange={()=>setScope('all')} style={{accentColor:'#dc2626'}}/>
              <span style={{fontSize:12,fontWeight:600,color:'#b91c1c'}}>전체 (확정된 수급자 재확정 포함)</span>
              <span style={{fontSize:11,color:'#64748b'}}>기존 확정 내역을 새 기준으로 덮어씀</span>
              <span style={{marginLeft:'auto',fontSize:11,fontWeight:700,color:'#b91c1c'}}>{totalCount}명</span>
            </label>
          </div>
        </div>

        {/* 안내 */}
        <div style={{margin:'0 16px 12px',padding:'8px 12px',background:'#f1f5f9',borderLeft:`3px solid ${basisColor}`,borderRadius:4,display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#475569'}}>
          <Info size={12} color={basisColor}/>
          <span>
            <strong style={{color:basisColor}}>{basis==='plan'?'계획자료':'청구자료'}</strong> 기준으로
            <strong style={{color:'#1e293b'}}> {targetCount}명</strong>의 본인부담금이 일괄 확정됩니다.
          </span>
        </div>

        <div style={{padding:'9px 16px',borderTop:'1px solid #e2e8f0',display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'5px 14px',fontSize:13,borderRadius:4,cursor:'pointer',border:'1px solid #e2e8f0',background:'#f8fafc',color:'#64748b'}}>취소</button>
          <button onClick={()=>onConfirm(basis,scope)} disabled={targetCount===0} style={{padding:'5px 18px',fontSize:13,borderRadius:4,cursor:targetCount===0?'not-allowed':'pointer',border:'none',background:targetCount===0?'#cbd5e1':'#152e50',color:'#fff',fontWeight:700,opacity:targetCount===0?0.6:1}}>일괄확정</button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────
export default function CopaymentConfirmationPage() {
  const now = new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth() + 1);
  const [tabFilter,setTabFilter]=useState<'all'|ServiceTab>('all');
  const [search,setSearch]=useState('');
  const [searchDraft,setSearchDraft]=useState('');
  const submitSearch = () => setSearch(searchDraft.trim());
  const [statusFilter,setStatusFilter]=useState<StatusFilterCode>('all');
  const [apiRows,setApiRows]=useState<CopayConfirmationRowDto[]>([]);
  const [monthSummary,setMonthSummary]=useState<CopayMonthSummaryItemDto[]>([]);
  const [loading,setLoading]=useState(true);
  const [selSet,setSelSet]=useState<Set<string>>(new Set());
  const [modalRecipientId,setModalRecipientId]=useState<string|null>(null);
  const [bulkAllOpen,setBulkAllOpen]=useState(false);

  const [nonBenefitMap,setNonBenefitMap]=useState<Record<string, NonBenefitEntry>>({});
  const [nbOtherCategories,setNbOtherCategories]=useState<string[]>([]);
  const [nbModalId,setNBModalId]=useState<string|null>(null);
  const [nbBulkOpen,setNBBulkOpen]=useState(false);

  const listQuery = useMemo(
    () => ({
      year,
      month,
      query: search || undefined,
      status: statusFilter,
      serviceType: 'all' as const,
    }),
    [year, month, search, statusFilter],
  );

  const refetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rowsRes, summaryRes, categoriesRes] = await Promise.all([
        fetchCopayRows(listQuery),
        fetchCopayMonthSummary(year),
        fetchNonBenefitCategories(),
      ]);
      setApiRows(rowsRes.rows);
      setMonthSummary(summaryRes.months);
      setNbOtherCategories(categoriesRes.categories);
    } catch {
      setApiRows([]);
      setMonthSummary([]);
    } finally {
      setLoading(false);
    }
  }, [listQuery, year]);

  useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  const loadNonBenefitData = useCallback(async (recipientId?: string) => {
    const res = await fetchNonBenefitBulk({
      year,
      month,
      query: search || undefined,
      status: statusFilter,
      serviceType: 'all',
      recipientId,
    });
    setNbOtherCategories(res.facilityOtherCategories);
    const map: Record<string, NonBenefitEntry> = {};
    res.entries.forEach((entry) => {
      map[entry.recipientId] = nbEntryFromDto(entry);
    });
    setNonBenefitMap(map);
    return map;
  }, [year, month, search, statusFilter]);

  useEffect(() => {
    if (nbBulkOpen) {
      loadNonBenefitData().catch(() => undefined);
    }
  }, [nbBulkOpen, loadNonBenefitData]);

  useEffect(() => {
    if (nbModalId) {
      loadNonBenefitData(nbModalId).catch(() => undefined);
    }
  }, [nbModalId, loadNonBenefitData]);

  const curNBMap = nonBenefitMap;
  const getNB = (id:string): NonBenefitEntry => curNBMap[id] ?? NB_DEFAULT;

  const getLimitExcess = (id:string): number => {
    const row = apiRows.find((x) => x.recipientId === id);
    return row?.limitExcess ?? 0;
  };

  const getNBSum = (id:string): number => {
    const row = apiRows.find((x) => x.recipientId === id);
    return row?.nonBenefitTotal ?? 0;
  };

  const saveNB = useCallback(async (recipientId:string, next:NonBenefitEntry) => {
    await saveNonBenefitBulk({
      year,
      month,
      entries: [nbToSaveEntry(recipientId, next)],
    });
    setNBModalId(null);
    await refetchAll();
  }, [year, month, refetchAll]);

  const saveAllNB = useCallback(async (next: Record<string, NonBenefitEntry>) => {
    await saveNonBenefitBulk({
      year,
      month,
      entries: Object.entries(next).map(([recipientId, entry]) =>
        nbToSaveEntry(recipientId, entry),
      ),
    });
    setNBBulkOpen(false);
    await refetchAll();
  }, [year, month, refetchAll]);

  const addNBCategory = async (name:string) => {
    const res = await addNonBenefitCategory(name);
    setNbOtherCategories(res.categories);
    if (nbBulkOpen || nbModalId) {
      await loadNonBenefitData(nbModalId ?? undefined);
    }
  };

  const removeNBCategory = async (name:string) => {
    const res = await deleteNonBenefitCategory(name);
    setNbOtherCategories(res.categories);
    if (nbBulkOpen || nbModalId) {
      await loadNonBenefitData(nbModalId ?? undefined);
    } else {
      await refetchAll();
    }
  };

  const getEntry=useCallback((id:string,tab:ServiceTab,periodKey:string):ConfirmEntry|undefined=>{
    const row = apiRows.find(
      (x) => x.recipientId === id && x.serviceType === tab && x.periodKey === periodKey,
    );
    if (!row?.confirmation) return undefined;
    const c = row.confirmation;
    return {
      type: c.type,
      count: c.count,
      insuranceAmount: c.insuranceAmount,
      copayAmount: c.copayAmount,
      limitExcessAmount: c.limitExcessAmount,
      confirmedAt: c.confirmedAt,
    };
  },[apiRows]);
  const getTabDef=(tab:ServiceTab)=>SERVICE_TABS.find(t=>t.key===tab)!;

  const prevYear=()=>{setYear(y=>y-1);setSelSet(new Set());};
  const nextYear=()=>{setYear(y=>y+1);setSelSet(new Set());};
  const selectMonth=(m:number)=>{setMonth(m);setSelSet(new Set());};

  const allRows=useMemo(()=>{
    type Row={r:Recipient;tab:ServiceTab;period:PeriodSegment;periodKey:string;rowKey:string};
    return apiRows.map((row): Row => ({
      r: rowToRecipient(row),
      tab: row.serviceType,
      period: {
        gradeNum: row.gradeNum,
        reduction: row.reduction,
        copaymentRate: row.copaymentRate,
        dateFrom: row.dateFrom,
        dateTo: row.dateTo,
        plan: row.plan,
        claim: row.claim,
      },
      periodKey: row.periodKey,
      rowKey: `${row.recipientId}::${row.serviceType}::${row.periodKey}`,
    }));
  },[apiRows]);

  const monthUnconfirmed=useMemo(()=>
    Array.from({length:12},(_,i)=>monthSummary[i]?.unconfirmedSegments ?? 0)
  ,[monthSummary]);
  const monthTotal=useMemo(()=>
    Array.from({length:12},(_,i)=>monthSummary[i]?.totalSegments ?? 0)
  ,[monthSummary]);

  // 급여유형별 카운트 — 기간 세그먼트 단위
  const tabCounts=useMemo(()=>SERVICE_TABS.map(t=>{
    const rows=allRows.filter(x=>x.tab===t.key);
    return{
      key:t.key,
      total:rows.length,
      confirmed:rows.filter(x=>!!getEntry(x.r.id,x.tab,x.periodKey)).length,
    };
  }),[allRows,getEntry]);

  const filtered=useMemo(()=>allRows.filter(({r,tab,periodKey})=>{
    if(tabFilter!=='all'&&tabFilter!==tab)return false;
    if(search&&!r.name.includes(search))return false;
    const e=getEntry(r.id,tab,periodKey);
    if(statusFilter==='unconfirmed'&&e)return false;
    if(statusFilter==='plan'&&e?.type!=='plan')return false;
    if(statusFilter==='claim'&&e?.type!=='claim')return false;
    if(statusFilter==='manual'&&e?.type!=='manual')return false;
    return true;
  }).sort((a,b)=>{
    const n=a.r.name.localeCompare(b.r.name,'ko');
    if(n!==0)return n;
    // 동일 수급자 내에서는 기간 시작일 → 급여유형 순
    const d=a.period.dateFrom.localeCompare(b.period.dateFrom);
    if(d!==0)return d;
    return SERVICE_TABS.findIndex(t=>t.key===a.tab)-SERVICE_TABS.findIndex(t=>t.key===b.tab);
  }),[allRows,tabFilter,search,statusFilter,getEntry]);

  const stats=useMemo(()=>{
    const conf=filtered.filter(({r,tab,periodKey})=>!!getEntry(r.id,tab,periodKey));
    return{total:filtered.length,confirmed:conf.length,unconfirmed:filtered.length-conf.length};
  },[filtered,getEntry]);

  const totals=useMemo(()=>{
    let pBenefit=0,pInsurance=0,pCopay=0;
    let cBenefit=0,cInsurance=0,cCopay=0;
    let confIns=0,confCopay=0,confNB=0,confLimitExcess=0;
    const seenNb=new Set<string>();
    filtered.forEach(({r,tab,period,periodKey})=>{
      pBenefit+=period.plan.benefit;pInsurance+=period.plan.insurance;pCopay+=period.plan.copay;
      cBenefit+=period.claim.benefit;cInsurance+=period.claim.insurance;cCopay+=period.claim.copay;
      const e=getEntry(r.id,tab,periodKey);
      if(e){confIns+=e.insuranceAmount;confCopay+=e.copayAmount;}
      if(!seenNb.has(r.id)){
        seenNb.add(r.id);
        confNB+=getNBSum(r.id);
        if(e){ confLimitExcess+=e.limitExcessAmount??0; }
      }
    });
    return{pBenefit,pInsurance,pCopay,cBenefit,cInsurance,cCopay,confIns,confCopay,confNB,confLimitExcess};
  },[filtered,getEntry,getNBSum]);


  const applyRecipientConfirm=useCallback(async (recipientId:string, sels:RecSelection[])=>{
    await applyRecipientConfirmApi(recipientId, {
      year,
      month,
      selections: sels.map((sel) => ({
        serviceType: sel.tab,
        periodKey: sel.periodKey,
        action: sel.action,
        count: sel.count,
        insuranceAmount: sel.ins,
        copayAmount: sel.cop,
      })),
    });
    setModalRecipientId(null);
    await refetchAll();
  },[year, month, refetchAll]);

  const bulkConfirm=async (type:'plan'|'claim')=>{
    await bulkConfirmCopay({
      year,
      month,
      basis: type,
      scope: 'selected',
      recipientIds: Array.from(selSet),
      query: search || undefined,
      status: statusFilter,
      serviceType: 'all',
    });
    setSelSet(new Set());
    await refetchAll();
  };

  const bulkAllConfirm=async (basis:'plan'|'claim',scope:'unconfirmed'|'all')=>{
    await bulkConfirmCopay({
      year,
      month,
      basis,
      scope,
      query: search || undefined,
      status: statusFilter,
      serviceType: 'all',
    });
    setBulkAllOpen(false);
    await refetchAll();
  };

  const bulkCancel=async ()=>{
    await bulkCancelCopay({
      year,
      month,
      recipientIds: Array.from(selSet),
      query: search || undefined,
      status: statusFilter,
      serviceType: 'all',
    });
    setSelSet(new Set());
    await refetchAll();
  };

  // 선택 단위 = 수급자(recipientId)
  const selectableIds=Array.from(new Set(filtered.map(x=>x.r.id)));
  // 행 줄무늬를 수급자 단위로 — 같은 수급자는 같은 음영, 다음 수급자는 교대.
  const recipientBandParity=(()=>{
    const m=new Map<string,boolean>(); let ri=-1;
    filtered.forEach(x=>{ if(!m.has(x.r.id)){ ri++; m.set(x.r.id, ri%2===0); } });
    return m;
  })();
  const toggleAll=()=>selectableIds.every(id=>selSet.has(id))?setSelSet(new Set()):setSelSet(new Set(selectableIds));
  const toggleRecipient=(id:string)=>setSelSet(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  const allChecked=selectableIds.length>0&&selectableIds.every(id=>selSet.has(id));
  const someChecked=selectableIds.some(id=>selSet.has(id))&&!allChecked;
  const progress=stats.total>0?Math.round(stats.confirmed/stats.total*100):0;

  // 컬럼 수: 틀고정 5(chk·no·name·grade·tab) + plan 3 + claim 3 + diff 2 + conf 4(공단·본인·한도초과액·비급여) + status·action 2 = 19
  const TOTAL_COLS = 19;
  const SUM_TOP = 68;
  // 헤더 색상 (탭과 무관한 고정값)
  const PLAN_HEAD = '#1a3a6e';
  const CLAIM_HEAD = '#0f4c2a';
  const DIFF_HEAD = '#3a3060';
  const CONF_HEAD = '#3d2a08';

  // 비급여 헤더 배경
  const NB_HEAD1 = '#5c3300';
  const NB_HEAD2 = '#7a4500';

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'#f0f4f8',overflow:'hidden'}}>

      {/* ── 연월 바 (1행) ── */}
      <div style={{background:'linear-gradient(135deg,#0f2744 0%,#1a3a5c 100%)',flexShrink:0,borderBottom:'1px solid #0a1f38',display:'flex',alignItems:'center',paddingLeft:10,paddingRight:14,gap:8}}>

        {/* 연도 선택 */}
        <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
          <button onClick={prevYear} style={{background:'#1c3a60',border:'none',color:'#fff',cursor:'pointer',borderRadius:4,width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center'}}><ChevronLeft size={12}/></button>
          <span style={{color:'#fff',fontSize:14,fontWeight:700,minWidth:52,textAlign:'center'}}>{year}년</span>
          <button onClick={nextYear} style={{background:'#1c3a60',border:'none',color:'#fff',cursor:'pointer',borderRadius:4,width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center'}}><ChevronRight size={12}/></button>
        </div>

        <div style={{width:1,height:18,background:'#1f4070',flexShrink:0}}/>

        {/* 1~12월 탭 */}
        <div style={{display:'flex',alignItems:'stretch',flex:1,gap:0,overflowX:'auto'}}>
          {Array.from({length:12},(_,i)=>{
            const m=i+1;
            const isActive=m===month;
            const unconf=monthUnconfirmed[i];
            const hasData=monthTotal[i]>0;
            const allDone=hasData&&unconf===0;
            return(
              <button key={m} onClick={()=>selectMonth(m)} style={{
                padding:'5px 10px 4px',
                fontSize:12,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? '#fff' : '#94a3b8',
                background: isActive ? '#1a3858' : 'transparent',
                border:'none',
                borderBottom: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                borderRadius:'4px 4px 0 0',
                cursor:'pointer',
                display:'flex',alignItems:'center',gap:5,
                whiteSpace:'nowrap',
                transition:'background 0.12s, color 0.12s',
                flexShrink:0,
              }}>
                <span>{m}월</span>
                {!hasData ? null : allDone ? (
                  <Check size={10} color="#4ade80" strokeWidth={3}/>
                ) : (
                  <span style={{
                    fontSize:9,
                    fontWeight:700,
                    minWidth:14,
                    height:14,
                    borderRadius:7,
                    padding:'0 4px',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    background: isActive ? '#f87171' : 'rgba(248,113,113,0.35)',
                    color: isActive ? '#fff' : '#fca5a5',
                    lineHeight:1,
                  }}>{unconf}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 확정 진행률 */}
        <div style={{display:'flex',alignItems:'center',gap:7,flexShrink:0}}>
          <span style={{fontSize:10,color:'#94a3b8'}}>확정 진행률</span>
          <div style={{width:80,height:5,background:'#1a3858',borderRadius:3,overflow:'hidden'}}>
            <div style={{width:`${progress}%`,height:'100%',background:progress===100?'#4ade80':'#60a5fa',borderRadius:3,transition:'width 0.3s'}}/>
          </div>
          <span style={{fontSize:11,fontWeight:700,color:progress===100?'#4ade80':'#fff'}}>{progress}%</span>
        </div>
      </div>

      {/* ── 비급여 안내 ── */}
      <div style={{background:'#fffbeb',borderBottom:'1px solid #fde68a',padding:'5px 14px',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
        <Pencil size={11} color="#d97706"/>
        <span style={{fontSize:11,color:'#92400e',fontWeight:600}}>본인부담금을 확정해야 24호서식등 본인부담금을 쓰는 부분에 본인부담금 적용이 됩니다. 비급여는 별개로 수시로 입력 가능합니다.</span>
      </div>

      {/* ── 필터 바 ── */}
      <div style={{background:'#f8fafc',borderBottom:'1px solid #e2e8f0',padding:'5px 16px',display:'flex',gap:8,alignItems:'center',flexShrink:0,flexWrap:'wrap'}}>
        {/* 검색 — 타이핑 중에는 필터 미반영, Enter 또는 [검색] 버튼 클릭 시 적용 */}
        <div style={{display:'flex',gap:4,flexShrink:0}}>
          <div style={{position:'relative'}}>
            <Search size={12} style={{position:'absolute',left:7,top:'50%',transform:'translateY(-50%)',color:'#94a3b8'}}/>
            <input
              value={searchDraft}
              onChange={e=>setSearchDraft(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter') submitSearch(); }}
              placeholder="수급자 검색"
              style={{paddingLeft:24,paddingRight:8,height:26,fontSize:11,border:'1px solid #e2e8f0',borderRadius:4,outline:'none',width:120,background:'#fff'}}
            />
          </div>
          <button
            onClick={submitSearch}
            title="검색 (Enter)"
            style={{height:26,padding:'0 10px',fontSize:11,borderRadius:4,cursor:'pointer',border:'1px solid #152e50',background:'#152e50',color:'#fff',fontWeight:700}}
          >검색</button>
          {search && (
            <button
              onClick={()=>{setSearchDraft('');setSearch('');}}
              title="검색 초기화"
              style={{height:26,padding:'0 8px',fontSize:11,borderRadius:4,cursor:'pointer',border:'1px solid #e2e8f0',background:'#fff',color:'#64748b'}}
            >초기화</button>
          )}
        </div>
        <div style={{display:'flex',gap:3}}>
          {([['all','전체'],['unconfirmed','미확정'],['plan','계획확정'],['claim','청구확정'],['manual','수동확정']] as const).map(([val,lbl])=>(
            <button key={val} onClick={()=>setStatusFilter(val)} style={{
              padding:'2px 8px',fontSize:11,borderRadius:4,cursor:'pointer',
              border:statusFilter===val?`1px solid #152e50`:'1px solid #e2e8f0',
              background:statusFilter===val?'#152e50':'#fff',
              color:statusFilter===val?'#fff':'#64748b',fontWeight:statusFilter===val?600:400,
            }}>{lbl}</button>
          ))}
        </div>
        {/* 급여유형 필터 */}
        <div style={{width:1,height:18,background:'#e2e8f0'}}/>
        <div style={{display:'flex',gap:3}}>
          <button onClick={()=>setTabFilter('all')} style={{
            padding:'2px 8px',fontSize:11,borderRadius:4,cursor:'pointer',
            border:tabFilter==='all'?'1px solid #475569':'1px solid #e2e8f0',
            background:tabFilter==='all'?'#475569':'#fff',
            color:tabFilter==='all'?'#fff':'#64748b',fontWeight:tabFilter==='all'?600:400,
          }}>전체유형</button>
          {SERVICE_TABS.map(t=>{
            const tc=tabCounts.find(c=>c.key===t.key);
            const isActive=tabFilter===t.key;
            return(
              <button key={t.key} onClick={()=>setTabFilter(t.key)} style={{
                padding:'2px 8px',fontSize:11,borderRadius:4,cursor:'pointer',
                border:isActive?`1px solid ${t.color}`:'1px solid #e2e8f0',
                background:isActive?t.color:'#fff',
                color:isActive?'#fff':t.color,fontWeight:isActive?600:500,display:'flex',alignItems:'center',gap:4,
              }}>
                {t.label}
                {tc&&tc.total>0&&(
                  <span style={{fontSize:9,padding:'0 4px',borderRadius:6,background:isActive?'rgba(255,255,255,0.25)':'#f1f5f9',color:isActive?'#fff':'#64748b',fontWeight:700}}>
                    {tc.total-tc.confirmed}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div style={{flex:1}}/>
        {selSet.size>0?(
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <span style={{fontSize:11,color:'#475569',fontWeight:600}}>{selSet.size}명 선택</span>
            <button onClick={()=>bulkConfirm('plan')} style={{padding:'2px 10px',fontSize:11,borderRadius:4,cursor:'pointer',border:'1px solid #2563eb',background:'#eff6ff',color:'#2563eb',fontWeight:600}}>계획기준 일괄확정</button>
            <button onClick={()=>bulkConfirm('claim')} style={{padding:'2px 10px',fontSize:11,borderRadius:4,cursor:'pointer',border:'1px solid #16a34a',background:'#f0fdf4',color:'#16a34a',fontWeight:600}}>청구기준 일괄확정</button>
            <button onClick={bulkCancel} style={{padding:'2px 10px',fontSize:11,borderRadius:4,cursor:'pointer',border:'1px solid #e2e8f0',background:'#fff',color:'#94a3b8'}}>확정취소</button>
          </div>
        ):(
          <div style={{display:'flex',gap:6,alignItems:'center',marginRight:50}}>
            <span style={{fontSize:11,color:'#94a3b8'}}>{filtered.length}명</span>
            <button
              onClick={()=>setBulkAllOpen(true)}
              disabled={filtered.length===0}
              style={{padding:'2px 12px',fontSize:12,borderRadius:4,cursor:filtered.length===0?'not-allowed':'pointer',
                border:'1px solid #152e50',background:'#152e50',color:'#fff',fontWeight:700,
                display:'flex',alignItems:'center',gap:4,opacity:filtered.length===0?0.5:1}}>
              <CheckSquare size={11}/> 본인부담금 일괄확정
            </button>
            <button
              onClick={()=>setNBBulkOpen(true)}
              style={{padding:'2px 12px',fontSize:12,borderRadius:4,cursor:'pointer',
                border:'1px solid #92400e',background:'#fffbeb',color:'#92400e',fontWeight:700,
                display:'flex',alignItems:'center',gap:4}}>
              <Edit3 size={11}/> 비급여액입력
            </button>
          </div>
        )}
      </div>

      {/* ── 테이블 ── */}
      <div style={{flex:1,overflow:'hidden',padding:'10px 16px'}}>
        <div style={{height:'100%',background:'#ffffff',borderRadius:8,border:'1px solid #e2e8f0',overflow:'auto'}}>
        <table style={{borderCollapse:'collapse',tableLayout:'fixed',minWidth:1394}}>
          <colgroup>
            {/* 틀고정 5: chk · no · name · 급여유형 · 등급/감경 */}
            <col style={{width:30}}/><col style={{width:32}}/>
            <col style={{width:68}}/><col style={{width:76}}/><col style={{width:COL_W.tab}}/>
            {/* 계획 3 (급여·본인·한도초과액) */}
            <col style={{width:84}}/><col style={{width:86}}/><col style={{width:84}}/>
            {/* 청구 3 (급여·본인·한도초과액) */}
            <col style={{width:84}}/><col style={{width:86}}/><col style={{width:84}}/>
            {/* 차이 2 */}
            <col style={{width:70}}/><col style={{width:70}}/>
            {/* 확정 3 (공단·본인·한도초과액) */}
            <col style={{width:84}}/><col style={{width:84}}/><col style={{width:88}}/>
            {/* 상태·액션 */}
            <col style={{width:68}}/><col style={{width:114}}/>
            {/* 비급여 (별도, 맨 오른쪽) */}
            <col style={{width:88}}/>
          </colgroup>

          <thead>
            {/* 1행 그룹 헤더 */}
            <tr>
              <th style={TH({position:'sticky',top:0,left:SL.chk,zIndex:5})} rowSpan={2}>
                <div onClick={toggleAll} style={{cursor:'pointer',display:'flex',justifyContent:'center',alignItems:'center'}}>
                  {allChecked?<CheckSquare size={12}/>:someChecked?<Square size={12} style={{opacity:.7}}/>:<Square size={12}/>}
                </div>
              </th>
              <th style={TH({position:'sticky',top:0,left:SL.no,zIndex:5})} rowSpan={2}>No</th>
              <th style={TH({position:'sticky',top:0,left:SL.name,zIndex:5,textAlign:'left',paddingLeft:8})} rowSpan={2}>수급자명</th>
              <th style={TH({position:'sticky',top:0,left:SL.grade,zIndex:5})} rowSpan={2}>등급/감경구분</th>
              <th style={TH({position:'sticky',top:0,left:SL.tab,zIndex:5,...FRZ_TH})} rowSpan={2}>유형</th>
              <th style={TH({background:PLAN_HEAD,boxShadow:'inset 2px 0 0 #3a5d87',position:'sticky',top:0,zIndex:3,fontSize:13})} colSpan={3}>계획자료기반</th>
              <th style={TH({background:CLAIM_HEAD,boxShadow:'inset 2px 0 0 #3a5d87',position:'sticky',top:0,zIndex:3,fontSize:13})} colSpan={3}>청구자료기반</th>
              <th style={TH({background:DIFF_HEAD,boxShadow:'inset 2px 0 0 #3a5d87',position:'sticky',top:0,zIndex:3,fontSize:13})} colSpan={2}>차이</th>
              <th style={TH({background:CONF_HEAD,boxShadow:'inset 2px 0 0 #3a5d87',position:'sticky',top:0,zIndex:3,fontSize:13})} colSpan={3}>확정</th>
              <th style={TH({position:'sticky',top:0,zIndex:3})} rowSpan={2}>확정상태</th>
              <th style={TH({position:'sticky',top:0,zIndex:3})} rowSpan={2}>액션</th>
              <th style={TH({background:CONF_HEAD,boxShadow:'none',position:'sticky',top:0,zIndex:3,color:'#fde68a'})} rowSpan={2}>비급여</th>
            </tr>
            {/* 2행 세부 */}
            <tr>
              <th style={TH({background:PLAN_HEAD,boxShadow:'inset 2px 0 0 #2a4d78',fontSize:10,position:'sticky',top:34,zIndex:3})}>급여</th>
              <th style={TH({background:PLAN_HEAD,fontSize:10,fontWeight:700,position:'sticky',top:34,zIndex:3})}>본인부담금</th>
              <th style={TH({background:PLAN_HEAD,fontSize:10,fontWeight:700,position:'sticky',top:34,zIndex:3,color:'#fde68a'})}>한도초과액</th>
              <th style={TH({background:CLAIM_HEAD,boxShadow:'inset 2px 0 0 #2a4d78',fontSize:10,position:'sticky',top:34,zIndex:3})}>급여</th>
              <th style={TH({background:CLAIM_HEAD,fontSize:10,fontWeight:700,position:'sticky',top:34,zIndex:3})}>본인부담금</th>
              <th style={TH({background:CLAIM_HEAD,fontSize:10,fontWeight:700,position:'sticky',top:34,zIndex:3,color:'#fde68a'})}>한도초과액</th>
              <th style={TH({background:DIFF_HEAD,boxShadow:'inset 2px 0 0 #2a4d78',fontSize:10,position:'sticky',top:34,zIndex:3})}>급여</th>
              <th style={TH({background:DIFF_HEAD,fontSize:10,fontWeight:700,position:'sticky',top:34,zIndex:3})}>본인부담금</th>
              <th style={TH({background:CONF_HEAD,boxShadow:'inset 2px 0 0 #2a4d78',fontSize:10,position:'sticky',top:34,zIndex:3})}>급여</th>
              <th style={TH({background:CONF_HEAD,fontSize:10,fontWeight:700,position:'sticky',top:34,zIndex:3})}>본인부담금</th>
              <th style={TH({background:CONF_HEAD,fontSize:10,fontWeight:700,position:'sticky',top:34,zIndex:3,color:'#fde68a'})}>한도초과액</th>
            </tr>

            {/* 합계 행 */}
            <tr>
              <td style={TD(true,{position:'sticky',top:SUM_TOP,left:SL.chk,zIndex:4,background:'#e8ecf5',borderBottom:'2px solid #c8d0e0'})}/>
              <td style={TD(true,{position:'sticky',top:SUM_TOP,left:SL.no,zIndex:4,background:'#e8ecf5',borderBottom:'2px solid #c8d0e0'})}/>
              <td style={TD(true,{position:'sticky',top:SUM_TOP,left:SL.name,zIndex:4,background:'#e8ecf5',borderBottom:'2px solid #c8d0e0',color:'#475569',fontWeight:700,textAlign:'left',paddingLeft:8})}>합계 ({filtered.length}건)</td>
              <td style={TD(true,{position:'sticky',top:SUM_TOP,left:SL.grade,zIndex:4,background:'#e8ecf5',borderBottom:'2px solid #c8d0e0'})}/>
              <td style={TD(true,{position:'sticky',top:SUM_TOP,left:SL.tab,zIndex:4,background:'#e8ecf5',borderBottom:'2px solid #c8d0e0',...FRZ})}/>
              <td style={TD(true,{position:'sticky',top:SUM_TOP,zIndex:2,background:'#dde8ff',color:'#1e40af',fontWeight:700,borderLeft:'2px solid rgba(21,46,80,0.18)',borderBottom:'2px solid #c8d0e0'})}>{fmt(totals.pBenefit)}</td>
              <td style={TD(true,{position:'sticky',top:SUM_TOP,zIndex:2,background:'#c8daff',color:'#1e3a8a',fontWeight:700,borderBottom:'2px solid #c8d0e0'})}>{fmt(totals.pCopay)}</td>
              <td style={TD(true,{position:'sticky',top:SUM_TOP,zIndex:2,background:'#c8daff',color:'#1e3a8a',fontWeight:700,borderBottom:'2px solid #c8d0e0'})}>{totals.confLimitExcess>0?fmt(totals.confLimitExcess):'-'}</td>
              <td style={TD(true,{position:'sticky',top:SUM_TOP,zIndex:2,background:'#d4f4e0',color:'#15803d',fontWeight:700,borderLeft:'2px solid rgba(21,46,80,0.18)',borderBottom:'2px solid #c8d0e0'})}>{fmt(totals.cBenefit)}</td>
              <td style={TD(true,{position:'sticky',top:SUM_TOP,zIndex:2,background:'#b8eecb',color:'#14532d',fontWeight:700,borderBottom:'2px solid #c8d0e0'})}>{fmt(totals.cCopay)}</td>
              <td style={TD(true,{position:'sticky',top:SUM_TOP,zIndex:2,background:'#b8eecb',color:'#14532d',fontWeight:700,borderBottom:'2px solid #c8d0e0'})}>{totals.confLimitExcess>0?fmt(totals.confLimitExcess):'-'}</td>
              <td style={TD(true,{position:'sticky',top:SUM_TOP,zIndex:2,background:'#edeaf8',fontWeight:700,borderLeft:'2px solid rgba(21,46,80,0.18)',textAlign:'center',borderBottom:'2px solid #c8d0e0',color:totals.pBenefit-totals.cBenefit!==0?'#ea580c':'#94a3b8'})}>
                {totals.pBenefit-totals.cBenefit===0?'동일':`${totals.pBenefit-totals.cBenefit>0?'+':''}${fmt(totals.pBenefit-totals.cBenefit)}`}
              </td>
              <td style={TD(true,{position:'sticky',top:SUM_TOP,zIndex:2,background:'#edeaf8',fontWeight:700,textAlign:'center',borderBottom:'2px solid #c8d0e0',color:totals.pCopay-totals.cCopay!==0?'#ea580c':'#94a3b8'})}>
                {totals.pCopay-totals.cCopay===0?'동일':`${totals.pCopay-totals.cCopay>0?'+':''}${fmt(totals.pCopay-totals.cCopay)}`}
              </td>
              <td style={TD(true,{position:'sticky',top:SUM_TOP,zIndex:2,background:'#fff0cc',color:'#b45309',fontWeight:700,borderLeft:'2px solid rgba(21,46,80,0.18)',borderBottom:'2px solid #c8d0e0'})}>{(totals.confIns+totals.confCopay)>0?fmt(totals.confIns+totals.confCopay):'-'}</td>
              <td style={TD(true,{position:'sticky',top:SUM_TOP,zIndex:2,background:'#fff0cc',color:'#b45309',fontWeight:700,borderBottom:'2px solid #c8d0e0'})}>{totals.confCopay>0?fmt(totals.confCopay):'-'}</td>
              <td style={TD(true,{position:'sticky',top:SUM_TOP,zIndex:2,background:'#fff0cc',color:'#b45309',fontWeight:700,borderBottom:'2px solid #c8d0e0'})}>{totals.confLimitExcess>0?fmt(totals.confLimitExcess):'-'}</td>
              <td colSpan={2} style={TD(true,{position:'sticky',top:SUM_TOP,zIndex:2,background:'#e8ecf5',borderBottom:'2px solid #c8d0e0'})}/>
              <td style={TD(true,{position:'sticky',top:SUM_TOP,zIndex:2,background:'#fff0cc',color:'#b45309',fontWeight:700,borderRight:'none',borderBottom:'2px solid #c8d0e0'})}>{totals.confNB>0?fmt(totals.confNB):'-'}</td>
            </tr>
          </thead>

          <tbody>
            {filtered.length===0?(
              <tr><td colSpan={TOTAL_COLS} style={{textAlign:'center',padding:48,color:'#94a3b8',fontSize:12}}>해당 조건의 수급자가 없습니다.</td></tr>
            ):filtered.map(({r,tab,rowKey,period,periodKey},idx)=>{
              const tabDefRow = getTabDef(tab);
              const plan = period.plan;
              const claim = period.claim;
              const entry=getEntry(r.id,tab,periodKey);
              const benefitDiff=plan.benefit-claim.benefit;
              const copayDiff=plan.copay-claim.copay;
              const showDiff=plan.count>0&&claim.count>0;
              // 수급자 단위 줄무늬 (같은 수급자의 모든 행은 동일 음영)
              const isEvenRow=recipientBandParity.get(r.id)??true;
              const isSel=selSet.has(r.id);
              // 등급/감경구분 — 기간 세그먼트 스냅샷 기준
              const segGradeText=`${period.gradeNum}등급`;
              const segReduction=period.reduction;
              const segCopayRate=period.copaymentRate;
              const tl: '감경'|'기초'|'일반' = segReduction.includes('감경')?'감경':segReduction.includes('기초')?'기초':'일반';
              const segReductionLabel = segReduction.includes('9')?'9%':segReduction.includes('7.5')?'7.5%':segReduction.includes('6')?'6%':segReduction.includes('기초')?'기초':'일반';
              const noCharge=segCopayRate===0;
              const rowBg=isSel?'#eff6ff':isEvenRow?'#ffffff':'#f4f7fb';
              // 한 칸 띄어 교대: 색 없는 수급자(=흰색)와 옅은 색 수급자를 번갈아 표시
              const pBg=isSel?'#eef4ff':isEvenRow?'#ffffff':'#eef4fc';
              const cBg=isSel?'#eef9f3':isEvenRow?'#ffffff':'#edf8f1';
              const dBg=isSel?'#f3f1fc':isEvenRow?'#ffffff':'#f2eefb';
              const confBg=isSel?'#fffbe9':isEvenRow?'#ffffff':'#fff8e8';
              // 비급여·한도초과액은 수급자 단위로 집계 (모든 행에서 동일 값 참조).
              const nbSum = getNBSum(r.id);
              const leSum = getLimitExcess(r.id);

              // 동일 수급자 연속 행 → 수급자명 통합
              const isFirstOfRecipient = idx===0 || filtered[idx-1].r.id !== r.id;
              let nameRowSpan = 1;
              if(isFirstOfRecipient){
                let i=idx+1;
                while(i<filtered.length && filtered[i].r.id===r.id){nameRowSpan++;i++;}
              }
              // 동일 (수급자, 등급/감경 세그먼트) 연속 행 → 등급/감경 셀 통합
              const isFirstOfPeriodGroup = idx===0
                || filtered[idx-1].r.id !== r.id
                || filtered[idx-1].periodKey !== periodKey;
              let gradeRowSpan = 1;
              if(isFirstOfPeriodGroup){
                let i=idx+1;
                while(i<filtered.length && filtered[i].r.id===r.id && filtered[i].periodKey===periodKey){gradeRowSpan++;i++;}
              }
              // 병합 셀도 수급자 줄무늬 색을 따라가도록 통일
              const nameBg  = rowBg;
              const gradeBg = rowBg;

              // 기간 표시 'M.D~D' (같은 월) / 'M.D~M.D'
              const fmtPeriod = (from:string,to:string)=>{
                const [, mF, dF]=from.split('-');
                const [, mT, dT]=to.split('-');
                const fromStr = `${parseInt(mF,10)}.${parseInt(dF,10)}`;
                const toStr = mF===mT ? `${parseInt(dT,10)}` : `${parseInt(mT,10)}.${parseInt(dT,10)}`;
                return from===to ? fromStr : `${fromStr}~${toStr}`;
              };
              const periodLabel = fmtPeriod(period.dateFrom, period.dateTo);

              return(
                <tr key={rowKey} style={{background:rowBg, height:30}} onClick={()=>toggleRecipient(r.id)}>
                  {/* ── 틀고정 4열 + 급여유형 + 등급 ── */}
                  {/* 체크박스 — 수급자 단위(병합) */}
                  {isFirstOfRecipient && (
                    <td rowSpan={nameRowSpan} style={TD(true,{position:'sticky',left:SL.chk,zIndex:2,background:isSel?'#dbeafe':rowBg,cursor:'pointer',textAlign:'center',verticalAlign:'middle',height:'auto',maxHeight:'none',borderBottom:'1px solid #e4eaf3'})}>
                      {isSel?<CheckSquare size={12} color="#2563eb"/>:<Square size={12} color="#cbd5e1"/>}
                    </td>
                  )}
                  <td style={TD(isEvenRow,{position:'sticky',left:SL.no,zIndex:2,background:rowBg,color:'#94a3b8',textAlign:'center'})}>{idx+1}</td>
                  {isFirstOfRecipient && (
                    <td rowSpan={nameRowSpan} style={TD(true,{position:'sticky',left:SL.name,zIndex:2,background:nameBg,textAlign:'left',paddingLeft:7,fontWeight:700,color:'#0f172a',verticalAlign:'middle',height:'auto',maxHeight:'none',borderBottom:'1px solid #e4eaf3'})}>
                      <div style={{display:'flex',flexDirection:'column',gap:2}}>
                        <span>{r.name}</span>
                        <span style={{fontSize:10,color:'#94a3b8',fontWeight:400}}>{(()=>{const ld=getLegalDob(r);return ld?`${ld.slice(2,4)}.${ld.slice(5,7)}.${ld.slice(8,10)}`:'-';})()}</span>
                      </div>
                    </td>
                  )}
                  {/* 등급/감경구분 — (수급자, 기간세그먼트) 단위로 통합 */}
                  {isFirstOfPeriodGroup && (
                    <td rowSpan={gradeRowSpan} style={TD(true,{position:'sticky',left:SL.grade,zIndex:2,background:gradeBg,textAlign:'center',verticalAlign:'middle',height:'auto',maxHeight:'none',borderBottom:'1px solid #e4eaf3'})}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:3}}>
                        <span style={{background:'#dbeafe',color:'#1d4ed8',border:'1px solid #bfdbfe',fontSize:12,padding:'1px 5px',borderRadius:3,fontWeight:600}}>{segGradeText}</span>
                        <TypeBadge t={tl} label={segReductionLabel} size={12}/>
                      </div>
                    </td>
                  )}
                  {/* 급여유형 — 행마다 표시 */}
                  <td style={TD(isEvenRow,{position:'sticky',left:SL.tab,zIndex:2,background:rowBg,textAlign:'center',...FRZ})}>
                    <span title={tabDefRow.label} style={{
                      fontSize:11,fontWeight:700,padding:'2px 6px',borderRadius:3,
                      background:`${tabDefRow.color}15`,color:tabDefRow.color,border:`1px solid ${tabDefRow.color}40`,
                    }}>{tabDefRow.short}</span>
                  </td>
                  {/* 계획 3 (급여·본인부담금·한도초과액) */}
                  <td style={TD(isEvenRow,{background:pBg,color:'#1e40af',borderLeft:'2px solid rgba(21,46,80,0.18)'})}>{fmt(plan.benefit)}</td>
                  <td style={TD(isEvenRow,{background:isEvenRow?'#ffffff':'#e6eefb',color:'#1e3a8a',fontWeight:700})}>{noCharge?<span style={{color:'#cbd5e1'}}>0</span>:fmt(plan.copay)}</td>
                  {/* 한도초과액(계획) — 수급자 단위 병합 */}
                  {isFirstOfRecipient && (
                    <td rowSpan={nameRowSpan} style={TD(true,{background:isEvenRow?'#ffffff':'#e6eefb',color:'#1e3a8a',fontWeight:700,verticalAlign:'middle',height:'auto',maxHeight:'none',borderBottom:'1px solid #e4eaf3'})}>
                      {leSum>0 ? fmt(leSum) : <span style={{color:'#cbd5e1'}}>-</span>}
                    </td>
                  )}

                  {/* 청구 3 (급여·본인부담금·한도초과액) */}
                  <td style={TD(isEvenRow,{background:cBg,color:'#15803d',borderLeft:'2px solid rgba(21,46,80,0.18)'})}>{fmt(claim.benefit)}</td>
                  <td style={TD(isEvenRow,{background:isEvenRow?'#ffffff':'#e0f2e8',color:'#14532d',fontWeight:700})}>{noCharge?<span style={{color:'#cbd5e1'}}>0</span>:fmt(claim.copay)}</td>
                  {/* 한도초과액(청구) — 수급자 단위 병합 */}
                  {isFirstOfRecipient && (
                    <td rowSpan={nameRowSpan} style={TD(true,{background:isEvenRow?'#ffffff':'#e0f2e8',color:'#14532d',fontWeight:700,verticalAlign:'middle',height:'auto',maxHeight:'none',borderBottom:'1px solid #e4eaf3'})}>
                      {leSum>0 ? fmt(leSum) : <span style={{color:'#cbd5e1'}}>-</span>}
                    </td>
                  )}

                  {/* 차이 2 (급여·본인부담금) */}
                  <td style={TD(isEvenRow,{background:dBg,textAlign:'center',borderLeft:'2px solid rgba(21,46,80,0.14)'})}>{!showDiff?null:fmtDiff(benefitDiff)}</td>
                  <td style={TD(isEvenRow,{background:dBg,textAlign:'center',fontWeight:700})}>{!showDiff?null:noCharge?<span style={{color:'#cbd5e1'}}>-</span>:fmtDiff(copayDiff)}</td>

                  {/* 확정 (급여·본인·한도초과액) */}
                  <td style={TD(isEvenRow,{background:confBg,color:'#b45309',fontWeight:600,borderLeft:'2px solid rgba(21,46,80,0.14)'})}>{entry?fmt(entry.insuranceAmount+entry.copayAmount):<span style={{color:'#cbd5e1'}}>-</span>}</td>
                  <td style={TD(isEvenRow,{background:confBg,color:'#b45309',fontWeight:700})}>{entry?fmt(entry.copayAmount):<span style={{color:'#cbd5e1'}}>-</span>}</td>
                  {/* 확정 한도초과액 — 수급자 단위 병합, 확정 시점 스냅샷 */}
                  {isFirstOfRecipient && (()=>{
                    // 이 수급자의 확정 엔트리 중 첫 번째에서 limitExcessAmount 읽기
                    const recRows = filtered.slice(idx, idx + nameRowSpan);
                    const firstConfirmed = recRows.map(x => getEntry(x.r.id, x.tab, x.periodKey)).find(e => e);
                    const snapAmt = firstConfirmed?.limitExcessAmount ?? 0;
                    return (
                      <td rowSpan={nameRowSpan} style={TD(true,{background:confBg,color:'#b45309',fontWeight:700,verticalAlign:'middle',height:'auto',maxHeight:'none',borderBottom:'1px solid #e4eaf3'})}>
                        {firstConfirmed
                          ? (snapAmt > 0 ? fmt(snapAmt) : <span style={{color:'#cbd5e1'}}>0</span>)
                          : <span style={{color:'#cbd5e1'}}>-</span>}
                      </td>
                    );
                  })()}

                  {/* 상태 */}
                  <td style={TD(isEvenRow,{background:rowBg,textAlign:'center'})}><ConfirmBadge entry={entry}/></td>

                  {/* 액션 — 수급자 단위 확정(병합): 한 버튼으로 그 수급자의 모든 행을 팝업에서 처리 */}
                  {isFirstOfRecipient && (()=>{
                    const recRows = filtered.slice(idx, idx+nameRowSpan);
                    // 수급자 단위 — 모든 건이 확정돼야 '확정', 아니면 '미확정'
                    const confirmedAll = recRows.length>0 && recRows.every(x=>!!getEntry(x.r.id,x.tab,x.periodKey));
                    return (
                      <td rowSpan={nameRowSpan} style={TD(true,{background:rowBg,textAlign:'center',verticalAlign:'middle',height:'auto',maxHeight:'none',borderBottom:'1px solid #e4eaf3'})} onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>setModalRecipientId(r.id)} style={{
                          padding:'3px 10px',fontSize:11,borderRadius:4,cursor:'pointer',fontWeight:700,
                          display:'inline-flex',alignItems:'center',gap:4,
                          border: confirmedAll?'1px solid #16a34a':'1px solid #152e50',
                          background: confirmedAll?'#f0fdf4':'#152e50',
                          color: confirmedAll?'#16a34a':'#fff',
                        }}>
                          {confirmedAll?<><Check size={11}/>확정완료</>:<><CheckSquare size={11}/>확정</>}
                        </button>
                      </td>
                    );
                  })()}
                  {/* 비급여 — 별도 컬럼, 수급자 단위 단일 값(병합), 맨 오른쪽 */}
                  {isFirstOfRecipient && (
                    <td rowSpan={nameRowSpan} style={TD(true,{background:confBg,color:'#b45309',fontWeight:700,borderRight:'none',textAlign:'right',verticalAlign:'middle',height:'auto',maxHeight:'none',borderBottom:'1px solid #e4eaf3'})}>
                      {nbSum>0 ? fmt(nbSum) : <span style={{color:'#cbd5e1'}}>-</span>}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* ── 수급자 단위 확정 모달 ── */}
      {modalRecipientId&&(()=>{
        const recRows = filtered.filter(x=>x.r.id===modalRecipientId);
        const rr = recRows[0]?.r;
        if(!rr) return null;
        const rowsForModal = recRows.map(x=>({
          tab:x.tab, tabLabel:getTabDef(x.tab).label, period:x.period, periodKey:x.periodKey,
          current:getEntry(x.r.id,x.tab,x.periodKey),
        }));
        return (
          <RecipientConfirmModal
            r={rr}
            rows={rowsForModal}
            onApply={(sels)=>{ void applyRecipientConfirm(modalRecipientId,sels); }}
            onClose={()=>setModalRecipientId(null)}
          />
        );
      })()}

      {/* ── 전체 일괄확정 모달 ── */}
      {bulkAllOpen&&(
        <BulkAllModal
          tabLabel={tabFilter==='all'?'전체유형':getTabDef(tabFilter).label}
          totalCount={filtered.length}
          unconfirmedCount={filtered.filter(({r,tab,periodKey})=>!getEntry(r.id,tab,periodKey)).length}
          confirmedCount={filtered.filter(({r,tab,periodKey})=>!!getEntry(r.id,tab,periodKey)).length}
          onConfirm={(basis, scope)=>{ void bulkAllConfirm(basis, scope); }}
          onClose={()=>setBulkAllOpen(false)}
        />
      )}

      {/* ── 비급여액입력 (일괄) 모달 ── */}
      {nbBulkOpen && (()=>{
        // 필터된 행에 등장하는 수급자 (중복 제거, 이름 정렬)
        const seen = new Set<string>();
        const list: Recipient[] = [];
        filtered.forEach(({r})=>{ if(!seen.has(r.id)){seen.add(r.id);list.push(r);} });
        list.sort((a,b)=>a.name.localeCompare(b.name,'ko'));
        return (
          <NBBulkModal
            recipients={list}
            data={curNBMap}
            facilityOtherCategories={nbOtherCategories}
            onAddCategory={(name)=>{ void addNBCategory(name); }}
            onRemoveCategory={(name)=>{ void removeNBCategory(name); }}
            onSave={(next)=>{ void saveAllNB(next); }}
            onClose={()=>setNBBulkOpen(false)}
          />
        );
      })()}

      {/* ── 비급여명세 모달 (수급자별 단일) ── */}
      {nbModalId&&(()=>{
        const row = apiRows.find(x=>x.recipientId===nbModalId);
        if(!row) return null;
        const r = rowToRecipient(row);
        return (
          <NBDetailModal
            r={r}
            entry={getNB(nbModalId)}
            facilityOtherCategories={nbOtherCategories}
            onAddCategory={(name)=>{ void addNBCategory(name); }}
            onRemoveCategory={(name)=>{ void removeNBCategory(name); }}
            onSave={(next)=>{ void saveNB(nbModalId, next); }}
            onClose={()=>setNBModalId(null)}
          />
        );
      })()}
    </div>
  );
}
