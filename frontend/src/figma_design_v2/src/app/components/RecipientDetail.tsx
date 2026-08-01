import { useState, useMemo, useEffect, useRef } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import {
  ChevronLeft, ChevronRight,
  Phone, MapPin,
  Printer, Download, ArrowLeft, X, Check, Plus, User, Calendar, Lock, Zap,
  StickyNote, Pencil, Award, Percent, Info, BarChart2, CalendarDays, ChevronDown, Search, ArrowUpRight,
} from 'lucide-react';
import { RecipientMemoPanel } from './RecipientMemoPanel';
import {
  getRecipient, getCareWorker, getSchedulesForRecipient,
  getCalendarWeeks, toDateStr, formatKRW,
  SERVICE_LABELS, SERVICE_SHORT,
  ScheduleEntry,
  recipients, getSchedules, careWorkers, getEmployeeBirth, POSITION_CODES,
  ServiceType, RecipientGrade,
  consultationVisits, socialWorkers, ConsultationVisit,
  getApprovedAmounts, getGuardians,
  getCertNo, getValidFrom, getValidTo, getMobile, getLegalDob, getReductionPill,
  getGradeNum, getGradeText, getReduction, getCopayRate, getServiceTypes,
  ReductionType, REDUCTION_OPTIONS,
  applySchedulePeriodChange, deriveGradeSegments, deriveReductionSegments,
  setEntrySnapshots, useSchedulesVersion,
  commitAddedSchedules, removeSchedules,
  setDayMemo,
  getAssignedWorkers, setAssignedWorkersBySvc,
  getFamilyRelations, setFamilyRelation, FAMILY_RELATIONS,
  getMonthlyLimit, calcLimitAwareSelfPay, calcFeeAmount, mutateScheduleFee,
  getFeeMinMinutes,
  calcCopayAmount, calcInsuranceAmount,
  getEntryBenefitTotal, getEntryCopayAmount, getEntryInsuranceAmount,
  isHoliday, calcSurcharge,
} from './mockData';

import {
  addDays, fmtMD,
  copayLabel, normalizeType, copayStyle, RATE_BY_REDUCTION,
  SVC_STYLE, TH,
  getScheduleTotalFee, buildSummary,
  parseWorkerDOB, checkSurcharge,
  CareWorkerCombo, PeriodChangeModal, WorkerScheduleModal,
  InfoCard, SectionTitle, ContactRow, InfoRow,
} from './RecipientHelpers';

const DAY_LABELS  = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

export function RecipientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const recipient = getRecipient(id ?? '');

  // URL 쿼리에서 초기값 읽기 (급여배정관리에서 클릭해서 들어온 경우)
  const initYear  = Number(sp.get('year')  || 2026);
  const initMonth = Number(sp.get('month') || 3);
  const initView  = (sp.get('view') === 'claim' ? 'claim' : 'plan') as 'plan' | 'claim';

  const [year, setYear]   = useState(initYear);
  const [month, setMonth] = useState(initMonth);
  // ── 메모 시스템 상태 ──────────────────────────
  const [memoOpen,    setMemoOpen]    = useState(false);
  const [memoCount,   setMemoCount]   = useState(0);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  // ── 등급/감경구분 변경 신청 모달 상태 (기간 분할) ──────────
  const [gradeModalOpen, setGradeModalOpen]         = useState(false);
  const [reductionModalOpen, setReductionModalOpen] = useState(false);
  const [gradeForm, setGradeForm]         = useState({ split: '', before: '', after: '', reason: '' });
  const [reductionForm, setReductionForm] = useState({ split: '', before: '', after: '', reason: '' });
  // 일정 entry 스냅샷이 단일 진실 소스 — 변경 시 재렌더용 버전 카운터.
  const schedulesVer = useSchedulesVersion();
  const [viewMode, setViewMode] = useState<'plan' | 'claim'>(initView);
  // 기본값 true — 계약구분 '수급중' 수급자는 일정 유무와 무관하게 기본 노출
  const [showAllActive, setShowAllActive] = useState(true);

  // ── 날짜별 한줄 메모 상태 ──────────────────
  const [dayMemoMap,      setDayMemoMap]      = useState<Record<string, string>>({});
  const [editingDayMemo,  setEditingDayMemo]  = useState<string | null>(null);
  const [dayMemoInput,    setDayMemoInput]    = useState('');

  // ── 수급자 목록 — 선택 항목 자동 스크롤 ref (useEffect는 listedRecipients 선언 이후에 위치) ──
  const listScrollRef   = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  // ── 집계 행 클릭 → 캘린더 카드 하이라이트 ──
  const [highlightedRowKey, setHighlightedRowKey] = useState<string | null>(null);
  const hlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 배정카드 팝오버 ──────────────────────
  const [cardPopover, setCardPopover] = useState<{ schedule: ScheduleEntry; x: number; y: number } | null>(null);
  useEffect(() => {
    if (!cardPopover) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setCardPopover(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cardPopover]);

  // ── 일정 추가 관련 상태 ──────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  // 담당 요양보호사 목록 (수급자 기초정보의 assignedCareWorkerIds 기반, 로컬 관리)
  // 급여종류별 독립 담당 목록 — serviceType → 담당 요양보호사/간호조무사 ID 배열
  // 수급자별로 영구 저장 (mockData._assignedWorkersStore)
  type AssignedMap = Record<string, string[]>;
  const [assignedWorkerMap, setAssignedWorkerMap] = useState<AssignedMap>(() =>
    id ? getAssignedWorkers(id) : {}
  );
  // 수급자 변경 시 해당 수급자의 저장된 담당 목록 로드
  useEffect(() => {
    setAssignedWorkerMap(id ? getAssignedWorkers(id) : {});
  }, [id]);
  // 현재 급여종류의 담당 목록 접근 헬퍼
  const curSvcWorkers = (svc: string) => assignedWorkerMap[svc] ?? [];
  const setCurSvcWorkers = (svc: string, fn: (prev: string[]) => string[]) => {
    setAssignedWorkerMap(prev => {
      const next = { ...prev, [svc]: fn(prev[svc] ?? []) };
      // 영구 저장소에도 반영
      if (id) setAssignedWorkersBySvc(id, svc, next[svc]);
      return next;
    });
  };
  // 가족요양 담당 요양보호사별 가족관계 (수급자별 영구 저장)
  const [familyRelationMap, setFamilyRelationMap] = useState<Record<string, string>>(() =>
    id ? getFamilyRelations(id) : {}
  );
  useEffect(() => { setFamilyRelationMap(id ? getFamilyRelations(id) : {}); }, [id]);
  const saveFamilyRelation = (workerId: string, relation: string) => {
    setFamilyRelationMap(prev => ({ ...prev, [workerId]: relation }));
    if (id) setFamilyRelation(id, workerId, relation);
  };
  // 담당 추가 시 가족관계 입력값
  const [addWorkerRelation, setAddWorkerRelation] = useState('');
  // 일정조회 모달 — 해당 요양보호사의 월간 일정을 달력으로 표시
  const [schedViewWorker, setSchedViewWorker] = useState<string | null>(null);
  // 팝오버 급여액 수정 상태
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [editingFeeVal, setEditingFeeVal] = useState('');
  // 담당 요양보호사 추가 인라인 선택 — 추가 버튼 클릭 시 콤보박스 표시
  const [showAddWorkerPicker, setShowAddWorkerPicker] = useState(false);
  const [addWorkerPickVal, setAddWorkerPickVal] = useState('');
  const [assignMode, setAssignMode] = useState(false);
  const [batchType, setBatchType] = useState('');
  // 특정요일 선택 팝업
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set()); // 0=일~6=토
  // 일괄삭제 패널
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [deleteTypes, setDeleteTypes] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    serviceType: 'visit_care' as ServiceType,
    careWorkerId: '',
    careWorkerId2: '', // 방문목욕 전용 두번째 요양보호사
    bathType: '차량이용(차량내)' as string, // 방문목욕 전용 차량이용 구분
    familyRelation: '' as string, // 가족요양 전용 가족관계
    startHour: '09', startMin: '00',
    endHour: '10', endMin: '30',
    durationMinutes: 90,
    grade: (recipient ? getGradeNum(recipient) : 3) as RecipientGrade,
    copaymentType: normalizeType(recipient ? getReduction(recipient) : '일반'),
    copaymentRate: recipient ? getCopayRate(recipient) : 15,
  });

  // 수급자 변경 시 폼·배정 상태 초기화
  useEffect(() => {
    setShowAddForm(false);
    setAssignMode(false);
    setBatchType('');
    setEditingDayMemo(null);
    setDayMemoInput('');
    const r = getRecipient(id ?? '');
    setFormData({
      serviceType: 'visit_care' as ServiceType,
      careWorkerId: '',
      careWorkerId2: '',
      startHour: '09', startMin: '00',
      endHour: '10', endMin: '30',
      durationMinutes: 90,
      unitCost: 20580,
      visitType: '천족' as string,
      distanceTransport: 0,
      holidayVisit: false,
      grade: (r ? getGradeNum(r) : 3) as RecipientGrade,
      copaymentType: normalizeType(r ? getReduction(r) : '일반'),
      copaymentRate: r ? getCopayRate(r) : 15,
    });
  }, [id]);

  // 폼에서 duration 자동 계산
  const computedDuration = useMemo(() => {
    const sh = parseInt(formData.startHour) || 0;
    const sm = parseInt(formData.startMin) || 0;
    const eh = parseInt(formData.endHour) || 0;
    const em = parseInt(formData.endMin) || 0;
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    // 자정을 넘기는 경우 (예: 22:00 ~ 02:00 다음날)
    if (diff < 0) diff += 24 * 60;
    return diff;
  }, [formData.startHour, formData.startMin, formData.endHour, formData.endMin]);

  const schedules      = useMemo(() => {
    // 일정은 mockData 전역 store(schedules2026_03)가 단일 진실 소스.
    // 추가/삭제 모두 commitAddedSchedules / removeSchedules 로 전역 mutate
    // 되어 있으므로 여기서는 그대로 읽어와 스냅샷 폴백만 적용한다.
    const merged = getSchedulesForRecipient(id ?? '', year, month);
    if (!recipient) return merged;

    // 일정 entry 스냅샷이 단일 진실 소스.
    // 스냅샷이 비어있는 entry(아직 한 번도 수정/추가되지 않은 케이스)는
    // 기초정보의 현재값으로 폴백하여 동일 형태로 표시한다.
    const curGrade = getGradeNum(recipient);
    const curRed   = getReduction(recipient);
    const curRate  = getCopayRate(recipient);
    return merged.map(s => {
      const grade         = (s.grade ?? curGrade) as RecipientGrade;
      const reduction     = (s.copaymentType ?? curRed) as ReductionType;
      const rate          = s.copaymentRate ?? curRate;
      const benefitTotal  = s.benefitTotal  ?? s.unitCost;
      const copayAmount   = s.copayAmount   ?? Math.floor(benefitTotal * rate / 100); // 본인부담금 절사
      const insuranceAmount = s.insuranceAmount ?? (benefitTotal - copayAmount);
      return {
        ...s,
        grade,
        copaymentType: reduction,
        copaymentRate: rate,
        benefitTotal,
        copayAmount,
        insuranceAmount,
      };
    });
  // schedulesVer 가 바뀌면 mockData entry 가 mutate 됐으므로 메모 무효화
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, year, month, recipient, schedulesVer]);
  const calendarWeeks  = useMemo(() => getCalendarWeeks(year, month), [year, month]);
  // 연도별 월별 배정건수 맵 — 연월바 뱃지용
  const yearMonthCounts = useMemo(() => {
    const map: Record<number, { plan: number; claim: number }> = {};
    for (let m = 1; m <= 12; m++) {
      const s = getSchedulesForRecipient(id ?? '', year, m);
      map[m] = {
        plan: s.filter(x => x.kind === 'plan').length,
        claim: s.filter(x => x.kind === 'claim').length,
      };
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, year, schedulesVer]);

  // ── 방문상담 일정 (해당 수급자·해당 월) ──────────────
  const consultVisitsThisMonth = useMemo(() => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return consultationVisits.filter(cv =>
      cv.recipientId === (id ?? '') && cv.date.startsWith(prefix)
    );
  }, [id, year, month]);

  const summary        = useMemo(() => {
    const filtered = viewMode === 'claim'
      ? schedules.filter(s => s.kind === 'claim')
      : schedules.filter(s => s.kind === 'plan');
    return buildSummary(filtered, year);
  }, [schedules, viewMode, year]);

  // ── 수급자 목록 패널용 월별 집계 ──────────────────
  // schedulesVer 의존성 — commitAddedSchedules 등으로 일정이 변경되면 재집계
  const monthlyAll = useMemo(() => getSchedules(year, month).slice(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [year, month, schedulesVer]);

  // 직원별 일자별 일정 맵 — 직원 중복검사용 (직원이 그날 다른 수급자에 배정된 일정)
  // key: careWorkerId, value: Map<dateStr, ScheduleEntry[]>
  const workerDayMap = useMemo(() => {
    const m = new Map<string, Map<string, ScheduleEntry[]>>();
    monthlyAll.forEach(s => {
      if (!m.has(s.careWorkerId)) m.set(s.careWorkerId, new Map());
      const dm = m.get(s.careWorkerId)!;
      if (!dm.has(s.date)) dm.set(s.date, []);
      dm.get(s.date)!.push(s);
    });
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthlyAll]);
  const recipientMonthlyMap = useMemo(() => {
    const map: Record<string, { total: number; planTotal: number; hasCompleted: boolean; hasUpcoming: boolean; planCount: number; claimCount: number }> = {};
    monthlyAll.forEach(s => {
      if (!map[s.recipientId]) map[s.recipientId] = { total: 0, planTotal: 0, hasCompleted: false, hasUpcoming: false, planCount: 0, claimCount: 0 };
      map[s.recipientId].total += s.unitCost;
      // 계획 = 전체 일정, 청구 = 완료된 일정 (급여일정관리와 동일)
      map[s.recipientId].planCount += 1;
      if (s.kind === 'claim') {
        map[s.recipientId].hasCompleted = true;
        map[s.recipientId].claimCount += 1;
      } else {
        map[s.recipientId].hasUpcoming = true;
        map[s.recipientId].planTotal += s.unitCost;
      }
    });
    return map;
  }, [monthlyAll]);

  // 수급자 목록 = 해당월 계획/청구 일정이 있는 수급자 ∪ 계약구분 '수급중' 수급자.
  // (showAllActive 토글로 '수급중'(일정 없는 경우 포함) 노출 여부 조절)
  const listedRecipients = useMemo(
    () => recipients
      .filter(r => !!recipientMonthlyMap[r.id] || (showAllActive && r.contractStatus === '수급중'))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [recipientMonthlyMap, showAllActive]
  );

  // 선택 수급자가 목록에서 가운데에 보이도록 스크롤 (listedRecipients 선언 이후에 위치해야 함)
  useEffect(() => {
    if (!selectedItemRef.current || !listScrollRef.current) return;
    const item      = selectedItemRef.current;
    const container = listScrollRef.current;
    const { top: iTop, bottom: iBottom } = item.getBoundingClientRect();
    const { top: cTop, bottom: cBottom } = container.getBoundingClientRect();
    if (iTop < cTop || iBottom > cBottom) {
      item.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [id, listedRecipients]);

  if (!recipient) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#94a3b8' }}>
        수급자를 찾을 수 없습니다.
      </div>
    );
  }

  const assignedWorkers = recipient.assignedCareWorkerIds.map(wid => getCareWorker(wid)).filter(Boolean);

  // ── 급여 현황 동적 계산 ──────────────────────────────────────────────
  // 수가·본인부담금·공단청구액은 ScheduleEntry 스냅샷 기반으로 계산
  // (본인부담금 = floor(수가 × 본인부담률/100), 공단청구액 = 수가 - 본인부담금)
  const claimScheds = schedules.filter(s => s.kind === 'claim');
  const planScheds  = schedules.filter(s => s.kind === 'plan');
  const claimUsed    = claimScheds.reduce((sum, s) => sum + getScheduleTotalFee(s, year), 0);
  const planUsed     = planScheds.reduce((sum, s) => sum + getScheduleTotalFee(s, year), 0);
  const activeUsed   = viewMode === 'claim' ? claimUsed : planUsed;
  // 월 급여한도 — 일정 없으면 기초정보 등급, 일정 있으면 월중 가장 높은 등급 기준
  const monthlyLimit = getMonthlyLimit(recipient.id, year, month);
  // 본인부담금 = 한도 이내 부분은 (등급·감경별 합산) × 본인부담률, 한도 초과분은 100% 수급자 부담
  const claimLimit = calcLimitAwareSelfPay(claimScheds, monthlyLimit, year, getCopayRate(recipient));
  const planLimit  = calcLimitAwareSelfPay(planScheds,  monthlyLimit, year, getCopayRate(recipient));
  const claimSelfPay  = claimLimit.selfPay;
  const planSelfPay   = planLimit.selfPay;
  const activeSelfPay = viewMode === 'claim' ? claimSelfPay : planSelfPay;
  const remaining    = monthlyLimit - activeUsed;
  const usageRate    = monthlyLimit > 0 ? Math.min((activeUsed / monthlyLimit) * 100, 100) : 0;
  const isLow        = remaining < 300000;
  // 한도초과액 = 날짜순 누적 기준으로 정확히 계산된 비급여 부담액
  const activeLimit  = viewMode === 'claim' ? claimLimit : planLimit;
  const limitExcess  = activeLimit.overLimitAmount;
  const todayStr   = '2026-03-21';

  // ── 일괄 배정 실행 ──────────────────────────────────────────────────
  // allowedDows: 배정 허용 요일 집합(0=일~6=토). null이면 모든 요일 허용.
  // excludeHoliday: true면 공휴일 제외. excludeWeekend: true면 토/일 제외.
  function runBatchAssign(opts: {
    excludeHoliday?: boolean;
    allowedDows?: Set<number> | null; // null = 모든 요일
  }) {
    const { excludeHoliday = false, allowedDows = null } = opts;
    const lastDay = new Date(year, month, 0).getDate();
    const mm = String(month).padStart(2, '0');
    const entries: ScheduleEntry[] = [];
    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${year}-${mm}-${String(d).padStart(2, '0')}`;
      const dow = new Date(year, month - 1, d).getDay(); // 0=일,6=토
      if (allowedDows && !allowedDows.has(dow)) continue;
      if (excludeHoliday && isHoliday(dateStr)) continue;
      // 중복 체크
      const dup = schedules.some(s =>
        s.careWorkerId === formData.careWorkerId &&
        s.serviceType === formData.serviceType &&
        s.startTime === `${formData.startHour}:${formData.startMin}` &&
        s.endTime === `${formData.endHour}:${formData.endMin}` &&
        s.date === dateStr
      );
      if (dup) continue;
      const _batchItemCode = formData.serviceType === 'visit_bath'
        ? ({'차량이용(차량내)':'나-1','차량이용(가정내)':'나-2','차량미이용':'나-3'} as Record<string,string>)[formData.bathType] ?? '나-1'
        : undefined;
      const fee   = calcFeeAmount({ year, serviceType: formData.serviceType, durationMinutes: computedDuration, gradeNum: formData.grade, itemCode: _batchItemCode });
      const sur   = calcSurcharge({
        year, serviceType: formData.serviceType, date: dateStr,
        startTime: `${formData.startHour}:${formData.startMin}`,
        endTime:   `${formData.endHour}:${formData.endMin}`,
        durationMinutes: computedDuration, gradeNum: formData.grade,
        feeAmount: fee, copaymentRate: formData.copaymentRate, itemCode: _batchItemCode,
      });
      // 본인부담금 = (기본수가 + 가산금) 합산 후 십원 단위 절사
      const totalFee = fee + sur.amount;
      const copay    = calcCopayAmount(totalFee, formData.copaymentRate);
      entries.push({
        id: `BATCH-${dateStr}-${formData.careWorkerId}-${Date.now()}-${d}`,
        recipientId: id ?? '', careWorkerId: formData.careWorkerId,
        date: dateStr, serviceType: formData.serviceType,
        startTime: `${formData.startHour}:${formData.startMin}`,
        endTime:   `${formData.endHour}:${formData.endMin}`,
        durationMinutes: computedDuration,
        unitCost: fee, benefitTotal: totalFee, copayAmount: copay, insuranceAmount: totalFee - copay,
        surchargeAmount: sur.amount, surchargeRate: sur.rate, surchargeMinutes: sur.minutes,
        kind: 'plan',
        grade: formData.grade, copaymentType: formData.copaymentType, copaymentRate: formData.copaymentRate,
      });
    }
    if (entries.length === 0) { alert('배정할 날짜가 없습니다.'); return; }
    entries.forEach(e => setEntrySnapshots(e, e.grade ?? 5, e.copaymentType ?? '일반'));
    commitAddedSchedules(year, month, entries);
    alert(`${entries.length}건 배정 완료`);
  }

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }
  function getDaySchedules(date: Date | null) {
    if (!date) return [];
    const all = schedules.filter(s => s.date === toDateStr(date));
    if (viewMode === 'claim') return all.filter(s =>  s.kind === 'claim');
    return all.filter(s => s.kind === 'plan');
  }

  function getDayConsults(date: Date | null): ConsultationVisit[] {
    if (!date) return [];
    return consultVisitsThisMonth.filter(cv => cv.date === toDateStr(date));
  }

  /** 배정 모드 중 폼 값이 바뀌면 자동으로 입력 단계(중복검사 전)로 되돌린다 */
  function updateForm(updater: (prev: typeof formData) => typeof formData) {
    if (assignMode) { setAssignMode(false); setBatchType(''); }
    setFormData(updater);
  }

  function closeForm() {
    setShowAddForm(false);
    setAssignMode(false);
    setBatchType('');
  }

  function saveDayMemo(dStr: string) {
    const trimmed = dayMemoInput.trim();
    setDayMemoMap(prev => {
      if (!trimmed) {
        const next = { ...prev };
        delete next[dStr];
        return next;
      }
      return { ...prev, [dStr]: trimmed };
    });
    // 글로벌 store 동기화 — 다른 화면(주간급여일정 등)에서도 보이도록
    if (recipient) setDayMemo(recipient.id, dStr, trimmed);
    setEditingDayMemo(null);
    setDayMemoInput('');
  }

  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', background: '#ffffff', position: 'relative' }}>

      {/* ── 슬라이드인 애니메이션 키프레임 ── */}
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0.6; }
          to   { transform: translateX(0);     opacity: 1;   }
        }
        @keyframes fadeInBackdrop {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cardPulse {
          0%   { box-shadow: 0 0 0 2px #f59e0b, 0 0 0px rgba(245,158,11,0); transform: scale(1); }
          25%  { box-shadow: 0 0 0 3px #f59e0b, 0 0 12px rgba(245,158,11,0.7); transform: scale(1.04); }
          60%  { box-shadow: 0 0 0 2px #f59e0b, 0 0 8px rgba(245,158,11,0.45); transform: scale(1.02); }
          100% { box-shadow: 0 0 0 2px #fbbf24, 0 0 6px rgba(251,191,36,0.3); transform: scale(1.02); }
        }
      `}</style>

      {/* ══ 수급자 목록 패널 (최좌측) ══ */}
      <aside style={{
        width: 258, flexShrink: 0,
        borderRight: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column',
        background: '#f8fafc',
      }}>
        {/* 급여일정관리 바로가기 — 수급자 목록 위 */}
        <div style={{ flexShrink: 0, padding: '5px 8px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 5 }}>
          {[
            { label: '(전체)연간급여일정', tooltip: `급여일정관리 > (전체)연간급여일정으로 이동합니다`, onClick: () => navigate(`/payment-assignment?tab=annual&year=${year}&view=${viewMode}&recipient=${recipient?.id ?? ''}`) },
            { label: `(전체)${month}월 급여일정`, tooltip: `급여일정관리 > (전체)${month}월 급여일정으로 이동합니다`, onClick: () => navigate(`/payment-assignment?tab=monthly&year=${year}&month=${month}&view=${viewMode}&recipient=${recipient?.id ?? ''}`) },
          ].map(({ label, tooltip, onClick }) => (
            <button key={label} onClick={onClick} title={tooltip}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                padding: '4px 0', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                color: '#475569', background: '#ffffff', border: '1px solid #e2e8f0',
                whiteSpace: 'nowrap', transition: 'background 0.13s, color 0.13s, border-color 0.13s',
              }}
              onMouseEnter={e => {
                const b = e.currentTarget;
                b.style.background = '#1d4ed8';
                b.style.color = '#ffffff';
                b.style.borderColor = '#1d4ed8';
              }}
              onMouseLeave={e => {
                const b = e.currentTarget;
                b.style.background = '#ffffff';
                b.style.color = '#475569';
                b.style.borderColor = '#e2e8f0';
              }}
            >
              {label}<ArrowUpRight size={10} />
            </button>
          ))}
        </div>

        {/* 패널 헤더 */}
        <div style={{
          flexShrink: 0, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 8px',
          background: 'linear-gradient(90deg, #0f2744 0%, #1a3a5c 100%)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>수급자 목록</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
              {year}년 {month}월 · {listedRecipients.length}명
            </span>
            {/* 수급중 포함 토글 */}
            <button
              onClick={() => setShowAllActive(v => !v)}
              title={showAllActive ? '수급중 수급자 숨기기' : '수급중 수급자 모두 보기'}
              style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 10, cursor: 'pointer',
                border: showAllActive ? '1px solid #6ee7b7' : '1px solid rgba(255,255,255,0.2)',
                backgroundColor: showAllActive ? 'rgba(16,185,129,0.25)' : 'transparent',
                color: showAllActive ? '#6ee7b7' : 'rgba(255,255,255,0.35)',
                fontWeight: showAllActive ? 700 : 400,
                transition: 'background-color 0.15s, color 0.15s',
              }}
            >수급중</button>
          </div>
        </div>

        {/* 수급자 목록 스크롤 영역 */}
        <div ref={listScrollRef} style={{ flex: 1, overflowY: 'auto' }}>
          {listedRecipients.map((r, idx) => {
            const m = recipientMonthlyMap[r.id];
            const isSelected = r.id === id;
            const bg = isSelected ? '#dbeafe' : idx % 2 === 0 ? '#ffffff' : '#f4f7fb';

            // 생년월일 추출 (insuranceId: 'YYMMDD-...')
            const ld = getLegalDob(r); // YYYY-MM-DD
            const dob = ld ? `${ld.slice(2,4)}.${ld.slice(5,7)}.${ld.slice(8,10)}` : '';

            return (
              <div
                key={r.id}
                ref={isSelected ? selectedItemRef : undefined}
                onClick={() => navigate(`/recipients/${r.id}`)}
                style={{
                  padding: '0 6px 0 4px',
                  height: 30,
                  display: 'flex', alignItems: 'center', gap: 3,
                  borderBottom: '1px solid #e4eaf3',
                  background: bg,
                  cursor: 'pointer',
                  borderLeft: isSelected ? '3px solid #2563eb' : '3px solid transparent',
                }}
              >
                <span style={{
                  fontSize: 13, fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? '#1d4ed8' : '#0f172a',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  flex: 1, minWidth: 0,
                }}>{r.name}({dob})</span>

                {/* 계획[숫자] 청구[숫자] 박스 (급여일정관리와 동일) */}
                {(() => {
                  const planCount  = m?.planCount  ?? 0;
                  const claimCount = m?.claimCount ?? 0;
                  const hasPlan    = planCount  > 0;
                  const hasClaim   = claimCount > 0;
                  const boxBase: CSSProperties = {
                    width: 23, height: 19, borderRadius: 3,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0, userSelect: 'none',
                  };
                  const planStyle  = hasPlan
                    ? { background: '#dbeafe', border: '1px solid #93c5fd', color: '#1d4ed8' }
                    : { background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#cbd5e1' };
                  const claimStyle = hasClaim
                    ? { background: '#d1fae5', border: '1px solid #6ee7b7', color: '#059669' }
                    : { background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#cbd5e1' };
                  return (
                    <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
                      <div title={hasPlan ? `계획 ${planCount}건` : '계획 없음'} style={{ ...boxBase, ...planStyle }}>
                        {hasPlan ? planCount : ''}
                      </div>
                      <div title={hasClaim ? `청구 ${claimCount}건` : '청구 없음'} style={{ ...boxBase, ...claimStyle }}>
                        {hasClaim ? claimCount : ''}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ══ 좌측 정보 패널 ═ */}
      <aside style={{
        width: 200, flexShrink: 0,
        borderRight: '1px solid #e2e8f0',
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
        background: '#f8fafc',
      }}>
        {/* 패널 헤더 */}
        <div style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
        }}>
          <button
            onClick={() => navigate('/recipients')}
            style={{
              width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #e2e8f0', borderRadius: 5, backgroundColor: '#f8fafc', cursor: 'pointer',
            }}
          ><ArrowLeft size={11} color="#64748b" /></button>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>수급자 상세</span>
        </div>

        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <>
          {/* 기본 정보 카드 */}
          <InfoCard>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              paddingBottom: 8, borderBottom: '1px solid #e2e8f0', marginBottom: 6,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <User size={12} color="#1d4ed8" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{recipient.name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{getCertNo(recipient)}</div>
              </div>
            </div>
            {/* 등급 + 감경구분 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: 12, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                {getGradeText(recipient)}
              </span>
              <span style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', fontSize: 12, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                {getReductionPill(recipient)}
              </span>
            </div>
            {/* 인정기간 */}
            <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', gap: 4, alignItems: 'center' }}>
              <span>{getValidFrom(recipient)}</span>
              <span>~</span>
              <span>{getValidTo(recipient)}</span>
            </div>
          </InfoCard>

          {/* 연락처보기 버튼 */}
          <InfoCard>
            <button
              onClick={() => setContactModalOpen(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '5px 0', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                color: '#1d4ed8', background: '#eff6ff',
                borderBottom: '1px solid #bfdbfe',
              }}
            >
              <Phone size={11} color="#1d4ed8" />
              연락처 보기
            </button>
          </InfoCard>


          {/* 연락처 모달 */}
          {contactModalOpen && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(15,39,68,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
              onClick={() => setContactModalOpen(false)}
            >
              <div style={{
                background: '#fff', borderRadius: 10, width: 420, maxHeight: '80vh',
                overflow: 'auto', boxShadow: '0 8px 32px rgba(15,39,68,0.18)',
              }}
                onClick={e => e.stopPropagation()}
              >
                {/* 모달 헤더 */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
                  background: 'linear-gradient(90deg,#0f2744,#1a3a5c)', borderRadius: '10px 10px 0 0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Phone size={13} color="#93c5fd" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>연락처 정보</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginLeft: 2 }}>{recipient.name}</span>
                  </div>
                  <button onClick={() => setContactModalOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                    <X size={15} color="rgba(255,255,255,0.6)" />
                  </button>
                </div>

                {/* 연락처 목록 — 수급자 본인 / 보호자(관계 병기) / 급여제공직원 */}
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>

                  {/* ── 수급자 본인 ── */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', minWidth: 80 }}>{recipient.name}</span>
                    <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 3, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', flexShrink: 0 }}>본인</span>
                    <span style={{ fontSize: 13, color: '#0f172a', fontFamily: "'Noto Sans KR', sans-serif", marginLeft: 'auto' }}>
                      {getMobile(recipient) || <span style={{ color: '#94a3b8' }}>-</span>}
                    </span>
                  </div>

                  {/* ── 보호자 (수급자와의 관계 병기) ── */}
                  {getGuardians(recipient).map((g) => {
                    const relation = g.relation || g.relationDirect || '';
                    const mobile = g.mobile || '';
                    return (
                      <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', minWidth: 80 }}>
                          {g.name}
                          {relation && <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400, marginLeft: 4 }}>({relation})</span>}
                        </span>
                        <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 3, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', flexShrink: 0 }}>보호자</span>
                        <span style={{ fontSize: 13, color: '#0f172a', fontFamily: "'Noto Sans KR', sans-serif", marginLeft: 'auto' }}>
                          {mobile || <span style={{ color: '#94a3b8' }}>-</span>}
                        </span>
                      </div>
                    );
                  })}

                  {/* ── 급여제공직원 ── */}
                  {assignedWorkers.length > 0 && (
                    <>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', padding: '8px 0 4px', letterSpacing: '0.04em' }}>급여제공직원</div>
                      {assignedWorkers.map(w => (
                        <div key={w!.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', minWidth: 80 }}>{w!.name}</span>
                          <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 3, background: '#faf5ff', color: '#7c3aed', border: '1px solid #e9d5ff', flexShrink: 0 }}>직원</span>
                          <span style={{ fontSize: 13, color: '#0f172a', fontFamily: "'Noto Sans KR', sans-serif", marginLeft: 'auto' }}>
                            {w!.phone || <span style={{ color: '#94a3b8' }}>-</span>}
                          </span>
                        </div>
                      ))}
                    </>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* 일정배정 */}
          <InfoCard>
            <SectionTitle>급여제공(일정배정)직원</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {assignedWorkers.map(w => {
                const birth = getEmployeeBirth(w!);
                return (
                  <div key={w!.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', flexShrink: 0 }}>{w!.name}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{birth}</span>
                    <button
                      onClick={() => setSchedViewWorker(w!.id)}
                      style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 7px', borderRadius: 4, cursor: 'pointer', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      일정조회
                    </button>
                  </div>
                );
              })}
              {assignedWorkers.length === 0 && (
                <div style={{ fontSize: 11, color: '#cbd5e1' }}>등록된 일정배정 직원이 없습니다.</div>
              )}
            </div>
          </InfoCard>

          {/* 제공서비스 — 수급자 기초정보의 중복선택 서비스 목록 */}
          <InfoCard>
            <SectionTitle>제공서비스</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {recipient.services.map(svc => {
                const LABEL: Record<string, string> = {
                  요양: '방문요양', 목욕: '방문목욕', 간호: '방문간호',
                  주간: '주간보호', 용구: '복지용구', 통합: '통합재가',
                  돌봄: '돌봄', 기타: '기타',
                };
                const COLOR: Record<string, { bg: string; color: string; border: string }> = {
                  요양: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
                  목욕: { bg: '#f0fdf4', color: '#059669', border: '#6ee7b7' },
                  간호: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
                  주간: { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
                  용구: { bg: '#ecfdf5', color: '#0d9488', border: '#99f6e4' },
                  통합: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
                  돌봄: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
                  기타: { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
                };
                const c = COLOR[svc] ?? { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
                return (
                  <span key={svc} style={{
                    background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                    fontSize: 11, padding: '1px 6px', borderRadius: 3, fontWeight: 600,
                  }}>
                    {LABEL[svc] ?? svc}
                  </span>
                );
              })}
              {recipient.services.length === 0 && (
                <span style={{ fontSize: 11, color: '#94a3b8' }}>등록된 제공서비스 없음</span>
              )}
            </div>
          </InfoCard>

          {/* 급여 현황 */}
          <InfoCard>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <SectionTitle style={{ marginBottom: 0 }}>급여 현황</SectionTitle>
              {viewMode === 'plan' ? (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                  background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd',
                }}>계획기준</span>
              ) : (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                  background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7',
                }}>청구기준</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#94a3b8' }}>급여한도</span>
                <span style={{ color: '#1e293b', fontFamily: "'Noto Sans KR', sans-serif", fontSize: 13 }}>{formatKRW(monthlyLimit)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#94a3b8' }}>기사용액</span>
                <span style={{
                  color: viewMode === 'claim' ? '#065f46' : '#1e293b',
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontWeight: viewMode === 'claim' ? 600 : 400,
                  fontSize: 13,
                }}>{formatKRW(activeUsed)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#94a3b8' }}>잔액</span>
                <span style={{ color: isLow ? '#dc2626' : '#059669', fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif", fontSize: 13 }}>
                  {formatKRW(remaining)}
                </span>
              </div>
              <div style={{ height: 5, background: '#e4eaf3', borderRadius: 3, overflow: 'hidden', marginTop: 2 }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: isLow
                    ? '#dc2626'
                    : viewMode === 'claim'
                    ? 'linear-gradient(90deg, #059669, #10b981)'
                    : '#2563eb',
                  width: `${usageRate}%`,
                  transition: 'width 0.3s ease, background 0.3s ease',
                }} />
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: viewMode === 'claim' ? '#059669' : '#94a3b8', fontWeight: viewMode === 'claim' ? 600 : 400 }}>
                {usageRate.toFixed(1)}% {viewMode === 'claim' ? '청구' : '사용'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid #e2e8f0', paddingTop: 4 }}>
                <span style={{ color: '#94a3b8' }}>본인부담</span>
                <span style={{
                  color: viewMode === 'claim' ? '#065f46' : '#64748b',
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontWeight: viewMode === 'claim' ? 600 : 400,
                  fontSize: 13,
                }}>{formatKRW(activeSelfPay)}</span>
              </div>
              {limitExcess > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#dc2626' }}>한도초과액</span>
                  <span style={{ color: '#dc2626', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700, fontSize: 13 }}>
                    {formatKRW(limitExcess)}
                  </span>
                </div>
              )}

              {/* 서비스별 급여금액 — 해당 월 일정 기반 동적 계산 */}
              {(() => {
                const SVC_LABEL: Record<string, string> = {
                  visit_care: '방문요양', family_care: '가족요양', full_day_visit: '종일방문',
                  visit_bath: '방문목욕', visit_nursing: '방문간호', day_care: '주간보호',
                };
                const activeScheds = viewMode === 'claim' ? claimScheds : planScheds;
                const svcMap = new Map<string, number>();
                activeScheds.forEach(s => {
                  const lbl = SVC_LABEL[s.serviceType] ?? s.serviceType;
                  svcMap.set(lbl, (svcMap.get(lbl) ?? 0) + getEntryBenefitTotal(s));
                });
                const rows = Array.from(svcMap.entries()).filter(([, v]) => v > 0);
                if (rows.length === 0) return null;
                return (
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 4, marginTop: 2 }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>서비스별 급여금액</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {rows.map(([label, v]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                          <span style={{ color: '#64748b' }}>{label}</span>
                          <span style={{ color: '#1e293b', fontFamily: "'Noto Sans KR', sans-serif" }}>{formatKRW(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </InfoCard>

          {/* 하단 버튼 */}
          {(() => {
            const mm        = String(month).padStart(2, '0');
            const monthStart = `${year}-${mm}-01`;
            const lastDay    = new Date(year, month, 0).getDate();
            const monthEnd   = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;
            const monthLabel = `${year}년 ${month}월`;
            const defSplit   = `${year}-${mm}-16`;
            // 일정 entry 스냅샷에서 직접 도출 — 단일 진실 소스.
            // 캘린더와 동일한 viewMode 로 필터링하여 보이지 않는 일정이
            // 칩 범위를 부풀리지 않도록 한다.
            void schedulesVer; // 의존성: 일정 변경 시 재계산
            const gSegs = deriveGradeSegments(id ?? '', year, month, viewMode)
              .map(s => ({ ...s, value: `${s.value}` }));
            const rSegs = deriveReductionSegments(id ?? '', year, month, viewMode);

            // 변경 적용 → mockData 의 일정 entry 스냅샷을 직접 mutate
            // (모든 일정이 전역 store 에 있으므로 한 번 호출로 끝)
            const applyChange = (
              kind: 'grade' | 'reduction',
              split: string, before: string, after: string,
            ) => {
              const rid = id ?? '';
              const splitDate = split <= monthStart ? monthStart : split;
              applySchedulePeriodChange({
                recipientId: rid, year, month,
                splitDate, kind, before, after,
              });
            };

            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, paddingBottom: 4 }}>
                  <button
                    onClick={() => {
                      const cur = String(getGradeNum(recipient));
                      setGradeForm({ split: defSplit, before: cur, after: cur, reason: '' });
                      setGradeModalOpen(true);
                    }}
                    style={{ padding: '5px 4px', fontSize: 11, borderRadius: 6, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                  ><Award size={12} color="#2563eb" /> 등급변경</button>
                  <button
                    onClick={() => {
                      const cur = getReduction(recipient);
                      setReductionForm({ split: defSplit, before: cur, after: cur, reason: '' });
                      setReductionModalOpen(true);
                    }}
                    style={{ padding: '5px 4px', fontSize: 11, borderRadius: 6, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                  ><Percent size={12} color="#d97706" /> 감경구분변경</button>
                </div>

                {/* 저장된 기간 구간 칩 (해당 월) */}
                {(gSegs.length > 0 || rSegs.length > 0) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingBottom: 4 }}>
                    {gSegs.map((s, i) => (
                      <span key={`g${i}`} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: '#dbeafe', color: '#1d4ed8', fontWeight: 600 }}>
                        {fmtMD(s.from)}~{fmtMD(s.to)} {s.value}등급
                      </span>
                    ))}
                    {rSegs.map((s, i) => (
                      <span key={`r${i}`} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: '#fff7ed', color: '#c2410c', fontWeight: 600 }}>
                        {fmtMD(s.from)}~{fmtMD(s.to)} {s.value}
                      </span>
                    ))}
                  </div>
                )}

                {/* 등급변경 모달 */}
                {gradeModalOpen && (
                  <PeriodChangeModal
                    icon={<Award size={13} color="#93c5fd" />}
                    title="등급 변경"
                    recipientName={recipient.name}
                    monthLabel={monthLabel}
                    monthStart={monthStart}
                    monthEnd={monthEnd}
                    splitDate={gradeForm.split}
                    onSplitChange={v => setGradeForm(f => ({ ...f, split: v }))}
                    options={([1, 2, 3, 4, 5] as const).map(g => ({ value: String(g), label: `${g}등급` }))}
                    beforeValue={gradeForm.before}
                    onBeforeChange={v => setGradeForm(f => ({ ...f, before: v }))}
                    afterValue={gradeForm.after}
                    onAfterChange={v => setGradeForm(f => ({ ...f, after: v }))}
                    reason={gradeForm.reason}
                    onReasonChange={v => setGradeForm(f => ({ ...f, reason: v }))}
                    accent="#2563eb"
                    onClose={() => setGradeModalOpen(false)}
                    onSave={() => {
                      applyChange('grade', gradeForm.split, gradeForm.before, gradeForm.after);
                      setGradeModalOpen(false);
                    }}
                  />
                )}

                {/* 감경구분변경 모달 */}
                {reductionModalOpen && (
                  <PeriodChangeModal
                    icon={<Percent size={13} color="#fdba74" />}
                    title="감경구분 변경"
                    recipientName={recipient.name}
                    monthLabel={monthLabel}
                    monthStart={monthStart}
                    monthEnd={monthEnd}
                    splitDate={reductionForm.split}
                    onSplitChange={v => setReductionForm(f => ({ ...f, split: v }))}
                    options={REDUCTION_OPTIONS.filter(t => t !== '감경7.5%').map(t => ({ value: t, label: t, sub: `${RATE_BY_REDUCTION[t]}%` }))}
                    beforeValue={reductionForm.before}
                    onBeforeChange={v => setReductionForm(f => ({ ...f, before: v }))}
                    afterValue={reductionForm.after}
                    onAfterChange={v => setReductionForm(f => ({ ...f, after: v }))}
                    reason={reductionForm.reason}
                    onReasonChange={v => setReductionForm(f => ({ ...f, reason: v }))}
                    accent="#d97706"
                    onClose={() => setReductionModalOpen(false)}
                    onSave={() => {
                      applyChange('reduction', reductionForm.split, reductionForm.before, reductionForm.after);
                      setReductionModalOpen(false);
                    }}
                  />
                )}
              </>
            );
          })()}

          {/* 일정 추가 버튼 — 청구보기에서는 숨김, 상세 패널 열려 있을 때도 숨김 */}
          {!showAddForm && viewMode !== 'claim' && (
            <button
              onClick={() => {
                setShowAddForm(true);
                setAssignMode(false);
                setBatchType('');
                setShowBulkDelete(false);
                if (assignedWorkers.length > 0 && !formData.careWorkerId) {
                  setFormData(f => ({ ...f, careWorkerId: assignedWorkers[0]!.id }));
                }
              }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '7px 12px', fontSize: 11, borderRadius: 7, fontWeight: 700,
                backgroundImage: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                backgroundColor: 'transparent',
                border: 'none', color: '#ffffff', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
              }}
            >
              <Plus size={11} />일정추가
            </button>
          )}

          {/* 일괄삭제 — 흐릿한 버튼 + 패널 */}
          {viewMode !== 'claim' && !showAddForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                onClick={() => { setShowBulkDelete(v => !v); setDeleteTypes(new Set()); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  padding: '5px 12px', fontSize: 11, borderRadius: 7, fontWeight: 500,
                  border: '1px dashed #cbd5e1', background: 'transparent',
                  color: '#94a3b8', cursor: 'pointer',
                }}
              >
                <X size={10} color="#94a3b8" />일괄삭제
              </button>

              {showBulkDelete && (() => {
                const SVC_ITEMS = [
                  { key: 'visit_care',     label: '방문요양' },
                  { key: 'family_care',    label: '가족요양' },
                  { key: 'full_day_visit', label: '종일방문' },
                  { key: 'visit_bath',     label: '방문목욕' },
                  { key: 'visit_nursing',  label: '방문간호' },
                  { key: 'day_care',       label: '주간보호' },
                ];
                const presentTypes = new Set(schedules.filter(s => s.kind === 'plan').map(s => s.serviceType));
                const allSelected = SVC_ITEMS.every(i => deleteTypes.has(i.key));
                const toggleAll = () => {
                  if (allSelected) setDeleteTypes(new Set());
                  else setDeleteTypes(new Set(SVC_ITEMS.map(i => i.key)));
                };
                const doDelete = () => {
                  const targets = schedules
                    .filter(s => s.kind === 'plan' && deleteTypes.has(s.serviceType))
                    .map(s => s.id);
                  if (targets.length === 0) { alert('삭제할 일정이 없습니다.'); return; }
                  if (!window.confirm(`${targets.length}건을 삭제할까요?`)) return;
                  removeSchedules(year, month, targets);
                  setShowBulkDelete(false);
                  setDeleteTypes(new Set());
                };
                return (
                  <div style={{ background: '#fff8f8', border: '1px solid #fecaca', borderRadius: 7, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', marginBottom: 2 }}>삭제할 급여종류 선택</div>
                    {/* 전체 선택 */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#475569' }}>
                      <input type="checkbox" checked={allSelected}
                        onChange={toggleAll}
                        style={{ accentColor: '#dc2626', width: 13, height: 13 }} />
                      전체
                    </label>
                    <div style={{ height: 1, background: '#fee2e2' }} />
                    {SVC_ITEMS.map(({ key, label }) => {
                      const hasSched = presentTypes.has(key as any);
                      const on = deleteTypes.has(key);
                      return (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: hasSched ? 'pointer' : 'default', fontSize: 11, color: hasSched ? '#0f172a' : '#cbd5e1' }}>
                          <input type="checkbox" checked={on} disabled={!hasSched}
                            onChange={() => setDeleteTypes(prev => { const n = new Set(prev); on ? n.delete(key) : n.add(key); return n; })}
                            style={{ accentColor: '#dc2626', width: 13, height: 13 }} />
                          {label}
                          {hasSched && <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 'auto' }}>
                            {schedules.filter(s => s.kind === 'plan' && s.serviceType === key).length}건
                          </span>}
                        </label>
                      );
                    })}
                    <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                      <button onClick={() => { setShowBulkDelete(false); setDeleteTypes(new Set()); }}
                        style={{ flex: 1, padding: '5px 0', fontSize: 11, borderRadius: 5, cursor: 'pointer', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b' }}>
                        취소
                      </button>
                      <button onClick={doDelete} disabled={deleteTypes.size === 0}
                        style={{ flex: 1, padding: '5px 0', fontSize: 11, borderRadius: 5, cursor: deleteTypes.size > 0 ? 'pointer' : 'not-allowed', border: 'none', background: deleteTypes.size > 0 ? '#dc2626' : '#fca5a5', color: '#fff', fontWeight: 700 }}>
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          </>
        </div>
      </aside>

      {/* ══ 우측 캘린더 패널 ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* 캘린더 헤더 바 */}
        <div style={{
          flexShrink: 0, height: 46,
          display: 'flex', alignItems: 'center', gap: 0,
          padding: '0 12px', borderBottom: '1px solid #e8edf5',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        }}>

          {/* ① 연도 선택기 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0, marginRight: 12,
            background: '#f1f5f9', borderRadius: 8, padding: '2px', border: '1px solid #e2e8f0' }}>
            <button onClick={() => setYear(y => y - 1)}
              style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', borderRadius: 6, background: 'transparent', cursor: 'pointer' }}>
              <ChevronLeft size={11} color="#64748b" />
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', minWidth: 52, textAlign: 'center', letterSpacing: '-0.3px' }}>{year}년</span>
            <button onClick={() => setYear(y => y + 1)}
              style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', borderRadius: 6, background: 'transparent', cursor: 'pointer' }}>
              <ChevronRight size={11} color="#64748b" />
            </button>
          </div>

          {/* ② 월 탭 — 건수 도트 뱃지 */}
          <div style={{ display: 'flex', gap: 1, flexShrink: 0, alignItems: 'center' }}>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => {
              const active = month === m;
              const cnt = yearMonthCounts[m];
              const planCnt  = cnt?.plan  ?? 0;
              const claimCnt = cnt?.claim ?? 0;
              const count = viewMode === 'claim' ? claimCnt : planCnt;
              const hasAny = planCnt > 0 || claimCnt > 0;
              const badgeColor = viewMode === 'claim' ? '#059669' : '#2563eb';
              const badgeBg   = viewMode === 'claim' ? '#dcfce7' : '#dbeafe';
              return (
                <button key={m} onClick={() => setMonth(m)}
                  style={{
                    width: 38, flexShrink: 0, height: 30, padding: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                    background: active
                      ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                      : hasAny ? '#f1f5f9' : 'transparent',
                    boxShadow: active ? '0 2px 6px rgba(37,99,235,0.30)' : 'none',
                    transition: 'all 0.12s ease',
                  }}>
                  <span style={{ fontSize: 11, fontWeight: active ? 700 : 500,
                    color: active ? '#ffffff' : '#475569', lineHeight: 1 }}>
                    {m}월
                  </span>
                  {count > 0 ? (
                    <span style={{
                      fontSize: 9, fontWeight: 700, lineHeight: '11px',
                      minWidth: 14, padding: '0 3px', borderRadius: 5, textAlign: 'center',
                      background: active ? 'rgba(255,255,255,0.25)' : badgeBg,
                      color: active ? '#ffffff' : badgeColor,
                    }}>{count}</span>
                  ) : (
                    <span style={{ height: 11 }} />
                  )}
                </button>
              );
            })}

            {/* 구분선 + 뷰 토글 — 12월 바로 뒤 */}
            <div style={{ width: 1, height: 22, background: '#e2e8f0', flexShrink: 0, margin: '0 8px' }} />
            <div style={{
              display: 'flex', alignItems: 'center', flexShrink: 0,
              background: '#e4eaf3', borderRadius: 6, padding: 2, gap: 1,
            }}>
              {([
                { key: 'plan',  label: '계획보기' },
                { key: 'claim', label: '청구보기' },
              ] as const).map(({ key, label }) => {
                const active = viewMode === key;
                const activeBg =
                  key === 'plan'  ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' :
                                    'linear-gradient(135deg, #059669, #047857)';
                return (
                  <button
                    key={key}
                    onClick={() => { if (!assignMode) setViewMode(key); }}
                    title={assignMode && key === 'claim' ? '배정 모드 중에는 계획보기만 사용할 수 있습니다' : undefined}
                    style={{
                      padding: '3px 9px', borderRadius: 4, border: 'none',
                      cursor: assignMode && key === 'claim' ? 'not-allowed' : 'pointer',
                      fontSize: 11, fontWeight: active ? 700 : 400, whiteSpace: 'nowrap',
                      backgroundImage: active ? activeBg : 'none',
                      backgroundColor: 'transparent',
                      color: active ? '#ffffff' : assignMode && key === 'claim' ? '#cbd5e1' : '#64748b',
                      opacity: assignMode && key === 'claim' ? 0.45 : 1,
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >{label}</button>
                );
              })}
            </div>
          </div>

          {/* ④ 우측 — 배정 모드 범례 or 액션 버튼 */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            {assignMode ? (
              /* 배정 모드 범례 칩 */
              <>
                {/* 중복검사 완료 뱃지 */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                  background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd',
                }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  중복검사 완료
                </span>
                {/* 구분선 */}
                <div style={{ width: 1, height: 16, background: '#dde3ed' }} />
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                  background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                  color: '#065f46', border: '1px solid #6ee7b7',
                }}>
                  <Zap size={9} strokeWidth={2.5} />배정 가능
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                  background: 'linear-gradient(135deg, #fff1f2, #fee2e2)',
                  color: '#991b1b', border: '1px solid #fca5a5',
                }}>
                  <Lock size={9} strokeWidth={2.5} />불가
                </span>
              </>
            ) : (
              <>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  padding: '4px 9px', fontSize: 11, borderRadius: 6,
                  border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#64748b', cursor: 'pointer',
                }}>
                  <Printer size={10} />출력
                </button>
                {/* 메모 버튼 */}
                <button
                  onClick={() => setMemoOpen(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                    padding: '4px 10px', fontSize: 11, borderRadius: 20, cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s',
                    background: memoOpen || memoCount > 0 ? '#fefce8' : 'white',
                    border: `1px solid ${memoOpen ? '#fbbf24' : memoCount > 0 ? '#fde68a' : '#e2e8f0'}`,
                  }}
                >
                  <StickyNote size={11}
                    style={{ color: memoOpen ? '#d97706' : memoCount > 0 ? '#f59e0b' : '#94a3b8' }} />
                  <span style={{ fontWeight: 600, color: memoOpen || memoCount > 0 ? '#92400e' : '#94a3b8' }}>메모</span>
                  {memoCount > 0 && (
                    <span style={{
                      minWidth: 16, height: 16, borderRadius: 8,
                      background: '#f59e0b', color: 'white',
                      fontSize: 9, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                    }}>
                      {memoCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* 요일 헤더 */}
        <div style={{ flexShrink: 0 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: '1px solid #e4eaf3', height: 26,
            background: '#f8fafc',
          }}>
            {DAY_LABELS.map((label, idx) => (
              <div
                key={label}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600,
                  borderRight: idx < 6 ? '1px solid #e4eaf3' : 'none',
                  color: idx === 0 ? '#dc2626' : idx === 6 ? '#2563eb' : '#64748b',
                }}
              >
                {label}요일
              </div>
            ))}
          </div>
        </div>

        {/* 캘린더 그리드 + 메모 + 집계 — 하나의 스크롤 영역 */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

          {/* 캘린더 그리드 */}
          <div>
            {calendarWeeks.map((week, weekIdx) => (
              <div
                key={weekIdx}
                style={{
                  display: 'flex',
                  minHeight: 62,
                  borderBottom: weekIdx < calendarWeeks.length - 1 ? '1px solid #e4eaf3' : 'none',
                }}
              >
                {week.map((day, dayIdx) => {
                  const dayScheds = getDaySchedules(day);
                  const dateStr   = day ? toDateStr(day) : '';
                  const isToday   = dateStr === todayStr;
                  const isSun     = dayIdx === 0;
                  const isSat     = dayIdx === 6;
                  const isPast    = !!day && dateStr < todayStr;
                  const isEmpty   = !day;

                  const hasDuplicate = (() => {
                    if (!assignMode || !day) return false;
                    const newStart = `${formData.startHour}:${formData.startMin}`;
                    const newEnd   = `${formData.endHour}:${formData.endMin}`;
                    const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
                    const overlaps = (s: ScheduleEntry) => {
                      let ns = toMins(newStart), ne = toMins(newEnd);
                      let ss = toMins(s.startTime), se = toMins(s.endTime);
                      if (ne <= ns) ne += 24 * 60; // 자정 넘김
                      if (se <= ss) se += 24 * 60;
                      return ns < se && ss < ne;
                    };
                    // 방문요양↔방문간호, 방문목욕↔방문간호 조합은 시간 겹침 허용
                    const newSt = formData.serviceType;
                    const isExemptPair = (existSt: ServiceType) =>
                      (newSt === 'visit_nursing' && (existSt === 'visit_care' || existSt === 'visit_bath')) ||
                      (existSt === 'visit_nursing' && (newSt === 'visit_care' || newSt === 'visit_bath'));
                    // 1. 수급자 기준: 이 수급자의 해당날 일정과 시간 겹침 (예외 조합 제외)
                    if (dayScheds.some(s => !isExemptPair(s.serviceType) && overlaps(s))) return true;
                    // 2. 직원 기준: 선택된 요양보호사/간호사의 해당날 타수급자 일정과 시간 겹침
                    if (formData.careWorkerId) {
                      const wScheds = workerDayMap.get(formData.careWorkerId)?.get(dateStr) ?? [];
                      if (wScheds.some(s => s.recipientId !== id && overlaps(s))) return true;
                    }
                    return false;
                  })();
                  const isAssignable = assignMode && !!day && !isEmpty && !hasDuplicate;

                  const cellBg = assignMode
                    ? (isEmpty ? '#f8fafc' : hasDuplicate ? '#fee2e2' : '#f0fdf4')
                    : isEmpty
                    ? '#f8fafc'
                    : isSun
                    ? 'rgba(254,242,242,0.4)'
                    : isSat
                    ? 'rgba(239,246,255,0.4)'
                    : '#ffffff';

                  return (
                    <div
                      key={dayIdx}
                      onClick={() => {
                        if (!day) return;
                        if (assignMode) {
                          if (viewMode === 'claim') return;
                          if (hasDuplicate) return;
                          // 수가 계산 후 본인부담금·공단청구액 산출
                          // 본인부담금 = floor(수가 × 본인부담률/100), 공단청구액 = 수가 - 본인부담금
                          const _itemCode = formData.serviceType === 'visit_bath'
                              ? ({'차량이용(차량내)':'나-1','차량이용(가정내)':'나-2','차량미이용':'나-3'} as Record<string,string>)[formData.bathType] ?? '나-1'
                              : undefined;
                          const fee = calcFeeAmount({
                            year, serviceType: formData.serviceType,
                            durationMinutes: computedDuration, gradeNum: formData.grade, itemCode: _itemCode,
                          });
                          const surcharge = calcSurcharge({
                            year, serviceType: formData.serviceType, date: dateStr,
                            startTime: `${formData.startHour}:${formData.startMin}`,
                            endTime:   `${formData.endHour}:${formData.endMin}`,
                            durationMinutes: computedDuration, gradeNum: formData.grade,
                            feeAmount: fee, copaymentRate: formData.copaymentRate, itemCode: _itemCode,
                          });
                          // 본인부담금 = (기본수가 + 가산금) 합산 후 십원 단위 절사
                          const totalFee2 = fee + surcharge.amount;
                          const copay2    = calcCopayAmount(totalFee2, formData.copaymentRate);
                          const newEntry: ScheduleEntry = {
                            id: `NEW-${dateStr}-${formData.careWorkerId}-${Date.now()}`,
                            recipientId: id ?? '',
                            careWorkerId: formData.careWorkerId,
                            date: dateStr,
                            serviceType: formData.serviceType,
                            startTime: `${formData.startHour}:${formData.startMin}`,
                            endTime:   `${formData.endHour}:${formData.endMin}`,
                            durationMinutes: computedDuration,
                            unitCost: fee, benefitTotal: totalFee2, copayAmount: copay2, insuranceAmount: totalFee2 - copay2,
                            surchargeAmount: surcharge.amount, surchargeRate: surcharge.rate,
                            surchargeMinutes: surcharge.minutes,
                            kind: 'plan',
                            grade: formData.grade, copaymentType: formData.copaymentType, copaymentRate: formData.copaymentRate,
                          };
                          // 스냅샷 채워서 mockData 전역 일정 리스트에 commit
                          // (본인부담금확정 등 다른 화면에서도 즉시 보이도록)
                          setEntrySnapshots(newEntry, newEntry.grade ?? 5, newEntry.copaymentType ?? '일반');
                          commitAddedSchedules(year, month, [newEntry]);
                          return;
                        }
                      }}
                      style={{
                        flex: 1, minWidth: 0,
                        display: 'flex', flexDirection: 'column',
                        position: 'relative',
                        borderRight: dayIdx < 6 ? '1px solid #e4eaf3' : 'none',
                        borderLeft: assignMode && day
                          ? hasDuplicate ? '3px solid #fca5a5'
                          : isAssignable ? '3px solid #10b981'
                          : 'none'
                          : 'none',
                        backgroundColor: cellBg,
                        cursor: day ? (assignMode ? (hasDuplicate ? 'not-allowed' : 'pointer') : 'default') : 'default',
                        boxShadow: assignMode && isAssignable
                          ? 'inset 0 0 0 1px rgba(16,185,129,0.28), inset 2px 0 6px rgba(16,185,129,0.08)'
                          : assignMode && hasDuplicate
                          ? 'inset 0 0 0 1px rgba(248,113,113,0.25)'
                          : 'none',
                        transition: 'box-shadow 0.12s ease, background 0.12s ease',
                      }}
                    >
                      {/* 날짜 숫자 + 한줄 메모 */}
                      <div style={{
                        flexShrink: 0, padding: '2px 3px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 2,
                      }}>
                        {day ? (
                          <>
                            {/* 좌측: 날짜 원 + 인라인 메모 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0, overflow: 'hidden' }}>
                              <div style={{
                                width: 17, height: 17, flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '50%', fontSize: 11,
                                background: assignMode && isAssignable
                                  ? (isToday ? '#059669' : 'transparent')
                                  : isToday ? '#2563eb' : 'transparent',
                                color: assignMode && isAssignable
                                  ? (isToday ? '#ffffff' : '#047857')
                                  : assignMode && hasDuplicate
                                  ? '#ef4444'
                                  : isToday ? '#ffffff' : isSun ? '#dc2626' : isSat ? '#2563eb' : '#475569',
                                fontWeight: isToday ? 700 : assignMode ? 600 : 400,
                              }}>
                                {day.getDate()}
                              </div>

                              {/* 한줄 메모 인라인 영역 (배정 모드일 때 숨김) */}
                              {!assignMode && (
                                <div
                                  style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}
                                  onClick={e => e.stopPropagation()}
                                >
                                  {editingDayMemo === dateStr ? (
                                    <input
                                      autoFocus
                                      value={dayMemoInput}
                                      onChange={e => setDayMemoInput(e.target.value)}
                                      onBlur={() => saveDayMemo(dateStr)}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') saveDayMemo(dateStr);
                                        if (e.key === 'Escape') setEditingDayMemo(null);
                                      }}
                                      placeholder="메모 입력..."
                                      style={{
                                        width: '100%', fontSize: 12, padding: '1px 3px', height: 18,
                                        border: '1px solid #fbbf24', borderRadius: 3,
                                        background: '#fffbeb', color: '#92400e',
                                        outline: 'none', boxSizing: 'border-box' as const,
                                      }}
                                    />
                                  ) : dayMemoMap[dateStr] ? (
                                    <span
                                      onClick={() => {
                                        setEditingDayMemo(dateStr);
                                        setDayMemoInput(dayMemoMap[dateStr] ?? '');
                                      }}
                                      title={`${dayMemoMap[dateStr]}  (클릭하여 편집)`}
                                      style={{
                                        display: 'block', fontSize: 12, color: '#b45309', fontWeight: 500,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        background: '#fef9c3', padding: '0 3px', borderRadius: 2,
                                        borderLeft: '2px solid #f59e0b', cursor: 'text', lineHeight: '15px',
                                      }}
                                    >
                                      {dayMemoMap[dateStr]}
                                    </span>
                                  ) : (
                                    <span
                                      onClick={() => {
                                        setEditingDayMemo(dateStr);
                                        setDayMemoInput('');
                                      }}
                                      title="클릭하여 메모 추가"
                                      style={{
                                        display: 'flex', alignItems: 'center', cursor: 'pointer',
                                        opacity: 0.25, lineHeight: '15px', fontSize: 12,
                                      }}
                                    >
                                      <Pencil size={8} color="#475569" />
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* 우측: 배정 모드 상태 뱃지 */}
                            {assignMode ? (
                              hasDuplicate ? (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 1, flexShrink: 0,
                                  fontSize: 8, padding: '1px 3px', borderRadius: 3, fontWeight: 700,
                                  background: '#fee2e2', color: '#dc2626',
                                  border: '1px solid #fca5a5', lineHeight: 1,
                                }}>
                                  <Lock size={6} strokeWidth={2.5} />불가
                                </span>
                              ) : (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 1, flexShrink: 0,
                                  fontSize: 8, padding: '1px 3px', borderRadius: 3, fontWeight: 700,
                                  background: '#dcfce7', color: '#15803d',
                                  border: '1px solid #6ee7b7', lineHeight: 1,
                                }}>
                                  <Zap size={6} strokeWidth={2.5} />가능
                                </span>
                              )
                            ) : (
                              isPast && dayScheds.length > 0 && (
                                <Check size={8} color="#a7f3d0" style={{ flexShrink: 0 }} />
                              )
                            )}
                          </>
                        ) : null}
                      </div>

                      {/* 배정 가능 셀 — 호버 힌트 레이어 */}
                      {assignMode && isAssignable && (
                        <div style={{
                          position: 'absolute', bottom: 3, left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: 8, color: '#059669', fontWeight: 700,
                          opacity: 0.55, whiteSpace: 'nowrap', pointerEvents: 'none',
                        }}>
                          + 클릭 배정
                        </div>
                      )}

                      {/* 일정 카드 */}
                      <div style={{ padding: '0 2px 3px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {dayScheds.map(s => {
                          const c = SVC_STYLE[s.serviceType] ?? SVC_STYLE.visit_care;
                          const worker = getCareWorker(s.careWorkerId);
                          const isAdded = s.id.startsWith('NEW-');
                          // 집계 테이블 행과 동일한 규칙으로 그룹키 생성 (buildSummary와 일치).
                          // 청구: 제공직원|급여종류|수가최저분|급여액|claim  /  계획: 제공직원|급여종류|시작|종료|급여액|plan
                          const _cardFee = getScheduleTotalFee(s, year);
                          const cardKey = s.kind === 'claim'
                            ? `${s.careWorkerId}|${s.serviceType}|${getFeeMinMinutes(year, s.serviceType, s.durationMinutes)}|${_cardFee}|claim`
                            : `${s.careWorkerId}|${s.serviceType}|${s.startTime}|${s.endTime}|${_cardFee}|plan`;
                          const isCardHL = highlightedRowKey === cardKey;
                          return (
                            <div
                              key={s.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                const pw = 480;
                                const ph = 130;
                                let cx = rect.right + 6 + pw > window.innerWidth ? rect.left - pw - 6 : rect.right + 6;
                                cx = Math.max(4, Math.min(cx, window.innerWidth - pw - 4));
                                const cy = Math.max(4, Math.min(rect.top, window.innerHeight - ph));
                                setCardPopover({ schedule: s, x: cx, y: cy });
                              }}
                              style={{
                                borderRadius: 3, padding: '2px 3px',
                                cursor: 'pointer',
                                background: cardPopover?.schedule.id === s.id
                                  ? (s.kind === 'claim' ? '#dcfce7' : '#dbeafe')
                                  : isCardHL ? '#fef9c3' : c.bg,
                                borderTop:    `${cardPopover?.schedule.id === s.id ? '2px' : '1px'} solid ${cardPopover?.schedule.id === s.id ? (s.kind === 'claim' ? '#059669' : '#1d4ed8') : isCardHL ? '#f59e0b' : c.border}`,
                                borderRight:  `${cardPopover?.schedule.id === s.id ? '2px' : '1px'} solid ${cardPopover?.schedule.id === s.id ? (s.kind === 'claim' ? '#059669' : '#1d4ed8') : isCardHL ? '#f59e0b' : c.border}`,
                                borderBottom: `${cardPopover?.schedule.id === s.id ? '2px' : '1px'} solid ${cardPopover?.schedule.id === s.id ? (s.kind === 'claim' ? '#059669' : '#1d4ed8') : isCardHL ? '#f59e0b' : c.border}`,
                                borderLeft:   `${cardPopover?.schedule.id === s.id ? '3px' : '2px'} solid ${cardPopover?.schedule.id === s.id ? (s.kind === 'claim' ? '#059669' : '#1d4ed8') : isCardHL ? '#f59e0b' : s.kind === 'claim' ? '#16a34a' : '#2563eb'}`,
                                boxShadow: cardPopover?.schedule.id === s.id
                                  ? `0 0 0 2px ${s.kind === 'claim' ? 'rgba(5,150,105,0.3)' : 'rgba(29,78,216,0.3)'}, 0 2px 8px rgba(0,0,0,0.12)`
                                  : undefined,
                                animation: isCardHL ? 'cardPulse 0.45s ease-out forwards' : undefined,
                                position: 'relative', zIndex: cardPopover?.schedule.id === s.id ? 10 : isCardHL ? 5 : undefined,
                                transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                                <span style={{ fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0, fontWeight: 600 }}>
                                  {SERVICE_LABELS[s.serviceType as keyof typeof SERVICE_LABELS]} {s.durationMinutes}분
                                  {s.feeEdited && <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 3px', borderRadius: 2, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', marginLeft: 3, verticalAlign: 'middle' }}>급여수정</span>}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                                  <span style={{
                                    fontSize: 9, fontWeight: 700, lineHeight: 1,
                                    padding: '1px 3px', borderRadius: 2,
                                    background: s.kind === 'claim' ? '#dcfce7' : '#dbeafe',
                                    color: s.kind === 'claim' ? '#15803d' : '#1d4ed8',
                                    border: `1px solid ${s.kind === 'claim' ? '#86efac' : '#93c5fd'}`,
                                  }}>{s.kind === 'claim' ? '청' : '계'}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // 모든 일정은 전역 store 에 있으므로 동일하게 제거
                                      removeSchedules(year, month, [s.id]);
                                    }}
                                    style={{
                                      width: 13, height: 13,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      backgroundColor: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
                                      borderRadius: 2, cursor: 'pointer', padding: 0,
                                    }}
                                    title="삭제"
                                  >
                                    <X size={7} color="#dc2626" />
                                  </button>
                                </div>
                              </div>
                              <div style={{ fontSize: 13, color: '#0f172a', opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {s.startTime}~{s.endTime}
                              </div>
                              {(() => {
                                const displayGrade = s.grade ?? getGradeNum(recipient);
                                const displayType  = s.copaymentType ?? getReduction(recipient);
                                const cs = copayStyle(displayType);
                                return (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
                                    <span style={{ fontSize: 13, color: '#0f172a', opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                                      {worker?.name}
                                    </span>
                                    <span style={{ display: 'flex', gap: 2, flexShrink: 0, alignItems: 'center' }}>
                                      <span style={{ fontSize: 9, padding: '0px 3px', borderRadius: 2, fontWeight: 700, lineHeight: 1.6, background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>{displayGrade}등</span>
                                      <span style={{ fontSize: 9, padding: '0px 3px', borderRadius: 2, fontWeight: 700, lineHeight: 1.6, background: cs.bg, color: cs.color, border: `1px solid ${cs.border}` }}>{copayLabel(displayType)}</span>
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })}

                        {/* 방문상담 카드 */}
                        {getDayConsults(day).map(consult => {
                          const sw = socialWorkers.find(w => w.id === consult.socialWorkerId);
                          const startTime = consult.plannedStartTime;
                          const endTime   = consult.plannedEndTime ?? '';
                          const [startH, startM] = startTime.split(':').map(Number);
                          const [endH, endM] = (endTime || '00:00').split(':').map(Number);
                          const durationMin = (endH * 60 + endM) - (startH * 60 + startM);
                          const isDone = consult.consultStatus === 'completed';
                          return (
                            <div
                              key={consult.id}
                              style={{
                                borderRadius: 3, padding: '2px 3px',
                                background: 'transparent',
                                borderTop: '1px dashed #d8b4fe',
                                borderRight: '1px dashed #d8b4fe',
                                borderBottom: '1px dashed #d8b4fe',
                                borderLeft: `2px solid ${isDone ? '#a855f7' : '#c084fc'}`,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                                <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                                  방문상담 {durationMin}분
                                </span>
                                <span style={{
                                  fontSize: 9, fontWeight: 700, lineHeight: 1,
                                  padding: '1px 3px', borderRadius: 2, flexShrink: 0,
                                  background: isDone ? '#f3e8ff' : '#faf5ff',
                                  color: isDone ? '#7e22ce' : '#9333ea',
                                  border: '1px solid #d8b4fe',
                                }}>{isDone ? '완' : '예'}</span>
                              </div>
                              <div style={{ fontSize: 13, color: '#0f172a', opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {startTime}~{endTime}
                              </div>
                              <div style={{ fontSize: 13, color: '#581c87', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {sw?.name}
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

          {/* 급여 집계 테이블 */}
          <div style={{ borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  {['구분', '급여제공직원', '시작시간', '종료시간', '급여종류', '제공시간', '급여액(1회)', '제공횟수', '급여액합계'].map((h) => (
                    <th key={h} style={{
                      ...TH,
                      borderRight: '1px solid rgba(255,255,255,0.12)',
                    }}>{h}</th>
                  ))}
                  {viewMode === 'plan' && (
                    <th style={{ ...TH, borderRight: 'none', width: 60, minWidth: 60 }}></th>
                  )}
                </tr>
              </thead>
              <tbody>
                {summary.length === 0 ? (
                  <tr>
                    <td colSpan={viewMode === 'plan' ? 10 : 9} style={{ padding: '10px', textAlign: 'center', fontSize: 11, color: '#94a3b8' }}>
                      이 달의 일정 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  summary.map((row, idx) => {
                    const worker     = getCareWorker(row.careWorkerId);
                    const agencyPay  = row.benefitTotalSum;
                    const c          = SVC_STYLE[row.serviceType] ?? SVC_STYLE.visit_care;
                    // cardKey(캘린더 일정카드)와 동일한 규칙 — 클릭 시 해당 그룹의 일정만 하이라이트
                    const rowKey     = row.kind === 'claim'
                      ? `${row.careWorkerId}|${row.serviceType}|${row.durationMinutes}|${row.unitCost}|claim`
                      : `${row.careWorkerId}|${row.serviceType}|${row.startTime}|${row.endTime}|${row.unitCost}|plan`;
                    const isRowActive = highlightedRowKey === rowKey;
                    const bg         = isRowActive
                      ? 'rgba(254,243,199,0.85)'
                      : idx % 2 === 0 ? '#ffffff' : '#f4f7fb';
                    const td: CSSProperties = {
                      padding: '0 8px', height: 30,
                      borderBottom: '1px solid #e4eaf3',
                      textAlign: 'center', background: bg,
                      color: '#1e293b', fontSize: 13,
                      transition: 'background 0.2s',
                    };
                    return (
                      <tr
                        key={idx}
                        onClick={() => {
                          if (hlTimerRef.current) clearTimeout(hlTimerRef.current);
                          setHighlightedRowKey(rowKey);
                          hlTimerRef.current = setTimeout(() => setHighlightedRowKey(null), 5000);
                        }}
                        style={{
                          cursor: 'pointer',
                          outline: isRowActive ? '2px solid #fbbf24' : 'none',
                          outlineOffset: -1,
                        }}
                      >
                        <td style={{ ...td }}>
                          <span style={{
                            fontSize: 11, padding: '1px 7px', borderRadius: 3, fontWeight: 700,
                            background: row.kind === 'claim' ? '#d1fae5' : '#dbeafe',
                            color:      row.kind === 'claim' ? '#059669' : '#1d4ed8',
                            border:     `1px solid ${row.kind === 'claim' ? '#6ee7b7' : '#93c5fd'}`,
                          }}>
                            {row.kind === 'claim' ? '청구' : '계획'}
                          </span>
                        </td>
                        <td style={{ ...td }}>{worker?.name ?? '-'}</td>
                        <td style={{ ...td, fontFamily: "'Noto Sans KR', sans-serif" }}>{row.startTime || <span style={{ color: '#cbd5e1' }}>-</span>}</td>
                        <td style={{ ...td, fontFamily: "'Noto Sans KR', sans-serif" }}>{row.endTime || <span style={{ color: '#cbd5e1' }}>-</span>}</td>
                        <td style={{ ...td }}>
                          <span style={{
                            background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                            fontSize: 11, padding: '1px 5px', borderRadius: 3, fontWeight: 600,
                          }}>
                            {SERVICE_LABELS[row.serviceType as keyof typeof SERVICE_LABELS]}
                          </span>
                        </td>
                        <td style={{ ...td }}>{row.durationMinutes}분</td>
                        <td style={{ ...td, fontFamily: "'Noto Sans KR', sans-serif", fontSize: 13 }}>{row.unitCost.toLocaleString('ko-KR')}원</td>
                        <td style={{ ...td, fontFamily: "'Noto Sans KR', sans-serif" }}>{row.count}회</td>
                        <td style={{ ...td, color: row.kind === 'claim' ? '#059669' : '#1d4ed8', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>
                          {agencyPay.toLocaleString('ko-KR')}원
                        </td>
                        {viewMode === 'plan' && (
                          <td style={{ ...td, padding: '0 6px' }}>
                            <button
                              onClick={() => {
                                const [sh, sm] = row.startTime.split(':');
                                const [eh, em] = row.endTime.split(':');
                                setFormData(f => ({
                                  ...f,
                                  careWorkerId: row.careWorkerId,
                                  serviceType:  row.serviceType,
                                  startHour:    sh ?? '09',
                                  startMin:     sm ?? '00',
                                  endHour:      eh ?? '10',
                                  endMin:       em ?? '30',
                                  unitCost:     row.unitCost,
                                }));
                                setAssignMode(false);
                                setShowAddForm(true);
                              }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                padding: '2px 7px', fontSize: 10, borderRadius: 4, cursor: 'pointer',
                                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                color: '#ffffff', border: 'none', fontWeight: 700,
                                whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(37,99,235,0.35)',
                              }}
                            >
                              + 일정추가
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* ══ 일정 추가 플로팅 패널 ══ */}
      {showAddForm && (
        <>
          {/* 반투명 딤 배경 — 배정 모드일 때는 제거해서 캘린더 클릭 허용 */}
          {!assignMode && (
            <div
              onClick={closeForm}
              style={{
                position: 'absolute', top: 0, left: 0, bottom: 0, width: 258,
                zIndex: 40,
                background: 'rgba(10, 25, 50, 0.18)',
                animation: 'fadeInBackdrop 0.18s ease',
              }}
            />
          )}

          {/* 슬라이드인 플로팅 폼 패널 — 수급자 목록(258px) 위에 떠 있음 */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            width: 258, zIndex: 50,
            display: 'flex', flexDirection: 'column',
            background: 'linear-gradient(180deg, #f0f6ff 0%, #ffffff 60px)',
            borderRight: '2px solid #bfdbfe',
            boxShadow: '8px 0 32px rgba(10,25,60,0.28), 2px 0 6px rgba(37,99,235,0.12)',
            overflow: 'hidden',
            animation: 'slideInLeft 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>

            {/* 플로팅 패널 헤더 */}
            <div style={{
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px 8px',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #0f2744 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.12)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: 'rgba(255,255,255,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Calendar size={11} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>일정 추가</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{recipient.name}</div>
                </div>
              </div>
              <button
                onClick={closeForm}
                style={{
                  width: 22, height: 22, borderRadius: 6, cursor: 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={11} color="rgba(255,255,255,0.85)" />
              </button>
            </div>

            {/* 폼 내용 스크롤 영역 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* ── 등급 ── */}
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 700, letterSpacing: '0.03em' }}>등급</div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {([1, 2, 3, 4, 5] as RecipientGrade[]).map(g => {
                    const active = formData.grade === g;
                    return (
                      <button key={g} onClick={() => updateForm(f => ({ ...f, grade: g }))}
                        style={{
                          flex: 1, padding: '4px 0', fontSize: 11, borderRadius: 4, cursor: 'pointer',
                          fontWeight: active ? 700 : 400,
                          backgroundColor: active ? '#dbeafe' : '#ffffff',
                          color: active ? '#1d4ed8' : '#94a3b8',
                          border: `1px solid ${active ? '#93c5fd' : '#e2e8f0'}`,
                          boxShadow: active ? '0 1px 4px rgba(37,99,235,0.15)' : 'none',
                          transition: 'background 0.12s, color 0.12s, border-color 0.12s, box-shadow 0.12s',
                        }}>
                        {g}등급
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── 감경구분 ── */}
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 700, letterSpacing: '0.03em' }}>감경구분</div>
                <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
                  {([
                    { type: '일반',   rate: 15, short: '일반', sub: '15%',  activeBg: '#f1f5f9', activeColor: '#475569', activeBorder: '#cbd5e1' },
                    { type: '감경9%', rate:  9, short: '9%',   sub: '감경', activeBg: '#fff7ed', activeColor: '#c2410c', activeBorder: '#fdba74' },
                    { type: '감경6%', rate:  6, short: '6%',   sub: '감경', activeBg: '#f0fdf4', activeColor: '#059669', activeBorder: '#6ee7b7' },
                    { type: '기초',   rate:  0, short: '기초', sub: '0%',   activeBg: '#fefce8', activeColor: '#854d0e', activeBorder: '#fde047' },
                  ] as const).map(({ type, rate, short, sub, activeBg, activeColor, activeBorder }) => {
                    const active = formData.copaymentType === type;
                    return (
                      <button key={type}
                        onClick={() => updateForm(f => ({ ...f, copaymentType: type, copaymentRate: rate }))}
                        style={{
                          flex: 1, padding: '4px 0', fontSize: 11, borderRadius: 4, cursor: 'pointer',
                          fontWeight: active ? 700 : 400,
                          backgroundColor: active ? activeBg : '#ffffff',
                          color: active ? activeColor : '#94a3b8',
                          border: `1px solid ${active ? activeBorder : '#e2e8f0'}`,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
                          lineHeight: 1.3,
                          boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                          transition: 'background 0.12s, color 0.12s, border-color 0.12s, box-shadow 0.12s',
                        }}>
                        <span style={{ fontWeight: active ? 700 : 500 }}>{short}</span>
                        <span style={{ fontSize: 10, opacity: 0.75 }}>{sub}</span>
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* 급여종류 */}
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 700, letterSpacing: '0.03em' }}>급여종류</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {(Object.keys(SERVICE_LABELS) as ServiceType[]).map(st => {
                    const c = SVC_STYLE[st];
                    const active = formData.serviceType === st;
                    return (
                      <button key={st} onClick={() => updateForm(f => ({ ...f, serviceType: st, careWorkerId: '', careWorkerId2: '' }))}
                        style={{
                          fontSize: 11, padding: '3px 7px', borderRadius: 4, cursor: 'pointer',
                          fontWeight: active ? 700 : 400,
                          backgroundColor: active ? c.bg : '#ffffff',
                          color: active ? c.color : '#94a3b8',
                          border: `1px solid ${active ? c.border : '#e2e8f0'}`,
                          boxShadow: active ? `0 1px 4px ${c.border}80` : 'none',
                          transition: 'background 0.12s, color 0.12s, border-color 0.12s, box-shadow 0.12s',
                        }}>
                        {SERVICE_LABELS[st]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 요양보호사 — 주간보호는 숨김, 방문목욕은 2명, 나머지는 1명 */}
              {formData.serviceType !== 'day_care' && (
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 700, letterSpacing: '0.03em' }}>
                    급여제공(일정배정) {formData.serviceType === 'visit_nursing' ? '간호(조무)사' : `요양보호사${formData.serviceType === 'visit_bath' ? ' (1번)' : ''}`} <span style={{ color: '#ef4444' }}>*</span>
                  </div>
                  <CareWorkerCombo
                    value={formData.careWorkerId}
                    onChange={id => {
                      updateForm(f => ({ ...f, careWorkerId: id }));
                      // 담당이 있는 종류면 해당 종류의 목록에 없을 때 자동 등록
                      if (id && formData.serviceType !== 'day_care') {
                        setCurSvcWorkers(formData.serviceType, prev => prev.includes(id) ? prev : [...prev, id]);
                        // 가족요양 — 현재 선택된 가족관계도 함께 저장
                        if (formData.serviceType === 'family_care' && formData.familyRelation) {
                          saveFamilyRelation(id, formData.familyRelation);
                        }
                      }
                    }}
                    placeholder={formData.serviceType === 'visit_nursing' ? '간호사/간호조무사를 선택하세요' : '요양보호사를 선택하세요'}
                    allowedPositions={formData.serviceType === 'visit_nursing' ? ['ST_04', 'ST_09'] : ['ST_08']}
                  />
                  {formData.serviceType === 'visit_bath' && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 700, letterSpacing: '0.03em' }}>
                        요양보호사 (2번) <span style={{ color: '#ef4444' }}>*</span>
                      </div>
                      <CareWorkerCombo
                        value={formData.careWorkerId2}
                        onChange={id => {
                          updateForm(f => ({ ...f, careWorkerId2: id }));
                          if (id) {
                            setCurSvcWorkers('visit_bath', prev => prev.includes(id) ? prev : [...prev, id]);
                          }
                        }}
                        placeholder="두번째 요양보호사를 선택하세요"
                      />
                    </div>
                  )}
                  {/* 가족요양 — 가족관계 */}
                  {formData.serviceType === 'family_care' && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 700, letterSpacing: '0.03em' }}>
                        가족관계 <span style={{ color: '#ef4444' }}>*</span>
                      </div>
                      <select
                        value={formData.familyRelation}
                        onChange={e => {
                          const rel = e.target.value;
                          updateForm(f => ({ ...f, familyRelation: rel }));
                          // 이미 선택된 요양보호사가 있으면 가족관계 즉시 갱신
                          if (formData.careWorkerId && rel) {
                            saveFamilyRelation(formData.careWorkerId, rel);
                          }
                        }}
                        style={{ width: '100%', fontSize: 12, padding: '5px 8px', borderRadius: 5, border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', outline: 'none' }}
                      >
                        <option value="">선택</option>
                        {FAMILY_RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  )}
                  {/* 방문목욕 — 차량이용 구분 */}
                  {formData.serviceType === 'visit_bath' && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 700, letterSpacing: '0.03em' }}>
                        차량이용 구분 <span style={{ color: '#ef4444' }}>*</span>
                      </div>
                      <select
                        value={formData.bathType}
                        onChange={e => updateForm(f => ({ ...f, bathType: e.target.value }))}
                        style={{ width: '100%', fontSize: 12, padding: '5px 8px', borderRadius: 5, border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', outline: 'none' }}
                      >
                        <option value="차량이용(차량내)">차량이용(차량내)</option>
                        <option value="차량이용(가정내)">차량이용(가정내)</option>
                        <option value="차량미이용">차량미이용</option>
                      </select>
                    </div>
                  )}
                </div>
              )}



              {/* 시간 */}
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 700, letterSpacing: '0.03em' }}>시간</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <select value={formData.startHour} onChange={e => updateForm(f => ({ ...f, startHour: e.target.value }))}
                    style={{ width: 40, fontSize: 12, padding: '3px 2px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>:</span>
                  <select value={formData.startMin} onChange={e => updateForm(f => ({ ...f, startMin: e.target.value }))}
                    style={{ width: 40, fontSize: 12, padding: '3px 2px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>~</span>
                  <select value={formData.endHour} onChange={e => updateForm(f => ({ ...f, endHour: e.target.value }))}
                    style={{ width: 40, fontSize: 12, padding: '3px 2px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>:</span>
                  <select value={formData.endMin} onChange={e => updateForm(f => ({ ...f, endMin: e.target.value }))}
                    style={{ width: 40, fontSize: 12, padding: '3px 2px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                {/* 빠른 시간 설정 버튼 — 급여종류별 */}
                {(() => {
                  type QuickBtn = { label: string; mins: number };
                  const map: Record<string, QuickBtn[]> = {
                    visit_care:     [{ label:'3시간', mins:180 },{ label:'3시간30분', mins:210 },{ label:'4시간', mins:240 },{ label:'8시간', mins:480 }],
                    family_care:    [{ label:'60분', mins:60 },{ label:'90분', mins:90 }],
                    full_day_visit: [{ label:'12시간', mins:720 }],
                    visit_bath:     [{ label:'40분', mins:40 },{ label:'60분', mins:60 }],
                    visit_nursing:  [{ label:'15분', mins:15 },{ label:'30분', mins:30 },{ label:'60분', mins:60 }],
                    day_care:       [{ label:'3시간', mins:180 },{ label:'6시간', mins:360 },{ label:'8시간', mins:480 },{ label:'10시간', mins:600 }],
                  };
                  const btns = map[formData.serviceType] ?? [];
                  if (btns.length === 0) return null;
                  const applyDuration = (mins: number) => {
                    const sh = parseInt(formData.startHour) || 0;
                    const sm = parseInt(formData.startMin) || 0;
                    const total = sh * 60 + sm + mins;
                    // 자정 넘김 처리 — 24시간 이내로 표현
                    const eh = Math.floor(total / 60) % 24;
                    const em = total % 60;
                    updateForm(f => ({
                      ...f,
                      endHour: String(eh).padStart(2, '0'),
                      endMin:  String(em).padStart(2, '0'),
                    }));
                  };
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                      {btns.map(b => (
                        <button key={b.label} onClick={() => applyDuration(b.mins)}
                          style={{
                            fontSize: 11, padding: '3px 7px', borderRadius: 4, cursor: 'pointer',
                            border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8',
                            fontWeight: 500, whiteSpace: 'nowrap',
                          }}>
                          {b.label}
                        </button>
                      ))}
                    </div>
                  );
                })()}
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  {computedDuration > 0
                    ? `${Math.floor(computedDuration / 60)}시간 ${computedDuration % 60}분 (${computedDuration}분)${computedDuration >= 24*60 ? ' ⚠ 24시간 초과' : ''}`
                    : '시간을 확인하세요'}
                </div>
              </div>

              {/* ── 담당 요양보호사/간호(조무)사 (방문요양/가족요양/종일방문/방문목욕=요양보호사, 방문간호=간호조무사, 주간보호=없음) ── */}
              {formData.serviceType !== 'day_care' && (()=>{
                const isNursing = formData.serviceType === 'visit_nursing';
                const label = isNursing ? '담당 간호(조무)사' : '담당 요양보호사';
                const emptyMsg = `등록된 ${label}가 없습니다.`;
                const pickerPos = isNursing ? ['ST_04','ST_09'] : ['ST_08'];
                return (
                <div style={{ marginTop: 10 }}>
                  <div style={{ height: 1, background: '#e2e8f0', marginBottom: 10 }} />
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.03em' }}>※ {label}</span>
                  </div>
                  {curSvcWorkers(formData.serviceType).length === 0 ? (
                    <div style={{ fontSize: 11, color: '#cbd5e1', padding: '6px 0' }}>{emptyMsg}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {curSvcWorkers(formData.serviceType).map(wid => {
                        const w = careWorkers.find(x => x.id === wid);
                        if (!w) return null;
                        const birth = getEmployeeBirth(w);
                        const isSel = formData.careWorkerId === wid;
                        return (
                          <div key={wid} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 6px', borderRadius: 5, border: `1px solid ${isSel ? '#bfdbfe' : '#e2e8f0'}`, background: isSel ? '#eff6ff' : '#f8fafc' }}>
                            {/* 이름 — 선택 여부에 따라 파랑/회색 */}
                            <button
                              onClick={() => updateForm(f => ({
                                ...f,
                                careWorkerId: wid,
                                // 가족요양이면 저장된 가족관계도 함께 반영
                                familyRelation: formData.serviceType === 'family_care' ? (familyRelationMap[wid] ?? '') : f.familyRelation,
                              }))}
                              title="이 요양보호사를 위의 선택칸에 입력"
                              style={{ fontSize: 12, fontWeight: isSel ? 700 : 500, color: isSel ? '#1d4ed8' : '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                              {w.name}
                            </button>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{birth}</span>
                            {/* 가족요양 — 가족관계 표시 */}
                            {formData.serviceType === 'family_care' && familyRelationMap[wid] && (
                              <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', whiteSpace: 'nowrap' }}>
                                {familyRelationMap[wid]}
                              </span>
                            )}
                            {/* 일정조회 — 항상 회색 */}
                            <button
                              onClick={() => setSchedViewWorker(wid)}
                              style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 7px', borderRadius: 4, cursor: 'pointer', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              일정조회
                            </button>
                            {/* 삭제 */}
                            <button
                              onClick={() => setCurSvcWorkers(formData.serviceType, prev => prev.filter(x => x !== wid))}
                              style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, cursor: 'pointer', border: '1px solid #fecaca', background: '#fff1f2', color: '#dc2626' }}>
                              <X size={10} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* [+ 추가] 버튼 — 목록 아래, 덜 진한 스타일 */}
                  {!showAddWorkerPicker && (
                    <button
                      onClick={() => { setShowAddWorkerPicker(true); setAddWorkerPickVal(''); }}
                      style={{ marginTop: 6, width: '100%', fontSize: 11, padding: '4px 0', borderRadius: 5, cursor: 'pointer', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#94a3b8', fontWeight: 500 }}>
                      + 추가
                    </button>
                  )}
                  {/* 인라인 요양보호사 검색 선택 — 추가 버튼 아래 */}
                  {showAddWorkerPicker && (
                    <div style={{ marginTop: 6, padding: '8px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <CareWorkerCombo
                        value={addWorkerPickVal}
                        onChange={wid => { setAddWorkerPickVal(wid); setAddWorkerRelation(''); }}
                        placeholder={`추가할 ${label}를 검색하세요`}
                        allowedPositions={pickerPos}
                      />
                      {/* 가족요양 — 가족관계 선택 */}
                      {formData.serviceType === 'family_care' && addWorkerPickVal && (
                        <select
                          value={addWorkerRelation}
                          onChange={e => setAddWorkerRelation(e.target.value)}
                          style={{ fontSize: 12, padding: '4px 8px', borderRadius: 5, border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', outline: 'none' }}
                        >
                          <option value="">가족관계 선택</option>
                          {FAMILY_RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      )}
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => { setShowAddWorkerPicker(false); setAddWorkerPickVal(''); setAddWorkerRelation(''); }}
                          style={{ padding: '4px 12px', fontSize: 12, borderRadius: 5, cursor: 'pointer', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b' }}>
                          취소
                        </button>
                        <button
                          disabled={!addWorkerPickVal || (formData.serviceType === 'family_care' && !addWorkerRelation)}
                          onClick={() => {
                            if (addWorkerPickVal && !curSvcWorkers(formData.serviceType).includes(addWorkerPickVal)) {
                              setCurSvcWorkers(formData.serviceType, prev => [...prev, addWorkerPickVal]);
                            }
                            if (formData.serviceType === 'family_care' && addWorkerRelation) {
                              saveFamilyRelation(addWorkerPickVal, addWorkerRelation);
                            }
                            setAddWorkerPickVal('');
                            setAddWorkerRelation('');
                            setShowAddWorkerPicker(false);
                          }}
                          style={{ padding: '4px 14px', fontSize: 12, borderRadius: 5,
                            cursor: (addWorkerPickVal && (formData.serviceType !== 'family_care' || addWorkerRelation)) ? 'pointer' : 'not-allowed',
                            border: '1px solid #152e50',
                            background: (addWorkerPickVal && (formData.serviceType !== 'family_care' || addWorkerRelation)) ? '#152e50' : '#e2e8f0',
                            color: (addWorkerPickVal && (formData.serviceType !== 'family_care' || addWorkerRelation)) ? '#fff' : '#94a3b8', fontWeight: 700 }}>
                          등록
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                );
              })()}

            </div>

            {/* 하단 버튼 영역 */}
            <div style={{
              flexShrink: 0,
              padding: '10px 12px',
              borderTop: '1px solid #e2e8f0',
              background: '#ffffff',
              boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
            }}>
              {!assignMode ? (
                /* ── Step 1: 값 설정 후 중복검사 ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* 안내 힌트 */}
                  <div style={{
                    fontSize: 11, color: '#64748b', padding: '4px 8px',
                    background: '#f8fafc', borderRadius: 5, border: '1px solid #e2e8f0',
                    lineHeight: 1.5,
                  }}>
                    값 설정 후 <span style={{ color: '#1d4ed8', fontWeight: 700 }}>중복검사</span>를 실행하면
                    배정 가능한 날짜가 캘린더에 표시됩니다.
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={closeForm}
                      style={{
                        flex: 1, padding: '7px', fontSize: 12, borderRadius: 7,
                        border: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
                        color: '#64748b', cursor: 'pointer', fontWeight: 500,
                      }}>
                      취소
                    </button>
                    <button
                      onClick={() => {
                        if (formData.serviceType !== 'day_care' && !formData.careWorkerId) { alert('요양보호사를 선택하세요.'); return; }
                        if (formData.serviceType === 'visit_bath' && !formData.careWorkerId2) { alert('방문목욕은 요양보호사 2명을 선택해야 합니다.'); return; }
                        if (computedDuration <= 0) { alert('시간을 확인하세요.'); return; }
                        setViewMode('plan');
                        setAssignMode(true);
                        setBatchType('');
                      }}
                      style={{
                        flex: 2, padding: '7px', fontSize: 12, borderRadius: 7, fontWeight: 700,
                        backgroundImage: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        backgroundColor: 'transparent',
                        border: 'none', color: '#ffffff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        boxShadow: '0 2px 8px rgba(37,99,235,0.30)',
                      }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      중복검사
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Step 2: 배정 모드 (개별 클릭 + 일괄설정) ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>

                  {/* 상태 배너 */}
                  <div style={{
                    padding: '6px 9px',
                    background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                    borderRadius: 7, border: '1px solid #6ee7b7',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                      <Check size={11} color="#059669" />중복검사 완료 · 배정 모드
                    </div>
                    <div style={{ fontSize: 11, color: '#065f46', lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 700 }}>초록 날짜</span> 클릭 → 개별 배정
                      &nbsp;·&nbsp; 아래 일괄설정 후 <span style={{ fontWeight: 700 }}>실행</span>
                    </div>
                  </div>

                  {/* 구분선 + 일괄설정 라벨 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>일괄설정</span>
                    <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                  </div>

                  {/* 일괄설정 드롭다운 + 실행 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 8px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                    <select value={batchType} onChange={e => { setBatchType(e.target.value); setShowDayPicker(false); }}
                      style={{ width: '100%', fontSize: 12, padding: '4px 5px', borderRadius: 5, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', cursor: 'pointer' }}>
                      <option value="">방식 선택</option>
                      <option value="all_month">한달모두일괄 (모든 날짜)</option>
                      <option value="weekday_only">(공휴일아닌) 평일일괄 (공휴일·토·일 제외)</option>
                      <option value="no_holiday_only">공휴일만제외 일괄적용</option>
                      <option value="no_weekend">토일일괄제외 (월~금)</option>
                      <option value="specific_day">특정요일 일괄적용</option>
                    </select>

                    {/* 특정요일 선택 */}
                    {batchType === 'specific_day' && (
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        {['일','월','화','수','목','금','토'].map((d, i) => {
                          const on = selectedDays.has(i);
                          return (
                            <button key={i} onClick={() => setSelectedDays(prev => {
                              const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n;
                            })} style={{
                              width: 28, height: 28, borderRadius: 6, border: on ? 'none' : '1px solid #e2e8f0',
                              fontSize: 11, fontWeight: on ? 700 : 400, cursor: 'pointer',
                              background: on ? (i === 0 ? '#dc2626' : i === 6 ? '#2563eb' : '#152e50') : '#fff',
                              color: on ? '#fff' : i === 0 ? '#dc2626' : i === 6 ? '#2563eb' : '#64748b',
                            }}>{d}</button>
                          );
                        })}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        if (!batchType) { alert('방식을 선택하세요.'); return; }
                        if (batchType === 'specific_day' && selectedDays.size === 0) { alert('요일을 하나 이상 선택하세요.'); return; }
                        if (batchType === 'all_month')       runBatchAssign({});
                        else if (batchType === 'weekday_only')  runBatchAssign({ excludeHoliday: true, allowedDows: new Set([1,2,3,4,5]) });
                        else if (batchType === 'no_holiday_only') runBatchAssign({ excludeHoliday: true });
                        else if (batchType === 'no_weekend')    runBatchAssign({ allowedDows: new Set([1,2,3,4,5]) });
                        else if (batchType === 'specific_day')  runBatchAssign({ allowedDows: selectedDays });
                      }}
                      disabled={!batchType}
                      style={{
                        padding: '6px 0', fontSize: 12, borderRadius: 5, fontWeight: 700,
                        backgroundImage: batchType ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'none',
                        backgroundColor: batchType ? 'transparent' : '#e4eaf3',
                        border: 'none', color: batchType ? '#fff' : '#94a3b8',
                        cursor: batchType ? 'pointer' : 'default',
                        boxShadow: batchType ? '0 2px 6px rgba(37,99,235,0.25)' : 'none',
                      }}
                    >일괄 배정 실행</button>
                  </div>

                  {/* 구분선 */}
                  <div style={{ height: 1, background: '#e2e8f0' }} />

                  {/* 하단 버튼: 다시설정 / 배정완료 */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => { setAssignMode(false); setBatchType(''); }}
                      style={{
                        flex: 1, padding: '6px', fontSize: 12, borderRadius: 7,
                        border: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
                        color: '#64748b', cursor: 'pointer', fontWeight: 500,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                      }}>
                      <ChevronLeft size={11} />다시설정
                    </button>
                    <button
                      onClick={() => { setAssignMode(false); setShowAddForm(false); setBatchType(''); }}
                      style={{
                        flex: 2, padding: '6px', fontSize: 12, borderRadius: 7, fontWeight: 700,
                        backgroundImage: 'linear-gradient(135deg, #059669, #047857)',
                        backgroundColor: 'transparent',
                        border: 'none', color: '#ffffff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        boxShadow: '0 2px 8px rgba(5,150,105,0.25)',
                      }}>
                      <Check size={11} />배정 완료
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>
        </>
      )}

      {/* ══ 배정카드 팝오버 ══ */}
      {cardPopover && (() => {
        const s = cardPopover.schedule;
        const w = getCareWorker(s.careWorkerId);
        const displayGrade    = s.grade ?? getGradeNum(recipient);
        const displayCopayType = s.copaymentType ?? getReduction(recipient);
        const displayCopayRate = s.copaymentRate ?? getCopayRate(recipient);
        const totalAmt    = getScheduleTotalFee(s, year); // 기본수가 + 가산금 (저장/실시간 모두 정확)
        const selfPay     = s.copayAmount ?? Math.floor(totalAmt * displayCopayRate / 100);
        const insurancePay = s.insuranceAmount ?? (totalAmt - selfPay);
        const dob       = w ? parseWorkerDOB(w.registrationId) : '-';
        const sc        = SVC_STYLE[s.serviceType] ?? SVC_STYLE.visit_care;
        // 가산금 — 저장된 스냅샷 우선, 없으면 실시간 계산
        // surcharge는 항상 unitCost(기본수가) 기준으로 계산 (totalAmt는 이미 surcharge 포함)
        const surSnap = calcSurcharge({
          year, serviceType: s.serviceType, date: s.date,
          startTime: s.startTime, endTime: s.endTime,
          durationMinutes: s.durationMinutes, gradeNum: displayGrade,
          feeAmount: s.unitCost, copaymentRate: displayCopayRate,
        });
        const hasSurcharge = surSnap.amount > 0;
        // totalAmt = unitCost + surchargeAmount (이미 가산 포함)
        const totalFeeAll  = totalAmt;
        const totalCopay   = hasSurcharge ? Math.floor(totalFeeAll * displayCopayRate / 1000) * 10 : selfPay;
        const totalInsurance = hasSurcharge ? totalFeeAll - totalCopay : insurancePay;

        const THP: CSSProperties = {
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          borderRight: '1px solid #e2e8f0',
          padding: '3px 5px', fontSize: 12, fontWeight: 600,
          color: '#64748b', textAlign: 'center', whiteSpace: 'nowrap', lineHeight: 1.35,
        };
        const TD0: CSSProperties = {
          borderBottom: '1px solid #f1f5f9',
          borderRight: '1px solid #f1f5f9',
          padding: '3px 5px',
          fontSize: 13, color: '#1e293b', textAlign: 'center', whiteSpace: 'nowrap',
        };
        return (
          <>
            {/* 투명 backdrop (클릭 시 닫기) */}
            <div
              onClick={() => setCardPopover(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 300 }}
            />
            {/* 팝오버 본체 */}
            <div style={{
              position: 'fixed', left: cardPopover.x, top: cardPopover.y,
              zIndex: 301, width: 520,
              background: '#ffffff',
              border: `2px solid ${s.kind === 'claim' ? '#059669' : '#2563eb'}`,
              borderRadius: 8,
              boxShadow: `0 12px 32px rgba(15,23,42,0.18), 0 3px 8px rgba(15,23,42,0.1), 0 0 0 4px ${s.kind === 'claim' ? 'rgba(5,150,105,0.12)' : 'rgba(37,99,235,0.12)'}`,
              userSelect: 'none',
              overflow: 'hidden',
            }}>
              {/* 타이틀 바 */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#ffffff', borderBottom: '1px solid #e2e8f0',
                padding: '7px 10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{recipient.name}</span>
                  <span style={{ width: 1, height: 11, background: '#e2e8f0', display: 'inline-block', margin: '0 2px' }} />
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>급여일자</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{s.date}</span>
                </div>
                <button
                  onClick={() => setCardPopover(null)}
                  style={{
                    width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#f1f5f9', border: '1px solid #e2e8f0',
                    borderRadius: 4, cursor: 'pointer', padding: 0, flexShrink: 0,
                  }}
                >
                  <X size={10} color="#64748b" strokeWidth={2.5} />
                </button>
              </div>

              {/* 테이블 */}
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th rowSpan={2} style={{ ...THP, width: 36, borderLeft: 'none', verticalAlign: 'middle' }}>구분</th>
                      <th style={THP}>수급등급</th>
                      <th style={THP}>수급구분</th>
                      <th rowSpan={2} style={{ ...THP, verticalAlign: 'middle' }}>시작시간</th>
                      <th rowSpan={2} style={{ ...THP, verticalAlign: 'middle' }}>종료시간</th>
                      <th rowSpan={2} style={{ ...THP, verticalAlign: 'middle' }}>제공시간</th>
                      <th rowSpan={2} style={{ ...THP, textAlign: 'right', verticalAlign: 'middle', borderRight: 'none' }}>급여액</th>
                    </tr>
                    <tr>
                      <th style={{ ...THP, borderTop: '1px solid #e2e8f0' }}>종사자이름</th>
                      <th style={{ ...THP, borderTop: '1px solid #e2e8f0', borderRight: 'none' }}>생년월일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Row 1 */}
                    <tr>
                      <td rowSpan={2} style={{ ...TD0, borderLeft: 'none', background: sc.bg, color: sc.color, fontWeight: 700, fontSize: 13, verticalAlign: 'middle' }}>
                        {SERVICE_SHORT[s.serviceType as keyof typeof SERVICE_SHORT]}
                      </td>
                      <td style={TD0}>{displayGrade}등급</td>
                      <td style={TD0}>{displayCopayType}</td>
                      <td style={{ ...TD0, fontFamily: "'Noto Sans KR', sans-serif", color: '#334155', fontWeight: 600 }}>{s.startTime}</td>
                      <td style={{ ...TD0, fontFamily: "'Noto Sans KR', sans-serif", color: '#334155', fontWeight: 600 }}>{s.endTime}</td>
                      <td style={{ ...TD0, fontWeight: 600 }}>{s.durationMinutes}분</td>
                      <td rowSpan={2} style={{ ...TD0, textAlign: 'right', fontFamily: "'Noto Sans KR', sans-serif", color: '#0f172a', fontWeight: 700, borderRight: 'none', verticalAlign: 'middle' }}>
                        {editingFeeId === s.id ? (() => {
                          // editingFeeVal = "기본수가|가산금" (숫자 그대로 저장)
                          const [baseStr, surStr] = editingFeeVal.split('|');
                          const baseVal = parseInt(baseStr || '0', 10) || 0;
                          const surVal  = parseInt(surStr  || '0', 10) || 0;
                          const total   = baseVal + surVal;
                          const fmtComma = (n: number) => n === 0 ? '0' : n.toLocaleString('ko-KR');
                          // onChange: 콤마 제거 후 숫자만 추출해 저장
                          const setBase = (v: string) => setEditingFeeVal(`${v.replace(/[^0-9]/g,'')||'0'}|${surStr||'0'}`);
                          const setSur  = (v: string) => setEditingFeeVal(`${baseStr||'0'}|${v.replace(/[^0-9]/g,'')||'0'}`);
                          const save = () => {
                            mutateScheduleFee(year, month, s.id, baseVal, displayCopayRate);
                            const entry = schedules.find(x => x.id === s.id);
                            if (entry) { entry.surchargeAmount = surVal; entry.feeEdited = true; }
                            setEditingFeeId(null);
                          };
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 160 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 10, color: '#64748b', width: 42, flexShrink: 0 }}>기본수가</span>
                                <input autoFocus type="text" value={fmtComma(baseVal)}
                                  onChange={e => setBase(e.target.value)}
                                  onFocus={e => e.target.select()}
                                  onKeyDown={e => { if (e.key === 'Escape') setEditingFeeId(null); if (e.key === 'Enter') save(); }}
                                  style={{ width: 80, fontSize: 12, padding: '2px 5px', border: '1px solid #f59e0b', borderRadius: 3, outline: 'none', textAlign: 'right' }} />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 10, color: '#b45309', width: 42, flexShrink: 0 }}>가산금</span>
                                <input type="text" value={fmtComma(surVal)}
                                  onChange={e => setSur(e.target.value)}
                                  onFocus={e => e.target.select()}
                                  onKeyDown={e => { if (e.key === 'Escape') setEditingFeeId(null); if (e.key === 'Enter') save(); }}
                                  style={{ width: 80, fontSize: 12, padding: '2px 5px', border: '1px solid #fde68a', borderRadius: 3, outline: 'none', textAlign: 'right', background: '#fffbeb' }} />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 10, color: '#94a3b8', width: 42, flexShrink: 0 }}>급여액</span>
                                <span style={{ width: 80, fontSize: 12, fontWeight: 700, color: '#0f172a', textAlign: 'right', padding: '2px 5px', display: 'inline-block' }}>{total.toLocaleString('ko-KR')}원</span>
                              </div>
                              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                <button onClick={() => setEditingFeeId(null)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 3, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer' }}>취소</button>
                                <button onClick={save} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 3, border: 'none', background: '#f59e0b', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>저장</button>
                              </div>
                            </div>
                          );
                        })() : (
                          <div style={{ cursor: 'pointer' }}
                            title="클릭하여 수정"
                            onClick={() => {
                              setEditingFeeId(s.id);
                              setEditingFeeVal(`${s.unitCost}|${s.surchargeAmount ?? surSnap.amount}`);
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {formatKRW(totalFeeAll)}
                              <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>✎</span>
                            </div>
                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, lineHeight: 1.4 }}>
                              기본수가 {formatKRW(s.unitCost)}&nbsp;&nbsp;가산금 {formatKRW(s.surchargeAmount ?? surSnap.amount)}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                    {/* Row 2: 종사자 */}
                    <tr>
                      <td style={{ ...TD0, color: '#1e40af', fontWeight: 600 }}>{w?.name ?? '-'}</td>
                      <td style={{ ...TD0, color: '#475569', fontFamily: "'Noto Sans KR', sans-serif", borderRight: 'none' }}>{dob}</td>
                      <td style={{ ...TD0, color: '#94a3b8' }}>-</td>
                      <td style={{ ...TD0, color: '#94a3b8' }}>-</td>
                      <td style={{ ...TD0, color: '#94a3b8' }}>-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      })()}

      {/* ══ 메모 슬라이드 패널 ══ */}
      <RecipientMemoPanel
        recipientId={id ?? ''}
        recipientName={recipient?.name ?? ''}
        serviceYear={year}
        serviceMonth={month}
        open={memoOpen}
        onClose={() => setMemoOpen(false)}
        onCountChange={setMemoCount}
      />
      {/* 아래 블록은 제거 예정 dead code — 런타임에서 렌더되지 않음 */}
      {false && (<>
        {/* 패널 헤더 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 10px',
          background: 'linear-gradient(135deg,#78350f,#92400e)',
          flexShrink: 0,
        }}>
          <StickyNote size={13} style={{ color: '#fde68a' }} />
          <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#fef9c3' }}>
            {recipient?.name} 메모
          </span>
          {recipientMemos.length > 0 && (
            <span style={{
              fontSize: 10, color: '#fde68a',
              background: 'rgba(253,230,138,0.15)', border: '1px solid rgba(253,230,138,0.3)',
              padding: '1px 7px', borderRadius: 10, fontWeight: 600,
            }}>
              {recipientMemos.length}건
            </span>
          )}
          <button onClick={() => setMemoOpen(false)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 20, height: 20, border: 'none',
            background: 'rgba(255,255,255,0.15)', borderRadius: 4, cursor: 'pointer', padding: 0,
          }}>
            <X size={12} style={{ color: 'white' }} />
          </button>
        </div>

        {/* 새 메모 입력 영역 */}
        <div style={{
          padding: '8px 10px', background: '#fffbeb',
          borderBottom: '1px solid #fde68a', flexShrink: 0,
        }}>
          <div style={{
            fontSize: 9, color: '#92400e', fontWeight: 600,
            marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {year}년 {month}월 서비스 작업 중
          </div>
          <textarea
            value={newMemoText}
            onChange={e => setNewMemoText(e.target.value)}
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
              disabled={!newMemoText.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: 3, padding: '4px 12px',
                background: newMemoText.trim()
                  ? 'linear-gradient(135deg,#d97706,#b45309)' : '#f1f5f9',
                color: newMemoText.trim() ? 'white' : '#94a3b8',
                border: 'none', borderRadius: 5,
                cursor: newMemoText.trim() ? 'pointer' : 'default',
                fontSize: 11, fontWeight: 600,
              }}
            >
              <Plus size={11} />저장
            </button>
          </div>
        </div>

        {/* 메모 목록 */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '6px 8px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {sortedMemos.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: '100%', gap: 8, opacity: 0.5,
            }}>
              <StickyNote size={28} style={{ color: '#d1d5db' }} />
              <p style={{ fontSize: 11, color: '#9ca3af' }}>메모가 없습니다</p>
            </div>
          ) : (
            sortedMemos.map(m => (
              <div key={m.id} style={{
                background: m.pinned ? '#fffbeb' : '#f8fafc',
                border: `1px solid ${m.pinned ? '#fde68a' : '#e2e8f0'}`,
                borderLeft: `3px solid ${m.pinned ? '#f59e0b' : '#e2e8f0'}`,
                borderRadius: 6, padding: '6px 8px',
              }}>
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
                {editingMemoId === m.id ? (
                  <div>
                    <textarea
                      autoFocus
                      value={editingMemoText}
                      onChange={e => setEditingMemoText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveEditMemo();
                        if (e.key === 'Escape') setEditingMemoId(null);
                      }}
                      rows={3}
                      style={{
                        width: '100%', padding: '4px 6px',
                        border: '1px solid #fbbf24', borderRadius: 4,
                        fontSize: 11, color: '#1e293b', outline: 'none',
                        resize: 'none', boxSizing: 'border-box',
                        lineHeight: 1.5, fontFamily: 'inherit', background: '#fffbeb',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditingMemoId(null)} style={{
                        padding: '2px 8px', border: '1px solid #e2e8f0', borderRadius: 4,
                        background: 'white', fontSize: 10, cursor: 'pointer', color: '#64748b',
                      }}>취소</button>
                      <button onClick={saveEditMemo} style={{
                        padding: '2px 8px', border: 'none', borderRadius: 4,
                        background: '#d97706', color: 'white',
                        fontSize: 10, fontWeight: 600, cursor: 'pointer',
                      }}>저장</button>
                    </div>
                  </div>
                ) : (
                  <p
                    onDoubleClick={() => { setEditingMemoId(m.id); setEditingMemoText(m.content); }}
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
                {editingMemoId !== m.id && (
                  <div style={{ display: 'flex', gap: 3, marginTop: 5, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => { setEditingMemoId(m.id); setEditingMemoText(m.content); }}
                      style={{ fontSize: 9, color: '#64748b', background: 'white',
                        border: '1px solid #e2e8f0', borderRadius: 3, padding: '1px 6px', cursor: 'pointer' }}>
                      편집
                    </button>
                    <button
                      onClick={() => togglePinMemo(m.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 2, fontSize: 9,
                        color: m.pinned ? '#d97706' : '#64748b',
                        background: m.pinned ? '#fef3c7' : 'white',
                        border: `1px solid ${m.pinned ? '#fde68a' : '#e2e8f0'}`,
                        borderRadius: 3, padding: '1px 6px', cursor: 'pointer',
                      }}>
                      {m.pinned ? '고정해제' : '고정'}
                    </button>
                    <button
                      onClick={() => deleteMemo(m.id)}
                      style={{ fontSize: 9, color: '#dc2626', background: '#fff1f2',
                        border: '1px solid #fecaca', borderRadius: 3, padding: '1px 6px', cursor: 'pointer' }}>
                      삭제
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </>)}

      {/* ── 담당 요양보호사 일정조회 모달 ── */}
      {schedViewWorker && (
        <WorkerScheduleModal
          workerId={schedViewWorker}
          initYear={year}
          initMonth={month}
          todayStr={todayStr}
          onClose={() => setSchedViewWorker(null)}
        />
      )}

    </div>
  );
}

