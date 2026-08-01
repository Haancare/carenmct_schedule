'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Search, User, Save, AlertTriangle, FileText, ClipboardList,
} from 'lucide-react';
import {
  fetchConsultWorkers,
  fetchConsultationVisits,
  fetchConsultationRecipients,
  fetchWorkJournals,
  fetchWorkJournal,
  createWorkJournal,
  updateWorkJournal,
} from '@/lib/api/consultation';
import { useRecipientGroups } from '@/features/payment-assignment/hooks/useRecipientGroups';
import {
  SERVICE_LABELS,
  getCertNo, getGradeNum, getGradeText, getServiceTypes, getReduction,
  toVisit, toUiRecipient, toUiWorker,
} from '../utils/helpers';
import type { ConsultationVisit, UiRecipient, UiWorker } from '../utils/helpers';
import { JournalFormBody } from './JournalModal';
import type { JournalStatus } from './JournalModal';

interface RecipientJournalTabProps {
  initialRecipId?: string;
}

interface RecipJournalEntry {
  id: string;
  visitId?: string;
  date: string;
  visitDate?: string;
  socialWorkerId?: string;
  data: Record<string, any>;
  status: JournalStatus;
}

type RecipJournalStore = Record<string, RecipJournalEntry[]>;

const pad2 = (n: number) => String(n).padStart(2, '0');
const TODAY = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
})();

const GRADE_COLOR: Record<number, { bg: string; c: string }> = {
  1: { bg: '#fef2f2', c: '#dc2626' },
  2: { bg: '#fff7ed', c: '#ea580c' },
  3: { bg: '#fffbeb', c: '#d97706' },
  4: { bg: '#f0fdf4', c: '#16a34a' },
  5: { bg: '#eff6ff', c: '#2563eb' },
};

export function RecipientJournalTab({ initialRecipId }: RecipientJournalTabProps) {
  const now0 = new Date();
  const { groups: recipientGroups } = useRecipientGroups();
  const [workers, setWorkers] = useState<UiWorker[]>([]);
  const [recipList, setRecipList] = useState<UiRecipient[]>([]);
  const [visits, setVisits] = useState<ConsultationVisit[]>([]);
  const [store, setStore] = useState<RecipJournalStore>({});
  const [selectedRecipId, setSelectedRecipId] = useState<string | null>(initialRecipId ?? null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [pendingVisit, setPendingVisit] = useState<ConsultationVisit | null>(null);
  const [isNewEntry, setIsNewEntry] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [entryStatus, setEntryStatus] = useState<JournalStatus>('completed');
  const [entryDate, setEntryDate] = useState(TODAY);
  const [authorId, setAuthorId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterSubGroup, setFilterSubGroup] = useState('all');
  const [filterSw, setFilterSw] = useState('all');
  const [filterSwStatus, setFilterSwStatus] = useState<'all' | 'active'>('all');
  const [filterRecipStatus, setFilterRecipStatus] = useState<'active' | 'all'>('all');
  const [filterMonthData, setFilterMonthData] = useState<'month' | 'all'>('month');
  const [year, setYear] = useState(now0.getFullYear());
  const [month, setMonth] = useState(now0.getMonth() + 1);
  const [showVisitPicker, setShowVisitPicker] = useState(false);
  const chipBarRef = useRef<HTMLDivElement>(null);

  const monthPfx = `${year}-${pad2(month)}`;
  function prevMonth() { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); }

  const groupOptions = [
    { id: 'all', label: '전체 그룹', subs: [] as { id: string; name: string }[] },
    ...recipientGroups.map(g => ({ id: g.id, label: g.name, subs: g.subgroups })),
  ];
  const curGroup = groupOptions.find(g => g.id === filterGroup) ?? groupOptions[0];

  useEffect(() => {
    fetchConsultWorkers(filterSwStatus)
      .then(list => {
        const mapped = list.map(toUiWorker);
        setWorkers(mapped);
        if (!authorId && mapped[0]) setAuthorId(mapped[0].id);
      })
      .catch(() => setWorkers([]));
  }, [filterSwStatus]);

  useEffect(() => {
    fetchConsultationVisits({ year, month })
      .then(list => setVisits(list.map(toVisit)))
      .catch(() => setVisits([]));
    fetchWorkJournals({ year, month })
      .then(async list => {
        const next: RecipJournalStore = {};
        for (const j of list) {
          const entry: RecipJournalEntry = {
            id: j.id,
            visitId: j.consultationVisitId ?? undefined,
            date: j.writtenDate,
            visitDate: j.writtenDate,
            socialWorkerId: j.employeeId,
            data: {},
            status: j.journalStatus,
          };
          if (!next[j.recipientId]) next[j.recipientId] = [];
          next[j.recipientId].push(entry);
        }
        for (const arr of Object.values(next)) {
          arr.sort((a, b) => b.date.localeCompare(a.date));
        }
        // visit date sync from visits
        const visitMap = new Map(
          (await fetchConsultationVisits({ year, month }).catch(() => [])).map(v => [v.id, v]),
        );
        for (const arr of Object.values(next)) {
          for (const e of arr) {
            if (e.visitId && visitMap.has(e.visitId)) {
              e.visitDate = visitMap.get(e.visitId)!.date;
            }
          }
        }
        setStore(next);
      })
      .catch(() => setStore({}));
  }, [year, month]);

  useEffect(() => {
    fetchConsultationRecipients({
      activeOnly: filterRecipStatus === 'active',
      query: search || undefined,
      gradeFilter: filterGrade,
      serviceFilter: filterService,
      groupId: filterGroup,
      subgroupId: filterSubGroup,
      year, month,
      hasSchedulesInMonth: filterMonthData === 'month' ? true : undefined,
    })
      .then(list => setRecipList(list.map(toUiRecipient)))
      .catch(() => setRecipList([]));
  }, [filterRecipStatus, search, filterGrade, filterService, filterGroup, filterSubGroup, filterMonthData, year, month]);

  useEffect(() => {
    if (!initialRecipId) return;
    setSelectedRecipId(initialRecipId);
    setShowVisitPicker(true);
  }, [initialRecipId]);

  const filteredRecips = [...recipList]
    .filter(r => {
      if (filterSw === 'all') return true;
      return visits.some(v =>
        v.recipientId === r.id && v.socialWorkerId === filterSw && v.date.startsWith(monthPfx),
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const sel = selectedRecipId ? recipList.find(r => r.id === selectedRecipId) ?? null : null;
  const selEntries: RecipJournalEntry[] = selectedRecipId ? (store[selectedRecipId] ?? []) : [];
  const selEntry = selectedEntryId ? selEntries.find(e => e.id === selectedEntryId) : null;

  function handleSelectRecip(recipId: string) {
    if (isDirty && !window.confirm('저장되지 않은 변경사항이 있습니다. 이동하시겠습니까?')) return;
    setSelectedRecipId(recipId);
    setSelectedEntryId(null);
    setPendingVisit(null);
    setIsNewEntry(false);
    setShowVisitPicker(true);
    setFormData({});
    setIsDirty(false);
  }

  async function handleSelectEntry(entry: RecipJournalEntry) {
    if (isDirty && !window.confirm('저장되지 않은 변경사항이 있습니다. 이동하시겠습니까?')) return;
    try {
      const detail = await fetchWorkJournal(entry.id);
      const next: RecipJournalEntry = {
        ...entry,
        data: detail.formData as Record<string, any>,
        status: detail.journalStatus,
        date: detail.writtenDate,
        socialWorkerId: detail.employeeId,
        visitId: detail.consultationVisitId ?? entry.visitId,
      };
      setStore(prev => {
        if (!selectedRecipId) return prev;
        const arr = (prev[selectedRecipId] ?? []).map(e => (e.id === entry.id ? next : e));
        return { ...prev, [selectedRecipId]: arr };
      });
      setSelectedEntryId(next.id);
      setIsNewEntry(false);
      setPendingVisit(null);
      setFormData({ ...next.data });
      setEntryStatus(next.status);
      setEntryDate(next.date);
      if (next.socialWorkerId) setAuthorId(next.socialWorkerId);
      setIsDirty(false);
      setShowVisitPicker(false);
    } catch (err) {
      console.error(err);
      window.alert('일지를 불러오지 못했습니다.');
    }
  }

  function handlePickVisit(visit: ConsultationVisit) {
    const existing = (store[visit.recipientId] ?? []).find(e => e.visitId === visit.id);
    if (existing) {
      void handleSelectEntry(existing);
      return;
    }
    if (visit.journalId) {
      void handleSelectEntry({
        id: visit.journalId,
        visitId: visit.id,
        date: visit.date,
        visitDate: visit.date,
        socialWorkerId: visit.socialWorkerId,
        data: {},
        status: (visit.journalStatus as JournalStatus) || 'draft',
      });
      return;
    }
    setSelectedEntryId(null);
    setIsNewEntry(true);
    setPendingVisit(visit);
    const plannedStart = visit.plannedStartTime || '10:00';
    const plannedEnd = visit.plannedEndTime || (() => {
      const [h, m] = plannedStart.split(':').map(Number);
      const total = h * 60 + m + 30;
      return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    })();
    setFormData({
      j_workDate: visit.date,
      j_startTime: plannedStart,
      j_endTime: plannedEnd,
    });
    setEntryStatus('completed');
    setEntryDate(visit.date);
    setAuthorId(visit.socialWorkerId);
    setIsDirty(false);
    setShowVisitPicker(false);
  }

  async function handleSave(overrideStatus?: JournalStatus) {
    if (!selectedRecipId) return;
    const finalStatus = overrideStatus ?? entryStatus;
    const employeeId = authorId || pendingVisit?.socialWorkerId || workers[0]?.id;
    if (!employeeId) {
      window.alert('상담직원을 선택하세요.');
      return;
    }
    const now = new Date();
    const writtenAt = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    try {
      if (isNewEntry && pendingVisit) {
        const created = await createWorkJournal({
          consultationVisitId: pendingVisit.id,
          recipientId: selectedRecipId,
          employeeId,
          journalStatus: finalStatus,
          writtenDate: entryDate || writtenAt,
          formData,
        });
        const newEntry: RecipJournalEntry = {
          id: created.id,
          visitId: pendingVisit.id,
          date: created.writtenDate,
          visitDate: pendingVisit.date,
          socialWorkerId: employeeId,
          data: { ...formData },
          status: created.journalStatus,
        };
        setStore(prev => {
          const arr = [newEntry, ...(prev[selectedRecipId] ?? [])].sort((a, b) => b.date.localeCompare(a.date));
          return { ...prev, [selectedRecipId]: arr };
        });
        setSelectedEntryId(created.id);
        setIsNewEntry(false);
        setPendingVisit(null);
      } else if (selectedEntryId) {
        await updateWorkJournal(selectedEntryId, {
          journalStatus: finalStatus,
          writtenDate: entryDate || writtenAt,
          formData,
        });
        setStore(prev => {
          const arr = (prev[selectedRecipId] ?? []).map(e =>
            e.id === selectedEntryId
              ? { ...e, date: entryDate, data: { ...formData }, status: finalStatus, socialWorkerId: employeeId }
              : e,
          ).sort((a, b) => b.date.localeCompare(a.date));
          return { ...prev, [selectedRecipId]: arr };
        });
      }
      // refresh visits (status may promote)
      const refreshed = await fetchConsultationVisits({ year, month });
      setVisits(refreshed.map(toVisit));
      setEntryStatus(finalStatus);
      setIsDirty(false);
      setSelectedEntryId(null);
      setIsNewEntry(false);
      setShowVisitPicker(true);
    } catch (err) {
      console.error(err);
      window.alert('일지 저장에 실패했습니다.');
    }
  }

  const handleSetFormData: React.Dispatch<React.SetStateAction<Record<string, any>>> = (action) => {
    setFormData(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      setIsDirty(true);
      return next;
    });
  };

  const workerForForm = workers.find(w => w.id === (authorId || pendingVisit?.socialWorkerId || selEntry?.socialWorkerId));

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#f0f4f8' }}>
      <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#fff', borderRight: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#0f2744 0%,#1a3a5c 100%)', padding: '8px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 6px' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', display: 'flex', alignItems: 'center', padding: '2px 4px' }}><ChevronLeft size={14} /></button>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{year}년 {month}월</span>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', display: 'flex', alignItems: 'center', padding: '2px 4px' }}><ChevronRight size={14} /></button>
          </div>
        </div>

        {(() => {
          const allMv = visits.filter(v => v.date.startsWith(monthPfx));
          const tPlanned = allMv.filter(v => v.consultStatus === 'planned').length;
          const tCompleted = allMv.filter(v => v.consultStatus === 'completed').length;
          const tUnable = allMv.filter(v => v.consultStatus === 'unable').length;
          const allEntries = Object.values(store).flat();
          const tWritten = allEntries.filter(e => (e.visitDate ?? e.date).startsWith(monthPfx) && e.status === 'completed').length;
          const tNone = Math.max(0, tCompleted - tWritten);
          const chip = (label: string, count: number, bg: string, color: string, border: string) => (
            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, padding: '2px 7px', borderRadius: 10, background: bg, color, border: `1px solid ${border}`, fontWeight: 700 }}>
              <span style={{ fontSize: 12, fontWeight: 800 }}>{count}</span>{label}
            </span>
          );
          return (
            <div style={{ flexShrink: 0, padding: '7px 10px 6px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 5 }}>기관전체 ({year}.{pad2(month)})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: '#94a3b8', flexShrink: 0 }}>상담</span>
                  {chip('완료', tCompleted, '#d1fae5', '#059669', '#6ee7b7')}
                  {chip('예정', tPlanned, '#dbeafe', '#1d4ed8', '#93c5fd')}
                  {chip('불가', tUnable, '#fff1f2', '#be123c', '#fda4af')}
                </div>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: '#94a3b8', flexShrink: 0 }}>일지</span>
                  {chip('작성', tWritten, '#d1fae5', '#059669', '#6ee7b7')}
                  {chip('미작성', tNone, '#f1f5f9', '#64748b', '#e2e8f0')}
                </div>
              </div>
            </div>
          );
        })()}

        <div style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 5, padding: '3px 8px' }}>
            <Search size={11} color="#94a3b8" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="수급자명 검색"
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 11, color: '#1e293b', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['active', 'all'] as const).map(v => (
              <button key={v} onClick={() => setFilterRecipStatus(v)}
                style={{ flex: 1, fontSize: 9, padding: '3px 0', borderRadius: 4, cursor: 'pointer', border: '1px solid',
                  borderColor: filterRecipStatus === v ? '#3b82f6' : '#e2e8f0',
                  background: filterRecipStatus === v ? '#eff6ff' : '#f8fafc',
                  color: filterRecipStatus === v ? '#1d4ed8' : '#64748b', fontWeight: filterRecipStatus === v ? 700 : 400 }}>
                {v === 'active' ? '수급중' : '전체수급자'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['month', 'all'] as const).map(v => (
              <button key={v} onClick={() => setFilterMonthData(v)}
                style={{ flex: 1, fontSize: 9, padding: '3px 0', borderRadius: 4, cursor: 'pointer', border: '1px solid',
                  borderColor: filterMonthData === v ? '#3b82f6' : '#e2e8f0',
                  background: filterMonthData === v ? '#eff6ff' : '#f8fafc',
                  color: filterMonthData === v ? '#1d4ed8' : '#64748b', fontWeight: filterMonthData === v ? 700 : 400 }}>
                {v === 'month' ? '해당월 방문급여제공있는 수급자' : '전체'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
              style={{ flex: 1, fontSize: 10, padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, outline: 'none', color: '#334155', background: '#fff' }}>
              <option value="all">등급 전체</option>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={String(n)}>{n}등급</option>)}
              <option value="in">인지지원</option>
            </select>
            <select value={filterService} onChange={e => setFilterService(e.target.value)}
              style={{ flex: 1, fontSize: 10, padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, outline: 'none', color: '#334155', background: '#fff' }}>
              <option value="all">급여유형 전체</option>
              {(['visit_care', 'visit_bath', 'visit_nursing', 'day_care'] as const).map(k => <option key={k} value={k}>{SERVICE_LABELS[k]}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <select value={filterGroup} onChange={e => { setFilterGroup(e.target.value); setFilterSubGroup('all'); }}
              style={{ flex: 1, fontSize: 10, padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, outline: 'none', color: '#334155', background: '#fff' }}>
              {groupOptions.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
            {curGroup.subs.length > 0 && (
              <select value={filterSubGroup} onChange={e => setFilterSubGroup(e.target.value)}
                style={{ flex: 1, fontSize: 10, padding: '3px 4px', border: '1px solid #dbeafe', borderRadius: 4, outline: 'none', color: '#1e40af', background: '#eff6ff' }}>
                <option value="all">전체</option>
                {curGroup.subs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>상담직원</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {(['all', 'active'] as const).map(v => (
                <button key={v} onClick={() => { setFilterSwStatus(v); setFilterSw('all'); }}
                  style={{ fontSize: 9, padding: '2px 7px', borderRadius: 3, cursor: 'pointer', border: '1px solid',
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
            style={{ width: '100%', fontSize: 10, padding: '3px 4px', border: '1px solid #e2e8f0', borderRadius: 4, outline: 'none', color: '#334155', background: '#fff' }}>
            <option value="all">전체</option>
            {workers
              .filter(s => filterSwStatus === 'all' || s.status === 'active')
              .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 18 }} /><col style={{ width: 72 }} /><col style={{ width: 28 }} />
              <col style={{ width: 30 }} /><col style={{ width: 26 }} /><col style={{ width: 26 }} /><col style={{ width: 26 }} /><col style={{ width: 30 }} />
            </colgroup>
            <thead>
              <tr>
                {['#', '이름', '등급', '예정', '완료', '불가', '작성', '미작성'].map((h, i) => (
                  <th key={i} style={{ position: 'sticky', top: 0, zIndex: 2, background: '#152e50', color: 'rgba(255,255,255,0.88)', fontWeight: 600, height: 26, textAlign: 'center', borderRight: i < 7 ? '1px solid rgba(255,255,255,0.1)' : 'none', padding: '0 2px', whiteSpace: 'nowrap', fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRecips.map((r, idx) => {
                const isSel = r.id === selectedRecipId;
                const gc = GRADE_COLOR[getGradeNum(r)] ?? { bg: '#f1f5f9', c: '#64748b' };
                const mv = visits.filter(v => v.recipientId === r.id && v.date.startsWith(monthPfx));
                const planned = mv.filter(v => v.consultStatus === 'planned').length;
                const completed = mv.filter(v => v.consultStatus === 'completed').length;
                const unable = mv.filter(v => v.consultStatus === 'unable').length;
                const entries = store[r.id] ?? [];
                const written = entries.filter(e => (e.visitDate ?? e.date).startsWith(monthPfx) && e.status === 'completed').length
                  || mv.filter(v => v.hasJournal && v.journalStatus === 'completed').length;
                const unwritten = Math.max(0, completed - written);
                const rowBg = isSel ? '#eff6ff' : idx % 2 === 0 ? '#ffffff' : '#f4f7fb';
                const tdS = { height: 30, padding: '0 3px', textAlign: 'center' as const, borderBottom: '1px solid #e4eaf3', borderRight: '1px solid rgba(21,46,80,0.08)', background: rowBg, verticalAlign: 'middle' as const };
                const numCell = (n: number, color: string) => n > 0
                  ? <span style={{ fontSize: 11, fontWeight: 700, color }}>{n}</span>
                  : <span style={{ fontSize: 10, color: '#cbd5e1' }}>-</span>;
                return (
                  <tr key={r.id} onClick={() => handleSelectRecip(r.id)} style={{ cursor: 'pointer', borderLeft: `3px solid ${isSel ? '#2563eb' : 'transparent'}` }}>
                    <td style={{ ...tdS, color: '#94a3b8', fontSize: 10 }}>{idx + 1}</td>
                    <td style={{ ...tdS, textAlign: 'left', fontWeight: isSel ? 700 : 500, color: isSel ? '#1e40af' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{r.name}</td>
                    <td style={{ ...tdS }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '1px 3px', borderRadius: 3, background: gc.bg, color: gc.c, fontSize: 10, fontWeight: 700, border: `1px solid ${gc.c}40`, whiteSpace: 'nowrap' }}>
                        {(() => { const n = getGradeNum(r); return (n >= 1 && n <= 5) ? n : '인'; })()}
                      </span>
                    </td>
                    <td style={{ ...tdS }}>{numCell(planned, '#2563eb')}</td>
                    <td style={{ ...tdS }}>{numCell(completed, '#059669')}</td>
                    <td style={{ ...tdS }}>{numCell(unable, '#be123c')}</td>
                    <td style={{ ...tdS }}>{numCell(written, '#059669')}</td>
                    <td style={{ ...tdS, borderRight: 'none' }}>{numCell(unwritten, '#dc2626')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!sel ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={32} color="#cbd5e1" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#64748b' }}>수급자를 선택하세요</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>목록에서 수급자를 클릭하면 방문상담일지를 관리할 수 있습니다</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <FileText size={13} color="#94a3b8" />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>방문상담일지</span>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {(() => {
            const mv = visits.filter(v => v.recipientId === sel.id && v.date.startsWith(monthPfx));
            const mPlanned = mv.filter(v => v.consultStatus === 'planned').length;
            const mCompleted = mv.filter(v => v.consultStatus === 'completed').length;
            const mEntries = selEntries.filter(e => (e.visitDate ?? e.date).startsWith(monthPfx));
            const mWritten = mEntries.filter(e => e.status === 'completed').length
              || mv.filter(v => v.hasJournal && v.journalStatus === 'completed').length;
            const mUnwritten = Math.max(0, mCompleted - mWritten);
            return (
              <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={18} color="#2563eb" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{sel.name}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: (GRADE_COLOR[getGradeNum(sel)] ?? { bg: '#f1f5f9' }).bg, color: (GRADE_COLOR[getGradeNum(sel)] ?? { c: '#64748b' }).c, fontWeight: 700 }}>{getGradeText(sel)}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 600 }}>{getReduction(sel)}</span>
                    {getServiceTypes(sel).map(st => (
                      <span key={st} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 8, background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe' }}>{SERVICE_LABELS[st]}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                    {getCertNo(sel)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8', marginRight: 2 }}>{year}.{pad2(month)}</span>
                  {[
                    { label: '상담예정', val: mPlanned, color: '#2563eb' },
                    { label: '완료', val: mCompleted, color: '#059669' },
                    { label: '작성', val: mWritten, color: '#059669' },
                    { label: '미작성', val: mUnwritten, color: '#dc2626' },
                  ].map((item, i) => (
                    <React.Fragment key={item.label}>
                      {i > 0 && <div style={{ width: 1, height: 28, background: '#e2e8f0' }} />}
                      <div style={{ textAlign: 'center', minWidth: 32 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: item.val > 0 ? item.color : '#94a3b8' }}>{item.val}</div>
                        <div style={{ fontSize: 9, color: '#94a3b8' }}>{item.label}</div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          })()}

          {showVisitPicker && sel && (() => {
            const monthVisits = visits
              .filter(v => v.recipientId === sel.id && v.date.startsWith(monthPfx))
              .sort((a, b) => a.date.localeCompare(b.date));
            return (
              <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: '#f0f4f8', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>상담일정 선택</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{year}년 {month}월 · {sel.name} · 일지를 작성할 상담일정을 선택하세요</div>
                </div>

                {monthVisits.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={24} color="#cbd5e1" />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>상담일정(예정/완료/불가)이 없습니다</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 1.6 }}>방문상담 일정관리에서 먼저 일정 등록을 해야<br />업무수행일지 작성이 가능합니다</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {monthVisits.map(v => {
                      const existEntry = (store[sel.id] ?? []).find(e => e.visitId === v.id)
                        || (v.journalId ? { id: v.journalId, visitId: v.id, date: v.date, visitDate: v.date, socialWorkerId: v.socialWorkerId, data: {}, status: (v.journalStatus as JournalStatus) || 'draft' } : undefined);
                      const hasJournal = !!(existEntry || v.hasJournal);
                      const isComp = v.consultStatus === 'completed';
                      const sw = workers.find(s => s.id === v.socialWorkerId);
                      const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][new Date(v.date).getDay()];
                      return (
                        <div key={v.id} style={{ background: '#fff', border: `1.5px solid ${hasJournal ? '#e2e8f0' : '#bfdbfe'}`, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                          <div style={{ flexShrink: 0, textAlign: 'center', width: 52, background: isComp ? '#f0fdf4' : '#eff6ff', borderRadius: 8, padding: '8px 0' }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: isComp ? '#059669' : '#2563eb', lineHeight: 1 }}>{v.date.slice(8)}</div>
                            <div style={{ fontSize: 10, color: isComp ? '#6ee7b7' : '#93c5fd', marginTop: 2 }}>{v.date.slice(5, 7)}월 {dayOfWeek}요일</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 700,
                                background: isComp ? '#d1fae5' : '#dbeafe',
                                color: isComp ? '#059669' : '#2563eb',
                                border: `1px solid ${isComp ? '#6ee7b7' : '#93c5fd'}` }}>
                                {isComp ? '완료' : v.consultStatus === 'unable' ? '불가' : '예정'}
                              </span>
                              {hasJournal && (
                                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 700, background: '#d1fae5', color: '#059669', border: '1px solid #6ee7b7' }}>
                                  일지 작성완료
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 13, color: '#64748b' }}>
                              담당: <span style={{ fontWeight: 600, color: '#374151' }}>{sw?.name ?? '-'}</span>
                              {v.plannedStartTime && <span style={{ marginLeft: 10 }}>예정: {v.plannedStartTime}{v.plannedEndTime ? ` ~ ${v.plannedEndTime}` : ''}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => hasJournal && existEntry ? handleSelectEntry(existEntry) : handlePickVisit(v)}
                            style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700,
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

          {!showVisitPicker && (selectedEntryId || isNewEntry) ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: 14, background: '#f0f4f8' }}>
              <div style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      if (isDirty && !window.confirm('저장되지 않은 변경사항이 있습니다. 돌아가시겠습니까?')) return;
                      setShowVisitPicker(true); setSelectedEntryId(null); setIsNewEntry(false); setPendingVisit(null); setIsDirty(false);
                    }}
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                    ← 돌아가기
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>작성일</span>
                    <input
                      type="date"
                      value={entryDate}
                      onChange={e => { setEntryDate(e.target.value); setIsDirty(true); }}
                      style={{ fontSize: 12, border: '1px solid #d1d5db', background: '#f9fbff', color: '#1e293b', outline: 'none', padding: '3px 6px', borderRadius: 3, width: 130 }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>상담직원</span>
                    <select
                      value={authorId}
                      onChange={e => { setAuthorId(e.target.value); setIsDirty(true); }}
                      style={{ fontSize: 12, border: '1px solid #d1d5db', background: '#f9fbff', color: '#1e293b', outline: 'none', padding: '3px 6px', borderRadius: 3, minWidth: 90 }}
                    >
                      {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }} />
                  {isDirty && (
                    <span style={{ fontSize: 11, color: '#f97316', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={11} /> 미저장 변경사항 있음
                    </span>
                  )}
                  <button
                    onClick={() => handleSave('completed')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: isDirty ? '#2563eb' : '#f1f5f9',
                      color: isDirty ? '#fff' : '#94a3b8',
                      border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 12, fontWeight: 700,
                      cursor: isDirty ? 'pointer' : 'default', transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    <Save size={13} />
                    저장
                  </button>
                </div>

                <JournalFormBody
                  data={formData}
                  setData={handleSetFormData}
                  recipientId={sel.id}
                  socialWorkerId={authorId || pendingVisit?.socialWorkerId}
                  visitDate={pendingVisit?.date ?? selEntry?.visitDate ?? entryDate}
                  writtenAt={selEntry?.date}
                  recipient={sel}
                  worker={workerForForm}
                  defaultStartTime={pendingVisit?.plannedStartTime}
                  defaultEndTime={pendingVisit?.plannedEndTime}
                />
              </div>
            </div>
          ) : !showVisitPicker ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, background: '#f0f4f8' }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={26} color="#cbd5e1" />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>상담일정(예정/완료/불가)이 없습니다</div>
              <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 1.6 }}>방문상담 일정관리에서 먼저 일정 등록을 해야<br />업무수행일지 작성이 가능합니다</div>
            </div>
          ) : null}
        </div>
      )}
      <div ref={chipBarRef} style={{ display: 'none' }} />
    </div>
  );
}
