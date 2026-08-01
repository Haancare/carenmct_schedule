import { useState, useMemo, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ChevronLeft, ChevronRight, Filter, Search, ClipboardList, ChevronDown, X } from 'lucide-react';
import { recipients, careWorkers, allSchedules, getCertNo, getLegalDob, getReduction, getGradeNum, getGradeText, getEmployeeBirth, getSchedulesForRecipient, recipientHasSchedulesInYear, useSchedulesVersion, GRADE_OPTIONS, CONTRACT_STATUSES, getRecipientDayMemos, useDayMemosVersion, isHoliday } from './mockData';
import type { Recipient, Employee, ScheduleEntry } from './mockData';

// ── 고정 컬럼 너비 / sticky 오프셋 ─────────────────────────────────────
const W = { seq: 38, name: 82, birth: 60, grade: 52, type: 44, regId: 136, month: 54 } as const;
const S = {
  seq:   0,
  name:  W.seq,
  birth: W.seq + W.name,
  grade: W.seq + W.name + W.birth,
  type:  W.seq + W.name + W.birth + W.grade,
  regId: W.seq + W.name + W.birth + W.grade + W.type,
} as const;
const FIXED_W = W.seq + W.name + W.birth + W.grade + W.type + W.regId;

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const CUR_YEAR  = 2026;
const CUR_MONTH = 3;

// ── 헬퍼 ─────────────────────────────────────────────────────────────
const selStyle: CSSProperties = {
  height: 24, padding: '0 6px', fontSize: 12, borderRadius: 6, outline: 'none',
  border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b', cursor: 'pointer',
};

function typeLabel(copaymentType: string): '감경' | '기초' | '일반' {
  if (copaymentType.includes('감경')) return '감경';
  if (copaymentType.includes('기초')) return '기초';
  return '일반';
}

// 구분 컬럼 표시용 — 감경은 감경률(9% / 7.5% / 6%)로 표기한다.
function typeDisplay(reduction: string): string {
  if (reduction.includes('9'))    return '9%';
  if (reduction.includes('7.5'))  return '7.5%';
  if (reduction.includes('6'))    return '6%';
  if (reduction.includes('기초')) return '기초';
  return '일반';
}

function typeStyle(t: string): CSSProperties {
  if (t === '감경') return { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' };
  if (t === '기초') return { background: '#fff1f2', color: '#dc2626', border: '1px solid #fecaca' };
  return { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' };
}

// 계약구분 뱃지 색상 — 외부 공통 정의 8종
function contractStyle(s: string): CSSProperties {
  switch (s) {
    case '수급중':   return { background: '#ecfdf5', color: '#059669', border: '1px solid #6ee7b7' };
    case '준비중':   return { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' };
    case '타기관':   return { background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' };
    case '계약종료': return { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' };
    case '사망':     return { background: '#1f2937', color: '#f9fafb', border: '1px solid #111827' };
    case '보류':     return { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' };
    case '입원':     return { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
    case '상담중':   return { background: '#f0fdfa', color: '#0d9488', border: '1px solid #99f6e4' };
    default:         return { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' };
  }
}

// ── 계획/청구 정보 타입 ─────────────────────────────────────────────
interface MonthInfo {
  hasPlan:    boolean;
  planCount:  number;
  hasClaim:   boolean;
  claimCount: number;
  isActual:   boolean;
}

// 실제 일정 데이터가 있는 월만 표시한다 (계획=전체 일정, 청구=완료 일정).
function computeMonthInfo(r: Recipient, year: number, month: number): MonthInfo {
  const mm  = String(month).padStart(2, '0');
  const key = `${year}-${mm}`;

  const sched = allSchedules[key];
  if (!sched) {
    return { hasPlan: false, planCount: 0, hasClaim: false, claimCount: 0, isActual: true };
  }

  const rows       = sched.filter(s => s.recipientId === r.id);
  const planCount  = rows.length;
  const claimCount = rows.filter(s => s.kind === 'claim').length;
  return { hasPlan: planCount > 0, planCount, hasClaim: claimCount > 0, claimCount, isActual: true };
}

// ── 디자인 토큰 ──────────────────────────────────────────────────────
const TH_BASE: CSSProperties = {
  position: 'sticky', top: 0,
  color: 'rgba(255,255,255,0.88)',
  fontSize: 12, fontWeight: 600, height: 34,
  whiteSpace: 'nowrap', textAlign: 'center',
  borderRight: '1px solid rgba(255,255,255,0.12)',
  padding: '0 4px',
};

// 수급자별 일정표와 동일한 색 체계 — 계획=파랑, 청구=초록
const PLAN_ON:   CSSProperties = { background: '#dbeafe', border: '1px solid #93c5fd', color: '#1d4ed8' };
const PLAN_OFF:  CSSProperties = { background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#cbd5e1' };
const CLAIM_ON:  CSSProperties = { background: '#d1fae5', border: '1px solid #6ee7b7', color: '#059669' };
const CLAIM_OFF: CSSProperties = { background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#cbd5e1' };

function monthColBg(rowIsEven: boolean, colIsEven: boolean): string {
  if (colIsEven) return rowIsEven ? '#edf1f8' : '#e5eaf3';
  return rowIsEven ? '#ffffff' : '#f4f7fb';
}

function isQuarterStart(i: number): boolean { return i > 0 && i % 3 === 0; }

// 급여유형 2글자 라벨/색 (월별급여일정 행 구분용)
const SVC_META: Record<string, { short: string; first: string; color: string }> = {
  visit_care:     { short: '요양', first: '요', color: '#2563eb' },
  family_care:    { short: '가족', first: '가', color: '#0891b2' },
  full_day_visit: { short: '종일', first: '종', color: '#6366f1' },
  visit_bath:     { short: '목욕', first: '목', color: '#059669' },
  visit_nursing:  { short: '간호', first: '간', color: '#d97706' },
  day_care:       { short: '주간', first: '주', color: '#7c3aed' },
};
const SVC_ORDER = ['visit_care', 'family_care', 'full_day_visit', 'visit_bath', 'visit_nursing', 'day_care'];
const PA_GROUPS = [
  { id: 'all',    label: '전체',          subs: [] as string[] },
  { id: 'sw',     label: '담당사회복지사', subs: ['김지원', '박수현', '이나연'] },
  { id: 'region', label: '지역구분',       subs: ['동부지역', '서부지역'] },
];
// 월별 테이블 틀고정 컬럼 폭/오프셋 (순번·수급자명·급여유형·등급·감경)
const MW = { seq: 36, name: 82, birth: 60, svc: 60, grade: 48, red: 48 } as const;
const MS = { seq: 0, name: MW.seq, birth: MW.seq + MW.name, svc: MW.seq + MW.name + MW.birth, grade: MW.seq + MW.name + MW.birth + MW.svc, red: MW.seq + MW.name + MW.birth + MW.svc + MW.grade } as const;
const M_FIXED_W = MS.red + MW.red;

// ── 계획/청구 두 박스 셀 ──────────────────────────────────────────────
function PlanClaimCell({
  info,
  onPlan,
  onClaim,
}: {
  info:     MonthInfo;
  onPlan?:  () => void;
  onClaim?: () => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', justifyContent: 'center' }}>
      {/* 계획 박스 */}
      <div
        title={info.hasPlan ? `계획 ${info.planCount}건 — 클릭하여 상세 보기` : '계획 없음 — 클릭하여 상세 보기'}
        onClick={onPlan ? (e) => { e.stopPropagation(); onPlan(); } : undefined}
        style={{
          width: 23, height: 19, borderRadius: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif",
          flexShrink: 0, userSelect: 'none',
          cursor: onPlan ? 'pointer' : 'default',
          transition: 'opacity .12s',
          ...(info.hasPlan ? PLAN_ON : PLAN_OFF),
        }}
        onMouseEnter={e => { if (onPlan) (e.currentTarget as HTMLDivElement).style.opacity = '0.78'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
      >
        {info.hasPlan ? info.planCount : ''}
      </div>
      {/* 청구 박스 */}
      <div
        title={info.hasClaim ? `청구 ${info.claimCount}건 — 클릭하여 상세 보기` : '청구 없음 — 클릭하여 상세 보기'}
        onClick={onClaim ? (e) => { e.stopPropagation(); onClaim(); } : undefined}
        style={{
          width: 23, height: 19, borderRadius: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif",
          flexShrink: 0, userSelect: 'none',
          cursor: onClaim ? 'pointer' : 'default',
          transition: 'opacity .12s',
          ...(info.hasClaim ? CLAIM_ON : CLAIM_OFF),
        }}
        onMouseEnter={e => { if (onClaim) (e.currentTarget as HTMLDivElement).style.opacity = '0.78'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
      >
        {info.hasClaim ? info.claimCount : ''}
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────
export function PaymentAssignment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // URL 파라미터로 탭·연도·월·보기모드·수급자 초기값 수신 (수급자별 일정표 바로가기 등)
  const _tabParam = searchParams.get('tab');
  const initTab      = (_tabParam === 'monthly' ? 'monthly' : _tabParam === 'weekly' ? 'weekly' : 'annual') as 'annual' | 'monthly' | 'weekly';
  const initYear     = parseInt(searchParams.get('year')  ?? String(CUR_YEAR), 10);
  const initMonth    = parseInt(searchParams.get('month') ?? String(CUR_MONTH), 10);
  const initView     = (searchParams.get('view') === 'claim' ? 'claim' : 'plan') as 'plan' | 'claim';
  const initRecipient = searchParams.get('recipient') ?? '';
  // 탭: 연간급여일정 / 월별급여일정 / 주간급여일정
  const [tab, setTab]               = useState<'annual' | 'monthly' | 'weekly'>(initTab);
  // 월별 탭 — 선택 월 + 보기 모드(계획/청구)
  const [monthSel, setMonthSel]     = useState(initMonth);
  const [monthView, setMonthView]   = useState<'plan' | 'claim'>(initView);
  const [year, setYear]             = useState(initYear);
  // 주간 탭 — 선택 수급자 / 기간(직전 N개월) / 보기 모드
  const [weekRecipId, setWeekRecipId] = useState<string>(initRecipient);
  const [weekYear, setWeekYear]       = useState(initYear);
  const [weekView, setWeekView]       = useState<'plan' | 'claim'>(initView);
  // 주간 탭 — 수급자명 검색(명시적: Enter/검색 버튼) + 계약구분 필터
  const [weekQuery, setWeekQuery]           = useState('');
  const [weekQueryDraft, setWeekQueryDraft] = useState('');
  const submitWeekQuery = () => setWeekQuery(weekQueryDraft.trim());
  const [weekContract, setWeekContract] = useState<string>('all');
  // 바로가기로 진입 시 해당 수급자를 3초간 하이라이트
  const [flashId, setFlashId]       = useState<string>(initRecipient);
  useEffect(() => {
    if (!initRecipient) return;
    setFlashId(initRecipient);
    const t = setTimeout(() => setFlashId(''), 3000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 하이라이트 행을 테이블 내에서 자동 스크롤
  const flashRowRef = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    if (flashRowRef.current) {
      flashRowRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [flashId]);
  const [filterGrade, setFilterGrade]   = useState('all');
  const [selGroup,    setSelGroup]      = useState('all');
  const [selSubGroup, setSelSubGroup]   = useState('all');
  const [filterType,  setFilterType]    = useState('all');
  const [filterSvc,   setFilterSvc]     = useState('all');
  const [filterWorker, setFilterWorker] = useState('all');
  const [query, setQuery]           = useState('');
  // 입력 중인 값(=draft)은 query와 분리 — Enter/검색 버튼 클릭 시에만 query에 반영(서버 호출 부담 ↓)
  const [queryDraft, setQueryDraft] = useState('');
  const submitQuery = () => setQuery(queryDraft.trim());
  // 일정 없는 '수급중' 수급자 노출 토글 — 기본 켜짐
  const [showAllActive, setShowAllActive] = useState(true);
  const schedulesVer = useSchedulesVersion();

  // 명단 기준 — 외부 공유 기초정보의 계약구분이 '수급중'이거나, 해당 연도(year)에
  // 계획·청구 일정을 보유한 수급자. showAllActive가 꺼지면 일정 보유자만 표시.
  const filtered = useMemo(() =>
    recipients.filter(r => {
      const matchQ = query === '' || r.name.includes(query.trim());
      const matchG = filterGrade === 'all' || getGradeText(r) === filterGrade;
      const matchT = filterType  === 'all' || typeLabel(getReduction(r)) === filterType;
      const matchW = filterWorker === 'all' || r.assignedCareWorkerIds.includes(filterWorker);
      const matchS = filterSvc === 'all' || (() => {
        for (let m = 1; m <= 12; m++) {
          const arr = (allSchedules as Record<string, {recipientId:string;serviceType:string}[]>)[`${year}-${String(m).padStart(2,'0')}`];
          if (arr && arr.some(s => s.recipientId === r.id && s.serviceType === filterSvc)) return true;
        }
        return false;
      })();
      if (!(matchQ && matchG && matchT && matchW && matchS)) return false;
      const isActive = r.contractStatus === '수급중';
      const hasSched = recipientHasSchedulesInYear(r.id, year);
      return hasSched || (showAllActive && isActive);
    }).sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, filterGrade, filterType, filterSvc, filterWorker, year, showAllActive, schedulesVer]
  );

  const tableData = useMemo(() =>
    filtered.map(r => ({
      r,
      months: MONTHS.map((_, i) => computeMonthInfo(r, year, i + 1)),
    })),
    [filtered, year]
  );

  // 당월 통계
  const curStats = useMemo(() => {
    if (year !== CUR_YEAR) return null;
    const mi = CUR_MONTH - 1;
    return {
      plan:  tableData.filter(d => d.months[mi].hasPlan).length,
      claim: tableData.filter(d => d.months[mi].hasClaim).length,
    };
  }, [tableData, year]);

  // 클릭 핸들러 팩토리
  const handlePlan  = (rid: string, m: number) =>
    navigate(`/recipients/${rid}?year=${year}&month=${m}&view=plan`);
  const handleClaim = (rid: string, m: number) =>
    navigate(`/recipients/${rid}?year=${year}&month=${m}&view=claim`);

  // ── 월별급여일정 데이터 ─────────────────────────────────
  // 선택 월의 1일~말일 중, 각 수급자가 monthView(계획/청구) 일정을 가진 일자 집합
  const lastDay = useMemo(() => new Date(year, monthSel, 0).getDate(), [year, monthSel]);
  // 행을 (수급자 × 급여유형 × 등급 × 감경구분) 세그먼트로 분해. 각 세그먼트는
  // monthView(계획/청구) 일정을 가진 일자 집합(days)을 가진다. 일정이 없는 수급중
  // 수급자는 빈 행 1개로 표시.
  type MonthRow = { r: Recipient; key: string; svc: string | null; gradeNum: number | null; reduction: string | null; days: Set<number>; totalMinutes: number; count: number; firstOfRecipient: boolean; recRowSpan: number; firstOfPeriod: boolean; periodRowSpan: number };
  const monthlyRows = useMemo<MonthRow[]>(() => {
    const out: MonthRow[] = [];
    filtered.forEach(r => {
      const scheds = getSchedulesForRecipient(r.id, year, monthSel).filter(s => s.kind === monthView);
      const startIdx = out.length;
      if (scheds.length === 0) {
        out.push({ r, key: `${r.id}::none`, svc: null, gradeNum: null, reduction: null, days: new Set(), totalMinutes: 0, count: 0, firstOfRecipient: true, recRowSpan: 1, firstOfPeriod: true, periodRowSpan: 1 });
      } else {
        const fbGrade = getGradeNum(r);
        const fbRed = getReduction(r);
        const groups = new Map<string, { svc: string; gradeNum: number; reduction: string; days: Set<number>; totalMinutes: number; count: number }>();
        scheds.forEach(s => {
          const g = (s.grade ?? fbGrade) as number;
          const t = (s.copaymentType ?? fbRed) as string;
          const key = `${s.serviceType}|${g}|${t}`;
          let grp = groups.get(key);
          if (!grp) { grp = { svc: s.serviceType, gradeNum: g, reduction: t, days: new Set(), totalMinutes: 0, count: 0 }; groups.set(key, grp); }
          const d = parseInt(s.date.slice(8, 10), 10);
          if (d) grp.days.add(d);
          grp.totalMinutes += s.durationMinutes ?? 0;
          grp.count += 1;
        });
        // 정렬 우선순위: 종류(SVC_ORDER) → 등급 → 감경구분
        const items = Array.from(groups.values()).sort((a, b) => {
          const so = SVC_ORDER.indexOf(a.svc) - SVC_ORDER.indexOf(b.svc);
          if (so !== 0) return so;
          if (a.gradeNum !== b.gradeNum) return a.gradeNum - b.gradeNum;
          return a.reduction.localeCompare(b.reduction, 'ko');
        });
        // 종류 단위 rowSpan 계산용 — 연속된 같은 종류 묶음
        const periodKeyOf = (g: { svc: string }) => g.svc;
        items.forEach((grp, i) => {
          const periodKey = periodKeyOf(grp);
          const firstOfPeriod = i === 0 || periodKeyOf(items[i - 1]) !== periodKey;
          out.push({ r, key: `${r.id}::${grp.svc}|${grp.gradeNum}|${grp.reduction}`, svc: grp.svc, gradeNum: grp.gradeNum, reduction: grp.reduction, days: grp.days, totalMinutes: grp.totalMinutes, count: grp.count, firstOfRecipient: i === 0, recRowSpan: 1, firstOfPeriod, periodRowSpan: 1 });
        });
      }
      out[startIdx].recRowSpan = out.length - startIdx;
      // 같은 수급자 내에서 종류 그룹별 periodRowSpan 채우기
      let periodStart = startIdx;
      for (let i = startIdx + 1; i <= out.length; i++) {
        if (i === out.length || out[i].firstOfPeriod) {
          out[periodStart].periodRowSpan = i - periodStart;
          periodStart = i;
        }
      }
    });
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, year, monthSel, monthView, schedulesVer]);
  const goMonthly = (rid: string) =>
    navigate(`/recipients/${rid}?year=${year}&month=${monthSel}&view=${monthView}`);

  // ── 주간급여일정 데이터 ─────────────────────────────────
  // 수급자 선택 목록 — 계약구분 '수급중' 또는 해당 연도 일정 보유, 가나다순
  const weekRecipients = useMemo(
    () => recipients
      .filter(r => {
        // 명단 후보 — 계약구분 '수급중' 또는 해당 연도 일정 보유
        const inPool = r.contractStatus === '수급중' || recipientHasSchedulesInYear(r.id, CUR_YEAR);
        if (!inPool) return false;
        // 검색(명시적 — Enter/검색 버튼 클릭 시 적용)
        if (weekQuery && !r.name.includes(weekQuery)) return false;
        // 계약구분 필터
        if (weekContract !== 'all' && r.contractStatus !== weekContract) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [weekQuery, weekContract]
  );
  const weekRecip = weekRecipId ? recipients.find(r => r.id === weekRecipId) : undefined;
  const dayMemosVer = useDayMemosVersion();
  // 선택 수급자의 일자별 메모 맵 (RecipientDetail의 일정표 메모와 공유)
  const weekDayMemos = useMemo(
    () => weekRecip ? getRecipientDayMemos(weekRecip.id) : {},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekRecip, dayMemosVer]
  );
  // 선택 수급자의 선택 연도(weekYear) 내 일정(weekView kind) — 일자별 맵
  const weekSchedByDate = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    if (!weekRecip) return map;
    for (let m = 1; m <= 12; m++) {
      getSchedulesForRecipient(weekRecip.id, weekYear, m).forEach(s => {
        if (s.kind !== weekView) return;
        const arr = map.get(s.date) ?? [];
        arr.push(s);
        map.set(s.date, arr);
      });
    }
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekRecip, weekYear, weekView, schedulesVer]);
  // 데이터가 있는 첫 주 ~ 마지막 주 (월~일 단위). 일정이 없으면 빈 배열.
  const weeks = useMemo(() => {
    const dates = Array.from(weekSchedByDate.keys()).sort();
    if (dates.length === 0) return [];
    const toMonday = (ds: string) => {
      const [y, mo, da] = ds.split('-').map(Number);
      const d = new Date(y, mo - 1, da);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return d;
    };
    const start = toMonday(dates[0]);
    const lastMon = toMonday(dates[dates.length - 1]);
    const end = new Date(lastMon); end.setDate(end.getDate() + 6);
    const cur = new Date(start);
    const out: { mon: Date; days: Date[] }[] = [];
    while (cur <= end) {
      const days: Date[] = [];
      for (let i = 0; i < 7; i++) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
      out.push({ mon: days[0], days });
    }
    return out;
  }, [weekSchedByDate]);
  // 주차 라벨 — 달력 기준. 그 주(월~일)에 더 많은 날이 속한 월로 귀속하고,
  // 그 월의 첫 귀속 주(달력상)부터 센 주차를 표시한다. (데이터 시작점과 무관)
  // 예: 3/30·31 + 4/1~5 → 4월이 5일로 더 많음 → 4월 1주차
  const weekLabels = useMemo(() => {
    const mondayOf = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
    // (Y,M)월에 귀속되는 첫 주의 월요일 — 1일이 속한 주의 그 월 일수가 4 이상이면 그 주, 아니면 다음 주
    const firstWeekMonday = (Y: number, M: number) => {
      const monF = mondayOf(new Date(Y, M, 1));
      let cnt = 0;
      for (let i = 0; i < 7; i++) { const dd = new Date(monF); dd.setDate(dd.getDate() + i); if (dd.getFullYear() === Y && dd.getMonth() === M) cnt++; }
      if (cnt >= 4) return monF;
      const next = new Date(monF); next.setDate(next.getDate() + 7); return next;
    };
    return weeks.map(wk => {
      const counts = new Map<string, number>();
      wk.days.forEach(d => { const k = `${d.getFullYear()}-${d.getMonth()}`; counts.set(k, (counts.get(k) ?? 0) + 1); });
      let bestKey = '', bestCnt = -1;
      counts.forEach((c, k) => { if (c > bestCnt) { bestCnt = c; bestKey = k; } });
      const [yStr, mStr] = bestKey.split('-');
      const Y = Number(yStr), M = Number(mStr);
      const w1 = firstWeekMonday(Y, M);
      const thisMon = mondayOf(wk.mon);
      const ord = Math.round((thisMon.getTime() - w1.getTime()) / (7 * 86400000)) + 1;
      return `${M + 1}월 ${ord}주차`;
    });
  }, [weeks]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#f0f4f8' }}>

      {/* ── 탭 바 (연간급여일정 / 월별급여일정) ── */}
      <div style={{ flexShrink: 0, background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-end', gap: 2, padding: '0 12px' }}>
        {([['annual','(전체)연간급여일정'],['monthly','(전체)월별급여일정'],['weekly','(수급자별)주간급여일정']] as const).map(([key, label]) => {
          const on = tab === key;
          return (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '8px 16px', fontSize: 13, cursor: 'pointer', background: 'transparent', border: 'none',
              borderBottom: on ? '3px solid #2563eb' : '3px solid transparent',
              color: on ? '#1d4ed8' : '#64748b', fontWeight: on ? 700 : 500,
            }}>{label}</button>
          );
        })}
      </div>

      {/* ── 필터 바 (주간 탭에서는 숨김 — 자체 수급자 선택 UI 사용) ── */}
      {tab !== 'weekly' && (
      <div style={{
        flexShrink: 0, background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '5px 16px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Filter size={12} color="#94a3b8" />

        {/* 연도 이동 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button onClick={() => setYear(y => y - 1)} style={btnNav}>
            <ChevronLeft size={12} color="#64748b" />
          </button>
          <div style={{ minWidth: 60, textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
            {year}년
          </div>
          <button onClick={() => setYear(y => y + 1)} style={btnNav}>
            <ChevronRight size={12} color="#64748b" />
          </button>
        </div>

        <Divider />

        {/* 등급 드롭박스 */}
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
          style={selStyle}>
          <option value="all">전체 등급</option>
          {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        {/* 감경 드롭박스 */}
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={selStyle}>
          <option value="all">전체 감경</option>
          <option value="감경">감경</option>
          <option value="기초">기초</option>
          <option value="일반">일반</option>
        </select>

        {/* 급여종류 드롭박스 */}
        <select value={filterSvc} onChange={e => setFilterSvc(e.target.value)}
          style={selStyle}>
          <option value="all">전체 종류</option>
          {SVC_ORDER.map(k => <option key={k} value={k}>{SVC_META[k]?.short ?? k}</option>)}
        </select>

        <Divider />

        {/* 요양보호사 필터 — 검색형 콤보박스(이름·별칭·생년월일) */}
        <WorkerCombo workers={careWorkers} value={filterWorker} onChange={setFilterWorker} />

        {/* 검색 — 타이핑 중에는 필터 미반영, Enter 또는 [검색] 버튼 클릭 시 적용 */}
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ position: 'relative' }}>
            <Search size={11} color="#94a3b8" style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={queryDraft}
              onChange={e => setQueryDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitQuery(); }}
              placeholder="수급자명 검색"
              style={{ paddingLeft: 24, paddingRight: 8, height: 24, width: 130, border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, outline: 'none', background: '#f8fafc', color: '#1e293b' }}
            />
          </div>
          <button
            onClick={submitQuery}
            title="검색 (Enter)"
            style={{
              height: 24, padding: '0 10px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
              border: '1px solid #152e50', background: '#152e50', color: '#fff', fontWeight: 700,
            }}
          >검색</button>
          {query && (
            <button
              onClick={() => { setQueryDraft(''); setQuery(''); }}
              title="검색 초기화"
              style={{
                height: 24, padding: '0 8px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
                border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b',
              }}
            >초기화</button>
          )}
        </div>

        <Divider />

        {/* 그룹 필터 */}
        <select value={selGroup} onChange={e => { setSelGroup(e.target.value); setSelSubGroup('all'); }} style={selStyle}>
          {PA_GROUPS.map(g => <option key={g.id} value={g.id}>{g.id === 'all' ? '전체 그룹' : g.label}</option>)}
        </select>
        {(() => {
          const grp = PA_GROUPS.find(g => g.id === selGroup);
          if (!grp || grp.subs.length === 0) return null;
          return (
            <select value={selSubGroup} onChange={e => setSelSubGroup(e.target.value)}
              style={{ ...selStyle, borderColor: '#93c5fd', color: '#1d4ed8', background: '#eff6ff' }}>
              <option value="all">전체</option>
              {grp.subs.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          );
        })()}

        <Divider />

        {/* 일정 없는 수급중 수급자 노출 토글 */}
        <button
          onClick={() => setShowAllActive(v => !v)}
          title={showAllActive ? '수급중 수급자 숨기기' : '수급중 수급자 모두 보기'}
          style={{
            height: 24, padding: '0 9px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
            border: showAllActive ? '1px solid #6ee7b7' : '1px solid #e2e8f0',
            background: showAllActive ? '#ecfdf5' : '#f8fafc',
            color: showAllActive ? '#059669' : '#94a3b8',
            fontWeight: showAllActive ? 700 : 500,
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}
        >수급중</button>

        {/* 우측 통계 */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            총 <strong style={{ color: '#1d4ed8' }}>{filtered.length}</strong>명
          </span>
        </div>
      </div>
      )}

      {tab === 'annual' ? (
      <>
      {/* ── 범례 바 ── */}
      <div style={{
        flexShrink: 0, background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '4px 16px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <ClipboardList size={11} color="#94a3b8" />
        <span style={{ fontSize: 12, color: '#94a3b8' }}>범례</span>

        {[
          { planBg: '#dbeafe', planBd: '#93c5fd', claimBg: '#d1fae5', claimBd: '#6ee7b7', label: '계획 + 청구 모두 있음', labelColor: '#475569' },
          { planBg: '#dbeafe', planBd: '#93c5fd', claimBg: '#f1f5f9', claimBd: '#e2e8f0', label: '계획만 있음',          labelColor: '#475569' },
          { planBg: '#f1f5f9', planBd: '#e2e8f0', claimBg: '#d1fae5', claimBd: '#6ee7b7', label: '청구만 있음',          labelColor: '#475569' },
          { planBg: '#f1f5f9', planBd: '#e2e8f0', claimBg: '#f1f5f9', claimBd: '#e2e8f0', label: '자료 없음',            labelColor: '#94a3b8' },
        ].map(({ planBg, planBd, claimBg, claimBd, label, labelColor }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              <div style={{ width: 14, height: 14, borderRadius: 2, background: planBg,  border: `1px solid ${planBd}`  }} />
              <div style={{ width: 14, height: 14, borderRadius: 2, background: claimBg, border: `1px solid ${claimBd}` }} />
            </div>
            <span style={{ fontSize: 12, color: labelColor }}>{label}</span>
          </div>
        ))}

        <Divider />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#dbeafe', border: '1px solid #93c5fd' }} />
            좌 = 계획
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#d1fae5', border: '1px solid #6ee7b7' }} />
            우 = 청구
          </span>
        </div>
        <Divider />
        <span style={{ fontSize: 12, color: '#94a3b8' }}>네모상자를 클릭하면 해당 수급자의 해당 월의 일정표로 이동합니다</span>
      </div>

      {/* ── 테이블 영역 ── */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '10px 16px' }}>
        <div style={{ height: '100%', background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed', minWidth: FIXED_W + W.month * 12 }}>
            <colgroup>
              <col style={{ width: W.seq }} />
              <col style={{ width: W.name }} />
              <col style={{ width: W.birth }} />
              <col style={{ width: W.grade }} />
              <col style={{ width: W.type }} />
              <col style={{ width: W.regId }} />
              {MONTHS.map((_, i) => <col key={i} style={{ width: W.month }} />)}
            </colgroup>

            <thead>
              <tr>
                <th style={{ ...TH_BASE, background: '#152e50', left: S.seq,   zIndex: 30, width: W.seq }}>순번</th>
                <th style={{ ...TH_BASE, background: '#152e50', left: S.name,  zIndex: 30, width: W.name,  textAlign: 'left', padding: '0 4px 0 8px' }}>수급자명</th>
                <th style={{ ...TH_BASE, background: '#152e50', left: S.birth, zIndex: 30, width: W.birth }}>생년월일</th>
                <th style={{ ...TH_BASE, background: '#152e50', left: S.grade, zIndex: 30, width: W.grade }}>등급</th>
                <th style={{ ...TH_BASE, background: '#152e50', left: S.type,  zIndex: 30, width: W.type }}>감경</th>
                <th style={{ ...TH_BASE, background: '#152e50', left: S.regId, zIndex: 30, width: W.regId, textAlign: 'left', padding: '0 4px 0 8px' }}>인정번호</th>

                {MONTHS.map((ml, i) => {
                  const isEven = i % 2 === 1;
                  const qStart = isQuarterStart(i);
                  return (
                    <th key={i} style={{
                      ...TH_BASE,
                      background: isEven ? '#253f6a' : '#1e3a5f',
                      zIndex: 20, width: W.month,
                      color: 'rgba(255,255,255,0.82)',
                      borderLeft: qStart ? '2px solid rgba(255,255,255,0.22)' : undefined,
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{ml}</span>
                        <div style={{ display: 'flex', gap: 3 }}>
                          <span style={{ fontSize: 11, opacity: 0.55 }}>계</span>
                          <span style={{ fontSize: 11, opacity: 0.55 }}>청</span>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={6 + 12} style={{ padding: '32px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                tableData.map(({ r, months }, rowIdx) => {
                  const isEvenRow = rowIdx % 2 === 0;
                  const isFlash = flashId === r.id;
                  const bgFix = isFlash ? '#fef9c3' : isEvenRow ? '#ffffff' : '#f4f7fb';
                  const tl    = typeLabel(getReduction(r));

                  const tdFix: CSSProperties = {
                    position: 'sticky', zIndex: 10,
                    height: 30, padding: '0 6px',
                    borderBottom: '1px solid #e4eaf3',
                    background: bgFix, fontSize: 12,
                    borderRight: '1px solid rgba(21,46,80,0.1)',
                    borderTopColor: '#e4eaf3', borderLeftColor: 'rgba(21,46,80,0.1)',
                    textAlign: 'center', verticalAlign: 'middle',
                    overflow: 'hidden',
                  };

                  return (
                    <tr key={r.id} ref={isFlash ? flashRowRef : undefined}>
                      {/* 순번 */}
                      <td style={{ ...tdFix, left: S.seq, width: W.seq, color: '#94a3b8' }}>
                        {rowIdx + 1}
                      </td>

                      {/* 수급자명 */}
                      <td style={{ ...tdFix, left: S.name, width: W.name, textAlign: 'left', padding: '0 6px 0 8px', cursor: 'pointer' }}
                        onClick={() => navigate(`/recipients/${r.id}`)}>
                        <div className="text-[13px]" style={{ fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.name}
                        </div>
                      </td>

                      {/* 생년월일 */}
                      <td style={{ ...tdFix, left: S.birth, width: W.birth, fontFamily: "'Noto Sans KR', sans-serif", color: '#64748b' }}>
                        {(() => { const ld = getLegalDob(r); return ld ? `${ld.slice(2,4)}.${ld.slice(5,7)}.${ld.slice(8,10)}` : '-'; })()}
                      </td>

                      {/* 등급 */}
                      <td style={{ ...tdFix, left: S.grade, width: W.grade }}>
                        <span style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: 12, padding: '1px 5px', borderRadius: 3, fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block' }}>
                          {getGradeText(r)}
                        </span>
                      </td>

                      {/* 구분 */}
                      <td style={{ ...tdFix, left: S.type, width: W.type }}>
                        <span style={{ ...typeStyle(tl), fontSize: 12, padding: '1px 5px', borderRadius: 3, fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block' }}>
                          {typeDisplay(getReduction(r))}
                        </span>
                      </td>

                      {/* 인정번호 */}
                      <td style={{ ...tdFix, left: S.regId, width: W.regId, textAlign: 'left', padding: '0 6px 0 8px', fontFamily: "'Noto Sans KR', sans-serif", color: '#475569' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {getCertNo(r)}
                        </span>
                      </td>

                      {/* 12개 월 셀 */}
                      {months.map((info, mi) => {
                        const isEvenCol = mi % 2 === 1;
                        const qStart    = isQuarterStart(mi);
                        const bg        = isFlash ? '#fef9c3' : monthColBg(isEvenRow, isEvenCol);
                        const month     = mi + 1;
                        return (
                          <td
                            key={mi}
                            style={{
                              height: 30, width: W.month,
                              borderBottom: '1px solid #e4eaf3',
                              borderRight: `1px solid ${isEvenCol ? 'rgba(21,46,80,0.10)' : 'rgba(21,46,80,0.06)'}`,
                              borderLeft: qStart ? '2px solid rgba(21,46,80,0.16)' : undefined,
                              textAlign: 'center', verticalAlign: 'middle',
                              padding: 0, background: bg,
                            }}
                          >
                            <PlanClaimCell
                              info={info}
                              onPlan={() => handlePlan(r.id, month)}
                              onClaim={() => handleClaim(r.id, month)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      ) : tab === 'monthly' ? (
      <>
        {/* ── 월/보기 서브바 ── */}
        <div style={{ flexShrink: 0, background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '5px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* 월 선택 */}
          <div style={{ display: 'flex', gap: 2 }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
              const on = monthSel === m;
              return (
                <button key={m} onClick={() => setMonthSel(m)} style={{
                  fontSize: 12, padding: '2px 8px', borderRadius: 14, cursor: 'pointer',
                  background: on ? '#152e50' : '#ffffff', color: on ? '#fff' : '#64748b',
                  border: `1px solid ${on ? '#152e50' : '#e2e8f0'}`, fontWeight: on ? 700 : 400,
                }}>{m}월</button>
              );
            })}
          </div>
          <Divider />
          {/* 계획보기 / 청구보기 */}
          <div style={{ display: 'flex', gap: 3 }}>
            {([['plan','계획보기','#1d4ed8','#dbeafe','#93c5fd'],['claim','청구보기','#059669','#d1fae5','#6ee7b7']] as const).map(([key,label,col,bg,bd]) => {
              const on = monthView === key;
              return (
                <button key={key} onClick={() => setMonthView(key)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 12, padding: '3px 10px', borderRadius: 16, cursor: 'pointer',
                  background: on ? bg : '#ffffff', color: on ? col : '#64748b',
                  border: `1px solid ${on ? bd : '#e2e8f0'}`, fontWeight: on ? 700 : 500,
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: bg, border: `1px solid ${bd}` }} />
                  {label}
                </button>
              );
            })}
          </div>
          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>
            행을 클릭하면 해당 수급자의 {year}년 {monthSel}월 {monthView === 'plan' ? '계획' : '청구'}보기로 이동합니다.
          </span>
        </div>

        {/* ── 월별 테이블 (급여유형·등급·감경구분별 행) ── */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '10px 16px' }}>
          <div style={{ height: '100%', background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed', minWidth: M_FIXED_W + 26 * lastDay + 64 + 60 }}>
              <colgroup>
                <col style={{ width: MW.seq }} />
                <col style={{ width: MW.name }} />
                <col style={{ width: MW.birth }} />
                <col style={{ width: MW.svc }} />
                <col style={{ width: MW.grade }} />
                <col style={{ width: MW.red }} />
                {Array.from({ length: lastDay }, (_, i) => <col key={i} style={{ width: 26 }} />)}
                <col style={{ width: 80 }} />
                <col style={{ width: 60 }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ ...TH_BASE, background: '#152e50', left: MS.seq,   zIndex: 30, width: MW.seq }}>순번</th>
                  <th style={{ ...TH_BASE, background: '#152e50', left: MS.name,  zIndex: 30, width: MW.name, textAlign: 'left', padding: '0 4px 0 8px' }}>수급자명</th>
                  <th style={{ ...TH_BASE, background: '#152e50', left: MS.birth, zIndex: 30, width: MW.birth }}>생년월일</th>
                  <th style={{ ...TH_BASE, background: '#152e50', left: MS.svc,   zIndex: 30, width: MW.svc }}>종류</th>
                  <th style={{ ...TH_BASE, background: '#152e50', left: MS.grade, zIndex: 30, width: MW.grade }}>등급</th>
                  <th style={{ ...TH_BASE, background: '#152e50', left: MS.red,   zIndex: 30, width: MW.red }}>감경</th>
                  {Array.from({ length: lastDay }, (_, i) => {
                    const dnum = i + 1;
                    const dow = new Date(year, monthSel - 1, dnum).getDay();
                    const isSun = dow === 0, isSat = dow === 6;
                    return (
                      <th key={i} style={{
                        ...TH_BASE, background: isSun ? '#3a2540' : isSat ? '#1e3a5f' : '#253f6a',
                        zIndex: 20, width: 26, padding: 0,
                        color: isSun ? '#fca5a5' : isSat ? '#93c5fd' : 'rgba(255,255,255,0.82)',
                      }}>{dnum}</th>
                    );
                  })}
                  <th style={{ ...TH_BASE, background: '#1e3a5f', zIndex: 20, width: 80 }}>급여제공시간</th>
                  <th style={{ ...TH_BASE, background: '#1e3a5f', zIndex: 20, width: 60 }}>제공횟수</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRows.length === 0 ? (
                  <tr><td colSpan={6 + lastDay + 2} style={{ padding: '32px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>검색 결과가 없습니다.</td></tr>
                ) : (() => {
                  // 월별 일자 박스 — 계획=파랑 / 청구=초록 (여린 톤)
                  const onBox: CSSProperties = monthView === 'plan'
                    ? { background: '#93c5fd', border: '1px solid #60a5fa' }
                    : { background: '#6ee7b7', border: '1px solid #34d399' };
                  let recIdx = -1;
                  return monthlyRows.map((row) => {
                    if (row.firstOfRecipient) recIdx++;
                    const bandEven = recIdx % 2 === 0;
                    const isFlash = flashId === row.r.id;
                    const bgFix = isFlash ? '#fef9c3' : bandEven ? '#ffffff' : '#f4f7fb';
                    const meta = row.svc ? SVC_META[row.svc] : null;
                    const tl = row.reduction ? typeLabel(row.reduction) : '일반';
                    const tdFix: CSSProperties = {
                      position: 'sticky', zIndex: 10, height: 30, padding: '0 6px',
                      borderBottom: '1px solid #e4eaf3', background: bgFix, fontSize: 12,
                      borderRight: '1px solid rgba(21,46,80,0.1)',
                      textAlign: 'center', verticalAlign: 'middle', overflow: 'hidden',
                    };
                    return (
                      <tr key={row.key} ref={isFlash && row.firstOfRecipient ? flashRowRef : undefined} onClick={() => goMonthly(row.r.id)} style={{ cursor: 'pointer' }}>
                        {/* 순번·수급자명 — 수급자 단위 병합 */}
                        {row.firstOfRecipient && (
                          <td rowSpan={row.recRowSpan} style={{ ...tdFix, left: MS.seq, width: MW.seq, color: '#94a3b8', verticalAlign: 'middle' }}>{recIdx + 1}</td>
                        )}
                        {row.firstOfRecipient && (
                          <td rowSpan={row.recRowSpan} style={{ ...tdFix, left: MS.name, width: MW.name, textAlign: 'left', padding: '0 6px 0 8px', verticalAlign: 'middle' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>{row.r.name}</span>
                          </td>
                        )}
                        {row.firstOfRecipient && (
                          <td rowSpan={row.recRowSpan} style={{ ...tdFix, left: MS.birth, width: MW.birth, color: '#64748b', verticalAlign: 'middle' }}>
                            {(() => { const ld = getLegalDob(row.r); return ld ? `${ld.slice(2,4)}.${ld.slice(5,7)}.${ld.slice(8,10)}` : '-'; })()}
                          </td>
                        )}
                        {/* 종류 — 같은 종류 묶음 병합 */}
                        {row.firstOfPeriod && (
                          <td rowSpan={row.periodRowSpan} style={{ ...tdFix, left: MS.svc, width: MW.svc, verticalAlign: 'middle' }}>
                            {meta
                              ? <span style={{ fontSize: 12, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}40` }}>{meta.short}</span>
                              : <span style={{ color: '#cbd5e1' }}>-</span>}
                          </td>
                        )}
                        {/* 등급 — 행마다 표시 */}
                        <td style={{ ...tdFix, left: MS.grade, width: MW.grade }}>
                          {row.gradeNum != null
                            ? <span style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: 12, padding: '1px 5px', borderRadius: 3, fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block' }}>{row.gradeNum}등급</span>
                            : <span style={{ color: '#cbd5e1' }}>-</span>}
                        </td>
                        {/* 감경 — 행마다 표시 */}
                        <td style={{ ...tdFix, left: MS.red, width: MW.red }}>
                          {row.reduction != null
                            ? <span style={{ ...typeStyle(tl), fontSize: 12, padding: '1px 5px', borderRadius: 3, fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block' }}>{typeDisplay(row.reduction)}</span>
                            : <span style={{ color: '#cbd5e1' }}>-</span>}
                        </td>
                        {/* 일자 셀 */}
                        {Array.from({ length: lastDay }, (_, i) => {
                          const dnum = i + 1;
                          const has = row.days.has(dnum);
                          const dow = new Date(year, monthSel - 1, dnum).getDay();
                          const colBg = isFlash ? '#fef9c3' : dow === 0 ? 'rgba(254,242,242,0.5)' : dow === 6 ? 'rgba(239,246,255,0.5)' : bgFix;
                          return (
                            <td key={i} style={{
                              height: 30, width: 26, padding: 0,
                              borderBottom: '1px solid #e4eaf3', borderRight: '1px solid rgba(21,46,80,0.06)',
                              textAlign: 'center', verticalAlign: 'middle', background: colBg,
                            }}>
                              {has && (
                                <div style={{ width: 16, height: 16, borderRadius: 3, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', ...onBox }}>
                                  <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1, color: monthView === 'plan' ? '#1d4ed8' : '#065f46', userSelect: 'none' }}>
                                    {row.svc ? (SVC_META[row.svc]?.first ?? '') : ''}
                                  </span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                        {/* 급여제공시간·제공횟수 — 종류 단위 병합 */}
                        {row.firstOfPeriod && (()=>{
                          const h = Math.floor(row.totalMinutes / 60);
                          const m = row.totalMinutes % 60;
                          const timeStr = row.totalMinutes > 0
                            ? (h > 0 ? `${h}시간${m > 0 ? ` ${m}분` : ''}` : `${m}분`)
                            : '-';
                          const sumStyle: CSSProperties = {
                            ...tdFix, background: bgFix, fontWeight: 600,
                            borderLeft: '1px solid rgba(21,46,80,0.12)',
                            verticalAlign: 'middle',
                          };
                          return (<>
                            <td rowSpan={row.periodRowSpan} style={{ ...sumStyle, whiteSpace: 'nowrap' }}>
                              {timeStr}
                            </td>
                            <td rowSpan={row.periodRowSpan} style={{ ...sumStyle, borderLeft: '1px solid rgba(21,46,80,0.06)' }}>
                              {row.count > 0 ? `${row.count}회` : '-'}
                            </td>
                          </>);
                        })()}
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </>
      ) : (
      <>
        {/* ── (수급자별)주간급여일정 ── */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {/* 좌측 수급자 선택 목록 — 수급자별 일정표와 동일 디자인 */}
          <aside style={{ width: 258, flexShrink: 0, borderRight: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flexShrink: 0, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', background: 'linear-gradient(90deg,#0f2744 0%,#1a3a5c 100%)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>수급자 선택</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{weekRecipients.length}명</span>
            </div>
            {/* 검색 + 계약구분 필터 */}
            <div style={{ flexShrink: 0, padding: '6px 6px', borderBottom: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', gap: 3 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={11} color="#94a3b8" style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    value={weekQueryDraft}
                    onChange={e => setWeekQueryDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') submitWeekQuery(); }}
                    placeholder="수급자명 검색"
                    style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 22, paddingRight: 6, height: 22, border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 11, outline: 'none', background: '#f8fafc', color: '#1e293b' }}
                  />
                </div>
                <button onClick={submitWeekQuery} title="검색 (Enter)"
                  style={{ height: 22, padding: '0 8px', fontSize: 11, borderRadius: 4, cursor: 'pointer', border: '1px solid #152e50', background: '#152e50', color: '#fff', fontWeight: 700 }}>검색</button>
                {weekQuery && (
                  <button onClick={() => { setWeekQueryDraft(''); setWeekQuery(''); }} title="검색 초기화"
                    style={{ height: 22, padding: '0 6px', fontSize: 11, borderRadius: 4, cursor: 'pointer', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b' }}>초기화</button>
                )}
              </div>
              <select value={weekContract} onChange={e => setWeekContract(e.target.value)}
                style={{ height: 22, padding: '0 4px', fontSize: 11, borderRadius: 4, outline: 'none', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b', cursor: 'pointer' }}>
                <option value="all">전체 계약구분</option>
                {CONTRACT_STATUSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {/* 그룹 필터 */}
              <select value={selGroup} onChange={e => { setSelGroup(e.target.value); setSelSubGroup('all'); }}
                style={{ height: 22, padding: '0 4px', fontSize: 11, borderRadius: 4, outline: 'none', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b', cursor: 'pointer' }}>
                {PA_GROUPS.map(g => <option key={g.id} value={g.id}>{g.id === 'all' ? '전체 그룹' : g.label}</option>)}
              </select>
              {(() => {
                const grp = PA_GROUPS.find(g => g.id === selGroup);
                if (!grp || grp.subs.length === 0) return null;
                return (
                  <select value={selSubGroup} onChange={e => setSelSubGroup(e.target.value)}
                    style={{ height: 22, padding: '0 4px', fontSize: 11, borderRadius: 4, outline: 'none', border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer' }}>
                    <option value="all">전체</option>
                    {grp.subs.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                );
              })()}
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {weekRecipients.map((r, idx) => {
                const on = r.id === weekRecipId;
                const bg = on ? '#dbeafe' : idx % 2 === 0 ? '#ffffff' : '#f4f7fb';
                const ld = getLegalDob(r);
                const dob = ld ? `${ld.slice(2,4)}.${ld.slice(5,7)}.${ld.slice(8,10)}` : '';
                const tl = typeLabel(getReduction(r));
                return (
                  <div key={r.id} onClick={() => setWeekRecipId(r.id)}
                    style={{
                      padding: '0 6px 0 4px', height: 30,
                      display: 'flex', alignItems: 'center', gap: 3,
                      borderBottom: '1px solid #e4eaf3', cursor: 'pointer', background: bg,
                      borderLeft: on ? '3px solid #2563eb' : '3px solid transparent',
                    }}>
                    <span style={{
                      fontSize: 13, fontWeight: on ? 700 : 500, color: on ? '#1d4ed8' : '#0f172a',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1, minWidth: 0,
                    }}>{r.name}<span style={{ color: '#94a3b8', fontWeight: 400 }}>({dob})</span></span>
                    {/* 계약구분 뱃지 */}
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 4px', borderRadius: 3, ...contractStyle(r.contractStatus), flexShrink: 0, whiteSpace: 'nowrap' }}>{r.contractStatus}</span>
                    {/* 등급·감경 뱃지 */}
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 4px', borderRadius: 3, background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', flexShrink: 0, whiteSpace: 'nowrap' }}>{getGradeText(r)}</span>
                    <span style={{ ...typeStyle(tl), fontSize: 10, fontWeight: 700, padding: '1px 4px', borderRadius: 3, flexShrink: 0, whiteSpace: 'nowrap' }}>{typeDisplay(getReduction(r))}</span>
                  </div>
                );
              })}
              {weekRecipients.length === 0 && (
                <div style={{ padding: '20px 10px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>표시할 수급자가 없습니다.</div>
              )}
            </div>
          </aside>

          {/* 우측 본문 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* 컨트롤 바 */}
            <div style={{ flexShrink: 0, background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '5px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                {weekRecip ? weekRecip.name : '수급자를 선택하세요'}
              </span>
              {weekRecip && (
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  {getGradeText(weekRecip)} · {typeDisplay(getReduction(weekRecip))}
                </span>
              )}
              <Divider />
              {/* 연도 이동 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <button onClick={() => setWeekYear(y => y - 1)} style={btnNav}><ChevronLeft size={12} color="#64748b" /></button>
                <div style={{ minWidth: 54, textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{weekYear}년</div>
                <button onClick={() => setWeekYear(y => y + 1)} style={btnNav}><ChevronRight size={12} color="#64748b" /></button>
              </div>
              <Divider />
              {/* 계획/청구 보기 */}
              <div style={{ display: 'flex', gap: 3 }}>
                {([['plan','계획보기','#1d4ed8','#dbeafe','#93c5fd'],['claim','청구보기','#059669','#d1fae5','#6ee7b7']] as const).map(([key,label,col,bg,bd]) => {
                  const on = weekView === key;
                  return (
                    <button key={key} onClick={() => setWeekView(key)} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '3px 10px', borderRadius: 16, cursor: 'pointer',
                      background: on ? bg : '#fff', color: on ? col : '#64748b', border: `1px solid ${on ? bd : '#e2e8f0'}`, fontWeight: on ? 700 : 500,
                    }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: bg, border: `1px solid ${bd}` }} />{label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 주간 표 */}
            <div style={{ flex: 1, overflow: 'auto', padding: '10px 16px' }}>
              {!weekRecip ? (
                <div style={{ height: '100%', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
                  좌측에서 수급자를 선택하면 주간 급여일정이 표시됩니다.
                </div>
              ) : (
                <table style={{ borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed', width: '100%', minWidth: 720, background: '#fff' }}>
                  <colgroup>
                    <col style={{ width: 96 }} />
                    {Array.from({ length: 7 }, (_, i) => <col key={i} />)}
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={{ ...TH_BASE, position: 'sticky', top: 0, left: 0, zIndex: 20, background: '#152e50' }}>주</th>
                      {['월','화','수','목','금','토','일'].map((d, i) => (
                        <th key={d} style={{ ...TH_BASE, position: 'sticky', top: 0, zIndex: 10, background: i === 5 ? '#1e3a5f' : i === 6 ? '#3a2540' : '#253f6a', color: i === 6 ? '#fca5a5' : i === 5 ? '#93c5fd' : 'rgba(255,255,255,0.85)' }}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeks.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>{weekYear}년에 표시할 {weekView === 'plan' ? '계획' : '청구'} 일정이 없습니다.</td></tr>
                    ) : weeks.map((wk, wi) => {
                      const bg = '#ffffff';
                      const today = new Date();
                      const weekHasToday = wk.days.some(d => d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate());
                      return (
                        <tr key={wi}>
                          <td style={{ padding: '4px 6px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#334155', background: weekHasToday ? '#fef9c3' : bg, borderBottom: '1px solid #e4eaf3', borderRight: '1px solid #e2e8f0', position: 'sticky', left: 0, zIndex: 5, verticalAlign: 'middle' }}>
                            {weekLabels[wi]}
                          </td>
                          {wk.days.map((d, di) => {
                            const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                            const entries = weekSchedByDate.get(dateStr) ?? [];
                            const inRange = d.getFullYear() === weekYear;
                            const isHol = isHoliday(dateStr);
                            const isSun = di === 6 || isHol, isSat = di === 5;
                            const cellBg = !inRange ? '#f1f5f9' : isSun ? 'rgba(254,242,242,0.6)' : isSat ? 'rgba(239,246,255,0.5)' : bg;
                            const fmtDur = (mins: number) => {
                              const h = Math.floor(mins / 60), m = mins % 60;
                              return h > 0 ? (m > 0 ? `${h}시간${m}분` : `${h}시간`) : `${m}분`;
                            };
                            const memo = weekDayMemos[dateStr];
                            const goToDay = () => {
                              if (!weekRecip) return;
                              navigate(`/recipients/${weekRecip.id}?year=${d.getFullYear()}&month=${d.getMonth() + 1}&view=${weekView}`);
                            };
                            return (
                              <td key={di} onClick={goToDay} style={{ padding: '3px 4px', verticalAlign: 'top', background: cellBg, borderBottom: '1px solid #e4eaf3', borderRight: '1px solid rgba(21,46,80,0.06)', cursor: 'pointer' }}
                                onMouseEnter={e => { if (inRange) (e.currentTarget as HTMLTableCellElement).style.outline = '2px solid #93c5fd'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLTableCellElement).style.outline = 'none'; }}
                              >
                                {/* 헤더: M/D 좌측 + 메모(있으면) */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2, lineHeight: 1.2 }}>
                                  <span style={{ fontSize: 10, fontWeight: 600, color: isSun ? '#dc2626' : isSat ? '#2563eb' : '#475569', flexShrink: 0 }}>{d.getMonth() + 1}/{d.getDate()}</span>
                                  {memo && (
                                    <span title={memo} style={{ fontSize: 12, color: '#b45309', background: '#fef9c3', borderLeft: '2px solid #f59e0b', padding: '0 4px', borderRadius: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{memo}</span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  {/* 일정이 없어도 한 줄 높이 고정 여백 */}
                                  {entries.length === 0 && <div style={{ height: 18 }} />}
                                  {entries.map((s, si) => {
                                    const meta = SVC_META[s.serviceType];
                                    const w = careWorkers.find(x => x.id === s.careWorkerId);
                                    return (
                                      <div key={si} title={`${meta?.short ?? s.serviceType} ${s.startTime}~${s.endTime} ${w?.name ?? ''}`}
                                        style={{
                                          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', columnGap: 3,
                                          padding: '1px 2px', borderRadius: 3, fontSize: 12, lineHeight: 1.2,
                                        }}>
                                        {/* 1열: 급여종류 뱃지 (2글자) */}
                                        <span style={{
                                          fontSize: 12, fontWeight: 700, textAlign: 'center', padding: '1px 0', borderRadius: 3,
                                          background: meta ? `${meta.color}15` : '#f1f5f9',
                                          color: meta?.color ?? '#64748b',
                                          border: `1px solid ${meta ? `${meta.color}40` : '#e2e8f0'}`,
                                        }}>{meta?.short ?? '-'}</span>
                                        {/* 2열: 제공시간 */}
                                        <span style={{ fontSize: 12, color: '#475569', textAlign: 'center', whiteSpace: 'nowrap' }}>{fmtDur(s.durationMinutes ?? 0)}</span>
                                        {/* 3열: 제공자(요양보호사명) */}
                                        <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 500, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w?.name ?? '-'}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </>
      )}
    </div>
  );
}

// ── 요양보호사 검색형 콤보박스 ───────────────────────────────────────
// 수백 명 규모 대응 — 이름/별칭/생년월일로 로컬 필터링. 동명이인 구분을 위해
// 리스트에 '이름(별칭) 생년월일'을 함께 표시한다.
function WorkerCombo({ workers, value, onChange }: {
  workers: Employee[];
  value: string;                  // 'all' 또는 worker.id
  onChange: (v: string) => void;
}) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const selected = value === 'all' ? null : workers.find(w => w.id === value) ?? null;
  const q = query.trim().toLowerCase();
  const filtered = (q === ''
    ? workers
    : workers.filter(w => {
        const birth = getEmployeeBirth(w);
        return w.name.toLowerCase().includes(q)
          || (w.nickname ?? '').toLowerCase().includes(q)
          || birth.includes(q);
      })
  ).slice().sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const label = (w: Employee) => `${w.name}${w.nickname ? `(${w.nickname})` : ''}`;

  const pick = (v: string) => { onChange(v); setOpen(false); setQuery(''); };

  return (
    <div ref={boxRef} style={{ position: 'relative', width: 188 }}>
      {/* 트리거 */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', height: 24, padding: '0 6px',
          display: 'flex', alignItems: 'center', gap: 4,
          border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12,
          background: '#f8fafc', color: selected ? '#1e293b' : '#64748b', cursor: 'pointer',
        }}
      >
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? label(selected) : '전체 요양보호사'}
        </span>
        {selected && (
          <X size={12} color="#94a3b8" onClick={e => { e.stopPropagation(); pick('all'); }} />
        )}
        <ChevronDown size={12} color="#94a3b8" />
      </button>

      {/* 드롭다운 */}
      {open && (
        <div style={{
          position: 'absolute', top: 27, left: 0, zIndex: 50, width: 260,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(15,39,68,0.16)', overflow: 'hidden',
        }}>
          {/* 검색 입력 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 9px', borderBottom: '1px solid #f1f5f9' }}>
            <Search size={12} color="#94a3b8" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="이름·별칭·생년월일 검색"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 12, color: '#1e293b' }}
            />
          </div>
          {/* 리스트 */}
          <div style={{ maxHeight: 256, overflowY: 'auto' }}>
            <div
              onClick={() => pick('all')}
              style={{ padding: '7px 11px', fontSize: 12, cursor: 'pointer', color: value === 'all' ? '#1d4ed8' : '#64748b', fontWeight: value === 'all' ? 700 : 400, background: value === 'all' ? '#eff6ff' : '#fff' }}
            >전체 요양보호사</div>
            {filtered.map(w => {
              const on = w.id === value;
              const birth = getEmployeeBirth(w);
              return (
                <div
                  key={w.id}
                  onClick={() => pick(w.id)}
                  style={{
                    padding: '7px 11px', cursor: 'pointer',
                    display: 'flex', alignItems: 'baseline', gap: 7,
                    background: on ? '#eff6ff' : '#fff',
                    borderTop: '1px solid #f8fafc',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: on ? 700 : 600, color: on ? '#1d4ed8' : '#1e293b' }}>
                    {w.name}{w.nickname ? <span style={{ color: '#64748b', fontWeight: 400 }}>({w.nickname})</span> : null}
                  </span>
                  <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>{birth || '-'}</span>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '14px 11px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>검색 결과가 없습니다</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 소형 UI 헬퍼 ─────────────────────────────────────────────────────
function Divider() {
  return <div style={{ width: 1, height: 14, background: '#e2e8f0', flexShrink: 0 }} />;
}

const btnNav: CSSProperties = {
  width: 20, height: 20,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '1px solid #e2e8f0', borderRadius: 4,
  background: '#f8fafc', cursor: 'pointer',
};