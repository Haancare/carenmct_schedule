import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Search, User, Plus, Save, AlertTriangle, FileText, ClipboardList } from 'lucide-react';
import { recipients, consultationVisits, socialWorkers, SERVICE_LABELS, getCertNo, getValidFrom, getValidTo, getGradeNum, getGradeText, getServiceTypes, getReduction, RECIP_GROUPS, getSchedulesForRecipient } from './mockData';
import type { ConsultationVisit } from './mockData';
import { JournalFormBody } from './JournalModal';
import type { JournalStatus } from './JournalModal';

// ─── Props ────────────────────────────────────────────────────────────────────
interface RecipientJournalTabProps {
  initialRecipId?: string;
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface RecipJournalEntry {
  id: string;
  date: string;           // 작성일 YYYY-MM-DD (chip에 표시)
  visitDate?: string;     // 연결된 방문일자
  socialWorkerId?: string;
  data: Record<string, any>;
  status: JournalStatus;
}

type RecipJournalStore = Record<string, RecipJournalEntry[]>; // recipientId → entries (최신순)

// ─── Constants ──────────────────────────────────────────────────────────────
const TODAY = '2026-04-13';
const SW_NAMES = ['김지원', '박수현', '이나연'];
const pad2 = (n: number) => String(n).padStart(2, '0');


const GRADE_COLOR: Record<number, { bg: string; c: string }> = {
  1: { bg: '#fef2f2', c: '#dc2626' },
  2: { bg: '#fff7ed', c: '#ea580c' },
  3: { bg: '#fffbeb', c: '#d97706' },
  4: { bg: '#f0fdf4', c: '#16a34a' },
  5: { bg: '#eff6ff', c: '#2563eb' },
};

// ─── Initial mock data (방문상담일지 초기 데이터) ──────────────────────────────
const RAW_INIT: { visitId: string; data: Record<string, any>; status: JournalStatus; writtenAt: string }[] = [
  { visitId: 'CV-SW1-R001-0204', data: { j_s6_consult: '수급자 건강상태 양호. 방문요양 서비스 주5일 이용에 대한 만족도 확인. 보호자와 소통 원활.' }, status: 'completed', writtenAt: '2026-02-05' },
  { visitId: 'CV-SW1-R002-0204', data: { j_s6_consult: '수급자 및 보호자 희망에 따라 방문요양 주5일→주4일 조정 요청 접수. 급여변경 신청서 작성.' }, status: 'completed', writtenAt: '2026-02-05' },
  { visitId: 'CV-SW1-R007-0210', data: { j_s6_consult: '수급자 가족으로부터 청구 오류 민원 접수. 중복 청구 1건 확인 및 정정 처리 완료.' }, status: 'completed', writtenAt: '2026-02-11' },
  { visitId: 'CV-SW2-R025-0210', data: { j_s6_consult: '수급자 현황 실태조사 실시. 주거 환경, 건강 상태, 서비스 이용 현황 확인.' }, status: 'completed', writtenAt: '2026-02-11' },
  { visitId: 'CV-SW2-R034-0224', data: { j_s6_consult: '중증 치매 수급자 방문. 보호자(딸)와 함께 현황 확인. 방문요양 주5일 서비스 지속 필요.' }, status: 'completed', writtenAt: '2026-02-25' },
  { visitId: 'CV-SW3-R044-0211', data: { j_s6_consult: '인정 유효기간 만료에 따른 종결 처리 진행. 갱신 의사 없음 확인.' }, status: 'completed', writtenAt: '2026-02-12' },
  { visitId: 'CV-SW1-R001-0402', data: { j_s6_consult: '4월 정기 문 완료. 수급자 건강 양호. 서비스 만족도 지속 높음.' }, status: 'draft', writtenAt: '2026-04-02' },
  { visitId: 'CV-SW1-R011-0413', data: { j_s6_consult: '방문요양 급여 재계약 관련 상담 진행. 수급자 및 보호자와 서비스 지속 의사 확인.' }, status: 'draft', writtenAt: '2026-04-13' },
  { visitId: 'CV-SW2-R027-0413', data: { j_s6_consult: '4월 정기 방문. 서비스 이용 현황 및 만족도 확인.' }, status: 'draft', writtenAt: '2026-04-13' },
];

function buildInitStore(): RecipJournalStore {
  const store: RecipJournalStore = {};
  for (const raw of RAW_INIT) {
    const visit = consultationVisits.find(v => v.id === raw.visitId);
    if (!visit) continue;
    const recipId = visit.recipientId;
    if (!store[recipId]) store[recipId] = [];
    store[recipId].push({
      id: raw.visitId,
      date: raw.writtenAt,
      visitDate: visit.date,
      socialWorkerId: visit.socialWorkerId,
      data: { ...raw.data },
      status: raw.status,
    });
  }
  for (const arr of Object.values(store)) {
    arr.sort((a, b) => b.date.localeCompare(a.date));
  }
  return store;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function RecipientJournalTab({ initialRecipId }: RecipientJournalTabProps) {
  const [store, setStore]               = useState<RecipJournalStore>(buildInitStore);
  const [selectedRecipId, setSelectedRecipId] = useState<string | null>(initialRecipId ?? null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isNewEntry, setIsNewEntry]     = useState(false);
  const [formData, setFormData]         = useState<Record<string, any>>({});
  const [isDirty, setIsDirty]           = useState(false);
  const [entryStatus, setEntryStatus]   = useState<JournalStatus>('completed');
  const [entryDate, setEntryDate]       = useState(TODAY);
  const [author, setAuthor]             = useState(SW_NAMES[0]);
  const [search, setSearch]             = useState('');
  const [filterGrade, setFilterGrade]   = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [filterGroup, setFilterGroup]   = useState('all');
  const [filterSubGroup, setFilterSubGroup] = useState('all');
  const [filterSw, setFilterSw]         = useState('all');
  const [filterSwStatus, setFilterSwStatus] = useState<'all' | 'active'>('all');
  const [filterRecipStatus, setFilterRecipStatus] = useState<'active' | 'all'>('all');
  const [filterMonthData, setFilterMonthData] = useState<'month' | 'all'>('month');
  const [year, setYear]                 = useState(2026);
  const [month, setMonth]               = useState(4);
  const chipBarRef = useRef<HTMLDivElement>(null);

  const monthPfx = `${year}-${pad2(month)}`;
  function prevMonth() { if (month === 1) { setYear(y => y-1); setMonth(12); } else setMonth(m => m-1); }
  function nextMonth() { if (month === 12) { setYear(y => y+1); setMonth(1); } else setMonth(m => m+1); }

  // initialRecipId로 마운트 시 최근 일지 자동 로드
  React.useEffect(() => {
    if (initialRecipId) {
      const entries = store[initialRecipId] ?? [];
      if (entries.length > 0) {
        const first = entries[0];
        setSelectedEntryId(first.id);
        setIsNewEntry(false);
        setFormData({ ...first.data });
        setEntryStatus(first.status);
        setEntryDate(first.date);
        const sw = first.socialWorkerId ? socialWorkers.find(s => s.id === first.socialWorkerId) : undefined;
        if (sw) setAuthor(sw.name);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const curGroupObj = RECIP_GROUPS.find(g => g.id === filterGroup) ?? RECIP_GROUPS[0];
  const filteredRecips = [...recipients]
    .filter(r => filterRecipStatus === 'all' || r.status === 'active')
    .filter(r => !search || r.name.includes(search) || getCertNo(r).includes(search))
    .filter(r => filterGrade === 'all' || String(getGradeNum(r)) === filterGrade || (filterGrade === 'in' && getGradeNum(r) > 5))
    .filter(r => filterService === 'all' || getServiceTypes(r).includes(filterService as any))
    .filter(r => {
      if (filterMonthData === 'all') return true;
      const scheds = getSchedulesForRecipient(r.id, year, month);
      return scheds.some(s => ['visit_care','family_care','full_day_visit','visit_bath','visit_nursing'].includes(s.serviceType));
    })
    .filter(r => {
      if (filterGroup === 'all') return true;
      if (filterSubGroup === 'all') return true;
      return true; // 실제 그룹 데이터 연동 전 UI 전용
    })
    .filter(r => {
      if (filterSw === 'all') return true;
      return consultationVisits.some(v =>
        v.recipientId === r.id && v.socialWorkerId === filterSw && v.date.startsWith(monthPfx)
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const sel = selectedRecipId ? recipients.find(r => r.id === selectedRecipId) : null;
  const selEntries: RecipJournalEntry[] = selectedRecipId ? (store[selectedRecipId] ?? []) : [];
  const selEntry = selectedEntryId ? selEntries.find(e => e.id === selectedEntryId) : null;

  // ── 수급자 선택 ──────────────────────────────────────────────────────────
  function handleSelectRecip(recipId: string) {
    if (isDirty) {
      if (!window.confirm('저장되지 않은 변경사항이 있습니다. 이동하시겠습니까?')) return;
    }
    setSelectedRecipId(recipId);
    setSelectedEntryId(null);
    setIsNewEntry(false);
    setShowVisitPicker(true);
    setFormData({});
    setIsDirty(false);
  }

  // ── 칩(일지) 선택 ────────────────────────────────────────────────────────
  function handleSelectEntry(entry: RecipJournalEntry) {
    if (isDirty && !window.confirm('저장되지 않은 변경사항이 있습니다. 이동하시겠습니까?')) return;
    loadEntry(entry);
  }

  function loadEntry(entry: RecipJournalEntry) {
    setSelectedEntryId(entry.id);
    setIsNewEntry(false);
    setFormData({ ...entry.data });
    setEntryStatus(entry.status);
    setEntryDate(entry.date);
    const sw = entry.socialWorkerId ? socialWorkers.find(s => s.id === entry.socialWorkerId) : undefined;
    if (sw) setAuthor(sw.name);
    setIsDirty(false);
  }

  // ── 신규 작성 ─────────────────────────────────────────────────────────────
  const [showVisitPicker, setShowVisitPicker] = useState(false);

  function handleNewEntry() {
    if (isDirty && !window.confirm('저장되지 않은 변경사항이 있습니다. 계속하시겠습니까?')) return;
    setSelectedEntryId(null);
    setIsNewEntry(false);
    setFormData({});
    setIsDirty(false);
    setShowVisitPicker(true);
  }

  function handlePickVisit(visit: ConsultationVisit) {
    const sw = socialWorkers.find(s => s.id === visit.socialWorkerId);
    setSelectedEntryId(null);
    setIsNewEntry(true);
    setFormData({});
    setEntryStatus('completed');
    setEntryDate(visit.date);
    if (sw) setAuthor(sw.name);
    setIsDirty(false);
    setShowVisitPicker(false);
  }


  // ── 저장 ─────────────────────────────────────────────────────────────────
  function handleSave(overrideStatus?: JournalStatus) {
    if (!selectedRecipId) return;
    const finalStatus = overrideStatus ?? entryStatus;
    const now = new Date();
    const writtenAt = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

    if (isNewEntry) {
      const newId = `RJ-${selectedRecipId}-${Date.now()}`;
      const newEntry: RecipJournalEntry = {
        id: newId,
        date: entryDate,
        data: { ...formData },
        status: finalStatus,
      };
      setStore(prev => {
        const arr = [newEntry, ...(prev[selectedRecipId] ?? [])].sort((a,b) => b.date.localeCompare(a.date));
        return { ...prev, [selectedRecipId]: arr };
      });
      setSelectedEntryId(newId);
      setIsNewEntry(false);
    } else if (selectedEntryId) {
      setStore(prev => {
        const arr = (prev[selectedRecipId] ?? []).map(e =>
          e.id === selectedEntryId
            ? { ...e, date: entryDate, data: { ...formData }, status: finalStatus }
            : e
        ).sort((a,b) => b.date.localeCompare(a.date));
        return { ...prev, [selectedRecipId]: arr };
      });
    }
    setEntryStatus(finalStatus);
    setIsDirty(false);
    // 저장 후 자동으로 일정목록으로 복귀
    setSelectedEntryId(null);
    setIsNewEntry(false);
    setShowVisitPicker(true);
  }

  // ── formData setter with dirty flag ────────────────────────────────────────
  const handleSetFormData: React.Dispatch<React.SetStateAction<Record<string, any>>> = (action) => {
    setFormData(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      setIsDirty(true);
      return next;
    });
  };

  // ─── Left Panel: 수급자 목록 ────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden', background:'#f0f4f8' }}>

      {/* ── LEFT PANEL ── */}
      <div style={{ width:300, flexShrink:0, display:'flex', flexDirection:'column', background:'#fff', borderRight:'1px solid #e2e8f0', overflow:'hidden' }}>

        {/* 헤더: 상담연월 선택 */}
        <div style={{ background:'linear-gradient(135deg,#0f2744 0%,#1a3a5c 100%)', padding:'8px 12px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.1)', borderRadius:6, padding:'4px 6px' }}>
            <button onClick={prevMonth} style={{ background:'none', border:'none', cursor:'pointer', color:'#93c5fd', display:'flex', alignItems:'center', padding:'2px 4px' }}><ChevronLeft size={14} /></button>
            <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{year}년 {month}월</span>
            <button onClick={nextMonth} style={{ background:'none', border:'none', cursor:'pointer', color:'#93c5fd', display:'flex', alignItems:'center', padding:'2px 4px' }}><ChevronRight size={14} /></button>
          </div>
        </div>

        {/* 기관전체 통계 */}
        {(() => {
          const allMv = consultationVisits.filter(v => v.date.startsWith(monthPfx));
          const tPlanned   = allMv.filter(v => v.consultStatus === 'planned').length;
          const tCompleted = allMv.filter(v => v.consultStatus === 'completed').length;
          const tUnable    = allMv.filter(v => v.consultStatus === 'unable').length;
          const allEntries = Object.values(store).flat();
          const tWritten   = allEntries.filter(e => (e.visitDate ?? e.date).startsWith(monthPfx) && e.status === 'completed').length;
          const tNone      = Math.max(0, tCompleted - tWritten);
          const chip = (label: string, count: number, bg: string, color: string, border: string) => (
            <span key={label} style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:11, padding:'2px 7px', borderRadius:10, background:bg, color, border:`1px solid ${border}`, fontWeight:700 }}>
              <span style={{ fontSize:12, fontWeight:800 }}>{count}</span>{label}
            </span>
          );
          return (
            <div style={{ flexShrink:0, padding:'7px 10px 6px', borderBottom:'1px solid #e2e8f0', background:'#f8fafc' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#64748b', marginBottom:5 }}>기관전체 ({year}.{pad2(month)})</div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <div style={{ display:'flex', gap:3, alignItems:'center' }}>
                  <span style={{ fontSize:9, color:'#94a3b8', flexShrink:0 }}>상담</span>
                  {chip('완료', tCompleted, '#d1fae5', '#059669', '#6ee7b7')}
                  {chip('예정', tPlanned,   '#dbeafe', '#1d4ed8', '#93c5fd')}
                  {chip('불가', tUnable,    '#fff1f2', '#be123c', '#fda4af')}
                </div>
                <div style={{ display:'flex', gap:3, alignItems:'center' }}>
                  <span style={{ fontSize:9, color:'#94a3b8', flexShrink:0 }}>일지</span>
                  {chip('작성',   tWritten, '#d1fae5', '#059669', '#6ee7b7')}
                  {chip('미작성', tNone,    '#f1f5f9', '#64748b', '#e2e8f0')}
                </div>
              </div>
            </div>
          );
        })()}

        {/* 검색 + 필터 */}
        <div style={{ padding:'6px 10px', borderBottom:'1px solid #e2e8f0', flexShrink:0, display:'flex', flexDirection:'column', gap:4 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:5, padding:'3px 8px' }}>
            <Search size={11} color="#94a3b8" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="수급자명 검색"
              style={{ flex:1, border:'none', background:'transparent', fontSize:11, color:'#1e293b', outline:'none' }} />
          </div>
          {/* 수급자 상태 */}
          <div style={{ display:'flex', gap:4 }}>
            {(['active','all'] as const).map(v => (
              <button key={v} onClick={() => setFilterRecipStatus(v)}
                style={{ flex:1, fontSize:9, padding:'3px 0', borderRadius:4, cursor:'pointer', border:'1px solid',
                  borderColor: filterRecipStatus===v ? '#3b82f6' : '#e2e8f0',
                  background: filterRecipStatus===v ? '#eff6ff' : '#f8fafc',
                  color: filterRecipStatus===v ? '#1d4ed8' : '#64748b', fontWeight: filterRecipStatus===v ? 700 : 400 }}>
                {v==='active' ? '수급중' : '전체수급자'}
              </button>
            ))}
          </div>
          {/* 해당월 필터 */}
          <div style={{ display:'flex', gap:4 }}>
            {(['month','all'] as const).map(v => (
              <button key={v} onClick={() => setFilterMonthData(v)}
                style={{ flex:1, fontSize:9, padding:'3px 0', borderRadius:4, cursor:'pointer', border:'1px solid',
                  borderColor: filterMonthData===v ? '#3b82f6' : '#e2e8f0',
                  background: filterMonthData===v ? '#eff6ff' : '#f8fafc',
                  color: filterMonthData===v ? '#1d4ed8' : '#64748b', fontWeight: filterMonthData===v ? 700 : 400 }}>
                {v==='month' ? '해당월 방문급여제공있는 수급자' : '전체'}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', gap:4 }}>
            <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
              style={{ flex:1, fontSize:10, padding:'3px 4px', border:'1px solid #e2e8f0', borderRadius:4, outline:'none', color:'#334155', background:'#fff' }}>
              <option value="all">등급 전체</option>
              {[1,2,3,4,5].map(n => <option key={n} value={String(n)}>{n}등급</option>)}
              <option value="in">인지지원</option>
            </select>
            <select value={filterService} onChange={e => setFilterService(e.target.value)}
              style={{ flex:1, fontSize:10, padding:'3px 4px', border:'1px solid #e2e8f0', borderRadius:4, outline:'none', color:'#334155', background:'#fff' }}>
              <option value="all">급여유형 전체</option>
              {(['visit_care','visit_bath','visit_nursing','day_care'] as const).map(k => <option key={k} value={k}>{SERVICE_LABELS[k]}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', gap:4 }}>
            <select value={filterGroup} onChange={e => { setFilterGroup(e.target.value); setFilterSubGroup('all'); }}
              style={{ flex:1, fontSize:10, padding:'3px 4px', border:'1px solid #e2e8f0', borderRadius:4, outline:'none', color:'#334155', background:'#fff' }}>
              {RECIP_GROUPS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
            {curGroupObj.subs.length > 0 && (
              <select value={filterSubGroup} onChange={e => setFilterSubGroup(e.target.value)}
                style={{ flex:1, fontSize:10, padding:'3px 4px', border:'1px solid #dbeafe', borderRadius:4, outline:'none', color:'#1e40af', background:'#eff6ff' }}>
                <option value="all">전체</option>
                {curGroupObj.subs.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:10, color:'#94a3b8' }}>상담직원</span>
            <div style={{ display:'flex', gap:2 }}>
              {(['all', 'active'] as const).map(v => (
                <button key={v} onClick={() => { setFilterSwStatus(v); setFilterSw('all'); }}
                  style={{ fontSize:9, padding:'2px 7px', borderRadius:3, cursor:'pointer', border:'1px solid',
                    borderColor: filterSwStatus === v ? '#3b82f6' : '#e2e8f0',
                    background: filterSwStatus === v ? '#eff6ff' : '#f8fafc',
                    color: filterSwStatus === v ? '#1d4ed8' : '#64748b',
                    fontWeight: filterSwStatus === v ? 700 : 400 }}>
                  {v === 'all' ? '전체' : '근무중'}
                </button>
              ))}
            </div>
          </div>
          <select value={filterSw} onChange={e => setFilterSw(e.target.value)}
            style={{ width:'100%', fontSize:10, padding:'3px 4px', border:'1px solid #e2e8f0', borderRadius:4, outline:'none', color:'#334155', background:'#fff' }}>
            <option value="all">전체</option>
            {socialWorkers
              .filter(s => filterSwStatus === 'all' || s.status === 'active')
              .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* 수급자 목록 */}
        <div style={{ flex:1, overflowY:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11, tableLayout:'fixed' }}>
            <colgroup>
              <col style={{ width:18 }} /><col style={{ width:72 }} /><col style={{ width:28 }} />
              <col style={{ width:30 }} /><col style={{ width:26 }} /><col style={{ width:26 }} /><col style={{ width:26 }} /><col style={{ width:30 }} />
            </colgroup>
            <thead>
              <tr>
                {['#','이름','등급','예정','완료','불가','작성','미작성'].map((h,i) => (
                  <th key={i} style={{ position:'sticky', top:0, zIndex:2, background:'#152e50', color:'rgba(255,255,255,0.88)', fontWeight:600, height:26, textAlign:'center', borderRight:i<7?'1px solid rgba(255,255,255,0.1)':'none', padding:'0 2px', whiteSpace:'nowrap', fontSize:10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRecips.map((r, idx) => {
                const isSel = r.id === selectedRecipId;
                const gc = GRADE_COLOR[getGradeNum(r)] ?? { bg:'#f1f5f9', c:'#64748b' };
                const mv = consultationVisits.filter(v => v.recipientId === r.id && v.date.startsWith(monthPfx));
                const planned   = mv.filter(v => v.consultStatus === 'planned').length;
                const completed = mv.filter(v => v.consultStatus === 'completed').length;
                const unable    = mv.filter(v => v.consultStatus === 'unable').length;
                const entries   = store[r.id] ?? [];
                const written   = entries.filter(e => (e.visitDate ?? e.date).startsWith(monthPfx) && e.status === 'completed').length;
                const unwritten = Math.max(0, completed - written);
                const rowBg = isSel ? '#eff6ff' : idx%2===0 ? '#ffffff' : '#f4f7fb';
                const tdS = { height:30, padding:'0 3px', textAlign:'center' as const, borderBottom:'1px solid #e4eaf3', borderRight:'1px solid rgba(21,46,80,0.08)', background:rowBg, verticalAlign:'middle' as const };
                const numCell = (n: number, color: string) => n > 0
                  ? <span style={{ fontSize:11, fontWeight:700, color }}>{n}</span>
                  : <span style={{ fontSize:10, color:'#cbd5e1' }}>-</span>;
                return (
                  <tr key={r.id} onClick={() => handleSelectRecip(r.id)} style={{ cursor:'pointer', borderLeft:`3px solid ${isSel?'#2563eb':'transparent'}` }}>
                    <td style={{ ...tdS, color:'#94a3b8', fontSize:10 }}>{idx+1}</td>
                    <td style={{ ...tdS, textAlign:'left', fontWeight:isSel?700:500, color:isSel?'#1e40af':'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12 }}>{r.name}</td>
                    <td style={{ ...tdS }}>
                      <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'1px 3px', borderRadius:3, background:gc.bg, color:gc.c, fontSize:10, fontWeight:700, border:`1px solid ${gc.c}40`, whiteSpace:'nowrap' }}>
                        {(() => { const n = getGradeNum(r); return (n >= 1 && n <= 5) ? n : '인'; })()}
                      </span>
                    </td>
                    <td style={{ ...tdS }}>{numCell(planned, '#2563eb')}</td>
                    <td style={{ ...tdS }}>{numCell(completed, '#059669')}</td>
                    <td style={{ ...tdS }}>{numCell(unable, '#be123c')}</td>
                    <td style={{ ...tdS }}>{numCell(written, '#059669')}</td>
                    <td style={{ ...tdS, borderRight:'none' }}>{numCell(unwritten, '#dc2626')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      {!sel ? (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
          <div style={{ width:64, height:64, borderRadius:16, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ClipboardList size={32} color="#cbd5e1" />
          </div>
          <div style={{ fontSize:15, fontWeight:600, color:'#64748b' }}>수급자를 선택하세요</div>
          <div style={{ fontSize:12, color:'#94a3b8' }}>목록에서 수급자를 클릭하면 방문상담일지를 관리할 수 있습니다</div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
            <FileText size={13} color="#94a3b8" />
            <span style={{ fontSize:12, color:'#94a3b8' }}>방문상담일지</span>
          </div>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* ── 수급자 정보 바 ── */}
          {(() => {
            const mv = consultationVisits.filter(v => v.recipientId === sel.id && v.date.startsWith(monthPfx));
            const mPlanned   = mv.filter(v => v.consultStatus === 'planned').length;
            const mCompleted = mv.filter(v => v.consultStatus === 'completed').length;
            const mEntries   = selEntries.filter(e => (e.visitDate ?? e.date).startsWith(monthPfx));
            const mWritten   = mEntries.filter(e => e.status === 'completed').length;
            const mUnwritten = Math.max(0, mCompleted - mWritten);
            return (
              <div style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'8px 16px', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
                <div style={{ width:34, height:34, borderRadius:8, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <User size={18} color="#2563eb" />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                    <span style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>{sel.name}</span>
                    <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:(GRADE_COLOR[getGradeNum(sel)]??{bg:'#f1f5f9'}).bg, color:(GRADE_COLOR[getGradeNum(sel)]??{c:'#64748b'}).c, fontWeight:700 }}>{getGradeText(sel)}</span>
                    <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0', fontWeight:600 }}>{getReduction(sel)}</span>
                    {getServiceTypes(sel).map(st => (
                      <span key={st} style={{ fontSize:11, padding:'2px 7px', borderRadius:8, background:'#eff6ff', color:'#3b82f6', border:'1px solid #bfdbfe' }}>{SERVICE_LABELS[st]}</span>
                    ))}
                  </div>
                  <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>
                    {getCertNo(sel)} · {getValidFrom(sel) ?? ''}~{getValidTo(sel) ?? ''}
                  </div>
                </div>
                {/* 월별 일지 현황 */}
                <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
                  <span style={{ fontSize:10, color:'#94a3b8', marginRight:2 }}>{year}.{pad2(month)}</span>
                  {[
                    { label:'상담예정', val:mPlanned,   color:'#2563eb' },
                    { label:'완료',     val:mCompleted, color:'#059669' },
                    { label:'작성',     val:mWritten,   color:'#059669' },
                    { label:'미작성',   val:mUnwritten, color:'#dc2626' },
                  ].map((item, i) => (
                    <React.Fragment key={item.label}>
                      {i > 0 && <div style={{ width:1, height:28, background:'#e2e8f0' }} />}
                      <div style={{ textAlign:'center', minWidth:32 }}>
                        <div style={{ fontSize:16, fontWeight:700, color:item.val>0?item.color:'#94a3b8' }}>{item.val}</div>
                        <div style={{ fontSize:9, color:'#94a3b8' }}>{item.label}</div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          })()}


          {/* ── 상담일정 선택 피커 ── */}
          {showVisitPicker && sel && (() => {
            const monthVisits = consultationVisits
              .filter(v => v.recipientId === sel.id && v.date.startsWith(monthPfx))
              .sort((a, b) => a.date.localeCompare(b.date));
            return (
              <div style={{ flex:1, overflowY:'auto', padding:20, background:'#f0f4f8', display:'flex', flexDirection:'column', gap:12 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>상담일정 선택</div>
                  <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{year}년 {month}월 · {sel.name} · 일지를 작성할 상담일정을 선택하세요</div>
                </div>

                {monthVisits.length === 0 ? (
                  <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, padding:40 }}>
                    <div style={{ width:48, height:48, borderRadius:12, background:'#fff', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <FileText size={24} color="#cbd5e1" />
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#64748b' }}>상담일정(예정/완료/불가)이 없습니다</div>
                    <div style={{ fontSize:11, color:'#94a3b8', textAlign:'center', lineHeight:1.6 }}>방문상담 일정관리에서 먼저 일정 등록을 해야<br/>업무수행일지 작성이 가능합니다</div>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {monthVisits.map(v => {
                      const hasJournal = (store[sel.id] ?? []).some(e => e.id === v.id);
                      const existEntry = (store[sel.id] ?? []).find(e => e.id === v.id);
                      const isComp = v.consultStatus === 'completed';
                      const sw = socialWorkers.find(s => s.id === v.socialWorkerId);
                      const dayOfWeek = ['일','월','화','수','목','금','토'][new Date(v.date).getDay()];
                      return (
                        <div key={v.id} style={{ background:'#fff', border:`1.5px solid ${hasJournal ? '#e2e8f0' : '#bfdbfe'}`, borderRadius:10, padding:'14px 16px', display:'flex', alignItems:'center', gap:14, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                          {/* 날짜 */}
                          <div style={{ flexShrink:0, textAlign:'center', width:52, background: isComp ? '#f0fdf4' : '#eff6ff', borderRadius:8, padding:'8px 0' }}>
                            <div style={{ fontSize:18, fontWeight:800, color: isComp ? '#059669' : '#2563eb', lineHeight:1 }}>{v.date.slice(8)}</div>
                            <div style={{ fontSize:10, color: isComp ? '#6ee7b7' : '#93c5fd', marginTop:2 }}>{v.date.slice(5,7)}월 {dayOfWeek}요일</div>
                          </div>
                          {/* 정보 */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                              <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, fontWeight:700,
                                background: isComp ? '#d1fae5' : '#dbeafe',
                                color: isComp ? '#059669' : '#2563eb',
                                border: `1px solid ${isComp ? '#6ee7b7' : '#93c5fd'}` }}>
                                {isComp ? '완료' : '예정'}
                              </span>
                              {hasJournal && (
                                <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, fontWeight:700, background:'#d1fae5', color:'#059669', border:'1px solid #6ee7b7' }}>
                                  일지 작성완료
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize:13, color:'#64748b' }}>
                              담당: <span style={{ fontWeight:600, color:'#374151' }}>{sw?.name ?? '-'}</span>
                              {v.plannedStartTime && <span style={{ marginLeft:10 }}>예정: {v.plannedStartTime}{v.plannedEndTime ? ` ~ ${v.plannedEndTime}` : ''}</span>}
                            </div>
                          </div>
                          {/* 버튼 */}
                          <button
                            onClick={() => hasJournal && existEntry ? handleSelectEntry(existEntry) : handlePickVisit(v)}
                            style={{ flexShrink:0, padding:'7px 16px', borderRadius:7, cursor:'pointer', fontSize:12, fontWeight:700,
                              background: hasJournal ? '#f0fdf4' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                              color: hasJournal ? '#059669' : '#fff',
                              border: hasJournal ? '1px solid #6ee7b7' : 'none' }}>
                            {hasJournal ? '수정하기' : '작성하기'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── 폼 영역 ── */}
          {!showVisitPicker && (selectedEntryId || isNewEntry) ? (
            <div style={{ flex:1, overflowY:'auto', padding:14, background:'#f0f4f8' }}>
              <div style={{ maxWidth:800, display:'flex', flexDirection:'column', gap:10 }}>

                {/* 작성자·작성일·저장 행 */}
                <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'center', gap:14, flexShrink:0, flexWrap:'wrap' }}>
                  <button
                    onClick={() => {
                      if (isDirty && !window.confirm('저장되지 않은 변경사항이 있습니다. 돌아가시겠습니까?')) return;
                      setShowVisitPicker(true); setSelectedEntryId(null); setIsNewEntry(false); setIsDirty(false);
                    }}
                    style={{ fontSize:11, padding:'4px 10px', borderRadius:6, cursor:'pointer', background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0', fontWeight:600 }}>
                    ← 돌아가기
                  </button>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:11, color:'#64748b' }}>작성일</span>
                    <input
                      type="date"
                      value={entryDate}
                      onChange={e => { setEntryDate(e.target.value); setIsDirty(true); }}
                      style={{ fontSize:12, border:'1px solid #d1d5db', background:'#f9fbff', color:'#1e293b', outline:'none', padding:'3px 6px', borderRadius:3, width:130 }}
                    />
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:11, color:'#64748b' }}>상담직원</span>
                    <select
                      value={author}
                      onChange={e => { setAuthor(e.target.value); setIsDirty(true); }}
                      style={{ fontSize:12, border:'1px solid #d1d5db', background:'#f9fbff', color:'#1e293b', outline:'none', padding:'3px 6px', borderRadius:3, width:90 }}
                    >
                      {SW_NAMES.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div style={{ flex:1 }} />
                  {isDirty && (
                    <span style={{ fontSize:11, color:'#f97316', display:'flex', alignItems:'center', gap:4 }}>
                      <AlertTriangle size={11} /> 미저장 변경사항 있음
                    </span>
                  )}
                  <button
                    onClick={() => handleSave('completed')}
                    style={{
                      display:'flex', alignItems:'center', gap:6,
                      background: isDirty ? '#2563eb' : '#f1f5f9',
                      color: isDirty ? '#fff' : '#94a3b8',
                      border:'none', borderRadius:6, padding:'6px 16px', fontSize:12, fontWeight:700,
                      cursor: isDirty ? 'pointer' : 'default', transition:'background 0.15s, color 0.15s',
                    }}
                  >
                    <Save size={13} />
                    {isNewEntry ? '저장' : '저장'}
                  </button>
                </div>

                {/* 일지 본문 (inline) */}
                <JournalFormBody
                  data={formData}
                  setData={handleSetFormData}
                  recipientId={sel.id}
                  visitDate={selEntry?.visitDate ?? entryDate}
                  writtenAt={selEntry?.date}
                />

              </div>
            </div>
          ) : !showVisitPicker ? (
            /* 수급자 선택됐지만 일지 미선택 상태 */
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10, background:'#f0f4f8' }}>
              <div style={{ width:52, height:52, borderRadius:12, background:'#fff', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <FileText size={26} color="#cbd5e1" />
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:'#64748b' }}>상담일정(예정/완료/불가)이 없습니다</div>
              <div style={{ fontSize:11, color:'#94a3b8', textAlign:'center', lineHeight:1.6 }}>방문상담 일정관리에서 먼저 일정 등록을 해야<br/>업무수행일지 작성이 가능합니다</div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}