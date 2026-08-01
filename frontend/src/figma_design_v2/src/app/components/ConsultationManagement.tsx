import { useState, useRef, useEffect } from 'react';
import React from 'react';

function AutoTA({ value, onChange, style, minRows = 2 }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  style?: React.CSSProperties;
  minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  });
  return (
    <textarea ref={ref} value={value} rows={minRows}
      onChange={e => { onChange(e); const el = ref.current; if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
      style={{ ...style, overflow:'hidden', resize:'none' }}/>
  );
}
import type { CSSProperties, MouseEvent } from 'react';
import {
  ChevronLeft, ChevronRight, X, User, Phone, Search,
  CheckCircle2, Clock, FileText, MapPin, CalendarCheck, BookOpen, Pencil,
} from 'lucide-react';
import {
  socialWorkers, consultationVisits as initialVisits, recipients,
  getSchedulesForRecipient, SERVICE_LABELS, POSITION_CODES,
  getGradeText, getGradeNum, getReduction, getMobile, getGuardians,
  getCareWorker, getRecipient, getServiceTypes, RECIP_GROUPS,
} from './mockData';
import type { ConsultationVisit, ConsultStatus, ScheduleEntry } from './mockData';
import type { Journal as JournalNew, JournalStatus } from './JournalModal';
import { JournalFormBody } from './JournalModal';
import { RecipientJournalTab } from './RecipientJournalTab';

// ── 오늘 ─────────────────────────────────────────────────────────────────────
const TODAY = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();

// ── 등급별 색상 ───────────────────────────────────────────────────────────────
const GRADE_COLOR: Record<number, { bg: string; c: string }> = {
  1: { bg: '#fef2f2', c: '#dc2626' },
  2: { bg: '#fff7ed', c: '#ea580c' },
  3: { bg: '#fffbeb', c: '#d97706' },
  4: { bg: '#f0fdf4', c: '#16a34a' },
  5: { bg: '#eff6ff', c: '#2563eb' },
};

// ── 상담여부 ──────────────────────────────────────────────────────────────────
const CSTATUS: Record<ConsultStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  planned:   { label: '상담예정', bg: '#eff6ff', text: '#2563eb', border: '#93c5fd', dot: '#3b82f6' },
  completed: { label: '상담완료', bg: '#f0fdf4', text: '#059669', border: '#6ee7b7', dot: '#10b981' },
  unable:    { label: '방문불가', bg: '#fff1f2', text: '#be123c', border: '#fda4af', dot: '#f43f5e' },
};

// ── 서비스 일정 배경 색상 ─────────────────────────────────────────────────────
const SVC_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  visit_care:    { bg: 'rgba(219,234,254,0.55)', text: 'rgba(30,64,175,0.65)',  border: 'rgba(147,197,253,0.7)' },
  visit_bath:    { bg: 'rgba(209,250,229,0.55)', text: 'rgba(6,95,70,0.65)',    border: 'rgba(110,231,183,0.7)' },
  visit_nursing: { bg: 'rgba(255,247,237,0.55)', text: 'rgba(194,65,12,0.65)', border: 'rgba(253,186,116,0.7)' },
  day_care:      { bg: 'rgba(237,233,254,0.55)', text: 'rgba(91,33,182,0.65)', border: 'rgba(196,181,253,0.7)' },
  family_care:   { bg: 'rgba(224,242,254,0.55)', text: 'rgba(3,105,161,0.65)', border: 'rgba(125,211,252,0.7)' },
};

const DOW = ['일', '월', '화', '수', '목', '금', '토'];

function pad2(n: number) { return String(n).padStart(2, '0'); }
function dateStr(y: number, m: number, d: number) { return `${y}-${pad2(m)}-${pad2(d)}`; }

function addMin(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${pad2(Math.floor(total / 60) % 24)}:${pad2(total % 60)}`;
}

function calendarWeeks(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month - 1, 1).getDay();
  const days  = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(first).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// ── 인터페이스 ────────────────────────────────────────────────────────────────
interface VisitPopover  { visit: ConsultationVisit; x: number; y: number }
interface AddFormPopover { x: number; y: number; date: string }
interface JournalOverlayInfo {
  visitId: string;
  recipientId: string;
  socialWorkerId: string;
  date: string;
}

interface AddForm {
  consultStatus: ConsultStatus;
  plannedStartTime: string;
  plannedEndTime: string;
  actualStartTime: string;
  actualEndTime: string;
  notes: string;
}

const DEFAULT_FORM: AddForm = {
  consultStatus: 'planned',
  plannedStartTime: '10:00', plannedEndTime: '11:00',
  actualStartTime: '',       actualEndTime: '',
  notes: '',
};

// ── 업무수행일지 (새 구조) ─────────────────────────────────────────────────────
const INIT_JOURNALS: Record<string, JournalNew> = {
  'CV-SW1-R001-0204': { data: { j_s6_consult: '수급자 건강상태 양호. 방문요양 서비스 주5일 이용에 대한 만족도 확인. 보호자와 소통 원활.' }, status: 'completed', writtenAt: '2026-02-05' },
  'CV-SW1-R002-0204': { data: { j_s6_consult: '수급자 및 보호자 희망에 따라 방문요양 주5일→주4일 조정 요청 접수. 급여변경 신청서 작성.' }, status: 'completed', writtenAt: '2026-02-05' },
  'CV-SW1-R007-0210': { data: { j_s6_consult: '수급자 가족으로부터 청구 오류 민원 접수. 중복 청구 1건 확인 및 정정 처리 완료.' }, status: 'completed', writtenAt: '2026-02-11' },
  'CV-SW2-R025-0210': { data: { j_s6_consult: '수급자 현황 실태조사 실시. 주거 환경, 건강 상태, 서비스 이용 현황 확인.' }, status: 'completed', writtenAt: '2026-02-11' },
  'CV-SW2-R034-0224': { data: { j_s6_consult: '중증 치매 수급자 방문. 보호자(딸)와 함께 현황 확인. 방문요양 주5일 서비스 지속 필요.' }, status: 'completed', writtenAt: '2026-02-25' },
  'CV-SW3-R044-0211': { data: { j_s6_consult: '인정 유효기간 만료에 따른 종결 처리 진행. 갱신 의사 없음 확인.' }, status: 'completed', writtenAt: '2026-02-12' },
  'CV-SW1-R001-0402': { data: { j_s6_consult: '4월 정기 방문 완료. 수급자 건강 양호. 서비스 만족도 지속 높음.' }, status: 'draft', writtenAt: '2026-04-02' },
  'CV-SW1-R011-0413': { data: { j_s6_consult: '방문요양 급여 재계약 관련 상담 진행. 수급자 및 보호자와 서비스 지속 의사 확인.' }, status: 'draft', writtenAt: '2026-04-13' },
  'CV-SW2-R027-0413': { data: { j_s6_consult: '4월 정기 방문. 서비스 이용 현황 및 만족도 확인.' }, status: 'draft', writtenAt: '2026-04-13' },
};

const MOCK_GROUPS = RECIP_GROUPS;
const ALL_SW = '__ALL__';

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
export function ConsultationManagement() {
  const [activeMainTab, setActiveMainTab]         = useState<'schedule' | 'journal'>('schedule');
  const [selectedSwId, setSelectedSwId]           = useState(socialWorkers[0].id);
  const [swStatusFilter, setSwStatusFilter]       = useState<'all' | 'active'>('all');
  const [selectedGroup,    setSelectedGroup]      = useState('all');
  const [selectedSubGroup, setSelectedSubGroup]   = useState('all');
  const [year, setYear]                           = useState(2026);
  const [month, setMonth]                         = useState(4);
  const [visits, setVisits]                       = useState<ConsultationVisit[]>(initialVisits);
  const [popover, setPopover]                     = useState<VisitPopover | null>(null);
  const [addPopover, setAddPopover]               = useState<AddFormPopover | null>(null);
  const [schedulingRecipId, setSchedulingRecipId] = useState<string | null>(null);
  const [form, setForm]                           = useState<AddForm>(DEFAULT_FORM);
  const [journals, setJournals]                   = useState<Record<string, JournalNew>>(INIT_JOURNALS);
  const [journalRecipId, setJournalRecipId]       = useState<string | null>(null);
  const [highlightRecipId, setHighlightRecipId]   = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [highlightVisitId, setHighlightVisitId]   = useState<string | null>(null);
  const highlightVisitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [journalOverlay, setJournalOverlay]       = useState<JournalOverlayInfo | null>(null);
  const [overlayFormData, setOverlayFormData]     = useState<Record<string, any>>({});
  const [overlayStatus, setOverlayStatus]         = useState<JournalStatus>('draft');
  const [overlayDirty, setOverlayDirty]           = useState(false);
  const [schedPopup, setSchedPopup]               = useState<{ recipId: string; year: number; month: number } | null>(null);
  const [showRecipPopup, setShowRecipPopup]       = useState(false);
  const [slideSearch, setSlideSearch]             = useState('');
  const [slideGrade, setSlideGrade]               = useState<string>('all');
  const [slideService, setSlideService]           = useState<string>('all');
  const [slideRecipStatus, setSlideRecipStatus]   = useState<'active' | 'all'>('all');
  const [slideMonthFilter, setSlideMonthFilter]   = useState<'month' | 'all'>('month');

  function handleRowHighlight(recipId: string) {
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    setHighlightRecipId(recipId);
    highlightTimer.current = setTimeout(() => setHighlightRecipId(null), 3000);
  }

  function flashVisit(id: string) {
    if (highlightVisitTimer.current) clearTimeout(highlightVisitTimer.current);
    setHighlightVisitId(id);
    highlightVisitTimer.current = setTimeout(() => setHighlightVisitId(null), 3000);
  }

  // 수급자 목록 — 전체 수급자 기준 (그룹 필터는 UI 전용, 실제 데이터 연동 전)
  const curGroupObj = MOCK_GROUPS.find(g => g.id === selectedGroup) ?? MOCK_GROUPS[0];
  const mm          = pad2(month);
  const monthPfx    = `${year}-${mm}`;
  const swRecs = [...recipients]
    .filter(r => slideRecipStatus === 'all' || r.status === 'active')
    .filter(r => !slideSearch || r.name.includes(slideSearch))
    .filter(r => slideGrade === 'all' || String(getGradeNum(r)) === slideGrade || (slideGrade === 'in' && getGradeNum(r) > 5))
    .filter(r => slideService === 'all' || getServiceTypes(r).includes(slideService as any))
    .filter(r => {
      if (slideMonthFilter === 'all') return true;
      const scheds = getSchedulesForRecipient(r.id, year, month);
      return scheds.some(s => ['visit_care','family_care','full_day_visit','visit_bath','visit_nursing'].includes(s.serviceType));
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  const isAllSwMode = selectedSwId === ALL_SW;
  const monthVisits = isAllSwMode
    ? visits.filter(v => v.date.startsWith(monthPfx))
    : visits.filter(v => v.socialWorkerId === selectedSwId && v.date.startsWith(monthPfx));
  const completedCount = monthVisits.filter(v => v.consultStatus === 'completed').length;
  const plannedCount   = monthVisits.filter(v => v.consultStatus === 'planned').length;
  const unableCount    = monthVisits.filter(v => v.consultStatus === 'unable').length;
  const schedulingRec  = schedulingRecipId ? recipients.find(r => r.id === schedulingRecipId) : null;
  const completedVisits       = monthVisits.filter(v => v.consultStatus === 'completed');
  const journalWrittenCount = completedVisits.filter(v => !!journals[v.id]).length;
  const journalNoneCount   = completedVisits.filter(v => !journals[v.id]).length;

  // 기관 전체 집계 (해당월, 전체 직원)
  const allMonthVisits     = visits.filter(v => v.date.startsWith(monthPfx));
  const totalCompleted     = allMonthVisits.filter(v => v.consultStatus === 'completed').length;
  const totalPlanned       = allMonthVisits.filter(v => v.consultStatus === 'planned').length;
  const totalUnable        = allMonthVisits.filter(v => v.consultStatus === 'unable').length;
  const totalCompVisits    = allMonthVisits.filter(v => v.consultStatus === 'completed');
  const totalJrnlWritten   = totalCompVisits.filter(v => !!journals[v.id]).length;
  const totalJrnlNone      = totalCompVisits.filter(v => !journals[v.id]).length;

  // ESC 키로 일정등록 모드 종료
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSchedulingRecipId(null);
        setAddPopover(null);
        setPopover(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1);
  }
  function closeAll() { setPopover(null); setAddPopover(null); }

  function openAddForm(e: MouseEvent, ds: string) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pw = 460, ph = 370;
    const vw = window.innerWidth, vh = window.innerHeight;
    let x = rect.right + 6, y = rect.top;
    if (x + pw > vw - 8) x = rect.left - pw - 6;
    if (y + ph > vh - 8) y = vh - ph - 8;
    if (y < 8) y = 8;
    setPopover(null);
    const scheds = schedulingRecipId
      ? getSchedulesForRecipient(schedulingRecipId, year, month)
          .filter(s => s.date === ds).sort((a, b) => a.startTime.localeCompare(b.startTime))
      : [];
    const baseTime = scheds.length > 0 ? addMin(scheds[0].startTime, 30) : '10:00';
    const isFuture = ds > TODAY;
    setAddPopover({ x, y, date: ds });
    setForm({
      ...DEFAULT_FORM,
      consultStatus: isFuture ? 'planned' : 'completed',
      plannedStartTime: isFuture ? baseTime : '',
      plannedEndTime:   isFuture ? addMin(baseTime, 30) : '',
      actualStartTime:  isFuture ? '' : baseTime,
      actualEndTime:    isFuture ? '' : addMin(baseTime, 30),
    });
  }

  function openVisitPopover(e: MouseEvent, visit: ConsultationVisit) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pw = 440, ph = 360;
    const vw = window.innerWidth, vh = window.innerHeight;
    let x = rect.right + 6, y = rect.top;
    if (x + pw > vw - 8) x = rect.left - pw - 6;
    if (y + ph > vh - 8) y = vh - ph - 8;
    if (y < 8) y = 8;
    setAddPopover(null);
    setPopover({ visit, x, y });
  }

  function goToJournalTab(e: React.MouseEvent | MouseEvent, recipientId?: string) {
    e.stopPropagation();
    closeAll();
    if (recipientId) setJournalRecipId(recipientId);
    setActiveMainTab('journal');
  }

  function openJournalOverlay(e: React.MouseEvent, visit: ConsultationVisit) {
    e.stopPropagation();
    closeAll();
    const existing = journals[visit.id];
    const baseData = existing
      ? { ...existing.data, j_workDate: visit.date }
      : { j_workDate: visit.date };
    setOverlayFormData(baseData);
    setOverlayStatus(existing?.status ?? 'draft');
    setOverlayDirty(false);
    setJournalOverlay({
      visitId: visit.id,
      recipientId: visit.recipientId,
      socialWorkerId: visit.socialWorkerId,
      date: visit.date,
    });
  }

  function handleOverlaySave(status: JournalStatus) {
    if (!journalOverlay) return;
    const now = new Date();
    const writtenAt = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    setJournals(prev => ({
      ...prev,
      [journalOverlay.visitId]: { data: { ...overlayFormData }, status, writtenAt },
    }));
    setOverlayStatus(status);
    setOverlayDirty(false);
    if (status === 'completed') setJournalOverlay(null);
  }

  function handleOverlayClose() {
    if (overlayDirty && !window.confirm('저장되지 않은 변경사항이 있습니다. 닫으시겠습니까?')) return;
    setJournalOverlay(null);
    setOverlayDirty(false);
  }

  const handleOverlaySetFormData: React.Dispatch<React.SetStateAction<Record<string, any>>> = (action) => {
    setOverlayFormData(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      setOverlayDirty(true);
      return next;
    });
  };

  function handleAdd() {
    if (!schedulingRecipId || !addPopover) return;
    const v: ConsultationVisit = {
      id: `CV-NEW-${Date.now()}`,
      socialWorkerId: selectedSwId,
      recipientId: schedulingRecipId,
      date: addPopover.date,
      consultStatus: form.consultStatus === 'unable' ? 'unable' : (form.actualStartTime && form.actualEndTime) ? 'completed' : 'planned',
      plannedStartTime: form.plannedStartTime,
      plannedEndTime: form.plannedEndTime || undefined,
      actualStartTime: form.actualStartTime || undefined,
      actualEndTime: form.actualEndTime || undefined,
      notes: form.notes || undefined,
    };
    setVisits(prev => [...prev, v]);
    setAddPopover(null);
    setSchedulingRecipId(null);
    flashVisit(v.id);
  }

  function handleDelete(id: string) {
    setVisits(prev => prev.filter(v => v.id !== id));
    setPopover(null);
  }

  // 상담여부 변경 (팝오버 내에서)
  function handleToggleStatus(id: string) {
    setVisits(prev => prev.map(v =>
      v.id === id
        ? { ...v, consultStatus: v.consultStatus === 'planned' ? 'completed' : 'planned',
            actualStartTime: v.consultStatus === 'planned' ? (v.plannedStartTime) : undefined,
            actualEndTime:   v.consultStatus === 'planned' ? (v.plannedEndTime) : undefined }
        : v
    ));
    setPopover(null);
  }

  // 상담 수정 저장
  function handleUpdate(id: string, form: EditForm) {
    setVisits(prev => prev.map(v =>
      v.id === id
        ? {
            ...v,
            consultStatus: form.consultStatus,
            plannedStartTime: form.plannedStartTime,
            plannedEndTime: form.plannedEndTime || undefined,
            actualStartTime: form.actualStartTime || undefined,
            actualEndTime: form.actualEndTime || undefined,
            notes: form.notes || undefined,
          }
        : v
    ));
    // 팝오버의 visit 정보도 갱신
    setPopover(prev => {
      if (!prev || prev.visit.id !== id) return prev;
      return {
        ...prev,
        visit: {
          ...prev.visit,
          consultStatus: form.consultStatus,
          plannedStartTime: form.plannedStartTime,
          plannedEndTime: form.plannedEndTime || undefined,
          actualStartTime: form.actualStartTime || undefined,
          actualEndTime: form.actualEndTime || undefined,
          notes: form.notes || undefined,
        },
      };
    });
  }

  const weeks = calendarWeeks(year, month);

  function recipientMonthVisit(recipId: string) {
    return monthVisits.find(v => v.recipientId === recipId);
  }
  function recipientMonthVisitsSorted(recipId: string) {
    return monthVisits
      .filter(v => v.recipientId === recipId)
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  function recipientMonthCounts(recipId: string) {
    const rvs = monthVisits.filter(v => v.recipientId === recipId);
    return {
      total: rvs.length,
      completed: rvs.filter(v => v.consultStatus === 'completed').length,
      planned:   rvs.filter(v => v.consultStatus === 'planned').length,
    };
  }
  function dayVisits(day: number): ConsultationVisit[] {
    const ds = dateStr(year, month, day);
    return monthVisits.filter(v => v.date === ds).sort((a, b) => a.plannedStartTime.localeCompare(b.plannedStartTime));
  }
  function dayServiceSchedules(day: number): ScheduleEntry[] {
    if (!schedulingRecipId) return [];
    const ds = dateStr(year, month, day);
    return getSchedulesForRecipient(schedulingRecipId, year, month).filter(s => s.date === ds);
  }

  const inSchedulingMode = !!schedulingRecipId && !isAllSwMode;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#f0f4f8' }}>

      {/* ── 상단 탭 바 ── */}
      <div style={{ flexShrink:0, background:'#fff', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', paddingLeft:8 }}>
        {([
          { key: 'schedule', label: '방문상담 일정관리' },
          { key: 'journal',  label: '방문급여 업무수행일지' },
        ] as { key: 'schedule' | 'journal'; label: string }[]).map(tab => {
          const isAct = activeMainTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveMainTab(tab.key)} style={{
              padding:'0 20px', height:42, fontSize:12,
              fontWeight: isAct ? 700 : 400,
              color: isAct ? '#1e40af' : '#64748b',
              background:'none', borderWidth:0,
              boxShadow: isAct ? 'inset 0 -2px 0 #2563eb' : 'none',
              cursor:'pointer', whiteSpace:'nowrap',
            }}>{tab.label}</button>
          );
        })}
      </div>

      {/* ── 수급자 일지관리 탭 ── */}
      {activeMainTab === 'journal' && (
        <div style={{ flex:1, overflow:'hidden' }}>
          <RecipientJournalTab initialRecipId={journalRecipId ?? undefined} />
        </div>
      )}

      {/* ── 상담 일정관리 탭 ── */}
      {activeMainTab === 'schedule' && (
      <div style={{ flex:1, display: 'flex', overflow: 'hidden' }}>

      {(popover || addPopover) && (
        <div onClick={closeAll} style={{ position: 'fixed', inset: 0, zIndex: 300 }} />
      )}

      {/* ── 좌측 패널 ────────────────────────────────────────────────────── */}
      <div style={{
        width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: '#ffffff', borderRight: '1px solid #e2e8f0', overflow: 'hidden',
        position: 'relative',
      }}>
        {/* 기관 전체 통계 */}
        <div style={{ flexShrink:0, padding:'7px 10px 6px', borderBottom:'1px solid #e2e8f0', background:'#f8fafc' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#64748b', marginBottom:5 }}>기관전체 ({year}.{pad2(month)})</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {/* 그룹1: 상담 현황 */}
            <div style={{ display:'flex', gap:3, alignItems:'center' }}>
              <span style={{ fontSize:9, color:'#94a3b8', flexShrink:0 }}>상담</span>
              {[
                { label:'완료', count:totalCompleted, bg:'#d1fae5', color:'#059669', border:'#6ee7b7' },
                { label:'예정', count:totalPlanned,   bg:'#dbeafe', color:'#1d4ed8', border:'#93c5fd' },
                { label:'불가', count:totalUnable,    bg:'#fff1f2', color:'#be123c', border:'#fda4af' },
              ].map(item => (
                <span key={item.label} style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:11, padding:'2px 7px', borderRadius:10, background:item.bg, color:item.color, border:`1px solid ${item.border}`, fontWeight:700 }}>
                  <span style={{ fontSize:12, fontWeight:800 }}>{item.count}</span>{item.label}
                </span>
              ))}
            </div>
            {/* 그룹2: 업무일지 현황 */}
            <div style={{ display:'flex', gap:3, alignItems:'center' }}>
              <span style={{ fontSize:9, color:'#94a3b8', flexShrink:0 }}>일지</span>
              {[
                { label:'작성',   count:totalJrnlWritten, bg:'#d1fae5', color:'#059669', border:'#6ee7b7' },
                { label:'미작성', count:totalJrnlNone,    bg:'#f1f5f9', color:'#64748b', border:'#e2e8f0' },
              ].map(item => (
                <span key={item.label} style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:11, padding:'2px 7px', borderRadius:10, background:item.bg, color:item.color, border:`1px solid ${item.border}`, fontWeight:700 }}>
                  <span style={{ fontSize:12, fontWeight:800 }}>{item.count}</span>{item.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ flexShrink: 0, padding: '8px 10px 6px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em' }}>상담직원</span>
            <div style={{ display:'flex', gap:2 }}>
              {(['all','active'] as const).map(f => (
                <button key={f} onClick={() => setSwStatusFilter(f)}
                  style={{ fontSize:12, padding:'2px 8px', borderRadius:4, cursor:'pointer', border:'1px solid',
                    borderColor: swStatusFilter===f ? '#3b82f6' : '#e2e8f0',
                    background: swStatusFilter===f ? '#eff6ff' : '#f8fafc',
                    color: swStatusFilter===f ? '#1d4ed8' : '#64748b', fontWeight: swStatusFilter===f ? 700 : 400 }}>
                  {f==='all' ? '전체' : '근무중'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ fontSize:12, color:'#94a3b8' }}>
            {swStatusFilter==='all' ? '전체' : '근무중'} 시설장 / 사회복지사 / 간호사 / 간호조무사
          </div>
        </div>

        <div style={{ flexShrink: 0, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* 전체상담직원 일정조회 카드 */}
          <div
            onClick={() => { setSelectedSwId(ALL_SW); setSchedulingRecipId(null); setAddPopover(null); }}
            style={{ borderRadius:7, cursor:'pointer', overflow:'hidden',
              background: isAllSwMode ? 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(79,70,229,0.08))' : '#f8fafc',
              border: isAllSwMode ? '1px solid #a5b4fc' : '1px solid #e2e8f0',
              transition:'background 0.12s, border-color 0.12s',
            }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px 6px' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0,
                background: isAllSwMode ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'linear-gradient(135deg,#94a3b8,#64748b)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff' }}>전</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color: isAllSwMode ? '#3730a3' : '#1e293b' }}>전체상담직원 일정조회</div>
                <div style={{ fontSize:11, color:'#64748b', marginTop:1 }}>
                  이번달&nbsp;
                  <span style={{ color:'#059669', fontWeight:600 }}>{totalCompleted}건 완료</span>
                  {totalPlanned > 0 && <span style={{ color:'#2563eb', fontWeight:600 }}> · {totalPlanned}건 예정</span>}
                  {totalUnable > 0  && <span style={{ color:'#be123c', fontWeight:600 }}> · {totalUnable}건 불가</span>}
                </div>
              </div>
            </div>
            <div style={{ padding:'4px 0', fontSize:11, fontWeight:700, textAlign:'center',
              background: isAllSwMode ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : '#e8edf5',
              color: isAllSwMode ? '#fff' : '#475569',
              borderTop: isAllSwMode ? '1px solid rgba(99,102,241,0.2)' : '1px solid #dde3ed' }}>
              조회 전용 (일정등록/수정 안됨)
            </div>
          </div>

          {socialWorkers.filter(s => swStatusFilter==='all' || s.status==='active').map(s => {
            const isSelected = s.id === selectedSwId;
            const allV  = visits.filter(v => v.socialWorkerId === s.id && v.date.startsWith(monthPfx));
            const done  = allV.filter(v => v.consultStatus === 'completed').length;
            const total = allV.length;
            return (
              <div key={s.id}
                onClick={() => { setSelectedSwId(s.id); setSchedulingRecipId(null); setAddPopover(null); }}
                style={{
                  borderRadius: 7, cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.12s, border-color 0.12s',
                  background: isSelected ? 'linear-gradient(135deg,rgba(59,130,246,0.12),rgba(37,99,235,0.08))' : '#f8fafc',
                  border: isSelected ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                  overflow: 'hidden',
                }}
              >
                {/* 직원 정보 영역 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px 6px' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: isSelected ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'linear-gradient(135deg,#94a3b8,#64748b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff',
                  }}>{s.name[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? '#1e40af' : '#1e293b' }}>{s.name}</span>
                      <span style={{ fontSize: 12, padding: '1px 6px', borderRadius: 8, background: isSelected ? '#dbeafe' : '#f1f5f9', color: isSelected ? '#1d4ed8' : '#64748b', border: `1px solid ${isSelected ? '#bfdbfe' : '#e2e8f0'}` }}>{POSITION_CODES[s.positionCode]}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      이번달&nbsp;
                      <span style={{ color: '#059669', fontWeight: 600 }}>{done}건 완료</span>
                      {total > done && <span style={{ color: '#2563eb', fontWeight: 600 }}> · {total - done}건 예정</span>}
                      {total === 0 && <span style={{ color: '#94a3b8' }}> · 상담 없음</span>}
                    </div>
                    <div style={{ marginTop: 4, height: 3, borderRadius: 2, background: '#e2e8f0', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 2, width: `${total > 0 ? (done/total)*100 : 0}%`, background: done===total && total>0 ? '#10b981' : '#3b82f6', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                </div>
                {/* 일정등록 버튼 — 카드 하단 */}
                <button
                  onClick={e => { e.stopPropagation(); if (!isSelected) { setSelectedSwId(s.id); setSchedulingRecipId(null); setAddPopover(null); } else { setShowRecipPopup(true); } }}
                  style={{ display:'block', width:'100%', padding:'5px 0', cursor:'pointer', fontSize:12, fontWeight:700, background: isSelected ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#e8edf5', color: isSelected ? '#fff' : '#475569', border:'none', borderTop: isSelected ? '1px solid rgba(37,99,235,0.2)' : '1px solid #dde3ed', letterSpacing:'0.02em' }}
                >
                  + 일정등록
                </button>
              </div>
            );
          })}
        </div>

        {/* ── 수급자 슬라이드 패널 ── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          background: '#ffffff',
          transform: showRecipPopup ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', flexDirection: 'column',
          boxShadow: showRecipPopup ? '4px 0 20px rgba(0,0,0,0.12)' : 'none',
        }}>
          {/* 슬라이드 헤더 */}
          <div style={{ flexShrink:0, background:'linear-gradient(90deg,#0f2744,#1a3a5c)', padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#fff' }}>
              일정등록할 수급자 선택
              {schedulingRec && <span style={{ fontSize:11, color:'#93c5fd', marginLeft:8 }}>· {schedulingRec.name} 선택됨</span>}
            </span>
            <button onClick={() => setShowRecipPopup(false)}
              style={{ width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:4, cursor:'pointer', padding:0 }}>
              <X size={11} color="#e0eaff" strokeWidth={2.5} />
            </button>
          </div>
          {/* 안내 문구 */}
          <div style={{ flexShrink:0, background:'#fffbeb', borderBottom:'1px solid #fde68a', padding:'5px 10px', display:'flex', alignItems:'flex-start', gap:6 }}>
            <span style={{ fontSize:10, color:'#d97706', flexShrink:0, marginTop:1 }}>💡</span>
            <span style={{ fontSize:10, color:'#92400e', lineHeight:1.5 }}>상담할 수급자의 <strong>등록</strong> 버튼을 클릭한 후 달력의 일자를 클릭하면 상담등록이 됩니다.</span>
          </div>
          {/* 검색 + 필터 */}
          <div style={{ flexShrink:0, padding:'6px 8px', borderBottom:'1px solid #e2e8f0', display:'flex', flexDirection:'column', gap:4 }}>
            {/* 검색 */}
            <div style={{ display:'flex', alignItems:'center', gap:5, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:5, padding:'3px 7px' }}>
              <Search size={11} color="#94a3b8" />
              <input value={slideSearch} onChange={e => setSlideSearch(e.target.value)} placeholder="수급자명 검색"
                style={{ flex:1, border:'none', background:'transparent', fontSize:11, color:'#1e293b', outline:'none' }} />
            </div>
            {/* 수급자 상태 + 해당월 필터 */}
            <div style={{ display:'flex', gap:4 }}>
              {(['active','all'] as const).map(v => (
                <button key={v} onClick={() => setSlideRecipStatus(v)}
                  style={{ flex:1, fontSize:9, padding:'3px 0', borderRadius:4, cursor:'pointer', border:'1px solid',
                    borderColor: slideRecipStatus===v ? '#3b82f6' : '#e2e8f0',
                    background: slideRecipStatus===v ? '#eff6ff' : '#f8fafc',
                    color: slideRecipStatus===v ? '#1d4ed8' : '#64748b', fontWeight: slideRecipStatus===v ? 700 : 400 }}>
                  {v==='active' ? '수급중' : '전체수급자'}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:4 }}>
              {(['month','all'] as const).map(v => (
                <button key={v} onClick={() => setSlideMonthFilter(v)}
                  style={{ flex:1, fontSize:9, padding:'3px 0', borderRadius:4, cursor:'pointer', border:'1px solid',
                    borderColor: slideMonthFilter===v ? '#3b82f6' : '#e2e8f0',
                    background: slideMonthFilter===v ? '#eff6ff' : '#f8fafc',
                    color: slideMonthFilter===v ? '#1d4ed8' : '#64748b', fontWeight: slideMonthFilter===v ? 700 : 400 }}>
                  {v==='month' ? '해당월 방문급여제공있는 수급자' : '전체'}
                </button>
              ))}
            </div>
            {/* 필터 행 1: 등급 + 급여유형 */}
            <div style={{ display:'flex', gap:4 }}>
              <select value={slideGrade} onChange={e => setSlideGrade(e.target.value)}
                style={{ flex:1, fontSize:10, padding:'3px 4px', border:'1px solid #e2e8f0', borderRadius:4, outline:'none', color:'#334155', background:'#fff' }}>
                <option value="all">등급 전체</option>
                {[1,2,3,4,5].map(n => <option key={n} value={String(n)}>{n}등급</option>)}
                <option value="in">인지지원</option>
              </select>
              <select value={slideService} onChange={e => setSlideService(e.target.value)}
                style={{ flex:1, fontSize:10, padding:'3px 4px', border:'1px solid #e2e8f0', borderRadius:4, outline:'none', color:'#334155', background:'#fff' }}>
                <option value="all">급여유형 전체</option>
                {(['visit_care','visit_bath','visit_nursing','day_care'] as const).map(k => <option key={k} value={k}>{SERVICE_LABELS[k]}</option>)}
              </select>
            </div>
            {/* 필터 행 2: 그룹 */}
            <div style={{ display:'flex', gap:4 }}>
              <select value={selectedGroup} onChange={e => { setSelectedGroup(e.target.value); setSelectedSubGroup('all'); }}
                style={{ flex:1, fontSize:10, padding:'3px 4px', border:'1px solid #e2e8f0', borderRadius:4, outline:'none', color:'#334155', background:'#fff' }}>
                {MOCK_GROUPS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
              </select>
              {curGroupObj.subs.length > 0 && (
                <select value={selectedSubGroup} onChange={e => setSelectedSubGroup(e.target.value)}
                  style={{ flex:1, fontSize:10, padding:'3px 4px', border:'1px solid #dbeafe', borderRadius:4, outline:'none', color:'#1e40af', background:'#eff6ff' }}>
                  <option value="all">전체</option>
                  {curGroupObj.subs.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
            </div>
          </div>
          {/* 수급자 테이블 */}
          <div style={{ flex:1, overflowY:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11, tableLayout:'fixed' }}>
              <colgroup>
                <col style={{ width:20 }} /><col /><col style={{ width:30 }} />
                <col style={{ width:62 }} /><col style={{ width:34 }} /><col style={{ width:34 }} />
              </colgroup>
              <thead>
                <tr>
                  {['#','이름','등급','이번달','선택','일정'].map((h,i) => (
                    <th key={i} style={{ position:'sticky', top:0, zIndex:2, background:'#152e50', color:'rgba(255,255,255,0.88)', fontWeight:600, height:24, textAlign:'center', borderRight:i<5?'1px solid rgba(255,255,255,0.1)':'none', padding:'0 2px', whiteSpace:'nowrap', fontSize:10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {swRecs.map((r, idx) => {
                  const isActive = schedulingRecipId === r.id;
                  const rowBg    = isActive ? '#eff6ff' : idx%2===0 ? '#ffffff' : '#f4f7fb';
                  const gc       = GRADE_COLOR[getGradeNum(r)] ?? { bg:'#f1f5f9', c:'#64748b' };
                  const gradeLabel = (() => { const n = getGradeNum(r); return (n >= 1 && n <= 5) ? n : '인'; })();
                  const td: CSSProperties = { height:28, padding:'0 3px', textAlign:'center', borderBottom:'1px solid #e4eaf3', borderRight:'1px solid rgba(21,46,80,0.08)', background:rowBg, verticalAlign:'middle' };
                  return (
                    <tr key={r.id} style={{ borderLeft:`3px solid ${isActive?'#2563eb':'transparent'}` }}>
                      <td style={{ ...td, color:'#94a3b8', fontSize:10 }}>{idx+1}</td>
                      <td style={{ ...td, textAlign:'left', fontWeight:isActive?700:500, color:isActive?'#1e40af':'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12 }}>{r.name}</td>
                      <td style={{ ...td }}>
                        <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'1px 4px', borderRadius:3, background:gc.bg, color:gc.c, fontSize:10, fontWeight:700, border:`1px solid ${gc.c}40`, whiteSpace:'nowrap' }}>{gradeLabel}</span>
                      </td>
                      <td style={{ ...td, height:'auto', padding:'2px 3px' }}>
                        {(() => {
                          const rvs = recipientMonthVisitsSorted(r.id);
                          if (rvs.length === 0) return <span style={{ fontSize:10, color:'#cbd5e1' }}>-</span>;
                          return (
                            <div style={{ display:'flex', flexDirection:'column', gap:1, alignItems:'center' }}>
                              {rvs.map(v => {
                                const mmdd = v.date.slice(5).replace('-', '/');
                                const cs = CSTATUS[v.consultStatus] ?? CSTATUS['planned'];
                                return (
                                  <span key={v.id} style={{ display:'inline-flex', alignItems:'center', gap:2, fontSize:9, padding:'1px 4px', borderRadius:3, fontWeight:700, whiteSpace:'nowrap', background:cs.bg, color:cs.text, border:`1px solid ${cs.border}` }}>
                                    {v.consultStatus === 'completed' ? '완료' : v.consultStatus === 'unable' ? '불가' : '예정'} {mmdd}
                                  </span>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ ...td, padding:'0 2px' }}>
                        <button onClick={() => { setSchedulingRecipId(prev => prev===r.id ? null : r.id); setAddPopover(null); setPopover(null); setShowRecipPopup(false); }}
                          style={{ width:'100%', padding:'3px 1px', borderRadius:4, cursor:'pointer', fontSize:10, fontWeight:700, whiteSpace:'nowrap', background:isActive?'linear-gradient(135deg,#2563eb,#1d4ed8)':'#f1f5f9', color:isActive?'#fff':'#475569', border:isActive?'none':'1px solid #e2e8f0' }}
                        >{isActive ? '✓' : '선택'}</button>
                      </td>
                      <td style={{ ...td, borderRight:'none', padding:'0 2px' }}>
                        <button onClick={() => setSchedPopup({ recipId:r.id, year, month })}
                          style={{ width:'100%', padding:'3px 1px', borderRadius:4, cursor:'pointer', fontSize:10, fontWeight:700, whiteSpace:'nowrap', background:'#f0fdf4', color:'#15803d', border:'1px solid #bbf7d0' }}
                        >일정</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 캘린더 영역 ──────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* 헤더 바 */}
        <div style={{ flexShrink:0, height:44, background:'#ffffff', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:10, padding:'0 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <button onClick={prevMonth} style={navBtn}><ChevronLeft size={13} color="#64748b" /></button>
            <div style={{ minWidth:80, textAlign:'center', fontSize:13, fontWeight:700, color:'#0f172a' }}>{year}년 {month}월</div>
            <button onClick={nextMonth} style={navBtn}><ChevronRight size={13} color="#64748b" /></button>
          </div>
          <button onClick={() => { setYear(2026); setMonth(4); }} style={{ fontSize:12, padding:'3px 10px', borderRadius:5, cursor:'pointer', background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0', fontWeight:500 }}>오늘</button>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:8 }}>
            <StatChip color="#059669" bg="#d1fae5" border="#6ee7b7" label="상담완료" count={completedCount} />
            <StatChip color="#2563eb" bg="#dbeafe" border="#93c5fd" label="상담예정" count={plannedCount} />
            {unableCount > 0 && <StatChip color="#be123c" bg="#fff1f2" border="#fda4af" label="방문불가" count={unableCount} />}
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:10, color:'#94a3b8', fontWeight:600 }}>업무일지:</span>
            {([
              {bg:'#d1fae5',color:'#059669',border:'#6ee7b7',label:'작성',   count:journalWrittenCount},
              {bg:'#f1f5f9',color:'#94a3b8',border:'#e2e8f0',label:'미작성', count:journalNoneCount},
            ] as const).map((c,i) => (
              <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12, padding:'1px 7px', borderRadius:10, background:c.bg, color:c.color, border:`1px solid ${c.border}`, fontWeight:700 }}>
                {c.label}
                <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:14, height:14, borderRadius:7, background:c.color, color:'#fff', fontSize:10, fontWeight:800, lineHeight:1, padding:'0 3px' }}>{c.count}</span>
              </span>
            ))}
          </div>
        </div>

        {/* 등록 모드 배너 */}
        {inSchedulingMode && schedulingRec && (
          <div style={{ flexShrink:0, background:'linear-gradient(90deg,#eff6ff,#f0f9ff)', borderBottom:'1px solid #bfdbfe', padding:'5px 14px', display:'flex', alignItems:'center', gap:8 }}>
            <CalendarCheck size={13} color="#2563eb" />
            <span style={{ fontSize:12, color:'#1e40af', fontWeight:700 }}>{schedulingRec.name} ({getGradeText(schedulingRec)})</span>
            <span style={{ fontSize:11, color:'#3b82f6' }}>방문상담 일정 등록 · 날짜 셀을 클릭하세요</span>
            <button onClick={() => { setSchedulingRecipId(null); setAddPopover(null); }} style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:3, padding:'2px 8px', borderRadius:4, cursor:'pointer', fontSize:11, fontWeight:600, background:'#fee2e2', color:'#dc2626', border:'1px solid #fca5a5' }}>
              <X size={10} /> (일정등록)모드 종료
            </button>
          </div>
        )}

        {/* 요일 헤더 */}
        <div style={{ flexShrink:0, display:'grid', gridTemplateColumns:'repeat(7, 1fr)', background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
          {DOW.map((d,i) => (
            <div key={i} style={{ height:28, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:i===0?'#dc2626':i===6?'#2563eb':'#64748b', borderRight:i<6?'1px solid #e2e8f0':'none' }}>{d}</div>
          ))}
        </div>

        {/* 캘린더 그리드 */}
        <div style={{ flex:1, overflowY:'auto', background:'#f8fafc' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', borderBottom:'1px solid #e2e8f0', minHeight:128 }}>
              {week.map((day, di) => {
                const ds      = day ? dateStr(year, month, day) : '';
                const isToday = ds === TODAY;
                const isSun   = di === 0, isSat = di === 6;
                const dvs     = day ? dayVisits(day) : [];
                const bgSch   = day ? dayServiceSchedules(day) : [];
                return (
                  <div key={di}
                    onClick={inSchedulingMode && day ? e => openAddForm(e, ds) : undefined}
                    style={{ padding:'4px 4px 6px', borderRight:di<6?'1px solid #e2e8f0':'none', background:!day?'#f0f4f8':isToday?'#eff6ff':'#ffffff', cursor:inSchedulingMode&&day?'pointer':'default', minHeight:128, position:'relative' }}
                  >
                    {day && (
                      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:3 }}>
                        <span style={{ width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%', fontSize:12, fontWeight:isToday?800:500, background:isToday?'#2563eb':'transparent', color:isToday?'#fff':isSun?'#dc2626':isSat?'#2563eb':'#374151' }}>{day}</span>
                      </div>
                    )}
                    {bgSch.length > 0 && (
                      <div style={{ display:'flex', flexDirection:'column', gap:1, marginBottom:3 }}>
                        {bgSch.map(s => {
                          const sc = SVC_COLOR[s.serviceType] ?? { bg:'rgba(200,200,200,0.4)',text:'rgba(100,100,100,0.6)',border:'rgba(180,180,180,0.5)' };
                          const recip = recipients.find(r => r.id === s.recipientId);
                          const cw    = getCareWorker(s.careWorkerId);
                          return (
                            <div key={s.id} style={{ display:'flex', flexDirection:'column', padding:'2px 4px', borderRadius:3, background:sc.bg, border:`1px dashed ${sc.border}`, pointerEvents:'none', gap:1 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:2 }}>
                                <span style={{ fontSize:12, color:sc.text, fontWeight:700, flexShrink:0 }}>{SERVICE_LABELS[s.serviceType]}</span>
                                <span style={{ fontSize:12, color:sc.text, flexShrink:0 }}>{s.startTime}~{s.endTime}</span>
                              </div>
                              <div style={{ fontSize:11, color:sc.text, opacity:0.85 }}>
                                {recip?.name ?? '-'}{cw ? ` (${cw.name})` : ''}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                      {dvs.map(v => {
                        const rec     = recipients.find(r => r.id === v.recipientId);
                        const vSw     = isAllSwMode ? socialWorkers.find(s => s.id === v.socialWorkerId) : null;
                        const cs      = CSTATUS[v.consultStatus];
                        const jrnl    = journals[v.id];
                        const hasJrnl = !!jrnl;
                        const isSelected = popover?.visit.id === v.id;
                        const isHL = highlightRecipId === v.recipientId;
                        const isFlash = highlightVisitId === v.id;
                        return (
                          <div key={v.id}
                            onClick={isAllSwMode ? undefined : e => openVisitPopover(e, v)}
                            style={{ padding:'2px 5px 2px', borderRadius:4, cursor: isAllSwMode ? 'default' : 'pointer',
                              background: isFlash ? '#fef08a' : isSelected ? (v.consultStatus==='completed'?'#bbf7d0':'#bfdbfe') : isHL ? (v.consultStatus==='completed'?'#bbf7d0':'#bfdbfe') : cs.bg,
                              border: isFlash ? '2px solid #f59e0b' : isSelected ? `2px solid ${v.consultStatus==='completed'?'#059669':'#1d4ed8'}` : isHL ? `2px solid ${v.consultStatus==='completed'?'#10b981':'#3b82f6'}` : `1px solid ${cs.border}`,
                              overflow:'hidden',
                              boxShadow: isFlash ? '0 0 0 3px rgba(245,158,11,0.4), 0 3px 10px rgba(245,158,11,0.25)' : isSelected ? `0 0 0 3px ${v.consultStatus==='completed'?'rgba(5,150,105,0.35)':'rgba(29,78,216,0.35)'}, 0 3px 10px rgba(0,0,0,0.15)` : isHL ? `0 0 0 2px ${v.consultStatus==='completed'?'rgba(16,185,129,0.3)':'rgba(59,130,246,0.3)'}` : 'none',
                              transition:'background 0.3s, border-color 0.3s, box-shadow 0.3s',
                            }}>
                            {/* 1행: 점 + 이름(+상담직원) + 일지버튼 */}
                            <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                              <div style={{ width:5, height:5, borderRadius:'50%', flexShrink:0, background:cs.dot }} />
                              <span style={{ fontSize:13, fontWeight:600, flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#1e293b' }}>
                                {rec?.name ?? '-'}
                                {isAllSwMode && vSw && <span style={{ fontSize:11, color:'#64748b', fontWeight:400 }}> ({vSw.name})</span>}
                              </span>
                              <button onClick={e => openJournalOverlay(e, v)} title="업무수행일지 열기" style={{ flexShrink:0, display:'inline-flex', alignItems:'center', gap:2, padding:'0px 4px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, borderWidth:1, borderStyle:'solid', lineHeight:'14px', ...(hasJrnl ? {background:'#d1fae5',color:'#059669',borderColor:'#6ee7b7'} : {background:'#f1f5f9',color:'#64748b',borderColor:'#e2e8f0'}) }}>
                                <BookOpen size={7} />
                                {hasJrnl ? '작성' : '미작성'}
                              </button>
                            </div>
                            {/* 2행: 시간 / 방문불가 */}
                            <div style={{ paddingLeft:8, marginTop:1, fontSize:13, color:cs.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                              {v.consultStatus === 'unable'
                                ? '방문불가'
                                : v.consultStatus === 'completed'
                                ? `완료 ${v.actualStartTime ?? v.plannedStartTime}${(v.actualEndTime ?? v.plannedEndTime) ? `~${v.actualEndTime ?? v.plannedEndTime}` : ''}`
                                : `예정 ${v.plannedStartTime}${v.plannedEndTime ? `~${v.plannedEndTime}` : ''}`
                              }
                            </div>
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

      {/* 방문 상세 팝오버 */}
      {popover && (
        <PopoverCard
          popover={popover}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onClose={closeAll}
          onOpenJournal={(visit, e) => { openJournalOverlay(e as unknown as React.MouseEvent, visit); }}
          journalStatus={popover ? (journals[popover.visit.id]?.status ?? null) : null}
        />
      )}

      {/* 일정 등록 팝오버 */}
      {addPopover && schedulingRecipId && schedulingRec && (
        <AddFormCard
          popover={addPopover}
          recipient={schedulingRec}
          form={form}
          setForm={setForm}
          onSave={handleAdd}
          onClose={() => setAddPopover(null)}
        />
      )}


      </div>
      )}

      {/* ── 수급자 일정 조회 팝업 ── */}
      {schedPopup && (
        <SchedViewPopup
          recipId={schedPopup.recipId}
          initYear={schedPopup.year}
          initMonth={schedPopup.month}
          onClose={() => setSchedPopup(null)}
        />
      )}

      {/* ── 업무수행일지 오버레이 ── */}
      {journalOverlay && (
        <JournalOverlayModal
          overlay={journalOverlay}
          existing={journals[journalOverlay.visitId]}
          formData={overlayFormData}
          setFormData={handleOverlaySetFormData}
          status={overlayStatus}
          isDirty={overlayDirty}
          onSave={handleOverlaySave}
          onClose={handleOverlayClose}
        />
      )}
    </div>
  );
}

// ── 업무수행일지 오버레이 모달 ─────────────────────────────────────────────────
interface JournalOverlayModalProps {
  overlay: JournalOverlayInfo;
  existing?: JournalNew;
  formData: Record<string, any>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  status: JournalStatus;
  isDirty: boolean;
  onSave: (status: JournalStatus) => void;
  onClose: () => void;
}

function JournalOverlayModal({ overlay, existing, formData, setFormData, status, isDirty, onSave, onClose }: JournalOverlayModalProps) {
  const rec = recipients.find(r => r.id === overlay.recipientId);
  const sw  = socialWorkers.find(s => s.id === overlay.socialWorkerId);
  const isNew = !existing;
  const dateLabel = overlay.date.replace(/-/g, '. ') + '.';

  return (
    <div
      onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(15,39,68,0.55)', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:40, paddingBottom:40 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width:'min(832px, 94vw)', maxHeight:'calc(100vh - 80px)', background:'#fff', borderRadius:10, boxShadow:'0 24px 80px rgba(15,39,68,0.28)', display:'flex', flexDirection:'column', overflow:'hidden' }}
      >
        {/* 헤더 */}
        <div style={{ background:'linear-gradient(90deg,#0f2744,#1a3a5c)', padding:'10px 16px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <BookOpen size={14} color="#93c5fd" />
          <span style={{ fontSize:12, fontWeight:700, color:'#fff' }}>업무수행일지</span>
          <span style={{ width:1, height:13, background:'rgba(255,255,255,0.25)', display:'inline-block' }} />
          <span style={{ fontSize:12, fontWeight:700, color:'#bfdbfe' }}>{rec?.name ?? '-'}</span>
          <span style={{ fontSize:12, color:'#93c5fd' }}>{dateLabel}</span>
          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, fontWeight:700, background: isNew ? '#f1f5f9' : '#d1fae5', color: isNew ? '#64748b' : '#059669', border: isNew ? '1px solid #e2e8f0' : '1px solid #6ee7b7' }}>
            {isNew ? '신규작성' : '작성완료'}
          </span>
          {isDirty && (
            <span style={{ fontSize:10, padding:'1px 6px', borderRadius:8, background:'rgba(253,186,116,0.2)', color:'#fed7aa', border:'1px solid rgba(253,186,116,0.4)', fontWeight:600 }}>미저장</span>
          )}
          {sw && (
            <span style={{ fontSize:11, color:'#94a3b8', marginLeft:'auto', display:'flex', alignItems:'center', gap:4 }}>
              담당: {sw.name}
              {sw.positionCode && <span style={{ fontSize:10, padding:'1px 5px', borderRadius:8, background:'rgba(255,255,255,0.12)', color:'#bfdbfe', border:'1px solid rgba(255,255,255,0.18)' }}>{POSITION_CODES[sw.positionCode]}</span>}
            </span>
          )}
          <button onClick={onClose} style={{ width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:5, cursor:'pointer', padding:0, marginLeft: sw ? 0 : 'auto' }}>
            <X size={12} color="#e0eaff" strokeWidth={2.5} />
          </button>
        </div>

        {/* 구분 안내 바 */}
        <div style={{ background: isNew ? '#eff6ff' : status === 'completed' ? '#f0fdf4' : '#fffbeb', borderBottom:'1px solid #e2e8f0', padding:'6px 16px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          {isNew ? (
            <>
              <FileText size={12} color="#2563eb" />
              <span style={{ fontSize:12, color:'#1e40af', fontWeight:600 }}>신규 작성 — 업무수행일자가 방문상담 날짜({overlay.date})로 자동 설정되었습니다.</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={12} color="#059669" />
              <span style={{ fontSize:12, color:'#065f46', fontWeight:600 }}>작성된 일지입니다. 내용을 수정 후 저장할 수 있습니다.</span>
            </>
          )}
          {existing?.writtenAt && (
            <span style={{ marginLeft:'auto', fontSize:11, color:'#94a3b8' }}>최종저장: {existing.writtenAt}</span>
          )}
        </div>

        {/* 본문 — 스크롤 */}
        <div style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>
          <JournalFormBody
            data={formData}
            setData={setFormData}
            recipientId={overlay.recipientId}
            socialWorkerId={overlay.socialWorkerId}
            visitDate={overlay.date}
            writtenAt={existing?.writtenAt}
          />
        </div>

        {/* 푸터 */}
        <div style={{ flexShrink:0, borderTop:'1px solid #e2e8f0', background:'#f8fafc', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:8 }}>
          <button
            onClick={onClose}
            style={{ padding:'6px 16px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0' }}
          >
            닫기
          </button>
          <button
            onClick={() => onSave('completed')}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 18px', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer', background:'linear-gradient(135deg,#059669,#047857)', color:'#fff', border:'none' }}
          >
            <CheckCircle2 size={12} />저장
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 일정 등록 팝오버 ──────────────────────────────────────────────────────────
interface AddFormCardProps {
  popover: AddFormPopover;
  recipient: { id: string; name: string };
  form: AddForm;
  setForm: React.Dispatch<React.SetStateAction<AddForm>>;
  onSave: () => void;
  onClose: () => void;
}

function AddFormCard({ popover, recipient, form, setForm, onSave, onClose }: AddFormCardProps) {
  const { x, y, date } = popover;
  const DOW_KR = ['일','월','화','수','목','금','토'];
  const dateLabel = date.replace(/-/g, '. ') + '. (' + DOW_KR[new Date(date).getDay()] + ')';

  // 시/분 분리 헬퍼
  const toHH = (t: string) => t.split(':')[0] ?? '10';
  const toMM = (t: string) => t.split(':')[1] ?? '00';
  const combine = (hh: string, mm: string) => `${hh}:${mm}`;

  // 시간 드롭박스 컴포넌트
  const timeSel = (value: string, onChange: (v: string) => void, err?: boolean) => {
    const hh = toHH(value); const mm = toMM(value);
    const selSt: CSSProperties = { ...inputStyle, width:52, padding:'4px 2px', textAlign:'center' as const };
    return (
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        <select value={hh} onChange={e => onChange(combine(e.target.value, mm))} style={{ ...selSt, borderColor: err ? '#fca5a5' : '#e2e8f0' }}>
          {Array.from({length:24},(_,i)=>String(i).padStart(2,'0')).map(h=><option key={h} value={h}>{h}</option>)}
        </select>
        <span style={{ fontSize:11, color:'#64748b' }}>시</span>
        <select value={mm} onChange={e => onChange(combine(hh, e.target.value))} style={{ ...selSt, borderColor: err ? '#fca5a5' : '#e2e8f0' }}>
          {Array.from({length:60},(_,i)=>String(i).padStart(2,'0')).map(m=><option key={m} value={m}>{m}</option>)}
        </select>
        <span style={{ fontSize:11, color:'#64748b' }}>분</span>
      </div>
    );
  };
  const canSave = form.consultStatus === 'unable'
    ? true
    : form.consultStatus === 'planned'
    ? !!(form.plannedStartTime && form.plannedEndTime && form.plannedStartTime < form.plannedEndTime)
    : !!(form.actualStartTime  && form.actualEndTime  && form.actualStartTime  < form.actualEndTime);

  return (
    <div onClick={e => e.stopPropagation()} style={{ position:'fixed', left:x, top:y, zIndex:401, width:400, background:'#ffffff', border:'1px solid #93c5fd', borderRadius:8, boxShadow:'0 14px 48px rgba(37,99,235,0.18)', overflow:'hidden' }}>
      {/* 헤더 */}
      <div style={{ background:'linear-gradient(90deg,#0f2744,#1a3a5c)', padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <CalendarCheck size={13} color="#93c5fd" />
          <span style={{ fontSize:12, fontWeight:700, color:'#fff' }}>방문상담 일정 등록</span>
          <span style={{ width:1, height:11, background:'rgba(255,255,255,0.3)', display:'inline-block', margin:'0 2px' }} />
          <span style={{ fontSize:12, color:'#bfdbfe' }}>{recipient.name}</span>
          <span style={{ fontSize:12, color:'#93c5fd' }}>{dateLabel}</span>
        </div>
        <button onClick={onClose} style={closeBtn}><X size={11} color="#e0eaff" strokeWidth={2.5} /></button>
      </div>

      <div style={{ padding:'13px 16px', display:'flex', flexDirection:'column', gap:12 }}>

        {/* Step 1: 상담 유형 선택 */}
        <div style={{ display:'flex', gap:8 }}>
          {(['planned','completed','unable'] as ConsultStatus[]).map(s => {
            const cs = CSTATUS[s]; const sel = form.consultStatus === s;
            return (
              <button key={s} onClick={() => setForm(f => ({
                ...f,
                consultStatus: s,
                plannedStartTime: s === 'planned' ? (f.plannedStartTime || '10:00') : '',
                plannedEndTime:   s === 'planned' ? (f.plannedEndTime   || '10:30') : '',
                actualStartTime:  s === 'completed' ? (f.actualStartTime || '10:00') : '',
                actualEndTime:    s === 'completed' ? (f.actualEndTime   || '10:30') : '',
              }))}
                style={{ flex:1, padding:'9px 0', borderRadius:7, fontSize:13, cursor:'pointer', fontWeight:sel?700:500,
                  background:sel?cs.bg:'#f8fafc', color:sel?cs.text:'#64748b',
                  border:`2px solid ${sel?cs.border:'#e2e8f0'}`, transition:'all 0.12s' }}>
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:sel?cs.dot:'#cbd5e1', display:'inline-block' }} />
                  {cs.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Step 2: 시간 입력 (방문불가는 시간 없음) */}
        {form.consultStatus !== 'unable' && (() => {
          const isPlanned = form.consultStatus === 'planned';
          const color = isPlanned ? '#2563eb' : '#059669';
          const dot   = isPlanned ? '#3b82f6' : '#10b981';
          const label = isPlanned ? '상담 예정 시간' : '상담 완료 시간';
          const startV = isPlanned ? (form.plannedStartTime || '10:00') : (form.actualStartTime || '10:00');
          const endV   = isPlanned ? (form.plannedEndTime   || '11:00') : (form.actualEndTime   || '11:00');
          const setStart = (v: string) => setForm(f => isPlanned ? {...f, plannedStartTime:v} : {...f, actualStartTime:v});
          const setEnd   = (v: string) => setForm(f => isPlanned ? {...f, plannedEndTime:v}   : {...f, actualEndTime:v});
          const err = endV <= startV;
          return (
            <div style={{ background: isPlanned ? '#eff6ff' : '#f0fdf4', border:`1px solid ${isPlanned ? '#bfdbfe' : '#bbf7d0'}`, borderRadius:7, padding:'10px 12px', display:'flex', flexDirection:'column', gap:7 }}>
              <div style={{ fontSize:12, fontWeight:700, color, display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:dot, display:'inline-block' }} />{label}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:11, color:'#64748b' }}>시작</span>
                {timeSel(startV, setStart)}
                <span style={{ fontSize:11, color:'#64748b' }}>종료</span>
                {timeSel(endV, setEnd, err)}
              </div>
              <button onClick={() => { setStart(startV); setEnd(addMin(startV, 30)); }}
                style={{ alignSelf:'flex-start', fontSize:11, padding:'2px 10px', borderRadius:4, cursor:'pointer', background: isPlanned ? '#dbeafe' : '#dcfce7', color: isPlanned ? '#1d4ed8' : '#15803d', border:`1px solid ${isPlanned ? '#93c5fd' : '#6ee7b7'}`, fontWeight:600 }}>
                30분
              </button>
            </div>
          );
        })()}

        {/* 메모 */}
        <FormRow label="메모">
          <AutoTA minRows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes:e.target.value}))} style={{ ...inputStyle, padding:'5px 8px', lineHeight:1.5 }} />
        </FormRow>

      </div>

      <div style={{ padding:'9px 16px 13px', display:'flex', justifyContent:'flex-end', gap:7, borderTop:'1px solid #e8f0fe' }}>
        <button onClick={onClose} style={cancelBtn}>취소</button>
        <button onClick={onSave} disabled={!canSave} style={{ padding:'6px 18px', borderRadius:6, fontSize:12, fontWeight:600, cursor:canSave?'pointer':'not-allowed', background:canSave?'linear-gradient(135deg,#2563eb,#1d4ed8)':'#e2e8f0', color:canSave?'#fff':'#94a3b8', border:'none' }}>저장</button>
      </div>
    </div>
  );
}

// ── 방문 상세 팝오버 ──────────────────────────────────────────────────────────
type EditForm = AddForm;

interface PopoverCardProps {
  popover: VisitPopover;
  onDelete: (id: string) => void;
  onUpdate: (id: string, form: EditForm) => void;
  onClose: () => void;
  onOpenJournal: (visit: ConsultationVisit, e: MouseEvent) => void;
  journalStatus: 'draft' | 'completed' | null;
}

function PopoverCard({ popover, onDelete, onUpdate, onClose, onOpenJournal, journalStatus }: PopoverCardProps) {
  const { visit, x, y } = popover;
  const rec = recipients.find(r => r.id === visit.recipientId);
  const sw  = socialWorkers.find(s => s.id === visit.socialWorkerId);
  const cs  = CSTATUS[visit.consultStatus];

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    consultStatus: visit.consultStatus,
    plannedStartTime: visit.plannedStartTime,
    plannedEndTime: visit.plannedEndTime ?? '',
    actualStartTime: visit.actualStartTime ?? '',
    actualEndTime: visit.actualEndTime ?? '',
    notes: visit.notes ?? '',
  });

  function handleSave() {
    const autoStatus: ConsultStatus = editForm.consultStatus === 'unable' ? 'unable' : (editForm.actualStartTime && editForm.actualEndTime) ? 'completed' : 'planned';
    onUpdate(visit.id, { ...editForm, consultStatus: autoStatus });
    setIsEditing(false);
  }

  const editTimeSel = (value: string, onChange: (v: string) => void, err?: boolean) => {
    const hh = (value || '').split(':')[0] || '10';
    const mm = (value || '').split(':')[1] || '00';
    const selSt: CSSProperties = { ...inputStyle, width:46, padding:'3px 2px', textAlign:'center' as const, fontSize:11 };
    return (
      <div style={{ display:'flex', alignItems:'center', gap:3 }}>
        <select value={hh} onChange={e => onChange(`${e.target.value}:${mm}`)} style={{ ...selSt, borderColor: err ? '#fca5a5' : '#e2e8f0' }}>
          {Array.from({length:24},(_,i)=>String(i).padStart(2,'0')).map(h=><option key={h} value={h}>{h}</option>)}
        </select>
        <span style={{ fontSize:11 }}>시</span>
        <select value={mm} onChange={e => onChange(`${hh}:${e.target.value}`)} style={{ ...selSt, borderColor: err ? '#fca5a5' : '#e2e8f0' }}>
          {Array.from({length:60},(_,i)=>String(i).padStart(2,'0')).map(m=><option key={m} value={m}>{m}</option>)}
        </select>
        <span style={{ fontSize:11 }}>분</span>
      </div>
    );
  };

  const hasActualEdit  = !!(editForm.actualStartTime && editForm.actualEndTime && editForm.actualStartTime < editForm.actualEndTime);
  const hasPlannedEdit = !!(editForm.plannedStartTime && editForm.plannedEndTime && editForm.plannedStartTime < editForm.plannedEndTime);
  const canSave = editForm.consultStatus === 'unable' || hasActualEdit || hasPlannedEdit;

  return (
    <div onClick={e => e.stopPropagation()} style={{ position:'fixed', left:x, top:y, zIndex:301, width:400, background:'#ffffff', border:'1px solid #93c5fd', borderRadius:8, boxShadow:'0 12px 40px rgba(37,99,235,0.18)', overflow:'hidden', userSelect:'none' }}>
      {/* 헤더 */}
      <div style={{ background: isEditing ? 'linear-gradient(90deg,#0f2744,#1a3a5c)' : 'linear-gradient(90deg,#1e40af,#2563eb)', padding:'7px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <User size={11} color="#bfdbfe" />
          <span style={{ fontSize:12, fontWeight:700, color:'#fff' }}>{rec?.name ?? '-'}</span>
          <span style={{ width:1, height:11, background:'rgba(255,255,255,0.3)', display:'inline-block', margin:'0 2px' }} />
          <span style={{ fontSize:12, color:'#bfdbfe' }}>{visit.date}</span>
          {isEditing
            ? <span style={{ fontSize:12, padding:'1px 7px', borderRadius:10, background:'rgba(253,186,116,0.25)', color:'#fed7aa', border:'1px solid rgba(253,186,116,0.5)', fontWeight:700 }}>수정 중</span>
            : <span style={{ fontSize:12, padding:'1px 7px', borderRadius:10, background:cs.bg, color:cs.text, border:`1px solid ${cs.border}`, fontWeight:700 }}>{cs.label}</span>
          }
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <button onClick={onClose} style={closeBtn}><X size={10} color="#e0eaff" strokeWidth={2.5} /></button>
        </div>
      </div>

      {isEditing ? (
        /* ── 수정 모드 ───────────────────────────────────────────────── */
        <div style={{ padding:'13px 14px', display:'flex', flexDirection:'column', gap:11 }}>

          {/* 방문불가 토글 */}
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <span style={{ fontSize:11, color:'#64748b' }}>방문불가 처리:</span>
            <button
              onClick={() => setEditForm(f => ({
                ...f,
                consultStatus: f.consultStatus === 'unable' ? 'planned' : 'unable',
                plannedStartTime: f.consultStatus === 'unable' ? (f.plannedStartTime || '10:00') : '',
                plannedEndTime:   f.consultStatus === 'unable' ? (f.plannedEndTime   || '10:30') : '',
                actualStartTime:  '',
                actualEndTime:    '',
              }))}
              style={{ padding:'3px 12px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700,
                background: editForm.consultStatus === 'unable' ? CSTATUS['unable'].bg : '#f8fafc',
                color:      editForm.consultStatus === 'unable' ? CSTATUS['unable'].text : '#64748b',
                border:     `1.5px solid ${editForm.consultStatus === 'unable' ? CSTATUS['unable'].border : '#e2e8f0'}` }}>
              {editForm.consultStatus === 'unable' ? '✓ 방문불가' : '방문불가'}
            </button>
          </div>

          {/* 예정·완료 시간 (방문불가일 때 숨김) */}
          {editForm.consultStatus !== 'unable' && <>

          {/* 예정 시간 */}
          <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:6, padding:'7px 10px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#2563eb', display:'flex', alignItems:'center', gap:3 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#3b82f6', display:'inline-block' }} />상담 예정 시간
              </div>
              {(editForm.plannedStartTime || editForm.plannedEndTime) && (
                <button onClick={() => setEditForm(f => ({...f, plannedStartTime:'', plannedEndTime:''}))}
                  style={{ fontSize:11, color:'#dc2626', background:'none', border:'none', cursor:'pointer' }}>삭제</button>
              )}
            </div>
            {(editForm.plannedStartTime || editForm.plannedEndTime) ? (
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, color:'#64748b' }}>시작</span>
                  {editTimeSel(editForm.plannedStartTime || '10:00', v => setEditForm(f => ({...f, plannedStartTime:v})))}
                  <span style={{ fontSize:11, color:'#64748b' }}>종료</span>
                  {editTimeSel(editForm.plannedEndTime || '11:00', v => setEditForm(f => ({...f, plannedEndTime:v})), !!(editForm.plannedEndTime && editForm.plannedStartTime >= editForm.plannedEndTime))}
                </div>
                <button onClick={() => setEditForm(f => ({...f, plannedEndTime: addMin(f.plannedStartTime || '10:00', 30)}))}
                  style={{ alignSelf:'flex-start', fontSize:11, padding:'2px 10px', borderRadius:4, cursor:'pointer', background:'#dbeafe', color:'#1d4ed8', border:'1px solid #93c5fd', fontWeight:600 }}>
                  30분
                </button>
              </div>
            ) : (
              <button onClick={() => setEditForm(f => ({...f, plannedStartTime:'10:00', plannedEndTime:'11:00'}))}
                style={{ fontSize:12, padding:'4px 12px', borderRadius:5, cursor:'pointer', background:'#dbeafe', color:'#2563eb', border:'1px solid #93c5fd' }}>
                + 예정시간 입력
              </button>
            )}
          </div>

          {/* 완료 시간 */}
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:6, padding:'7px 10px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#059669', display:'flex', alignItems:'center', gap:3 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', display:'inline-block' }} />상담 완료 시간 <span style={{ fontSize:11, color:'#94a3b8', fontWeight:400 }}>(있으면 완료)</span>
              </div>
              {(editForm.actualStartTime || editForm.actualEndTime) && (
                <button onClick={() => setEditForm(f => ({...f, actualStartTime:'', actualEndTime:''}))}
                  style={{ fontSize:11, color:'#dc2626', background:'none', border:'none', cursor:'pointer' }}>삭제</button>
              )}
            </div>
            {(editForm.actualStartTime || editForm.actualEndTime) ? (
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, color:'#64748b' }}>시작</span>
                  {editTimeSel(editForm.actualStartTime || '10:00', v => setEditForm(f => ({...f, actualStartTime:v})))}
                  <span style={{ fontSize:11, color:'#64748b' }}>종료</span>
                  {editTimeSel(editForm.actualEndTime || '11:00', v => setEditForm(f => ({...f, actualEndTime:v})), !!(editForm.actualEndTime && editForm.actualStartTime >= editForm.actualEndTime))}
                </div>
                <button onClick={() => setEditForm(f => ({...f, actualEndTime: addMin(f.actualStartTime || '10:00', 30)}))}
                  style={{ alignSelf:'flex-start', fontSize:11, padding:'2px 10px', borderRadius:4, cursor:'pointer', background:'#dcfce7', color:'#15803d', border:'1px solid #6ee7b7', fontWeight:600 }}>
                  30분
                </button>
              </div>
            ) : (
              <button onClick={() => setEditForm(f => ({...f, actualStartTime:'10:00', actualEndTime:'11:00'}))}
                style={{ fontSize:12, padding:'4px 12px', borderRadius:5, cursor:'pointer', background:'#dcfce7', color:'#059669', border:'1px solid #6ee7b7' }}>
                + 완료시간 입력
              </button>
            )}
          </div>

          </>}

          {/* 메모 */}
          <FormRow label="메모">
            <AutoTA minRows={2} value={editForm.notes} onChange={e => setEditForm(f => ({...f, notes:e.target.value}))} style={{ ...inputStyle, padding:'5px 8px', lineHeight:1.5 }} />
          </FormRow>

          <div style={{ display:'flex', justifyContent:'flex-end', gap:7, borderTop:'1px solid #e8f0fe', paddingTop:10 }}>
            <button onClick={() => setIsEditing(false)} style={cancelBtn}>취소</button>
            <button onClick={handleSave} disabled={!canSave} style={{ padding:'6px 18px', borderRadius:6, fontSize:12, fontWeight:600, cursor:canSave?'pointer':'not-allowed', background:canSave?'linear-gradient(135deg,#2563eb,#1d4ed8)':'#e2e8f0', color:canSave?'#fff':'#94a3b8', border:'none' }}>저장</button>
          </div>
        </div>
      ) : (
        /* ── 상세 보기 모드 ──────────────────────────────────────────── */
        <>
          {/* 정보 테이블 */}
          <div style={{ padding:'10px 12px 0' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <tbody>
                <tr>
                  <InfoTH>담당 상담직원</InfoTH>
                  <InfoTD colSpan={3}>{sw?.name}{sw?.positionCode ? <span style={{ marginLeft: 5, fontSize: 12, padding: '1px 5px', borderRadius: 8, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>{POSITION_CODES[sw.positionCode]}</span> : ''}</InfoTD>
                </tr>
                <tr>
                  <InfoTH>수급등급</InfoTH>
                  <InfoTD>{rec ? getGradeText(rec) : ''} ({rec ? getReduction(rec) : ''})</InfoTD>
                  <InfoTH>상담여부</InfoTH>
                  <InfoTD><span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:7, height:7, borderRadius:'50%', background:cs.dot, display:'inline-block', flexShrink:0 }} /><span style={{ color:cs.text, fontWeight:700 }}>{cs.label}</span></span></InfoTD>
                </tr>
                <tr>
                  <InfoTH><MapPin size={9} style={{ display:'inline', marginRight:2 }} />주소</InfoTH>
                  <InfoTD colSpan={3}>{rec?.address}</InfoTD>
                </tr>
                <tr>
                  <InfoTH><Phone size={9} style={{ display:'inline', marginRight:2 }} />연락처</InfoTH>
                  <InfoTD>{rec ? getMobile(rec) : ''}</InfoTD>
                  <InfoTH>보호자</InfoTH>
                  <InfoTD>{(()=>{const g=rec?getGuardians(rec)[0]:undefined;return g?`${g.name} (${g.mobile})`:'';})()}</InfoTD>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 시간 정보 */}
          <div style={{ padding:'8px 12px 0' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:6, padding:'6px 10px' }}>
                <div style={{ fontSize:12, color:'#2563eb', fontWeight:700, marginBottom:3, display:'flex', alignItems:'center', gap:3 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#3b82f6', display:'inline-block' }} />상담 예정 시간
                </div>
                <div style={{ fontSize:12, color:'#1e40af', fontWeight:600 }}>
                  {visit.plannedStartTime}{visit.plannedEndTime ? ` ~ ${visit.plannedEndTime}` : ''}
                </div>
              </div>
              <div style={{ background: visit.actualStartTime ? '#f0fdf4' : '#f8fafc', border:`1px solid ${visit.actualStartTime ? '#bbf7d0' : '#e2e8f0'}`, borderRadius:6, padding:'6px 10px' }}>
                <div style={{ fontSize:12, color: visit.actualStartTime ? '#059669' : '#94a3b8', fontWeight:700, marginBottom:3, display:'flex', alignItems:'center', gap:3 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background: visit.actualStartTime ? '#10b981' : '#e2e8f0', display:'inline-block' }} />상담 완료 시간
                </div>
                <div style={{ fontSize:12, color: visit.actualStartTime ? '#065f46' : '#94a3b8', fontWeight:600 }}>
                  {visit.actualStartTime ? `${visit.actualStartTime}${visit.actualEndTime ? ` ~ ${visit.actualEndTime}` : ''}` : '미입력'}
                </div>
              </div>
            </div>
          </div>

          {/* 해당일 급여일정 */}
          {(() => {
            const [y, m] = visit.date.split('-').map(Number);
            const dayScheds = getSchedulesForRecipient(visit.recipientId, y, m)
              .filter(s => s.date === visit.date)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            const plans   = dayScheds.filter(s => s.kind === 'plan');
            const claims  = dayScheds.filter(s => s.kind === 'claim');
            if (dayScheds.length === 0) return null;
            const rowSt: CSSProperties = { display:'flex', alignItems:'center', gap:6, fontSize:11, padding:'2px 0' };
            const kindBox = (scheds: typeof dayScheds, label: string, bg: string, color: string, border: string) => (
              scheds.length > 0 && (
                <div style={{ flex:1, background:bg, border:`1px solid ${border}`, borderRadius:5, padding:'5px 8px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color, marginBottom:3 }}>{label}</div>
                  {scheds.map(s => {
                    const cw = getCareWorker(s.careWorkerId);
                    return (
                      <div key={s.id} style={rowSt}>
                        <span style={{ fontSize:10, padding:'1px 5px', borderRadius:3, background:'#fff', border:`1px solid ${border}`, color, fontWeight:600, whiteSpace:'nowrap' }}>{SERVICE_LABELS[s.serviceType]}</span>
                        <span style={{ color:'#374151', fontWeight:600 }}>{s.startTime}~{s.endTime}</span>
                        <span style={{ color:'#64748b' }}>{cw?.name ?? '-'}</span>
                      </div>
                    );
                  })}
                </div>
              )
            );
            return (
              <div style={{ padding:'8px 12px 0' }}>
                <div style={{ fontSize:11, color:'#64748b', fontWeight:600, marginBottom:4, display:'flex', alignItems:'center', gap:3 }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:'#94a3b8', display:'inline-block' }} />해당일 급여일정
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  {kindBox(plans,  '계획', '#eff6ff', '#1e40af', '#bfdbfe')}
                  {kindBox(claims, '청구', '#f0fdf4', '#065f46', '#bbf7d0')}
                </div>
              </div>
            );
          })()}

          {/* 메모 */}
          <div style={{ padding:'8px 12px 0' }}>
            <div style={{ fontSize:12, color:'#64748b', fontWeight:600, marginBottom:3 }}>
              <FileText size={9} style={{ display:'inline', marginRight:3 }} />메모
            </div>
            <div style={{ fontSize:12, color: visit.notes ? '#374151' : '#94a3b8', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:5, padding:'5px 8px', lineHeight:1.5, fontStyle: visit.notes ? 'normal' : 'italic' }}>
              {visit.notes || '없음'}
            </div>
          </div>

          {/* 업무수행일지 바 */}
          <div style={{ margin:'8px 12px 0', padding:'7px 10px', borderRadius:6, background:journalStatus==='completed'?'#f0fdf4':journalStatus==='draft'?'#fffbeb':'#f8fafc', border:`1px solid ${journalStatus==='completed'?'#bbf7d0':journalStatus==='draft'?'#fde68a':'#e2e8f0'}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <BookOpen size={11} color={journalStatus==='completed'?'#059669':journalStatus==='draft'?'#d97706':'#94a3b8'} />
              <span style={{ fontSize:12, fontWeight:600, color:journalStatus?'#059669':'#94a3b8' }}>업무수행일지</span>
              <span style={{ fontSize:12, padding:'1px 6px', borderRadius:10, fontWeight:700, borderWidth:1, borderStyle:'solid', ...(journalStatus ? {background:'#d1fae5',color:'#059669',borderColor:'#6ee7b7'} : {background:'#f1f5f9',color:'#94a3b8',borderColor:'#e2e8f0'}) }}>
                {journalStatus ? '작성' : '미작성'}
              </span>
            </div>
            <button onClick={e => onOpenJournal(visit, e as unknown as MouseEvent)} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:600, color:'#fff', border:'none', background: journalStatus === 'completed' ? 'linear-gradient(135deg,#059669,#047857)' : journalStatus === 'draft' ? 'linear-gradient(135deg,#d97706,#b45309)' : 'linear-gradient(135deg,#0f2744,#1a3a5c)' }}>
              <Pencil size={10} />편집
            </button>
          </div>

          {/* 버튼 */}
          <div style={{ padding:'10px 12px 12px', display:'flex', justifyContent:'flex-end', gap:6, borderTop:'1px solid #e8f0fe', marginTop:10 }}>
            <button onClick={() => setIsEditing(true)} style={{ ...actionBtn, background:'#eff6ff', color:'#2563eb', border:'1px solid #93c5fd' }}><CheckCircle2 size={11} /> 수정</button>
            <button onClick={onClose} style={{ ...actionBtn, background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0' }}>닫기</button>
            <button onClick={() => onDelete(visit.id)} style={{ ...actionBtn, background:'#fee2e2', color:'#991b1b', border:'1px solid #fca5a5' }}>삭제</button>
          </div>
        </>
      )}
    </div>
  );
}

// (JournalModal moved to JournalModal.tsx)

// ── 공통 ──────────────────────────────────────────────────────────────────────
function StatChip({ color, bg, border, label, count }: { color:string; bg:string; border:string; label:string; count:number }) {
  return <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, padding:'2px 8px', borderRadius:10, background:bg, color, border:`1px solid ${border}` }}><span style={{ fontWeight:700 }}>{count}</span><span>{label}</span></div>;
}
function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ display:'flex', flexDirection:'column', gap:4 }}><label style={{ fontSize:12, fontWeight:700, color:'#64748b' }}>{label}</label>{children}</div>;
}
function InfoTH({ children }: { children: React.ReactNode }) {
  return <td style={{ background:'#f1f5f9', color:'#475569', fontWeight:600, fontSize:12, padding:'4px 8px', whiteSpace:'nowrap', border:'1px solid #e2e8f0', width:90 }}>{children}</td>;
}
function InfoTD({ children, colSpan }: { children: React.ReactNode; colSpan?: number }) {
  return <td colSpan={colSpan} style={{ fontSize:12, color:'#1e293b', padding:'4px 8px', border:'1px solid #e2e8f0' }}>{children}</td>;
}

// ── 수급자 일정 조회 팝업 (조회 전용) ─────────────────────────────────────────
const SVC_CHIP: Record<string, { bg: string; c: string }> = {
  visit_care:    { bg:'#dbeafe', c:'#1d4ed8' },
  visit_bath:    { bg:'#d1fae5', c:'#065f46' },
  visit_nursing: { bg:'#fff7ed', c:'#c2410c' },
  day_care:      { bg:'#f3e8ff', c:'#6d28d9' },
  family_care:   { bg:'#e0f2fe', c:'#0369a1' },
  full_day_visit:{ bg:'#e0e7ff', c:'#4338ca' },
};
function SchedViewPopup({ recipId, initYear, initMonth, onClose }: {
  recipId: string; initYear: number; initMonth: number; onClose: () => void;
}) {
  const [yr, setYr] = useState(initYear);
  const [mo, setMo] = useState(initMonth);
  const recip = getRecipient(recipId);
  const scheds = getSchedulesForRecipient(recipId, yr, mo).filter(s => s.kind !== 'claim');

  const weeks = calendarWeeks(yr, mo);
  const todayStr = new Date().toISOString().slice(0, 10);

  const prevMo = () => { if (mo === 1) { setYr(y=>y-1); setMo(12); } else setMo(m=>m-1); };
  const nextMo = () => { if (mo === 12) { setYr(y=>y+1); setMo(1); } else setMo(m=>m+1); };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:10, width:'min(92vw,680px)', maxHeight:'88vh', display:'flex', flexDirection:'column', boxShadow:'0 16px 48px rgba(0,0,0,0.28)', overflow:'hidden' }}
        onClick={e=>e.stopPropagation()}>

        {/* 헤더 */}
        <div style={{ background:'linear-gradient(135deg,#0f2744,#1a3a5c)', padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{recip?.name ?? recipId}</div>
            <span style={{ fontSize:10, padding:'1px 7px', borderRadius:8, background:'rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.7)' }}>일정 조회</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <button onClick={prevMo} style={{ ...navBtn, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.18)' }}><ChevronLeft size={13} color="#fff"/></button>
            <span style={{ fontSize:13, fontWeight:700, color:'#fff', minWidth:72, textAlign:'center' }}>{yr}년 {mo}월</span>
            <button onClick={nextMo} style={{ ...navBtn, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.18)' }}><ChevronRight size={13} color="#fff"/></button>
            <button onClick={onClose} style={{ ...closeBtn, marginLeft:6 }}><X size={12} color="#fff"/></button>
          </div>
        </div>

        {/* 캘린더 */}
        <div style={{ flex:1, overflow:'auto', padding:'10px 12px' }}>
          {/* 요일 헤더 */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
            {['일','월','화','수','목','금','토'].map((d,i) => (
              <div key={d} style={{ textAlign:'center', fontSize:12, fontWeight:700, padding:'4px 0',
                color: i===0 ? '#ef4444' : i===6 ? '#2563eb' : '#64748b' }}>{d}</div>
            ))}
          </div>
          {/* 주 */}
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:2 }}>
              {week.map((day, di) => {
                if (!day) return <div key={di} style={{ minHeight:80, background:'#f8fafc', borderRadius:5 }} />;
                const ds = dateStr(yr, mo, day);
                const isToday = ds === todayStr;
                const daySc = scheds.filter(s => s.date === ds).sort((a,b)=>a.startTime.localeCompare(b.startTime));
                return (
                  <div key={di} style={{ minHeight:80, background: isToday ? '#eff6ff' : '#fff', border:`1px solid ${isToday?'#93c5fd':'#e4eaf3'}`, borderRadius:5, padding:'3px 4px', overflow:'hidden' }}>
                    <div style={{ fontSize:12, fontWeight: isToday?700:400, color: di===0?'#ef4444': di===6?'#2563eb': isToday?'#1d4ed8':'#475569', marginBottom:2 }}>{day}</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                      {daySc.map(s => {
                        const chip = SVC_CHIP[s.serviceType] ?? { bg:'#f1f5f9', c:'#475569' };
                        const worker = getCareWorker(s.careWorkerId);
                        return (
                          <div key={s.id} style={{ borderRadius:3, padding:'2px 4px', background:chip.bg, border:`1px solid ${chip.c}40` }}>
                            <div style={{ fontSize:12, fontWeight:700, color:chip.c, lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {SERVICE_LABELS[s.serviceType as keyof typeof SERVICE_LABELS]}
                            </div>
                            <div style={{ fontSize:12, color:'#64748b', lineHeight:1.3 }}>{s.startTime}~{s.endTime}</div>
                            {worker && <div style={{ fontSize:12, color:'#94a3b8', lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{worker.name}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {scheds.length === 0 && (
            <div style={{ textAlign:'center', padding:'32px 0', fontSize:12, color:'#94a3b8' }}>이 달의 일정이 없습니다.</div>
          )}
        </div>

        {/* 하단 통계 */}
        <div style={{ flexShrink:0, borderTop:'1px solid #e2e8f0', padding:'7px 14px', background:'#f8fafc', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <span style={{ fontSize:12, color:'#64748b' }}>계획 총 <strong style={{ color:'#0f172a' }}>{scheds.length}</strong>건</span>
          {Object.entries(
            scheds.reduce((acc, s) => { acc[s.serviceType] = (acc[s.serviceType]??0)+1; return acc; }, {} as Record<string,number>)
          ).map(([svc, cnt]) => {
            const chip = SVC_CHIP[svc] ?? { bg:'#f1f5f9', c:'#475569' };
            return <span key={svc} style={{ fontSize:12, padding:'1px 7px', borderRadius:8, background:chip.bg, color:chip.c, fontWeight:600 }}>
              {SERVICE_LABELS[svc as keyof typeof SERVICE_LABELS]} {cnt}건
            </span>;
          })}
          <button onClick={onClose} style={{ marginLeft:'auto', padding:'4px 14px', fontSize:12, borderRadius:5, border:'1px solid #e2e8f0', background:'#fff', color:'#64748b', cursor:'pointer' }}>닫기</button>
        </div>
      </div>
    </div>
  );
}

const navBtn: CSSProperties   = { width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #e2e8f0', borderRadius:5, background:'#f8fafc', cursor:'pointer', padding:0 };
const closeBtn: CSSProperties = { width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:4, cursor:'pointer', padding:0 };
const inputStyle: CSSProperties = { width:'100%', height:32, padding:'0 8px', boxSizing:'border-box', border:'1px solid #e2e8f0', borderRadius:6, fontSize:12, outline:'none', background:'#f8fafc', color:'#1e293b' };
const cancelBtn: CSSProperties = { padding:'6px 14px', borderRadius:6, fontSize:12, fontWeight:500, cursor:'pointer', background:'#f1f5f9', color:'#64748b', border:'1px solid #e2e8f0' };
const actionBtn: CSSProperties = { display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:5, fontSize:12, fontWeight:600, cursor:'pointer' };
