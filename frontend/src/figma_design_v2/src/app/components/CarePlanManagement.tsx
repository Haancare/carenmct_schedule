import React, { useState, useEffect } from 'react';
import { recipients, SERVICE_LABELS, socialWorkers, REDUCTION_OPTIONS, getApprovedAmounts, getValidFrom, getValidTo, getCertNo, getMobile, getGradeNum, getGradeText, getReduction, getCopayRate, getServiceTypes, getRealDob } from './mockData';
import {
  Search, Save, FileText,
  ClipboardList, ChevronRight, User,
  AlertTriangle, Plus, History, Trash2
} from 'lucide-react';
import { NeedsAssessmentForm } from './NeedsAssessmentForm';
import { CarePlanDocument } from './CarePlanDocument';

function AutoTA({ value, onChange, style, minRows = 2 }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  style?: React.CSSProperties;
  minRows?: number;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  React.useEffect(() => {
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

// ─── TYPES ──────────────────────────────────────────────────
type DocKey = 'longTerm' | 'needs' | 'fall' | 'pressure' | 'cognitive' | 'carePlan';

interface DocEntry {
  id: string;
  date: string;   // 작성일 (YYYY-MM-DD)
  author: string;
  data: Record<string, any>;
}

type RecipDocs = Record<DocKey, DocEntry[]>; // 내림차순(최신→과거)
type DocStore  = Record<string, RecipDocs>;

// ─── CONSTANTS ───────────────────────────────────────────────
const TODAY = '2026-04-15';
const SW = ['김지원', '박수현', '이나연'];

const DOCS = [
  { key: 'longTerm'  as DocKey, label: '장기이용계획', short: '장기', cycDays: 365, cycLabel: '1년',   col: '#6366f1' },
  { key: 'needs'     as DocKey, label: '욕구사정',      short: '욕구', cycDays: 365, cycLabel: '1년',   col: '#0ea5e9' },
  { key: 'fall'      as DocKey, label: '낙상위험측정',  short: '낙상', cycDays: 180, cycLabel: '6개월', col: '#f97316' },
  { key: 'pressure'  as DocKey, label: '욕창위험측정',  short: '욕창', cycDays: 180, cycLabel: '6개월', col: '#ec4899' },
  { key: 'cognitive' as DocKey, label: '인지선별검사',   short: '인지', cycDays: 180, cycLabel: '6개월', col: '#8b5cf6' },
  { key: 'carePlan'  as DocKey, label: '급여제공계획',   short: '계획', cycDays: 365, cycLabel: '1년',   col: '#10b981' },
];

const PROGRESS_DOCS = DOCS.filter(d => d.key !== 'longTerm');

// ─── MOCK DATA ───────────────────────────────────────────────
const DAY_PATS: number[][] = [
  [40,  28,  42,  118, 88,  56 ],
  [118, 148, 88,  58,  198, 168],
  [198, 58,  118, 43,  298, 58 ],
  [88,  58,  178, 88,  148, 118],
  [28,  168, 58,  168, 58,  183],
  [298, 43,  163, 28,  398, 148],
  [178, 88,  198, 148, 363, 88 ],
  [58,  118, 28,  198, 178, 43 ],
  [248, 168, 88,  58,  278, 168],
  [178, 58,  178, 88,  363, 58 ],
  [98,  118, 148, 78,  198, 138],
  [218, 38,  68,  158, 318, 78 ],
];

function subDays(n: number): string {
  const d = new Date(TODAY); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function buildStore(): DocStore {
  const s: DocStore = {};
  recipients.forEach((r, i) => {
    const pat  = DAY_PATS[i % DAY_PATS.length];
    const rec: Partial<RecipDocs> = {};
    const numEntries = (i % 3) + 1; // 1~3건

    DOCS.forEach((doc, di) => {
      const miss = (i % 9  === 0 && doc.key === 'cognitive') ||
                   (i % 13 === 0 && doc.key === 'carePlan');
      if (miss) {
        rec[doc.key] = [];
        return;
      }
      const entries: DocEntry[] = [];
      for (let e = 0; e < numEntries; e++) {
        const daysAgo = pat[di] + e * doc.cycDays;
        if (daysAgo >= 0) {
          const entryData: Record<string, any> = {};
          if (doc.key === 'fall') {
            entryData.fallMode = (i + e) % 2 === 0 ? 'huhn' : 'bobath';
          }
          if (doc.key === 'carePlan') {
            const svcTypes = ['방문요양','방문목욕','방문간호','주간보호'];
            entryData.cpd_svcType = svcTypes[(i + e) % svcTypes.length];
            entryData.cp_planTypes = ['visit'];
            const visitPt = CP_PLAN_TYPES.find(p => p.key === 'visit')!;
            const visitCatKeys = visitPt.categories.map(c => c.key);
            entryData.cp_catChecks = { visit: visitCatKeys };
            for (const cat of visitPt.categories) {
              const pfx = `cp_visit_${cat.key}`;
              entryData[`${pfx}_goal`] = cat.defaultGoal;
              entryData[`${pfx}_time`] = cat.defaultTime;
              entryData[`${pfx}_items`] = cat.items.map(it => ({...it}));
            }
          }
          entries.push({
            id:     `${r.id}_${doc.key}_${e}`,
            date:   subDays(daysAgo),
            author: SW[(i + e) % SW.length],
            data:   entryData,
          });
        }
      }
      // 최신 순 정렬
      entries.sort((a, b) => b.date.localeCompare(a.date));
      rec[doc.key] = entries;
    });
    s[r.id] = rec as RecipDocs;
  });
  return s;
}

// ─── PROGRESS ────────────────────────────────────────────────
function calcProg(lastDate: string | null, cycDays: number) {
  if (!lastDate) return { pct: 100, bar: '#94a3b8', txt: '#64748b', badge: '미실시', overdue: true, daysLeft: null };
  const e     = Math.floor((new Date(TODAY).getTime() - new Date(lastDate).getTime()) / 86400000);
  const ratio = e / cycDays;
  const pct   = Math.min(Math.round(ratio * 100), 100);
  const left  = cycDays - e;
  const bar   = ratio >= 1 ? '#ef4444' : ratio >= 0.85 ? '#f97316' : ratio >= 0.65 ? '#eab308' : '#22c55e';
  const txt   = ratio >= 1 ? '#dc2626' : ratio >= 0.85 ? '#ea580c' : ratio >= 0.65 ? '#ca8a04' : '#16a34a';
  const badge = left <= 0 ? `D+${Math.abs(left)}` : left <= 30 ? `D-${left}` : '';
  return { pct, bar, txt, badge, overdue: left <= 0, daysLeft: left };
}

// ─── ASSESSMENT DEFINITIONS ──────────────────────────────────
const HUHN_ITEMS: { k:string; label:string; cols:{v:number;l:string}[] }[] = [
  { k:'f1', label:'연령',         cols:[{v:0,l:''},{v:3,l:'≥80'},{v:2,l:'70-79'},{v:1,l:'60-69'}] },
  { k:'f2', label:'정신상태',     cols:[{v:4,l:'혼란스러움 /\n방향감각장애'},{v:0,l:''},{v:2,l:'때때로 혼란스러움 /\n방향감각장애'},{v:0,l:''}] },
  { k:'f3', label:'배변',         cols:[{v:4,l:'소변, 대변 실금'},{v:3,l:'조절능력 있지만,\n도움 필요'},{v:0,l:''},{v:1,l:'유치도뇨관 /\n인공항루'}] },
  { k:'f4', label:'낙상경험',     cols:[{v:4,l:'이미 세번 이상\n넘어짐'},{v:0,l:''},{v:2,l:'이미 한번 또는\n두번 넘어짐'},{v:0,l:''}] },
  { k:'f5', label:'활동',         cols:[{v:4,l:'전적으로 도움을 받음'},{v:3,l:'자리에서 일어나\n앉기 도움'},{v:0,l:''},{v:1,l:'자립 / 세면대,\n화장실 이용'}] },
  { k:'f6', label:'걸음걸이\n및 균형', cols:[{v:4,l:'불규칙 / 불안정\n서 있을 때와 걸을\n때 균형을 거의\n유지하지 못함'},{v:3,l:'일어서기 /\n걸을 때 기립성 /\n빈혈 / 혈액순환문제'},{v:2,l:'보행장애 /\n보조도구나\n도움으로 걷기'},{v:0,l:''}] },
  { k:'f7', label:'지난7일간\n약복용이나\n계획된 약물', cols:[{v:4,l:'3개 또는 그 이상\n의 약복용'},{v:3,l:'두 가지 약 복용'},{v:2,l:'한 가지 약 복용'},{v:0,l:''}] },
];
const fallRisk  = (s: number) => s <= 4 ? {l:'낙상위험 낮음',c:'#16a34a',bg:'#f0fdf4'} : s <= 10 ? {l:'낙상위험 높음',c:'#ea580c',bg:'#fff7ed'} : {l:'낙상위험 아주 높음',c:'#dc2626',bg:'#fef2f2'};

const BOBATH_GROUPS: { k:string; label:string; desc?:string; opts:{v:number;l:string;l2?:string}[] }[] = [
  { k:'bf1', label:'나이', opts:[{v:0,l:'60세 미만'},{v:1,l:'60~69세'},{v:2,l:'70~79세'},{v:3,l:'80세 이상'}] },
  { k:'bf2', label:'낙상 과거력', opts:[{v:0,l:'없음'},{v:1,l:'지난 1년 이내 낙상'},{v:2,l:'지난 1~5개월 이내 낙상'},{v:3,l:'지난4주이내 낙상'}] },
  { k:'bf3', label:'활동수준', opts:[{v:0,l:'와상상태'},{v:1,l:'1명 이상의 많은 도움으로 휠체어 이동가능(지속적인 sitting유지 어려움)'},{v:5,l:'1명의 약간의 도움으로 휠체어 이동이 가능(static standing이 가능)'},{v:8,l:'보조기나 한 사람의 도움으로 보행 가능'}] },
  { k:'bf4', label:'의식상태', opts:[{v:0,l:'지남력 있음 *3(사람, 장소, 시간)'},{v:2,l:'평가하기 어려움(uncheckable)'},{v:4,l:'지남력 있음 *2(사람, 장소)'},{v:6,l:'지남력 있음 *1 (사람)'},{v:8,l:'지남력없음'}] },
  { k:'bf5', label:'의사소통', opts:[{v:0,l:'정상'},{v:1,l:'청력상실'},{v:2,l:'언어장애'},{v:3,l:'청력과 언어장애'}] },
  { k:'bf6', label:'위험요인', desc:'수면장애, 배뇨장애, 설사, 시력장애, 어지러움, 우울, 흥분, 불안', opts:[{v:0,l:'없음'},{v:1,l:'1~2개'},{v:2,l:'3개'},{v:3,l:'4개 이상'}] },
  { k:'bf7', label:'관련질환', desc:'· 뇌졸중\n· 고혈압/저혈압\n· 치매\n· 파킨슨병\n· 골다공증\n· 신장장애\n· 근골격계질환(관절염 포함)\n· 발작장애', opts:[{v:0,l:'없음'},{v:1,l:'1~2개'},{v:2,l:'3~4개'},{v:3,l:'5개 이상'}] },
  { k:'bf8', label:'약물', desc:'[A군] 고혈압제 · 이뇨제 · 강심제\n[B군] 최면진정제 · 항우울제 · 항불안제 · 항파킨슨제 · 항전간제', opts:[{v:0,l:'A : 0개',l2:'B : 0~2 개'},{v:1,l:'A : 1~3 개',l2:'B : 0~2 개'},{v:2,l:'A : 0 개',l2:'B : 3~6 개'},{v:3,l:'A : 1~3 개',l2:'B : 3~6 개'}] },
];
const bobathRisk = (s: number) => s < 10 ? {l:'낮은 위험',c:'#16a34a',bg:'#f0fdf4'} : s <= 14 ? {l:'중등도 위험',c:'#ea580c',bg:'#fff7ed'} : {l:'높은 위험(고위험군)',c:'#dc2626',bg:'#fef2f2'};

const BRADEN_ITEMS: { k:string; label:string; opts:{v:number;l:string;d:string}[] }[] = [
  { k:'b1', label:'감각\n인지\n여부', opts:[
    {v:1,l:'1. 감각 완전 제한됨',d:'의식저하 및 진정자극으로 인해 통증자극에 대한 반응 없음 신체 대부분 통증지각 없음'},
    {v:2,l:'2. 감각 매우 제한됨',d:'통증자극에만 반응(신음, 불안전한양상보임). 신체1/2만 통증지각'},
    {v:3,l:'3. 감각 약간 제한됨',d:'말로 지시하면 반응하지만 항상 말할 수 있지 않다.'},
    {v:4,l:'4. 감각 손상 없음',d:'언어적 명령에 반응. 통증을 말로 표현할 수 있다.'},
  ]},
  { k:'b2', label:'습기\n여부', opts:[
    {v:1,l:'1. 항상 젖어 있음',d:'피부가 땀, 소변 등으로 항상 젖어있다.'},
    {v:2,l:'2. 자주 젖어 있음',d:'자주 축축해져 있어 8시간에 한번은 린넨 을 갈아주어야 한다'},
    {v:3,l:'3. 가끔 젖어 있음',d:'가끔 축축하여 하루에 한번정도 있어 린넨 교환이 필요하다'},
    {v:4,l:'4. 거의 젖지 않음',d:'피부는 보통 건조하여 린넨 은 평상시대로 교환해 주면 된다'},
  ]},
  { k:'b3', label:'활동\n상태', opts:[
    {v:1,l:'1. 항상 침대 생활',d:'도움 없이는 조금도 움직이지 못한다.'},
    {v:2,l:'2. 의자에 앉을수있음',d:'걸을 수 없거나 걷는 능력이 상당히 제한되어 있어 의자나 휠체어 이동시 상당한 도움이 필요로 한다.'},
    {v:3,l:'3. 가끔 걸을수 있음',d:'대부분의 시간이 침상에서 보내며 잠깐 동안 매우 짧은 거리를 걸을 수 있다.'},
    {v:4,l:'4. 자주 걸을 수 있음',d:'적어도 하루에 두 번 방밖을 걸고, 방안을 2시간마다 걷는다.'},
  ]},
  { k:'b4', label:'움직임', opts:[
    {v:1,l:'1. 완전히 못 움직임',d:'도움 없이는 신체나 사지를 전혀 움직이지 못한다.'},
    {v:2,l:'2. 매우 제한됨',d:'신체나 사지의 체위를 가끔 변경시킬 수 있지만 자주는 못한다.'},
    {v:3,l:'3. 약간 제한됨',d:'혼자서 신체나 사지의 체위를 조금이기는 하지만 자주 변경 시킨다'},
    {v:4,l:'4. 제 한 없 음',d:'도움 없이도 체위를 자주 변경시킨다.'},
  ]},
  { k:'b5', label:'영양\n상태', opts:[
    {v:1,l:'1. 매 우 나 쁨',d:'제공된 음식의 1/3이하를 섭취. 5일 이상동안 금식상태이거나 유동식으로 유지한다.'},
    {v:2,l:'2. 부 족 함',d:'제공된 음식의 1/2을 섭취. 유동식이나 위관영양을 적정량 미만으로 투여 받는다'},
    {v:3,l:'3. 적 당 함',d:'식사의 반 이상을 먹는다. 가끔 식사를 거부하지만 보통 영양 보충식이는 섭취 한다.'},
    {v:4,l:'4. 우 수 함',d:'대부분의 식사를 섭취. 영양보충식이는 필요로 되지 않는다.'},
  ]},
  { k:'b6', label:'마찰력\n과\n응전력', opts:[
    {v:1,l:'1. 문 제 있 음',d:'움직임에 많은 도움을 필요로 하며 린넨 으로 끌어당기지 않고 완전히 들어 올리는 것은 불가능 함. 관절구축이나,경직,응집임 등으로 향상 마찰이 생긴다.'},
    {v:2,l:'2. 잠정적으로 문제 있 음',d:'움직이는 동안 의자 억제대나 린넨 또는 다른 장비에 의해 마찰이 생길 수 있으며, 약간은 미끄러져 내려갈 수 있다.'},
    {v:3,l:'3. 문제 없 음',d:'침대나 의자에서 자유로이 움직이며 움직일 때 스스로 자신을 들어올릴 수 있을 정도로 충분한 근력이 있다.'},
  ]},
];
const bradenRisk = (s: number) => s <= 9 ? {l:'위험이 매우 높음',c:'#dc2626',bg:'#fef2f2'} : s <= 12 ? {l:'위험 높음',c:'#ef4444',bg:'#fef2f2'} : s <= 14 ? {l:'중간 정도의 위험 있음',c:'#ea580c',bg:'#fff7ed'} : s <= 18 ? {l:'약간의 위험 있음',c:'#ca8a04',bg:'#fefce8'} : {l:'위험없음',c:'#16a34a',bg:'#f0fdf4'};

const CIST_DOMAINS = [
  { k:'cist_orient',  label:'지남력 (Orientation)',      max:5,  desc:'시간·장소 파악 능력' },
  { k:'cist_memory',  label:'기억력 (Memory)',           max:10, desc:'단어 기억 및 회상' },
  { k:'cist_attn',    label:'주의력 (Attention)',        max:3,  desc:'집중력 및 계산 능력' },
  { k:'cist_lang',    label:'언어기능 (Language)',        max:4,  desc:'사물 이름 맞히기 등' },
  { k:'cist_visuo',   label:'시공간구성 (Visuospatial)',  max:2,  desc:'오각형 그리기 등' },
  { k:'cist_exec',    label:'집행기능 (Executive)',       max:6,  desc:'추상적 사고 및 판단력' },
];
const CIST_TOTAL_MAX = 30;
// 커트라인 기준: 이 점수 이상 → 정상, 미만 → 인지저하 의심
const cistResult = (score: number, cutoff: number | null) =>
  cutoff === null ? null : score >= cutoff ? '정상' : '인지저하 의심';
const cistColor = (result: string | null) =>
  result === '정상' ? { c:'#16a34a', bg:'#f0fdf4' } : result === '인지저하 의심' ? { c:'#ca8a04', bg:'#fefce8' } : { c:'#64748b', bg:'#f8fafc' };
const EXAMINER_QUALS = ['사회복지사','간호사','간호조무사','물리치료사','작업치료사','기타'];
const EXAM_PLACES   = ['센터 내부','수급자 자택','의료기관','기타'];
// 공단 공식 교육연수 구분 (CIST 진단검사 의뢰점수 기준)
const EDU_LEVELS = ['비문해', '무학/문해(~5년)', '초졸(6~8년)', '중졸(9~11년)', '고졸(12~15년)', '대졸이상(16년~)'];
const AGE_GROUPS = ['50~59세', '60~69세', '70~79세', '80~89세', '90세이상'];

// 공단 CIST 진단검사 의뢰점수: 이 점수 미만이면 인지저하 의심(진단검사 의뢰), 이상이면 정상
// null = 해당 연령·학력 조합은 기준 없음(-)
const CIST_CUTOFF_TABLE: Record<string, Record<string, number | null>> = {
  '50~59세': { '비문해':null, '무학/문해(~5년)':null, '초졸(6~8년)':22, '중졸(9~11년)':24, '고졸(12~15년)':26, '대졸이상(16년~)':27 },
  '60~69세': { '비문해':null, '무학/문해(~5년)':16,   '초졸(6~8년)':21, '중졸(9~11년)':23, '고졸(12~15년)':25, '대졸이상(16년~)':26 },
  '70~79세': { '비문해':13,   '무학/문해(~5년)':14,   '초졸(6~8년)':19, '중졸(9~11년)':22, '고졸(12~15년)':22, '대졸이상(16년~)':25 },
  '80~89세': { '비문해':10,   '무학/문해(~5년)':11,   '초졸(6~8년)':16, '중졸(9~11년)':18, '고졸(12~15년)':20, '대졸이상(16년~)':22 },
  '90세이상': { '비문해':10,  '무학/문해(~5년)':11,   '초졸(6~8년)':16, '중졸(9~11년)':18, '고졸(12~15년)':20, '대졸이상(16년~)':22 },
};

// 검사일 기준 만 나이로 연령그룹 자동 결정
function getCistAgeGroup(legalDob: string | undefined, examDate: string): string {
  if (!legalDob) return '';
  const dob = new Date(legalDob.replace(/\./g, '-'));
  const exam = new Date(examDate);
  if (isNaN(dob.getTime()) || isNaN(exam.getTime())) return '';
  let age = exam.getFullYear() - dob.getFullYear();
  const m = exam.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && exam.getDate() < dob.getDate())) age--;
  if (age < 50) return '';
  if (age < 60) return '50~59세';
  if (age < 70) return '60~69세';
  if (age < 80) return '70~79세';
  if (age < 90) return '80~89세';
  return '90세이상';
}

// ── 급여제공계획 급여종류별 구분·항목 ──
type CpCatDef = { key:string; label:string; defaultGoal:string; defaultTime:string; items:{name:string;details:string;freq:string}[] };
type CpPlanType = { key:string; label:string; categories:CpCatDef[] };

const CP_PLAN_TYPES: CpPlanType[] = [
  { key:'visit', label:'방문요양 급여계획서', categories:[
    { key:'physical', label:'신체활동', defaultGoal:'청결상태 유지, 신체기능 유지 및 향진, 개인위생 증진, 가족의 수발부담경감, 삶의 질 향상', defaultTime:'220', items:[
      {name:'세면도움',details:'- 얼굴과 목, 손 씻기 등\n- 사용 물품 정리\n- 세면대까지의 이동 포함',freq:'1회10분/매일'},
      {name:'구강관리',details:'- 구강청결(양치질 등)\n- 양치 지켜보기\n- 가글액, 물약치\n- 틀니소질\n- 필요물품 준비 및 사용물품의 정리',freq:'1회10분/매일'},
      {name:'식사도움',details:'- 식사 차리기\n- 식사보조\n- 구토물 정리',freq:'수시30분/매일'},
      {name:'몸단장',details:'- 머리단장\n- 손발톱 깎기\n- 면도\n- 면도 지켜보기\n- 화장하기\n- 필요물품 준비 및 사용물품의 정리',freq:'1회20분/매일'},
      {name:'옷갈아입히기',details:'- 의복준비(양말, 신발 포함)\n- 지켜보기 및 지도\n- 겉옷 및 속옷 갈아입히기\n- 의복정리',freq:'1회20분/매일'},
      {name:'머리감기기',details:'- 세면대까지의 이동보조 포함\n- 머리감기\n- 머리 말리기\n- 필요물품 준비 및 사용물품의 정리',freq:'3회20분/주'},
      {name:'목욕도움',details:'- 입욕준비\n- 입욕 시 이동보조\n- 몸 씻기(샤워 포함)\n- 옷갈아 입히기\n- 사용물품 정리',freq:'1회40분/주'},
      {name:'이동도움',details:'- 침대에서 휠체어로 옮겨타기\n- 보행도움\n- 산책',freq:'수시20분/매일'},
      {name:'체위변경',details:'- 체위변경\n- 일어나 앉기 도움',freq:'수시20분/매일'},
    ]},
    { key:'cognitive', label:'인지활동', defaultGoal:'인지기능 유지 및 악화 방지', defaultTime:'30', items:[
      {name:'인지자극활동',details:'- 회상활동, 퍼즐, 단어 맞추기 등\n- 달력 보기, 시간 인지 훈련\n- 그림 그리기, 색칠하기',freq:'1회30분/매일'},
    ]},
    { key:'emotional', label:'정서지원', defaultGoal:'의사소통 원활, 라포형성으로 정서적 안정', defaultTime:'30', items:[
      {name:'말벗·격려',details:'- 안부확인을 위한 방문 및 생활상의 문제 상담\n- 대화, 편지, 전화 등의 방법으로 수급자의 욕구 파악 및 의사 전달 대행',freq:'수시30분/매일'},
    ]},
    { key:'daily', label:'일상생활', defaultGoal:'이동장애 불편의 최소화, 일상생활 불편한 완화', defaultTime:'90', items:[
      {name:'식사준비',details:'- 수급자를 위한 식·재료의 준비\n- 밥 짓기, 국·반찬하기\n- 식탁청소, 설거지, 행주살기\n- 음식물쓰레기 정리 등',freq:'1회30분/매일'},
      {name:'청소및주변정돈',details:'- 수급자가 주로 거주하는 장소(방, 거실)\n- 화장실 청소\n- 쓰레기 분리배출\n- 내부정리, 이부자리 정돈\n- 옷장·서랍장 등 정리',freq:'1회30분/매일'},
      {name:'세탁',details:'- 수급자의 옷, 양말, 수건, 침구류\n- 걸레 등 세탁과 삶기 등',freq:'3회30분/주'},
    ]},
  ]},
  { key:'family', label:'가족요양 급여계획서', categories:[
    { key:'physical', label:'신체활동', defaultGoal:'가족 요양보호사를 통한 신체활동 지원', defaultTime:'120', items:[
      {name:'세면도움',details:'- 얼굴과 목, 손 씻기 등\n- 사용 물품 정리',freq:'1회10분/매일'},
      {name:'식사도움',details:'- 식사 차리기, 식사보조',freq:'수시30분/매일'},
      {name:'이동도움',details:'- 보행도움, 이동보조',freq:'수시20분/매일'},
    ]},
    { key:'emotional', label:'정서지원', defaultGoal:'가족관계 내 정서적 안정 도모', defaultTime:'30', items:[
      {name:'말벗·격려',details:'- 일상적인 대화, 정서적 지지',freq:'수시30분/매일'},
    ]},
    { key:'daily', label:'일상생활', defaultGoal:'일상생활 유지 지원', defaultTime:'60', items:[
      {name:'식사준비',details:'- 식·재료 준비, 조리, 설거지',freq:'1회30분/매일'},
      {name:'청소및주변정돈',details:'- 방, 거실, 화장실 청소\n- 쓰레기 분리배출',freq:'1회30분/매일'},
    ]},
  ]},
  { key:'bath', label:'방문목욕 급여계획서', categories:[
    { key:'vehicle', label:'차량이용', defaultGoal:'이동목욕 차량을 이용한 전신 목욕 서비스 제공', defaultTime:'40', items:[
      {name:'목욕준비',details:'- 차량 이동 및 장비 세팅\n- 수급자 상태 확인\n- 탈의 보조',freq:'1회/주'},
      {name:'목욕수행',details:'- 전신 세척(두발 포함)\n- 피부 상태 확인\n- 착의 보조 및 정리',freq:'1회40분/주'},
    ]},
    { key:'noVehicle', label:'차량미이용', defaultGoal:'가정 내 목욕 서비스 제공', defaultTime:'40', items:[
      {name:'목욕준비',details:'- 가정 내 욕실 준비\n- 물 온도 조절\n- 수급자 탈의 보조',freq:'1회/주'},
      {name:'목욕수행',details:'- 전신 세척(두발 포함)\n- 피부 상태 확인\n- 착의 보조 및 욕실 정리',freq:'1회40분/주'},
    ]},
  ]},
  { key:'nursing', label:'방문간호 급여계획서', categories:[
    { key:'basic', label:'기본간호', defaultGoal:'활력징후 관리 및 건강상태 모니터링', defaultTime:'30', items:[
      {name:'활력징후 측정',details:'- 혈압, 맥박, 체온, 호흡 측정\n- 건강 상태 관찰 및 기록',freq:'1회30분/방문시'},
    ]},
    { key:'disease', label:'질병관리', defaultGoal:'만성질환 관리 및 합병증 예방', defaultTime:'20', items:[
      {name:'만성질환 관리',details:'- 혈당 측정 및 관리\n- 혈압 관리 및 투약 확인\n- 합병증 예방 교육',freq:'1회20분/방문시'},
    ]},
    { key:'nutrition', label:'영양관리', defaultGoal:'적절한 영양 상태 유지', defaultTime:'15', items:[
      {name:'영양 상담',details:'- 식이 상태 평가\n- 영양 보충 가이드\n- 수분 섭취 관리',freq:'1회15분/방문시'},
    ]},
    { key:'excretion', label:'배설관리', defaultGoal:'배설 기능 유지 및 합병증 예방', defaultTime:'15', items:[
      {name:'배설 관리',details:'- 유치도뇨관 관리\n- 배변 양상 관찰\n- 피부 간호',freq:'1회15분/방문시'},
    ]},
    { key:'bodyTrain', label:'신체훈련', defaultGoal:'잔존 신체기능 유지·향상', defaultTime:'20', items:[
      {name:'관절운동',details:'- 관절 가동범위 운동\n- 근력 강화 운동 지도\n- 보행 훈련',freq:'1회20분/방문시'},
    ]},
    { key:'cogTrain', label:'인지훈련', defaultGoal:'인지기능 유지 및 자극', defaultTime:'20', items:[
      {name:'인지재활 프로그램',details:'- 기억력 훈련\n- 지남력 훈련\n- 일상생활 인지 자극',freq:'1회20분/방문시'},
    ]},
    { key:'eduConsult', label:'교육상담', defaultGoal:'수급자·보호자 건강교육', defaultTime:'15', items:[
      {name:'건강 교육',details:'- 질병 관리 교육\n- 약물 복용 지도\n- 낙상 예방 교육',freq:'1회15분/방문시'},
    ]},
    { key:'healthMgmt', label:'건강관리', defaultGoal:'전반적 건강 상태 관리', defaultTime:'15', items:[
      {name:'건강 관리',details:'- 건강 상태 종합 평가\n- 의료기관 연계\n- 건강 기록 관리',freq:'1회15분/방문시'},
    ]},
  ]},
  { key:'daycare', label:'주간보호 급여계획서', categories:[
    { key:'bodyFunc', label:'신체기능', defaultGoal:'잔존 신체기능 유지 및 향상', defaultTime:'60', items:[
      {name:'신체활동 프로그램',details:'- 스트레칭, 체조\n- 보행 훈련\n- 일상생활동작(ADL) 훈련',freq:'1회60분/매일'},
    ]},
    { key:'funcEval', label:'기능평가', defaultGoal:'기능 상태 정기 평가 및 프로그램 반영', defaultTime:'30', items:[
      {name:'기능 평가',details:'- ADL/IADL 평가\n- 인지 기능 평가\n- 낙상 위험 평가',freq:'1회30분/월'},
    ]},
    { key:'social', label:'사회생활', defaultGoal:'사회적 교류 및 여가 활동 참여', defaultTime:'60', items:[
      {name:'사회적응활동',details:'- 집단 활동 프로그램\n- 외부 나들이\n- 문화·여가 활동',freq:'1회60분/매일'},
    ]},
    { key:'cogFunc', label:'인지기능', defaultGoal:'인지기능 유지 및 치매 진행 예방', defaultTime:'30', items:[
      {name:'인지활동 프로그램',details:'- 인지자극 프로그램\n- 회상 요법\n- 미술·음악 치료',freq:'1회30분/매일'},
    ]},
    { key:'etcNursing', label:'기타간호', defaultGoal:'건강상태 관찰 및 투약 관리', defaultTime:'20', items:[
      {name:'간호 서비스',details:'- 활력징후 측정\n- 투약 확인 및 관리\n- 건강 상태 관찰',freq:'1회20분/매일'},
    ]},
    { key:'welfare', label:'복지지원', defaultGoal:'개별 복지 욕구 충족', defaultTime:'30', items:[
      {name:'복지 상담',details:'- 개별 상담\n- 가족 상담\n- 지역사회 자원 연계',freq:'1회30분/월'},
    ]},
  ]},
];

const ADL_ITEMS  = [{k:'a1',l:'세면하기'},{k:'a2',l:'구강청결'},{k:'a3',l:'목욕하기'},{k:'a4',l:'식사하기'},{k:'a5',l:'체위변경'},{k:'a6',l:'이동하기'},{k:'a7',l:'화장실이용'},{k:'a8',l:'대·소변조절'}];
const ADL_OPTS   = [{v:0,l:'완전자립(0)'},{v:1,l:'일부도움(1)'},{v:2,l:'상당도움(2)'},{v:3,l:'완전의존(3)'}];
const IADL_ITEMS = [{k:'i1',l:'금전관리'},{k:'i2',l:'투약관리'},{k:'i3',l:'전화사용'},{k:'i4',l:'교통수단이용'}];
const IADL_OPTS  = [{v:0,l:'스스로 가능(0)'},{v:1,l:'부분적 도움(1)'},{v:2,l:'완전 의존(2)'}];

// ─── STYLE HELPERS ───────────────────────────────────────────
const SH = {
  secHead: { background:'#152e50', color:'#fff', fontSize:12, fontWeight:700 as const, padding:'5px 12px', letterSpacing:'0.06em', textTransform:'uppercase' as const },
  row:   (odd: boolean) => ({ display:'flex' as const, alignItems:'center' as const, borderBottom:'1px solid #f1f5f9', background: odd ? '#f8fafc' : '#fff' }),
  lbl:   { fontSize:12, color:'#374151', padding:'6px 12px', flex: '0 0 130px' as const },
  sel:   { fontSize:12, border:'1px solid #e2e8f0', borderRadius:4, padding:'4px 6px', background:'#fff', color:'#1e293b', flex:1 },
  inp:   { fontSize:12, border:'1px solid #e2e8f0', borderRadius:4, padding:'5px 8px', width:'100%', background:'#fff', color:'#1e293b', boxSizing:'border-box' as const },
  ta:    { fontSize:12, border:'1px solid #e2e8f0', borderRadius:4, padding:'6px 8px', width:'100%', background:'#fff', color:'#1e293b', resize:'vertical' as const, boxSizing:'border-box' as const },
  score: { minWidth:36, textAlign:'center' as const, fontSize:12, fontWeight:700 as const, color:'#1e293b', padding:'6px 8px' },
};

// ─── GRADE COLOR ─────────────────────────────────────────────
const gradeColor = (g: number) =>
  g===1?{bg:'#fee2e2',c:'#dc2626'}:g===2?{bg:'#ffedd5',c:'#ea580c'}:
  g===3?{bg:'#fef9c3',c:'#ca8a04'}:g===4?{bg:'#f0fdf4',c:'#16a34a'}:{bg:'#f0f9ff',c:'#0369a1'};

// ── 그룹 목업 데이터 (기초정보관리 > 그룹관리 연동 전 UI 전용) ─────────────────
const CP_GROUPS = [
  { id: 'all',    label: '전체',          subs: [] as string[] },
  { id: 'sw',     label: '담당사회복지사', subs: ['김지원', '박수현', '이나연'] },
  { id: 'region', label: '지역구분',       subs: ['동부지역', '서부지역'] },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────
export function CarePlanManagement() {
  const [docStore, setDocStore]     = useState<DocStore>(buildStore);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<DocKey>('longTerm');
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState<'active'|'all'>('active');
  // 입력 중 값(draft)은 search와 분리 — Enter/검색 버튼 클릭 시에만 search에 반영
  const [searchDraft, setSearchDraft] = useState('');
  const submitSearch = () => setSearch(searchDraft.trim());
  const [selectedGroup,    setSelectedGroup]    = useState('all');
  const [selectedSubGroup, setSelectedSubGroup] = useState('all');
  const [gradeFilter,    setGradeFilter]    = useState('all');
  const [serviceFilter,  setServiceFilter]  = useState('all');
  const [formDraft, setFormDraft]   = useState<Record<string, any>>({});
  const [isDirty, setIsDirty]       = useState(false);
  const [author, setAuthor]         = useState('김지원');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isNewEntry, setIsNewEntry] = useState(false);
  const [tooltipId, setTooltipId]   = useState<string | null>(null);
  const [showCostPopup, setShowCostPopup] = useState(false);
  const [showCistTable, setShowCistTable] = useState(false);
  const [showFallTypeSelect, setShowFallTypeSelect] = useState(false);
  const [showCpContractPopup, setShowCpContractPopup] = useState(false);
  const [showCpCatPopup, setShowCpCatPopup] = useState<string|null>(null);
  const [showCpCatEdit, setShowCpCatEdit] = useState<string|null>(null);
  const [showCpTypeSelect, setShowCpTypeSelect] = useState(false);
  const [cpTypeChecks, setCpTypeChecks] = useState<string[]>([]);
  const [cpCatChecks, setCpCatChecks] = useState<Record<string, string[]>>({});

  // 수급자 또는 탭이 바뀌면 → 최신 항목 자동 선택
  useEffect(() => {
    if (!selectedId) return;
    const entries = docStore[selectedId][activeTab];
    if (entries.length > 0) {
      const latest = entries[0];
      setSelectedEntryId(latest.id);
      setFormDraft({ ...latest.data, writeDate: latest.date });
      setAuthor(latest.author || '김지원');
    } else {
      // 작성 기록 없음 → 빈 상태 유지 (신규작성 버튼으로만 진입)
      setSelectedEntryId(null);
      setAuthor('김지원');
      setFormDraft({ writeDate: TODAY });
      setIsNewEntry(false);
    }
    setIsNewEntry(false);
    setIsDirty(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, activeTab]);

  // 특정 항목 선택
  const selectEntry = (entry: DocEntry) => {
    setSelectedEntryId(entry.id);
    setFormDraft({ ...entry.data, writeDate: entry.date });
    setAuthor(entry.author || '김지원');
    setIsNewEntry(false);
    setIsDirty(false);
  };

  // 신규작성 모드
  const startNew = () => {
    if (activeTab === 'fall') {
      setShowFallTypeSelect(true);
      return;
    }
    if (activeTab === 'carePlan') {
      setSelectedEntryId(null);
      setIsNewEntry(true);
      setFormDraft({ writeDate: TODAY });
      setAuthor('김지원');
      setIsDirty(false);
      return;
    }
    setSelectedEntryId(null);
    setIsNewEntry(true);
    // 인지선별검사: 이전 검사지의 학력값 복사
    const prevEdu = (activeTab === 'cognitive' && selectedId)
      ? (docStore[selectedId]?.cognitive?.[0]?.data?.cist_edu ?? '')
      : '';
    setFormDraft({ writeDate: TODAY, ...(prevEdu ? { cist_edu: prevEdu } : {}) });
    setAuthor('김지원');
    setIsDirty(false);
  };
  const startNewFall = (mode: 'huhn' | 'bobath') => {
    setShowFallTypeSelect(false);
    setSelectedEntryId(null);
    setIsNewEntry(true);

    // 실제생년월일 기준 만 나이 자동 계산 → 연령 항목 자동 체크
    const draft: Record<string, any> = { writeDate: TODAY, fallMode: mode };
    if (sel) {
      const dob = new Date(getRealDob(sel).replace(/\./g, '-'));
      const ref = new Date(TODAY);
      let age = ref.getFullYear() - dob.getFullYear();
      const m = ref.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) age--;

      if (mode === 'huhn') {
        // f1: 0=없음, 1=60-69, 2=70-79, 3=≥80
        draft.f1 = age >= 80 ? 3 : age >= 70 ? 2 : age >= 60 ? 1 : 0;
      } else {
        // bf1: 0=60세 미만, 1=60~69, 2=70~79, 3=80세 이상
        draft.bf1 = age >= 80 ? 3 : age >= 70 ? 2 : age >= 60 ? 1 : 0;
      }
    }

    setFormDraft(draft);
    setAuthor('김지원');
    setIsDirty(false);
  };

  const startNewCarePlan = () => {
    setShowCpTypeSelect(false);
    setSelectedEntryId(null);
    setIsNewEntry(true);
    setAuthor('김지원');
    setIsDirty(false);
    // Build formDraft: only include selected types + their selected categories
    const draft: Record<string, any> = { writeDate: TODAY, cp_planTypes: cpTypeChecks, cp_catChecks: cpCatChecks };
    for (const typeKey of cpTypeChecks) {
      const pt = CP_PLAN_TYPES.find(p => p.key === typeKey);
      if (!pt) continue;
      const selectedCats = cpCatChecks[typeKey] || [];
      for (const cat of pt.categories) {
        if (!selectedCats.includes(cat.key)) continue;
        const prefix = `cp_${typeKey}_${cat.key}`;
        draft[`${prefix}_goal`] = cat.defaultGoal;
        draft[`${prefix}_time`] = cat.defaultTime;
        draft[`${prefix}_items`] = cat.items.map(it => ({...it}));
      }
    }
    setFormDraft(draft);
  };

  const setF = (k: string, v: any) => {
    setFormDraft(prev => ({ ...prev, [k]: v }));
    setIsDirty(true);
  };

  // 저장
  const saveForm = () => {
    if (!selectedId) return;
    const entryDate = String(formDraft.writeDate || TODAY);
    const newEntry: DocEntry = {
      id:     isNewEntry ? `${selectedId}_${activeTab}_${Date.now()}` : selectedEntryId!,
      date:   entryDate,
      author,
      data:   { ...formDraft },
    };
    setDocStore(prev => {
      const arr = [...(prev[selectedId][activeTab] || [])];
      if (isNewEntry) {
        arr.unshift(newEntry);
      } else {
        const idx = arr.findIndex(e => e.id === newEntry.id);
        if (idx >= 0) arr[idx] = newEntry; else arr.unshift(newEntry);
      }
      arr.sort((a, b) => b.date.localeCompare(a.date));
      return { ...prev, [selectedId]: { ...prev[selectedId], [activeTab]: arr } };
    });
    setSelectedEntryId(newEntry.id);
    setIsNewEntry(false);
    setIsDirty(false);
  };

  const deleteEntry = (entryId: string) => {
    if (!selectedId) return;
    if (!window.confirm('이 문서를 삭제하시겠습니까?')) return;
    setDocStore(prev => {
      const arr = (prev[selectedId][activeTab] || []).filter(e => e.id !== entryId);
      return { ...prev, [selectedId]: { ...prev[selectedId], [activeTab]: arr } };
    });
    if (!isNewEntry && selectedEntryId === entryId) {
      const remaining = (docStore[selectedId]?.[activeTab] || []).filter(e => e.id !== entryId);
      if (remaining.length > 0) {
        selectEntry(remaining[0]);
      } else {
        setSelectedEntryId(null);
        setIsNewEntry(false);
        setFormDraft({ writeDate: TODAY });
        setIsDirty(false);
      }
    }
  };

  const curGroupObj = CP_GROUPS.find(g => g.id === selectedGroup) ?? CP_GROUPS[0];
  const filteredRecips = recipients.filter(r =>
    (statusFilter === 'all' || r.status === 'active') &&
    (search === '' || r.name.includes(search)) &&
    (gradeFilter === 'all' || getGradeText(r) === gradeFilter) &&
    (serviceFilter === 'all' || getServiceTypes(r).includes(serviceFilter as any))
  ).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  const sel   = selectedId ? recipients.find(r => r.id === selectedId) : null;
  const sDocs = selectedId ? docStore[selectedId] : null;

  // 현재 탭의 항목 배열
  const activeEntries: DocEntry[] = sDocs ? sDocs[activeTab] : [];
  // 현재 편집 중인 항목
  const curEntry = isNewEntry ? null : activeEntries.find(e => e.id === selectedEntryId) ?? null;

  const f    = (k: string, def: string | number = '') => formDraft[k] ?? def;
  const fNum = (k: string, max: number) => { const v = Number(formDraft[k]); return isNaN(v) ? 0 : Math.min(v, max); };

  // ── ENTRY HISTORY BAR ────────────────────────────────────
  function renderEntryBar() {
    const doc = DOCS.find(d => d.key === activeTab)!;
    return (
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:'9px 12px', display:'flex', alignItems:'center', gap:10 }}>
        {/* 라벨 */}
        <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
          <History size={13} color="#64748b"/>
          <span style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>{activeTab === 'longTerm' ? '발급 기록' : '작성 기록'}</span>
          <span style={{ fontSize:10, color:'#94a3b8' }}>({activeEntries.length}건)</span>
        </div>

        <div style={{ width:1, height:20, background:'#e2e8f0', flexShrink:0 }}/>

        {/* 작성일 칩 목록 */}
        <div style={{ flex:1, display:'flex', gap:6, overflowX:'auto', paddingBottom:1 }}>
          {activeEntries.length === 0 && (
            <span style={{ fontSize:11, color:'#94a3b8', fontStyle:'italic' }}>작성된 기록이 없습니다</span>
          )}
          {activeEntries.map((entry, idx) => {
            const isSel = !isNewEntry && selectedEntryId === entry.id;
            return (
              <button key={entry.id} onClick={() => selectEntry(entry)} style={{
                flexShrink:0, display:'flex', alignItems:'center', gap:4,
                padding:'3px 10px', borderRadius:14,
                fontSize:11, fontWeight: isSel ? 700 : 400,
                background: isSel ? doc.col : '#f1f5f9',
                color:      isSel ? '#fff'  : '#475569',
                border:     isSel ? `1.5px solid ${doc.col}` : '1.5px solid #e2e8f0',
                cursor:'pointer', transition:'background 0.12s',
              }}>
                {idx === 0 && (
                  <span style={{ fontSize:8, background: isSel ? 'rgba(255,255,255,0.3)' : '#e2e8f0', color: isSel ? '#fff' : '#64748b', borderRadius:4, padding:'1px 4px', fontWeight:700 }}>최신</span>
                )}
                {entry.date}
                {activeTab === 'fall' && entry.data?.fallMode && (
                  <span style={{ fontSize:9, fontWeight:600, color: isSel ? 'rgba(255,255,255,0.85)' : '#f97316' }}>
                    {entry.data.fallMode === 'bobath' ? '보바스' : 'Huhn'}
                  </span>
                )}
                {activeTab === 'carePlan' && entry.data?.cpd_svcType && (
                  <span style={{ fontSize:9, fontWeight:600, color: isSel ? 'rgba(255,255,255,0.85)' : '#10b981' }}>
                    {({'방문요양':'요양','방문목욕':'목욕','방문간호':'간호','주간보호':'주간'} as Record<string,string>)[entry.data.cpd_svcType] ?? entry.data.cpd_svcType}
                  </span>
                )}
                {activeTab !== 'longTerm' && (
                  <span style={{ fontSize:9, color: isSel ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}>{entry.author}</span>
                )}
              </button>
            );
          })}
          {isNewEntry && (
            <div style={{
              flexShrink:0, display:'flex', alignItems:'center', gap:4,
              padding:'3px 10px', borderRadius:14,
              fontSize:11, fontWeight:700,
              background: doc.col, color:'#fff',
              border:`1.5px solid ${doc.col}`,
            }}>
              <Plus size={10}/>
              {activeTab === 'longTerm' ? '신규 발급 중' : '신규 작성 중'}
              {activeTab === 'fall' && formDraft.fallMode && (
                <span style={{ fontSize:9, opacity:0.85 }}>{formDraft.fallMode === 'bobath' ? '(보바스)' : '(Huhn)'}</span>
              )}
            </div>
          )}
        </div>

        {/* 신규작성 버튼 */}
        <button onClick={startNew} style={{
          flexShrink:0, display:'flex', alignItems:'center', gap:5,
          padding:'5px 12px', borderRadius:6, fontSize:11, fontWeight:700,
          background:'#2563eb', color:'#fff', border:'none', cursor:'pointer',
        }}>
          <Plus size={12}/> {activeTab === 'longTerm' ? '신규발급' : '신규작성'}
        </button>
      </div>
    );
  }

  // ── DOC HEADER ───────────────────────────────────────────
  function renderDocHeader() {
    const doc      = DOCS.find(d => d.key === activeTab)!;
    const latestDate = activeEntries[0]?.date ?? null;
    const prog     = calcProg(latestDate, doc.cycDays);
    return (
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:'11px 16px', display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:`${doc.col}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <FileText size={19} color={doc.col}/>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{doc.label}</div>
          <div style={{ fontSize:11, color:'#64748b', marginTop:1 }}>
            {activeTab !== 'longTerm' && <>갱신 주기: <b>{doc.cycLabel}</b></>}
            {latestDate && <span>{activeTab !== 'longTerm' ? ' · ' : ''}최근 {activeTab === 'longTerm' ? '발급' : '작성'}: <b>{latestDate}</b></span>}
            {!latestDate && <span style={{ color:'#dc2626' }}> · {activeTab === 'longTerm' ? '미발급' : '미작성'}</span>}
          </div>
        </div>
        {/* 경과율 — 장기이용계획은 갱신주기 없으므로 숨김 */}
        {activeTab !== 'longTerm' && (
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div>
            <div style={{ fontSize:10, color:'#94a3b8', marginBottom:3 }}>최신 기준 경과율</div>
            <div style={{ width:90, height:6, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
              <div style={{ width:`${prog.pct}%`, height:'100%', background:prog.bar, borderRadius:3 }}/>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:13, fontWeight:700, color:prog.txt }}>{latestDate ? `${prog.pct}%` : '—'}</div>
            {prog.badge && <div style={{ fontSize:10, color:prog.txt, fontWeight:700 }}>{prog.badge}</div>}
          </div>
        </div>
        )}
        {/* 총 건수 */}
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:10, color:'#94a3b8', marginBottom:3 }}>{activeTab === 'longTerm' ? '총 발급건수' : '총 작성건수'}</div>
          <div style={{ fontSize:18, fontWeight:700, color: doc.col }}>{activeEntries.length}<span style={{ fontSize:11, color:'#94a3b8', marginLeft:2 }}>건</span></div>
        </div>
      </div>
    );
  }

  // ── FORM RENDERERS ───────────────────────────────────────
  const TAB_LABELS: Record<string,string> = { longTerm:'장기이용계획서', needs:'욕구사정표', fall:'낙상위험 측정 문서', pressure:'욕창위험 측정 문서', cognitive:'인지선별검사 문서', carePlan:'급여제공계획서' };
  function renderEmptyGuard(tabKey: string): React.ReactNode | null {
    if (!selectedEntryId && !isNewEntry) {
      const entries = selectedId ? docStore[selectedId]?.[tabKey as keyof typeof docStore[string]] ?? [] : [];
      if (entries.length === 0) {
        return (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#94a3b8', gap:12, padding:'60px 0' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            <span style={{ fontSize:13, fontWeight:600 }}>작성된 {TAB_LABELS[tabKey] || '문서'}가 없습니다.</span>
            <span style={{ fontSize:11 }}>[{activeTab === 'longTerm' ? '신규발급' : '신규작성'}] 버튼을 눌러 {activeTab === 'longTerm' ? '발급 내역을 등록' : '새 문서를 작성'}하세요.</span>
          </div>
        );
      }
    }
    return null;
  }

  function renderLongTerm() {
    const _empty = renderEmptyGuard('longTerm'); if (_empty) return _empty;
    // 팝업 행 정의 — 이미지 기준 12행
    const COST_ROWS = [
      { k:'cr0',  label:'방문요양', grp:'visit_care',    defOn:true,  defPer:'주', defCnt:4, durOpts:['방문당 240분이상','방문당 210분이상','방문당 180분이상','방문당 150분이상','방문당 120분이상','방문당 90분이상','방문당 60분이상'], defDur:'방문당 180분이상', defCost:885600, defCopay:0 },
      { k:'cr1',  label:'방문요양', grp:'visit_care',    defOn:false, defPer:'주', defCnt:0, durOpts:['방문당 240분이상','방문당 210분이상','방문당 180분이상','방문당 150분이상','방문당 120분이상','방문당 90분이상','방문당 60분이상'], defDur:'', defCost:0, defCopay:0 },
      { k:'cr2',  label:'방문요양', grp:'visit_care',    defOn:false, defPer:'주', defCnt:0, durOpts:['방문당 240분이상','방문당 210분이상','방문당 180분이상','방문당 150분이상','방문당 120분이상','방문당 90분이상','방문당 60분이상'], defDur:'', defCost:0, defCopay:0 },
      { k:'cr3',  label:'방문목욕', grp:'visit_bath',    defOn:true,  defPer:'월', defCnt:1, durOpts:['차량(가정)60분이상','차량(가정)40분이상','차량미이용60분이상','차량미이용40분이상'], defDur:'차량미이용40분이상', defCost:38950, defCopay:0 },
      { k:'cr4',  label:'방문목욕', grp:'visit_bath',    defOn:false, defPer:'주', defCnt:0, durOpts:['차량(가정)60분이상','차량(가정)40분이상','차량미이용60분이상','차량미이용40분이상'], defDur:'', defCost:0, defCopay:0 },
      { k:'cr5',  label:'방문간호', grp:'visit_nursing', defOn:true,  defPer:'월', defCnt:1, durOpts:['15분이상 30분미만','30분이상 60분미만','60분이상'], defDur:'60분이상', defCost:62930, defCopay:0 },
      { k:'cr6',  label:'방문간호', grp:'visit_nursing', defOn:false, defPer:'월', defCnt:0, durOpts:['15분이상 30분미만','30분이상 60분미만','60분이상'], defDur:'', defCost:0, defCopay:0 },
      { k:'cr7',  label:'주야간보호', grp:'day_care',      defOn:true,  defPer:'주', defCnt:1, durOpts:['3시간이상','6시간이상','8시간이상','10시간이상','13시간초과'], defDur:'13시간초과', defCost:267720, defCopay:0 },
      { k:'cr8',  label:'주야간보호', grp:'day_care',      defOn:false, defPer:'월', defCnt:0, durOpts:['3시간이상','6시간이상','8시간이상','10시간이상','13시간초과'], defDur:'', defCost:0, defCopay:0 },
      { k:'cr9',  label:'공동생활', grp:'community',     defOn:false, defPer:'월', defCnt:0, durOpts:['공동생활가정'], defDur:'공동생활가정', defCost:0, defCopay:0, fixedDur:true },
      { k:'cr10', label:'시설입소', grp:'facility',      defOn:false, defPer:'월', defCnt:0, durOpts:['노인요양시설'], defDur:'노인요양시설', defCost:0, defCopay:0, fixedDur:true },
    ];

    // 합계 계산 (체크된 행만)
    const checkedRows = COST_ROWS.filter(r => !!f(`${r.k}_on`, r.defOn ? 1 : 0));
    const totalCost  = checkedRows.reduce((s,r) => s + Number(String(f(`${r.k}_cost`, r.defCost)).replace(/,/g,'')), 0);

    // ── 필요영역 동적 구조 ─────────────────────────────────────────────────
    type NeedItem = { desire: string; goal: string; content: string };
    type NeedArea = { k: string; label: string; items: NeedItem[] };

    const DEFAULT_NEED_AREAS: NeedArea[] = [
      { k:'na_body', label:'신체활동지원', items:[
        { desire:'개인위생관리', goal:'청결상태유지를 통한 자존감 향상', content:'옷갈아입기 지시 및 지켜보기 도움, 세면도움, 양치질도움, 몸씻기 도움, 머리감기 도움, 손발톱깎기' },
        { desire:'배뇨관리',     goal:'규칙적 배뇨 활동유도',            content:'배뇨문제 관리' },
        { desire:'약챙겨먹기',   goal:'정확한 복약으로 증상 완화',       content:'정확한 복약도움(시간, 용량, 용법 등)' },
      ]},
      { k:'na_cognitive', label:'인지활동지원', items:[
        { desire:'인지지원', goal:'인지기능 향상', content:'인지기능악화 예방활동(인지활동형 프로그램 이외)' },
      ]},
      { k:'na_daily', label:'일상생활지원,환경관리', items:[
        { desire:'일상생활수행', goal:'지원을 통한 일상생활 수행', content:'세탁' },
      ]},
      { k:'na_personal', label:'개인활동지원', items:[
        { desire:'개인활동수행', goal:'사회생활 수행능력 향상하기', content:'병원동행' },
      ]},
      { k:'na_bath', label:'전문목욕', items:[
        { desire:'전문목욕하기', goal:'청결상태 유지를 통한 건강 증진', content:'목욕을 위한 이동 도움' },
      ]},
      { k:'na_health', label:'건강관리', items:[
        { desire:'약물관리',     goal:'약물복용에 대한 이해도 증진', content:'투약관리 지도' },
        { desire:'기초건강관리', goal:'건강상태 유지 및 질병 예방', content:'건강상태 관찰 및 측정, 건강교육 및 상담, 감염간호, 의사진료지원, 치매간호, 의료기관의뢰' },
      ]},
      { k:'na_nursing', label:'간호처치', items:[
        { desire:'구강간호', goal:'청결한 구강상태 유지 및 구취제거', content:'구강간호' },
      ]},
      { k:'na_rehab', label:'기능회복훈련', items:[
        { desire:'기능회복훈련', goal:'신경,근골격계 후유장애 회복 및 보완 잔존기능의 유지 및 악화예방', content:'신체 인지기능 향상프로그램, 신체기능의 훈련, 기본동작 훈련, 일상생활동작 훈련, 인지기능프로그램, 여가·정서 프로그램, 사회적응훈련, 가족대상 프로그램, 물리치료, 작업치료' },
      ]},
      { k:'na_emergency', label:'응급지원', items:[
        { desire:'응급상황관리', goal:'응급상황시 적절한 대처를 통한 합병증 및 2차손상예방', content:'응급서비스' },
      ]},
      { k:'na_env', label:'생활 및 환경관리', items:[
        { desire:'송영관리',     goal:'안전한 송영관리',               content:'송영서비스' },
        { desire:'생활환경관리', goal:'청결하고 위생적인 생활환경 관리', content:'침구린넨 교환 및 정리, 환경관리, 물품관리, 세탁물관리' },
      ]},
    ];

    const rawNA = f('lt_needAreas', '');
    const needAreas: NeedArea[] = rawNA ? JSON.parse(String(rawNA)) : DEFAULT_NEED_AREAS;

    const saveNA = (next: NeedArea[]) => { setF('lt_needAreas', JSON.stringify(next)); setIsDirty(true); };
    const addArea    = () => saveNA([...needAreas, { k:`na_custom_${Date.now()}`, label:'새 필요영역', items:[{ desire:'', goal:'', content:'' }] }]);
    const delArea    = (ai: number) => { if (!window.confirm('이 필요영역을 삭제하시겠습니까?')) return; saveNA(needAreas.filter((_,i)=>i!==ai)); };
    const addItem    = (ai: number) => saveNA(needAreas.map((a,i)=>i===ai?{...a,items:[...a.items,{desire:'',goal:'',content:''}]}:a));
    const delItem    = (ai: number, ii: number) => { if (needAreas[ai].items.length<=1){window.alert('마지막 항목은 삭제할 수 없습니다.');return;} saveNA(needAreas.map((a,i)=>i===ai?{...a,items:a.items.filter((_,j)=>j!==ii)}:a)); };
    const updLabel   = (ai: number, v: string) => saveNA(needAreas.map((a,i)=>i===ai?{...a,label:v}:a));
    const updItem    = (ai: number, ii: number, field: keyof NeedItem, v: string) => saveNA(needAreas.map((a,i)=>i===ai?{...a,items:a.items.map((it,j)=>j===ii?{...it,[field]:v}:it)}:a));

    // needAreas는 위에서 동적으로 선언됨 (lt_needAreas JSON 키 기반)

    const cb = '1px solid #d1d5db';
    const hBg = '#f3f4f6';
    const cp = '6px 10px';
    const lS: React.CSSProperties = { fontSize:12, color:'#1e293b', padding:cp, borderRight:cb, borderBottom:cb, background:hBg, fontWeight:600, verticalAlign:'middle' };
    const vS: React.CSSProperties = { fontSize:12, color:'#1e293b', padding:cp, borderRight:cb, borderBottom:cb, verticalAlign:'middle' };
    const vE: React.CSSProperties = { ...vS, borderRight:'1px solid #d1d5db' };
    const iS: React.CSSProperties = { fontSize:13, border:'1px solid #d1d5db', background:'#f9fbff', color:'#1e293b', width:'100%', outline:'none', padding:'3px 6px', borderRadius:3 };
    const tS: React.CSSProperties = { fontSize:13, border:'1px solid #d1d5db', background:'#f9fbff', color:'#1e293b', width:'100%', outline:'none', resize:'vertical', padding:'4px 6px', lineHeight:1.6, borderRadius:3 };

    return (
      <div style={{ background:'#fff', border:'1px solid #d1d5db', borderRadius:4, overflow:'hidden', boxSizing:'border-box' }}>
        {/* 장기요양인정번호 */}
        <div style={{ display:'flex', alignItems:'center', padding:'8px 12px', borderBottom:cb, gap:6 }}>
          <span style={{ fontSize:12, fontWeight:700, color:'#1e293b' }}>장기요양인정번호 :</span>
          <span style={{ fontSize:12, fontWeight:600, color:'#374151', padding:'3px 8px', border:'1px solid #d1d5db', borderRadius:3, background:'#f9fbff' }}>L</span>
          <span style={{ color:'#6b7280' }}>-</span>
          <input value={String(f('lt_regNum1','0010213700'))} onChange={e=>setF('lt_regNum1',e.target.value.replace(/\D/g,''))} inputMode="numeric" style={{ ...iS, width:120, textAlign:'center' }}/>
          <span style={{ color:'#6b7280' }}>-</span>
          <input value={String(f('lt_regNum2','101'))} onChange={e=>setF('lt_regNum2',e.target.value.replace(/\D/g,''))} inputMode="numeric" style={{ ...iS, width:50, textAlign:'center' }}/>
        </div>

        {/* 기본정보 */}
        <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}><tbody>
          <tr>
            <td style={{ ...lS, width:'16%' }}>성명</td>
            <td style={{ ...vS, width:'34%' }}><input value={String(f('lt_name', sel?.name??''))} onChange={e=>setF('lt_name',e.target.value)} style={iS}/></td>
            <td style={{ ...lS, width:'16%' }}>생년월일</td>
            <td style={{ ...vE, width:'34%' }}><input value={String(f('lt_birthDate', sel?.legalDob??'1930-07-18'))} onChange={e=>{ const d=e.target.value.replace(/\D/g,'').slice(0,8); setF('lt_birthDate', d.length>6?d.slice(0,4)+'-'+d.slice(4,6)+'-'+d.slice(6):d.length>4?d.slice(0,4)+'-'+d.slice(4):d); }} placeholder="YYYY-MM-DD" maxLength={10} style={iS}/></td>
          </tr>
          <tr>
            <td style={lS}>장기요양등급</td>
            <td style={vS}>
              <select value={String(f('lt_grade', sel? getGradeNum(sel) : 2))} onChange={e=>setF('lt_grade',e.target.value)} style={{ ...iS, width:110 }}>
                {['1','2','3','4','5'].map(g=><option key={g} value={g}>{g}등급</option>)}
                <option value="인지지원">인지지원등급</option>
              </select>
            </td>
            <td style={lS}>발급일</td>
            <td style={vE}><input type="date" value={String(f('lt_issueDate', sel? getValidFrom(sel) : '2026-01-23'))} onChange={e=>setF('lt_issueDate',e.target.value)} style={{ ...iS, width:'100%', maxWidth:150 }}/></td>
          </tr>
          <tr>
            <td style={lS}>재가급여<br/>(월한도액)</td>
            <td style={vS}>
              <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' }}>
                <span style={{ fontSize:12, color:'#6b7280', whiteSpace:'nowrap' }}>1월당</span>
                <input value={String(f('lt_monthlyLimit', sel?.monthlyLimit? sel.monthlyLimit.toLocaleString():'1,370,600'))} onChange={e=>{ const n=e.target.value.replace(/[^\d]/g,''); setF('lt_monthlyLimit', n?Number(n).toLocaleString():''); }} inputMode="numeric" style={{ ...iS, width:100, textAlign:'right' }}/>
                <span style={{ fontSize:12, color:'#6b7280' }}>원</span>
              </div>
            </td>
            <td style={lS}>장기요양인정유효기간</td>
            <td style={vE}>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <input type="date" value={String(f('lt_validStart', sel? getValidFrom(sel) : '2026-01-23'))} onChange={e=>setF('lt_validStart',e.target.value)} style={{ ...iS, flex:1, minWidth:0 }}/>
                <span style={{ color:'#6b7280', flexShrink:0 }}>~</span>
                <input type="date" value={String(f('lt_validEnd', sel? getValidTo(sel) : '2028-01-22'))} onChange={e=>setF('lt_validEnd',e.target.value)} style={{ ...iS, flex:1, minWidth:0 }}/>
              </div>
            </td>
          </tr>
          <tr>
            <td style={lS} rowSpan={3}>노인요양시설</td>
            <td style={vS}>
              <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' }}>
                <span style={{ fontSize:12, color:'#6b7280' }}>일반</span><span style={{ fontSize:12, color:'#6b7280' }}>1일당</span>
                <input value={String(f('lt_fac_normal','0'))} onChange={e=>{ const n=e.target.value.replace(/[^\d]/g,''); setF('lt_fac_normal',n?Number(n).toLocaleString():'0'); }} inputMode="numeric" style={{ ...iS, width:70, textAlign:'right' }}/><span style={{ fontSize:12, color:'#6b7280' }}>원</span>
              </div>
            </td>
            <td style={lS} rowSpan={3}>노인요양공동생활<br/>가정</td>
            <td style={vE}>
              <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' }}>
                <span style={{ fontSize:12, color:'#6b7280' }}>일반</span><span style={{ fontSize:12, color:'#6b7280' }}>1일당</span>
                <input value={String(f('lt_com_normal','0'))} onChange={e=>{ const n=e.target.value.replace(/[^\d]/g,''); setF('lt_com_normal',n?Number(n).toLocaleString():'0'); }} inputMode="numeric" style={{ ...iS, width:70, textAlign:'right' }}/><span style={{ fontSize:12, color:'#6b7280' }}>원</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style={vS}>
              <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' }}>
                <span style={{ fontSize:12, color:'#6b7280' }}>치매전담가형</span><span style={{ fontSize:12, color:'#6b7280' }}>1일당</span>
                <input value={String(f('lt_fac_demA','0'))} onChange={e=>{ const n=e.target.value.replace(/[^\d]/g,''); setF('lt_fac_demA',n?Number(n).toLocaleString():'0'); }} inputMode="numeric" style={{ ...iS, width:70, textAlign:'right' }}/><span style={{ fontSize:12, color:'#6b7280' }}>원</span>
              </div>
            </td>
            <td style={vE}>
              <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' }}>
                <span style={{ fontSize:12, color:'#6b7280' }}>치매전담형</span><span style={{ fontSize:12, color:'#6b7280' }}>1일당</span>
                <input value={String(f('lt_com_dem','0'))} onChange={e=>{ const n=e.target.value.replace(/[^\d]/g,''); setF('lt_com_dem',n?Number(n).toLocaleString():'0'); }} inputMode="numeric" style={{ ...iS, width:70, textAlign:'right' }}/><span style={{ fontSize:12, color:'#6b7280' }}>원</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style={vS}>
              <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' }}>
                <span style={{ fontSize:12, color:'#6b7280' }}>치매전담나형</span><span style={{ fontSize:12, color:'#6b7280' }}>1일당</span>
                <input value={String(f('lt_fac_demB','0'))} onChange={e=>{ const n=e.target.value.replace(/[^\d]/g,''); setF('lt_fac_demB',n?Number(n).toLocaleString():'0'); }} inputMode="numeric" style={{ ...iS, width:70, textAlign:'right' }}/><span style={{ fontSize:12, color:'#6b7280' }}>원</span>
              </div>
            </td>
            <td style={vE} />
          </tr>
        </tbody></table>

        {/* 장기요양필요영역 > 욕구 / 목표 / 필요내용 (동적 추가/삭제) */}
        <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
          <colgroup>
            <col style={{ width:'14%' }} /><col style={{ width:'16%' }} /><col style={{ width:'26%' }} /><col /><col style={{ width:28 }} />
          </colgroup>
          <thead><tr>
            <th style={{ ...lS, textAlign:'center', fontSize:12 }}>장기요양필요영역</th>
            <th style={{ ...lS, textAlign:'center', fontSize:12 }}>장기요양욕구</th>
            <th style={{ ...lS, textAlign:'center', fontSize:12 }}>장기요양목표</th>
            <th style={{ ...lS, textAlign:'center', fontSize:12 }}>장기요양필요내용</th>
            <th style={{ ...lS, textAlign:'center', fontSize:11, borderRight:'none', padding:'4px 2px' }}></th>
          </tr></thead>
          <tbody>
            {needAreas.map((area, ai) => (
              area.items.map((it, ii) => (
                <tr key={`${area.k}_${ii}`}>
                  {/* 필요영역 셀 — 첫 항목에만 rowspan으로 표시, 편집+삭제 버튼 포함 */}
                  {ii === 0 && (
                    <td rowSpan={area.items.length} style={{ ...lS, textAlign:'center', fontWeight:500, fontSize:12, verticalAlign:'top', padding:'6px 4px' }}>
                      <AutoTA minRows={1}
                        value={area.label}
                        onChange={e => updLabel(ai, e.target.value)}
                        style={{ ...tS, textAlign:'center', marginBottom:4 }}
                      />
                      <div style={{ marginTop:4 }}>
                        <button onClick={() => addItem(ai)}
                          style={{ fontSize:10, fontWeight:700, border:'1px solid #86efac', borderRadius:3, padding:'2px 6px', cursor:'pointer', background:'#f0fdf4', color:'#166534', whiteSpace:'nowrap' }}>+ 욕구 추가</button>
                      </div>
                    </td>
                  )}
                  {/* 욕구 */}
                  <td style={{ ...vS, padding:'4px 5px', verticalAlign:'middle' }}>
                    <AutoTA minRows={2} value={it.desire} onChange={e => updItem(ai, ii, 'desire', e.target.value)} style={{ ...tS, textAlign:'center' }}/>
                  </td>
                  {/* 목표 */}
                  <td style={{ ...vS, padding:'4px 5px', verticalAlign:'middle' }}>
                    <AutoTA minRows={2} value={it.goal} onChange={e => updItem(ai, ii, 'goal', e.target.value)} style={tS}/>
                  </td>
                  {/* 필요내용 */}
                  <td style={{ ...vS, padding:'4px 5px', verticalAlign:'middle' }}>
                    <AutoTA minRows={2} value={it.content} onChange={e => updItem(ai, ii, 'content', e.target.value)} style={tS}/>
                  </td>
                  {/* 욕구 행 삭제 버튼 */}
                  <td style={{ ...vS, borderRight:'none', textAlign:'center', padding:'4px 2px', verticalAlign:'middle' }}>
                    <button onClick={() => delItem(ai, ii)} title="이 욕구 삭제"
                      style={{ width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:4, border:'1px solid #fca5a5', background:'#fff1f2', color:'#dc2626', cursor:'pointer', fontSize:13, lineHeight:1, padding:0 }}>×</button>
                  </td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
        {/* 필요영역 추가 버튼 */}
        <div style={{ padding:'6px 10px', borderTop:cb }}>
          <button onClick={addArea} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, padding:'5px 14px', borderRadius:5, border:'1px solid #2563eb', background:'#eff6ff', color:'#1d4ed8', cursor:'pointer' }}>
            + 필요영역 추가
          </button>
        </div>

        {/* 수급자 희망급여 */}
        <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}><tbody>
          <tr>
            <td style={{ ...lS, width:'22%', textAlign:'center' }}>수급자 희망급여</td>
            <td style={{ ...vS, borderRight:'none', padding:'6px 10px' }}>
              <AutoTA minRows={2} value={String(f('lt_desiredSvc','방문요양, 방문목욕, 방문간호, 주야간보호'))} onChange={e=>setF('lt_desiredSvc',e.target.value)} style={tS}/>
            </td>
          </tr>
        </tbody></table>

        {/* 유의사항 */}
        <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}><tbody>
          <tr>
            <td style={{ ...lS, width:'22%', textAlign:'center' }}>
              유의사항
            </td>
            <td style={{ ...vS, borderRight:'none', padding:'6px 10px' }}>
              <AutoTA minRows={3} value={String(f('lt_cautions','■ 장기요양급여 이용 시 자존감 보호를 위한 충분한 배려가 필요합니다\n■ 우울감, 무기력감, 고립감을 해소하고 안정감을 유지할 수 있도록 적극적인 정서적 지원이 필요합니다\n■ 사회적 지지체계가 부족하므로 지속적 관심과 지역자원연계가 필요합니다'))} onChange={e=>setF('lt_cautions',e.target.value)} style={tS}/>
            </td>
          </tr>
        </tbody></table>

        {/* 장기요양 이용계획 및 비용 — 요약 + 팝업 열기 */}
        <div style={{ borderTop:cb }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderBottom:cb, background:hBg, gap:8 }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#1e293b' }}>장기요양 이용계획 및 비용</span>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:12, color:'#6b7280' }}>급여비용 기준일</span>
              <input type="date" value={String(f('lt_costBaseDate','2025-09-22'))} onChange={e=>setF('lt_costBaseDate',e.target.value)} style={{ ...iS, width:130 }}/>
              <button onClick={()=>setShowCostPopup(true)} style={{ fontSize:12, fontWeight:700, color:'#fff', background:'#2563eb', border:'none', borderRadius:4, padding:'4px 12px', cursor:'pointer' }}>입력</button>
            </div>
          </div>
          {/* 요약 테이블 (읽기 전용) */}
          <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
            <thead><tr>
              <th style={{ ...lS, width:'16%', textAlign:'center' }}>급여종류</th>
              <th style={{ ...lS, textAlign:'center' }}>횟 수</th>
              <th style={{ ...lS, width:'24%', textAlign:'center', borderRight:'none' }}>장기요양급여비용</th>
            </tr></thead>
            <tbody>
              {COST_ROWS.filter(r => !!f(`${r.k}_on`, r.defOn ? 1 : 0)).map(row => {
                const per = String(f(`${row.k}_per`, row.defPer));
                const cnt = String(f(`${row.k}_cnt`, row.defCnt));
                const dur = String(f(`${row.k}_dur`, row.defDur));
                const cost = Number(String(f(`${row.k}_cost`, row.defCost)).replace(/,/g,''));
                return (
                  <tr key={row.k}>
                    <td style={{ fontSize:13, color:'#1e293b', padding:'6px 10px', borderRight:'1px solid #d1d5db', borderBottom:'1px solid #d1d5db', verticalAlign:'middle', textAlign:'left', fontWeight:500 }}>{row.label}</td>
                    <td style={{ fontSize:13, color:'#1e293b', padding:'6px 10px', borderRight:'1px solid #d1d5db', borderBottom:'1px solid #d1d5db', verticalAlign:'middle', textAlign:'left' }}>{per} {cnt} 회({dur})</td>
                    <td style={{ fontSize:13, color:'#1e293b', padding:'4px 10px', borderBottom:'1px solid #d1d5db', verticalAlign:'middle', textAlign:'right' }}>{cost.toLocaleString()} 원</td>
                  </tr>
                );
              })}
              {checkedRows.length === 0 && (
                <tr><td colSpan={3} style={{ fontSize:12, color:'#94a3b8', padding:'12px', borderBottom:'1px solid #d1d5db', verticalAlign:'middle', textAlign:'center', fontStyle:'italic' }}>선택된 급여가 없습니다. [입력] 버튼을 클릭하세요.</td></tr>
              )}
              <tr style={{ background:'#f9fafb' }}>
                <td colSpan={2} style={{ fontSize:13, color:'#1e293b', padding:'6px 10px', borderRight:'1px solid #d1d5db', borderBottom:'1px solid #d1d5db', background:'#f3f4f6', fontWeight:700, textAlign:'center', verticalAlign:'middle' }}>합 계</td>
                <td style={{ fontSize:13, color:'#1e293b', padding:'6px 10px', borderBottom:'1px solid #d1d5db', verticalAlign:'middle', textAlign:'right', fontWeight:700 }}>{totalCost.toLocaleString()} 원</td>
              </tr>
            </tbody>
          </table>

          {/* 복지용구 */}
          <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}><tbody>
            <tr>
              <td style={{ ...lS, width:'16%', textAlign:'center' }}>복지용구</td>
              <td style={{ ...vS, borderRight:'none' }}><input value={String(f('lt_welfareItems','지팡이'))} onChange={e=>setF('lt_welfareItems',e.target.value)} placeholder="예) 지팡이, 수동휠체어 등" style={iS}/></td>
            </tr>
          </tbody></table>
        </div>

        {/* ── 비용 팝업 모달 ── */}
        {showCostPopup && (() => {
          const popBd = '1px solid #c0c0c0';
          const popHd: React.CSSProperties = { background:'#e8e8e8', borderBottom:popBd, padding:'8px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' };
          return (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setShowCostPopup(false)}>
              <div onClick={e=>e.stopPropagation()} style={{ background:'#f5f5f5', border:'2px solid #888', borderRadius:4, width:680, maxHeight:'85vh', overflow:'auto', boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>
                {/* 헤더 */}
                <div style={popHd}>
                  <span style={{ fontSize:12, fontWeight:700, color:'#1e293b' }}>장기요양 이용계획 및 비용</span>
                  <button onClick={()=>setShowCostPopup(false)} style={{ width:22, height:22, background:'#e74c3c', color:'#fff', border:'none', borderRadius:3, cursor:'pointer', fontSize:14, fontWeight:700, lineHeight:1 }}>✕</button>
                </div>
                {/* 행 목록 */}
                <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:4 }}>
                  {COST_ROWS.map(row => {
                    const on   = !!f(`${row.k}_on`, row.defOn ? 1 : 0);
                    const per  = String(f(`${row.k}_per`, row.defPer));
                    const cnt  = Number(f(`${row.k}_cnt`, row.defCnt));
                    const dur  = String(f(`${row.k}_dur`, row.defDur));
                    const cost = String(f(`${row.k}_cost`, row.defCost ? row.defCost.toLocaleString() : '0'));
                    const rdio = (v: string) => ({ width:13, height:13, accentColor:'#2563eb', cursor:'pointer' } as React.CSSProperties);
                    return (
                      <div key={row.k} style={{ display:'flex', alignItems:'center', gap:6, background: on ? '#fff' : '#fafafa', border:popBd, borderRadius:3, padding:'4px 8px' }}>
                        {/* 체크박스 */}
                        <input type="checkbox" checked={on} onChange={e=>{ setF(`${row.k}_on`, e.target.checked?1:0); setIsDirty(true); }} style={{ width:15, height:15, accentColor:'#2563eb', cursor:'pointer', flexShrink:0 }}/>
                        {/* 라벨 */}
                        <span style={{ fontSize:12, fontWeight:600, color:'#1e293b', width:58, flexShrink:0 }}>{row.label}</span>
                        {/* 주/월 라디오 */}
                        <label style={{ display:'flex', alignItems:'center', gap:2, cursor:'pointer' }}>
                          <input type="radio" name={`${row.k}_per`} checked={per==='주'} onChange={()=>setF(`${row.k}_per`,'주')} style={rdio('주')}/><span style={{ fontSize:12 }}>주</span>
                        </label>
                        <label style={{ display:'flex', alignItems:'center', gap:2, cursor:'pointer' }}>
                          <input type="radio" name={`${row.k}_per`} checked={per==='월'} onChange={()=>setF(`${row.k}_per`,'월')} style={rdio('월')}/><span style={{ fontSize:12 }}>월</span>
                        </label>
                        {/* 횟수 */}
                        <input type="number" min={0} value={cnt} onChange={e=>setF(`${row.k}_cnt`,Number(e.target.value))} style={{ width:36, fontSize:13, border:popBd, borderRadius:3, padding:'2px 4px', textAlign:'center', background:'#fff' }}/>
                        <span style={{ fontSize:12, color:'#555' }}>회</span>
                        {/* 시간/유형 드롭다운 */}
                        {'fixedDur' in row && row.fixedDur ? (
                          <span style={{ fontSize:12, color:'#555', width:140, textAlign:'center' }}>{row.durOpts[0]}</span>
                        ) : (
                          <select value={dur} onChange={e=>setF(`${row.k}_dur`,e.target.value)} style={{ fontSize:13, border:popBd, borderRadius:3, padding:'2px 4px', background:'#fff', color:'#1e293b', width:140 }}>
                            <option value="">선택</option>
                            {row.durOpts.filter(Boolean).map(o=><option key={o} value={o}>{o}</option>)}
                          </select>
                        )}
                        <span style={{ color:'#999', fontSize:12 }}>▼</span>
                        {/* 장기요양급여비용 */}
                        <input value={cost} onChange={e=>{ const n=e.target.value.replace(/[^\d]/g,''); setF(`${row.k}_cost`, n ? Number(n).toLocaleString() : '0'); }} inputMode="numeric" style={{ width:100, fontSize:13, border:popBd, borderRadius:3, padding:'2px 4px', textAlign:'right', background:'#fff' }}/>
                        <span style={{ fontSize:12, color:'#555' }}>원</span>
                      </div>
                    );
                  })}
                </div>
                {/* 선택확인 버튼 */}
                <div style={{ display:'flex', justifyContent:'center', padding:'10px 12px', borderTop:popBd }}>
                  <button onClick={()=>setShowCostPopup(false)} style={{ fontSize:12, fontWeight:700, padding:'6px 28px', background:'#fff', border:'2px solid #888', borderRadius:4, cursor:'pointer', color:'#1e293b' }}>선택확인</button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 지사 전화번호 / 지사 담당자명 */}
        <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}><tbody>
          <tr>
            <td style={{ ...lS, width:'22%', textAlign:'center' }}>지사 전화번호</td>
            <td style={vS}><input value={String(f('lt_branchPhone','032-550-6250'))} onChange={e=>setF('lt_branchPhone',e.target.value)} style={iS}/></td>
            <td style={{ ...lS, width:'18%', textAlign:'center' }}>지사 담당자명</td>
            <td style={{ ...vS, borderRight:'none' }}><input value={String(f('lt_branchManager','주의성'))} onChange={e=>setF('lt_branchManager',e.target.value)} style={iS}/></td>
          </tr>
        </tbody></table>

        {/* 이용 가능한 급여종류 안내 */}
        {(() => {
          const AVAIL_ITEMS = [
            { k:'av_cogPgm',       label:'인지활동형 프로그램' },
            { k:'av_familyShort',  label:'장기요양 가족휴가제(단기보호)' },
            { k:'av_familyFull',   label:'장기요양 가족휴가제(종일 방문요양)' },
            { k:'av_dementiaDay',  label:'치매전담형 장기요양기관(주야간 보호)' },
            { k:'av_dementiaFac',  label:'치매전담형 장기요양기관(시설)' },
            { k:'av_familyCare90', label:'방문요양(가족 90분 적용)' },
            { k:'av_nurseHealth',  label:'방문간호(건강관리)' },
            { k:'av_nurseDementia',label:'방문간호(치매관리_60일 한정)' },
          ];
          // 기본값: 모두 X (이용 불가)로 초기화
          return (
            <div style={{ borderTop:cb, padding:'10px 12px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#1e293b', marginBottom:8, textAlign:'center', padding:'4px 0', background:'#f3f4f6', borderRadius:3, border:cb }}>
                【이용 가능한 급여종류 안내】
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:4 }}>
                {AVAIL_ITEMS.map(item => {
                  const avail = !!f(item.k, 0); // 0=X(불가), 1=O(가능)
                  return (
                    <label key={item.k} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 8px', borderRadius:4, border:`1px solid ${avail?'#6ee7b7':'#fca5a5'}`, background:avail?'#f0fdf4':'#fff1f2', cursor:'pointer', userSelect:'none' }}>
                      <input
                        type="checkbox"
                        checked={avail}
                        onChange={e=>{ setF(item.k, e.target.checked?1:0); setIsDirty(true); }}
                        style={{ accentColor:avail?'#059669':'#ef4444', width:14, height:14, flexShrink:0 }}
                      />
                      <span style={{ fontSize:12, color: avail?'#065f46':'#9f1239', fontWeight: avail?600:400 }}>
                        {avail ? '○' : '×'} {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>
              <div style={{ marginTop:6, fontSize:11, color:'#6b7280' }}>※ 체크하면 이용 가능(○), 체크 해제 시 이용 불가(×)</div>
            </div>
          );
        })()}
      </div>
    );
  }

  function renderNeeds() {
    const _empty = renderEmptyGuard('needs'); if (_empty) return _empty;
    return <NeedsAssessmentForm formDraft={formDraft} setF={setF} />;
  }

  function renderFall() {
    const _empty = renderEmptyGuard('fall'); if (_empty) return _empty;
    const mode = String(f('fallMode', 'huhn'));
    const isHuhn = mode === 'huhn';
    const hb = '1px solid #d1d5db';
    const hLbl:React.CSSProperties = { background:'#e8f0fe', padding:'6px 8px', fontSize:12, fontWeight:600, textAlign:'center', border:hb, whiteSpace:'pre-line', verticalAlign:'middle' };
    const hVal:React.CSSProperties = { background:'#fff', padding:'6px 6px', fontSize:12, textAlign:'center', border:hb, whiteSpace:'pre-line', verticalAlign:'middle', lineHeight:1.4 };

    if (isHuhn) {
      const curTotal = HUHN_ITEMS.reduce((s, i) => s + Number(f(i.k, 0)), 0);
      const curRisk = fallRisk(curTotal);
      return (
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#f1f5f9', borderBottom:'1px solid #e2e8f0' }}>
            <span style={{ fontSize:12, color:'#64748b' }}>문서 유형</span>
            <span style={{ fontSize:12, fontWeight:700, padding:'3px 14px', borderRadius:14, background:'#fff7ed', color:'#ea580c', border:'1px solid #fdba7440' }}>
              낙상위험도측정 (Huhn)
            </span>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
            <colgroup>
              <col style={{ width:'12%' }}/>
              <col style={{ width:'20%' }}/>
              <col style={{ width:'20%' }}/>
              <col style={{ width:'20%' }}/>
              <col style={{ width:'20%' }}/>
              <col style={{ width:'8%' }}/>
            </colgroup>
            <thead>
              <tr>
                <td style={{ ...hLbl, background:'#d4e3f7' }}>구분</td>
                <td style={{ ...hLbl, background:'#d4e3f7' }}>4점</td>
                <td style={{ ...hLbl, background:'#d4e3f7' }}>3점</td>
                <td style={{ ...hLbl, background:'#d4e3f7' }}>2점</td>
                <td style={{ ...hLbl, background:'#d4e3f7' }}>1점</td>
                <td style={{ ...hLbl, background:'#d4e3f7' }}>점수</td>
              </tr>
            </thead>
            <tbody>
              {HUHN_ITEMS.map((item) => {
                const cur = Number(f(item.k, 0));
                return (
                  <tr key={item.k}>
                    <td style={hLbl}>{item.label}</td>
                    {item.cols.map((col, ci) => (
                      <td key={ci} style={hVal}>
                        {col.l ? (
                          <label style={{ cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                            <span style={{ fontSize:12 }}>{col.l}</span>
                            <input type="checkbox" checked={cur === col.v && col.v !== 0} onChange={() => setF(item.k, cur === col.v ? 0 : col.v)} style={{ accentColor:'#2563eb' }}/>
                          </label>
                        ) : null}
                      </td>
                    ))}
                    <td style={{ ...hVal, fontWeight:700, fontSize:12, color:'#1e40af' }}>{cur} 점</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Huhn 점수해석 */}
          <div style={{ padding:'10px 14px', borderTop:'1px solid #e2e8f0', background: curRisk.bg, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <div>
              <span style={{ fontSize:12, color:'#64748b', marginRight:8 }}>합산 점수</span>
              <span style={{ fontSize:20, fontWeight:700, color: curRisk.c }}>{curTotal}점</span>
            </div>
            <div style={{ width:1, height:32, background:'#e2e8f0' }}/>
            <span style={{ fontSize:13, fontWeight:700, color: curRisk.c, padding:'3px 14px', background:`${curRisk.c}18`, borderRadius:16, border:`1px solid ${curRisk.c}40` }}>{curRisk.l}</span>
            <div style={{ flex:1 }}/>
            <div style={{ display:'flex', gap:8 }}>
              <span style={{ padding:'2px 10px', borderRadius:12, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', fontSize:11, fontWeight:700 }}>4점 이하: 낙상위험 낮음</span>
              <span style={{ padding:'2px 10px', borderRadius:12, background:'#fff7ed', color:'#ea580c', border:'1px solid #fdba74', fontSize:11, fontWeight:700 }}>5~10점: 낙상위험 높음</span>
              <span style={{ padding:'2px 10px', borderRadius:12, background:'#fef2f2', color:'#dc2626', border:'1px solid #fca5a5', fontSize:11, fontWeight:700 }}>11점 이상: 낙상위험 아주 높음</span>
            </div>
          </div>
          {/* 검사결과에 대한 의견 */}
          <div style={{ padding:'10px 12px', borderTop:'1px solid #e2e8f0' }}>
            <div style={{ marginBottom:6 }}>
              <span style={{ fontSize:12, fontWeight:600, color:'#334155' }}>검사결과에 대한 의견</span>
            </div>
            <textarea rows={5} value={String(f('fallOpinion', ''))} onChange={e => setF('fallOpinion', e.target.value)} placeholder="검사결과에 대한 의견을 작성하세요" style={{ ...SH.ta, fontSize:13, lineHeight:1.6 }}/>
          </div>
        </div>
      );
    }

    /* ── 보바스 모드 ── */
    const curTotal  = BOBATH_GROUPS.reduce((s, i) => s + Number(f(i.k, 0)), 0);
    const curRisk   = bobathRisk(curTotal);
    const bBdr = '1px solid #d1d5db';
    const bHd:React.CSSProperties = { background:'#e8f0fe', padding:'6px 8px', fontSize:12, fontWeight:600, textAlign:'center', border:bBdr, verticalAlign:'middle' };
    const bCell:React.CSSProperties = { background:'#fff', padding:'5px 8px', fontSize:12, border:bBdr, verticalAlign:'middle' };

    return (
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#f1f5f9', borderBottom:'1px solid #e2e8f0' }}>
          <span style={{ fontSize:12, color:'#64748b' }}>문서 유형</span>
          <span style={{ fontSize:12, fontWeight:700, padding:'3px 14px', borderRadius:14, background:'#eff6ff', color:'#2563eb', border:'1px solid #93c5fd40' }}>
            낙상위험도측정 (보바스)
          </span>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <td style={{ ...bHd, background:'#d4e3f7', width:'10%' }}>분류</td>
              <td style={{ ...bHd, background:'#d4e3f7' }}>낙상 위험 요인 사정</td>
              <td style={{ ...bHd, background:'#d4e3f7', width:'8%' }}>점수</td>
              <td style={{ ...bHd, background:'#d4e3f7', width:'7%' }}>확인</td>
            </tr>
          </thead>
          <tbody>
            {BOBATH_GROUPS.map((grp) => {
              const cur = Number(f(grp.k, 0));
              return (
                <React.Fragment key={grp.k}>
                  {grp.desc && (
                    <tr>
                      <td style={bHd} rowSpan={grp.opts.length + 1}>{grp.label}</td>
                      <td colSpan={3} style={{ ...bCell, fontSize:10, color:'#64748b', whiteSpace:'pre-line', background:'#f8fafc' }}>{grp.desc}</td>
                    </tr>
                  )}
                  {grp.opts.map((opt, oi) => (
                    <tr key={opt.v + '_' + oi}>
                      {!grp.desc && oi === 0 && <td style={bHd} rowSpan={grp.opts.length}>{grp.label}</td>}
                      <td style={{ ...bCell, ...(opt.l2 ? { display:'table-cell' } : {}) }}>
                        {opt.l2 ? (
                          <div style={{ display:'flex', gap:16 }}>
                            <span style={{ flex:1 }}>{opt.l}</span>
                            <span style={{ flex:1 }}>{opt.l2}</span>
                          </div>
                        ) : opt.l}
                      </td>
                      <td style={{ ...bCell, textAlign:'center', fontWeight:600 }}>{opt.v}</td>
                      <td style={{ ...bCell, textAlign:'center' }}>
                        <input type="radio" name={grp.k} checked={cur === opt.v} onChange={() => setF(grp.k, opt.v)} style={{ accentColor:'#2563eb' }}/>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {/* 보바스 점수해석 */}
        <div style={{ padding:'10px 14px', borderTop:'1px solid #e2e8f0', background: curRisk.bg, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <div>
            <span style={{ fontSize:12, color:'#64748b', marginRight:8 }}>합산 점수</span>
            <span style={{ fontSize:20, fontWeight:700, color: curRisk.c }}>{curTotal}점</span>
          </div>
          <div style={{ width:1, height:32, background:'#e2e8f0' }}/>
          <span style={{ fontSize:13, fontWeight:700, color: curRisk.c, padding:'3px 14px', background:`${curRisk.c}18`, borderRadius:16, border:`1px solid ${curRisk.c}40` }}>{curRisk.l}</span>
          <div style={{ flex:1 }}/>
          <div style={{ display:'flex', gap:8 }}>
            <span style={{ padding:'2px 10px', borderRadius:12, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', fontSize:11, fontWeight:700 }}>0~9점: 낮은 위험</span>
            <span style={{ padding:'2px 10px', borderRadius:12, background:'#fff7ed', color:'#ea580c', border:'1px solid #fdba74', fontSize:11, fontWeight:700 }}>10~14점: 중등도 위험</span>
            <span style={{ padding:'2px 10px', borderRadius:12, background:'#fef2f2', color:'#dc2626', border:'1px solid #fca5a5', fontSize:11, fontWeight:700 }}>15점 이상: 높은 위험(고위험군)</span>
          </div>
        </div>
        {/* 검사결과에 대한 의견 */}
        <div style={{ padding:'10px 12px', borderTop:'1px solid #e2e8f0' }}>
          <div style={{ marginBottom:6 }}>
            <span style={{ fontSize:12, fontWeight:600, color:'#334155' }}>검사결과에 대한 의견</span>
          </div>
          <textarea rows={5} value={String(f('fallOpinion', ''))} onChange={e => setF('fallOpinion', e.target.value)} placeholder="검사결과에 대한 의견을 작성하세요" style={{ ...SH.ta, fontSize:13, lineHeight:1.6 }}/>
        </div>
      </div>
    );
  }

  function renderPressure() {
    const _empty = renderEmptyGuard('pressure'); if (_empty) return _empty;
    const maxScore = (item: typeof BRADEN_ITEMS[0]) => item.opts[item.opts.length - 1].v;
    const total = BRADEN_ITEMS.reduce((s, i) => s + Number(f(i.k, maxScore(i))), 0);
    const risk  = bradenRisk(total);
    const pBdr = '1px solid #d1d5db';
    const pHd:React.CSSProperties = { background:'#e8f0fe', padding:'6px 8px', fontSize:12, fontWeight:600, textAlign:'center', border:pBdr, verticalAlign:'middle', whiteSpace:'pre-line' };
    const pVal:React.CSSProperties = { background:'#fff', padding:'6px 6px', fontSize:12, border:pBdr, verticalAlign:'middle', whiteSpace:'pre-line', lineHeight:1.4 };

    return (
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, overflow:'hidden' }}>
        {/* 문서 유형 배지 바 */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#f1f5f9', borderBottom:'1px solid #e2e8f0' }}>
          <span style={{ fontSize:12, color:'#64748b' }}>문서 유형</span>
          <span style={{ fontSize:12, fontWeight:700, padding:'3px 14px', borderRadius:14, background:'#eff6ff', color:'#2563eb', border:'1px solid #93c5fd40' }}>
            욕창위험도측정 (Braden Scale)
          </span>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
          <colgroup>
            <col style={{ width:'9%' }}/>
            <col style={{ width:'18%' }}/>
            <col/>
            <col style={{ width:'8%' }}/>
          </colgroup>
          <thead>
            <tr>
              <td style={{ ...pHd, background:'#d4e3f7' }}>구분</td>
              <td style={{ ...pHd, background:'#d4e3f7' }}>척도</td>
              <td style={{ ...pHd, background:'#d4e3f7' }}>내용</td>
              <td style={{ ...pHd, background:'#d4e3f7' }}>점수</td>
            </tr>
          </thead>
          <tbody>
            {BRADEN_ITEMS.map((item) => {
              const cur = Number(f(item.k, maxScore(item)));
              return (
                <React.Fragment key={item.k}>
                  {item.opts.map((opt, oi) => (
                    <tr key={opt.v}>
                      {oi === 0 && (
                        <td style={pHd} rowSpan={item.opts.length}>{item.label}</td>
                      )}
                      <td style={{ ...pVal, textAlign:'left', paddingLeft:8 }}>
                        <label style={{ display:'flex', alignItems:'flex-start', gap:5, cursor:'pointer' }}>
                          <input type="radio" name={item.k} checked={cur === opt.v} onChange={() => setF(item.k, opt.v)} style={{ accentColor:'#2563eb', marginTop:2, flexShrink:0 }}/>
                          <span style={{ fontSize:12 }}>{opt.l}</span>
                        </label>
                      </td>
                      <td style={{ ...pVal, textAlign:'left', paddingLeft:8, whiteSpace:'normal' }}>{opt.d}</td>
                      {oi === 0 && (
                        <td style={{ ...pVal, textAlign:'center', fontWeight:700, fontSize:12, color:'#1e40af' }} rowSpan={item.opts.length}>
                          {maxScore(item)} 점
                        </td>
                      )}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {/* 점수해석 */}
        <div style={{ padding:'10px 14px', borderTop:'1px solid #e2e8f0', background: risk.bg, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <div>
            <span style={{ fontSize:12, color:'#64748b', marginRight:8 }}>합산 점수</span>
            <span style={{ fontSize:20, fontWeight:700, color: risk.c }}>{total}점</span>
          </div>
          <div style={{ width:1, height:32, background:'#e2e8f0' }}/>
          <span style={{ fontSize:13, fontWeight:700, color: risk.c, padding:'3px 14px', background:`${risk.c}18`, borderRadius:16, border:`1px solid ${risk.c}40` }}>{risk.l}</span>
          <div style={{ flex:1 }}/>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <span style={{ padding:'2px 8px', borderRadius:12, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', fontSize:10, fontWeight:700 }}>19~23점: 위험없음</span>
            <span style={{ padding:'2px 8px', borderRadius:12, background:'#fefce8', color:'#ca8a04', border:'1px solid #fde68a', fontSize:10, fontWeight:700 }}>15~18점: 약간의 위험</span>
            <span style={{ padding:'2px 8px', borderRadius:12, background:'#fff7ed', color:'#ea580c', border:'1px solid #fdba74', fontSize:10, fontWeight:700 }}>13~14점: 중간 정도의 위험</span>
            <span style={{ padding:'2px 8px', borderRadius:12, background:'#fef2f2', color:'#ef4444', border:'1px solid #fca5a5', fontSize:10, fontWeight:700 }}>10~12점: 위험 높음</span>
            <span style={{ padding:'2px 8px', borderRadius:12, background:'#fef2f2', color:'#dc2626', border:'1px solid #f87171', fontSize:10, fontWeight:700 }}>9점 이하: 매우 높음</span>
          </div>
        </div>
        {/* 검사결과에 대한 의견 */}
        <div style={{ padding:'10px 12px', borderTop:'1px solid #e2e8f0' }}>
          <div style={{ marginBottom:6 }}>
            <span style={{ fontSize:12, fontWeight:600, color:'#334155' }}>검사결과에 대한 의견</span>
          </div>
          <textarea rows={5} value={String(f('pressureOpinion', ''))} onChange={e => setF('pressureOpinion', e.target.value)} placeholder="검사결과에 대한 의견을 작성하세요" style={{ ...SH.ta, fontSize:12, lineHeight:1.6 }}/>
        </div>
      </div>
    );
  }

  function renderCognitive() {
    const _empty = renderEmptyGuard('cognitive'); if (_empty) return _empty;

    // 검사일 기준 만 나이로 연령그룹 자동 결정 (실제생년월일 기준)
    const examDate   = String(f('writeDate', TODAY));
    const autoAgeGroup = sel ? getCistAgeGroup(getRealDob(sel), examDate) : '';
    const ageGroup   = autoAgeGroup || String(f('cist_age', ''));
    const eduLevel   = String(f('cist_edu', ''));

    // 연령·학력 → 커트라인 자동 매핑
    const cutoffVal  = (ageGroup && eduLevel) ? CIST_CUTOFF_TABLE[ageGroup]?.[eduLevel] : undefined;
    const autoCutoff: number | null = (cutoffVal !== undefined && cutoffVal !== null) ? cutoffVal as number : null;

    // 점수 입력 유효성 검증
    const scoreErrors: Record<string, string> = {};
    CIST_DOMAINS.forEach(d => {
      const raw = formDraft[d.k];
      if (raw === '' || raw === undefined || raw === null) return;
      const n = Number(raw);
      if (!Number.isInteger(n)) scoreErrors[d.k] = '정수만 입력';
      else if (n < 0) scoreErrors[d.k] = '0 이상';
      else if (n > d.max) scoreErrors[d.k] = `${d.max} 이하`;
    });
    const hasError = Object.keys(scoreErrors).length > 0;

    const total      = CIST_DOMAINS.reduce((s, d) => s + Math.min(Math.max(0, Number(f(d.k, 0))), d.max), 0);
    const autoResult = cistResult(total, autoCutoff);
    const lvl        = cistColor(autoResult);
    const hb    = '1px solid #d1d5db';
    const hLbl:React.CSSProperties = { background:'#e8f0fe', padding:'6px 8px', fontSize:12, fontWeight:600, textAlign:'center', border:hb, whiteSpace:'pre-line' as const, verticalAlign:'middle' };
    const hVal:React.CSSProperties = { background:'#fff', padding:'6px 6px', fontSize:12, textAlign:'center', border:hb, whiteSpace:'pre-line' as const, verticalAlign:'middle', lineHeight:1.4 };

    return (
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {/* ── 1. 영역별 세부 점수 ── */}
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, overflow:'hidden' }}>
          <div style={{ ...SH.secHead, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>CIST 영역별 세부 점수</span>
            <span style={{ fontSize:10, color:'#94a3b8', fontWeight:400, textTransform:'none' as const, letterSpacing:0 }}>총 {CIST_TOTAL_MAX}점 만점</span>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
            <colgroup>
              <col style={{ width:'30%' }}/>
              <col/>
              <col style={{ width:'15%' }}/>
              <col style={{ width:'10%' }}/>
            </colgroup>
            <thead>
              <tr>
                <td style={{ ...hLbl, background:'#d4e3f7' }}>검사 영역</td>
                <td style={{ ...hLbl, background:'#d4e3f7' }}>세부 내용</td>
                <td style={{ ...hLbl, background:'#d4e3f7' }}>점수 입력</td>
                <td style={{ ...hLbl, background:'#d4e3f7' }}>만점</td>
              </tr>
            </thead>
            <tbody>
              {CIST_DOMAINS.map((d) => {
                const err = scoreErrors[d.k];
                return (
                  <tr key={d.k}>
                    <td style={hLbl}>{d.label}</td>
                    <td style={{ ...hVal, textAlign:'left', paddingLeft:10 }}>{d.desc}</td>
                    <td style={hVal}>
                      <select value={String(formDraft[d.k] ?? '')}
                        onChange={e => setF(d.k, e.target.value === '' ? '' : Number(e.target.value))}
                        style={{ ...SH.sel, width:70, padding:'4px 6px', fontSize:13 }}>
                        <option value="">-</option>
                        {Array.from({ length: d.max + 1 }, (_, i) => (
                          <option key={i} value={i}>{i}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ ...hVal, fontWeight:700, fontSize:12, color:'#1e40af' }}>{d.max}점</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── 3. 최종 판정 결과 ── */}
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, overflow:'hidden' }}>
          <div style={{ ...SH.secHead, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>최종 판정 결과</span>
            <button onClick={() => setShowCistTable(true)} style={{ fontSize:11, fontWeight:700, color:'#2563eb', background:'#eff6ff', border:'1px solid #93c5fd', borderRadius:5, padding:'3px 10px', cursor:'pointer' }}>
              기준점표 보기
            </button>
          </div>
          {/* 학력 선택 */}
          <div style={{ padding:'12px 16px 8px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>교육연수(학력)</div>
              <select value={String(f('cist_edu', ''))} onChange={e => setF('cist_edu', e.target.value)} style={{ ...SH.sel, padding:'5px 8px', fontSize:13, minWidth:160 }}>
                <option value="">선택</option>
                {EDU_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>
                연령대
                {autoAgeGroup && <span style={{ marginLeft:6, fontSize:11, color:'#2563eb', fontWeight:600 }}>실제생년월일 기준 자동({autoAgeGroup})</span>}
              </div>
              {autoAgeGroup
                ? <div style={{ ...SH.inp, padding:'5px 10px', fontSize:13, fontWeight:600, color:'#1d4ed8', background:'#eff6ff', border:'1px solid #93c5fd', borderRadius:6, display:'inline-block' }}>{autoAgeGroup}</div>
                : <select value={String(f('cist_age', ''))} onChange={e => setF('cist_age', e.target.value)} style={{ ...SH.sel, padding:'5px 8px', fontSize:13, minWidth:110 }}>
                    <option value="">선택</option>
                    {AGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
              }
            </div>
          </div>
          {/* 총점 + 커트라인 + 최종판정 */}
          <div style={{ background:lvl.bg, padding:'12px 16px', display:'flex', alignItems:'center', gap:20, borderTop:`2px solid ${lvl.c}40`, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:12, color:'#64748b', marginBottom:2 }}>총 점수</div>
              <div style={{ fontSize:30, fontWeight:700, color:lvl.c }}>{total}<span style={{ fontSize:14, fontWeight:400 }}>점</span></div>
            </div>
            <div style={{ width:1, height:48, background:'#e2e8f0' }}/>
            <div>
              <div style={{ fontSize:12, color:'#64748b', marginBottom:2 }}>정상 기준점</div>
              <div style={{ fontSize:18, fontWeight:700, color:'#1d4ed8' }}>
                {autoCutoff !== null ? `${autoCutoff}점 이상` : <span style={{ fontSize:13, color:'#94a3b8' }}>연령·학력 선택 필요</span>}
              </div>
            </div>
            <div style={{ width:1, height:48, background:'#e2e8f0' }}/>
            <div>
              <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>최종 판정</div>
              {autoCutoff !== null
                ? <span style={{ fontSize:15, fontWeight:700, color:lvl.c, padding:'5px 16px', background:`${lvl.c}18`, borderRadius:20, border:`1px solid ${lvl.c}40` }}>
                    {autoResult ?? '—'}
                  </span>
                : <span style={{ fontSize:13, color:'#94a3b8' }}>—</span>
              }
            </div>
            <div style={{ flex:1 }}/>
            <div style={{ fontSize:11, color:'#94a3b8', lineHeight:1.8, textAlign:'right' }}>
              <div>※ 기준점 이상: 정상</div>
              <div>기준점 미만: 인지저하 의심(진단검사 의뢰)</div>
              <div>90세이상은 80~89세 기준 준용</div>
            </div>
          </div>
        </div>

        {/* ── CIST 기준점 팝업 ── */}
        {showCistTable && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}
            onClick={() => setShowCistTable(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:10, width:640, maxHeight:'85vh', overflow:'auto', boxShadow:'0 8px 40px rgba(0,0,0,0.2)' }}>
              {/* 헤더 */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px', background:'#1e40af', borderRadius:'10px 10px 0 0' }}>
                <span style={{ fontSize:15, fontWeight:700, color:'#fff' }}>CIST 진단검사 의뢰점수 기준표</span>
                <button onClick={() => setShowCistTable(false)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:4, color:'#fff', width:26, height:26, cursor:'pointer', fontSize:15, fontWeight:700 }}>✕</button>
              </div>
              {/* 테이블 */}
              <div style={{ padding:'16px 20px' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr>
                      <th style={{ background:'#dbeafe', border:'1px solid #93c5fd', padding:'8px 10px', textAlign:'center', fontWeight:700, color:'#1e40af' }} rowSpan={2}>연령</th>
                      <th style={{ background:'#dbeafe', border:'1px solid #93c5fd', padding:'8px 10px', textAlign:'center', fontWeight:700, color:'#1e40af' }} colSpan={6}>교육연수</th>
                    </tr>
                    <tr>
                      {['비문해', '무학/문해\n(~5년)', '초졸\n(6~8년)', '중졸\n(9~11년)', '고졸\n(12~15년)', '대졸이상\n(16년~)'].map(h => (
                        <th key={h} style={{ background:'#eff6ff', border:'1px solid #93c5fd', padding:'6px 8px', textAlign:'center', fontWeight:600, color:'#1e40af', whiteSpace:'pre-line', fontSize:12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {AGE_GROUPS.map((ag, ri) => {
                      const row = CIST_CUTOFF_TABLE[ag];
                      return (
                        <tr key={ag}>
                          <td style={{ border:'1px solid #e2e8f0', padding:'8px 12px', textAlign:'center', fontWeight:600, background:'#f8fafc', color: ageGroup===ag ? '#1d4ed8' : '#1e293b',
                            ...(ageGroup===ag ? { background:'#eff6ff', fontWeight:700 } : {}) }}>
                            {ag}{ag==='90세이상' && <div style={{ fontSize:10, color:'#94a3b8', fontWeight:400 }}>80~89세 준용</div>}
                          </td>
                          {['비문해','무학/문해(~5년)','초졸(6~8년)','중졸(9~11년)','고졸(12~15년)','대졸이상(16년~)'].map(edu => {
                            const v = row?.[edu];
                            const isMatch = ageGroup === ag && eduLevel === edu;
                            return (
                              <td key={edu} style={{ border:'1px solid #e2e8f0', padding:'8px', textAlign:'center',
                                background: isMatch ? '#fef9c3' : v === null ? '#f8fafc' : '#fff',
                                fontWeight: isMatch ? 700 : 400,
                                color: isMatch ? '#92400e' : v === null ? '#94a3b8' : '#1e293b' }}>
                                {v === null ? '—' : v}
                                {isMatch && autoCutoff !== null && <div style={{ fontSize:10, color:'#92400e' }}>★ 현재</div>}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {/* 적용 지침 */}
                <div style={{ marginTop:16, padding:'12px 14px', background:'#fef3c7', borderRadius:8, border:'1px solid #fcd34d' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#92400e', marginBottom:8 }}>적용 지침</div>
                  <div style={{ fontSize:12, color:'#78350f', lineHeight:1.8 }}>
                    <div>※ <b>기준점 이상</b>: 정상</div>
                    <div>※ <b>기준점 미만</b>: 인지저하 의심 → 진단검사 의뢰</div>
                    <div>※ 연령은 검사일 기준 <b>만 나이</b> 사용</div>
                    <div>※ <b>기초정보의 실제생년월일(양력)</b> 기준으로 자동 계산 (주민등록 생년월일 아님)</div>
                    <div>※ 90세 이상은 <b>80~89세 기준 준용</b></div>
                    <div>※ 50~59세 비문해·무학 조합은 기준점 없음(—)</div>
                  </div>
                </div>
                {/* 현재 수급자 요약 */}
                {(ageGroup || eduLevel) && (
                  <div style={{ marginTop:12, padding:'10px 14px', background:'#eff6ff', borderRadius:8, border:'1px solid #bfdbfe', fontSize:12, color:'#1e40af' }}>
                    <b>현재 수급자</b>:&nbsp;
                    {autoAgeGroup ? `${autoAgeGroup} (자동계산)` : ageGroup || '연령 미선택'}&nbsp;/&nbsp;
                    {eduLevel || '학력 미선택'}&nbsp;→&nbsp;
                    <b>{autoCutoff !== null ? `기준점 ${autoCutoff}점 이상 → 정상` : '기준점 없음 또는 미선택'}</b>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 4. 정성적 평가 및 관찰 기록 ── */}
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, overflow:'hidden' }}>
          <div style={SH.secHead}>정성적 평가 및 관찰 기록</div>
          <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
            <div>
              <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>검사 당시 컨디션</div>
              <textarea rows={2} value={String(f('cist_condition', ''))} onChange={e => setF('cist_condition', e.target.value)} placeholder="수급자의 협조도, 기분 상태, 청력·시력 등 신체적 제약 사항" style={{ ...SH.ta, fontSize:13 }}/>
            </div>
            <div>
              <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>특이 반응</div>
              <textarea rows={2} value={String(f('cist_reaction', ''))} onChange={e => setF('cist_reaction', e.target.value)} placeholder="예: 기억력 영역에서 특정 단어를 전혀 떠올리지 못함, 그리기 문항에서 손 떨림이 심함 등" style={{ ...SH.ta, fontSize:13 }}/>
            </div>
            <div>
              <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>이전 결과와 비교</div>
              <textarea rows={2} value={String(f('cist_compare', ''))} onChange={e => setF('cist_compare', e.target.value)} placeholder="전년도 대비 점수 변화 폭 및 인지 기능 저하 속도에 대한 소견" style={{ ...SH.ta, fontSize:13 }}/>
            </div>
          </div>
        </div>

        {/* ── 5. 후속 조치 및 계획 ── */}
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, overflow:'hidden' }}>
          <div style={SH.secHead}>후속 조치 및 계획</div>
          <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
            <div>
              <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>프로그램 반영</div>
              <textarea rows={2} value={String(f('cist_program', ''))} onChange={e => setF('cist_program', e.target.value)} placeholder="인지활동형 프로그램(인지자극활동 등) 제공 필요 여부 및 구체적 계획" style={{ ...SH.ta, fontSize:13 }}/>
            </div>
            <div>
              <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>외부 연계</div>
              <textarea rows={2} value={String(f('cist_referral', ''))} onChange={e => setF('cist_referral', e.target.value)} placeholder="치매안심센터 정밀검사 권고 또는 병원 진료 안내 여부" style={{ ...SH.ta, fontSize:13 }}/>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderCarePlan() {
    const _empty = renderEmptyGuard('carePlan'); if (_empty) return _empty;
    return <CarePlanDocument formDraft={formDraft} setF={setF} />;
  }

  function renderFormByTab() {
    switch (activeTab) {
      case 'longTerm':  return renderLongTerm();
      case 'needs':     return renderNeeds();
      case 'fall':      return renderFall();
      case 'pressure':  return renderPressure();
      case 'cognitive': return renderCognitive();
      case 'carePlan':  return renderCarePlan();
    }
  }

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', height:'100%', background:'#f0f4f8', overflow:'hidden' }}>

      {/* ══ LEFT PANEL ══════════════════════════════════════════ */}
      <div style={{ width:440, display:'flex', flexDirection:'column', background:'#fff', borderRight:'1px solid #e2e8f0', flexShrink:0 }}>

        <div style={{ background:'linear-gradient(135deg,#0f2744 0%,#1a3a5c 100%)', padding:'10px 14px', flexShrink:0 }}>
          <div style={{ color:'#fff', fontSize:13, fontWeight:700 }}>수급자 목록</div>
          <div style={{ color:'#94a3b8', fontSize:11, marginTop:2 }}>총 {filteredRecips.length}명 · 급여제공계획 진행 현황</div>
        </div>

        {/* 검색 */}
        <div style={{ padding:'7px 12px', borderBottom:'1px solid #f1f5f9', flexShrink:0, display:'flex', gap:4 }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:6, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6, padding:'4px 8px' }}>
            <Search size={12} color="#94a3b8"/>
            <input
              value={searchDraft}
              onChange={e => setSearchDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitSearch(); }}
              placeholder="이름 검색"
              style={{ flex:1, border:'none', background:'transparent', fontSize:12, color:'#1e293b', outline:'none' }}
            />
          </div>
          <button
            onClick={submitSearch}
            title="검색 (Enter)"
            style={{ padding:'0 10px', fontSize:12, borderRadius:6, cursor:'pointer', border:'1px solid #152e50', background:'#152e50', color:'#fff', fontWeight:700, flexShrink:0 }}
          >검색</button>
          {search && (
            <button
              onClick={() => { setSearchDraft(''); setSearch(''); }}
              title="검색 초기화"
              style={{ padding:'0 8px', fontSize:12, borderRadius:6, cursor:'pointer', border:'1px solid #e2e8f0', background:'#f8fafc', color:'#64748b', flexShrink:0 }}
            >✕</button>
          )}
        </div>

        {/* 그룹 필터 + 상태 필터 */}
        <div style={{ padding:'5px 12px', borderBottom:'1px solid #f1f5f9', display:'flex', flexDirection:'column', gap:4, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'active' | 'all')}
              style={{ fontSize:11, padding:'3px 5px', border:'1px solid #e2e8f0', borderRadius:4, outline:'none', color:'#334155', background:'#fff', flexShrink:0 }}
            >
              <option value="active">수급중</option>
              <option value="all">전체수급자</option>
            </select>
            <span style={{ fontSize:11, color:'#94a3b8', flexShrink:0 }}>그룹</span>
            <select
              value={selectedGroup}
              onChange={e => { setSelectedGroup(e.target.value); setSelectedSubGroup('all'); }}
              style={{ flex:1, fontSize:11, padding:'3px 5px', border:'1px solid #e2e8f0', borderRadius:4, outline:'none', color:'#334155', background:'#fff' }}
            >
              {CP_GROUPS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </div>
          {curGroupObj.subs.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ fontSize:11, color:'#94a3b8', flexShrink:0 }}>세부</span>
              <select
                value={selectedSubGroup}
                onChange={e => setSelectedSubGroup(e.target.value)}
                style={{ flex:1, fontSize:11, padding:'3px 5px', border:'1px solid #dbeafe', borderRadius:4, outline:'none', color:'#1e40af', background:'#eff6ff' }}
              >
                <option value="all">전체</option>
                {curGroupObj.subs.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          {/* 등급 + 급여종류 필터 */}
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:11, color:'#94a3b8', flexShrink:0 }}>등급</span>
            <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}
              style={{ flex:1, fontSize:11, padding:'3px 5px', border:'1px solid #e2e8f0', borderRadius:4, outline:'none', color:'#334155', background:'#fff' }}>
              <option value="all">전체</option>
              {['1등급','2등급','3등급','4등급','5등급','인지지원등급'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <span style={{ fontSize:11, color:'#94a3b8', flexShrink:0 }}>급여</span>
            <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}
              style={{ flex:1, fontSize:11, padding:'3px 5px', border:'1px solid #e2e8f0', borderRadius:4, outline:'none', color:'#334155', background:'#fff' }}>
              <option value="all">전체</option>
              {['visit_care','visit_bath','visit_nursing','day_care'].map(k => (
                <option key={k} value={k}>{SERVICE_LABELS[k] ?? k}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ padding:'4px 12px', borderBottom:'1px solid #f1f5f9', display:'flex', gap:8, flexShrink:0 }}>
          {[{c:'#22c55e',l:'양호'},{c:'#eab308',l:'주의'},{c:'#f97316',l:'임박'},{c:'#ef4444',l:'초과'},{c:'#94a3b8',l:'미실시'}].map(x => (
            <div key={x.l} style={{ display:'flex', alignItems:'center', gap:3 }}>
              <div style={{ width:8, height:4, borderRadius:2, background:x.c }}/>
              <span style={{ fontSize:9, color:'#64748b' }}>{x.l}</span>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', alignItems:'center', padding:'3px 12px 3px 15px', borderBottom:'2px solid #e2e8f0', background:'#f8fafc', flexShrink:0 }}>
          <div style={{ flex:'0 0 126px' }}/>
          {PROGRESS_DOCS.map(doc => (
            <div key={doc.key} style={{ flex:1, textAlign:'center', fontSize:9, fontWeight:700, color:doc.col, paddingRight:6 }}>{doc.label}</div>
          ))}
          <div style={{ flex:'0 0 36px' }}/>
        </div>

        <div style={{ flex:1, overflowY:'auto' }}>
          {filteredRecips.map(r => {
            const docs  = docStore[r.id];
            const isSel = r.id === selectedId;
            const gc    = gradeColor(getGradeNum(r));
            const urgentDocs = PROGRESS_DOCS.filter(d => {
              const latestDate = docs[d.key][0]?.date ?? null;
              return calcProg(latestDate, d.cycDays).overdue;
            });
            const urgentCount = urgentDocs.length;
            return (
              <div key={r.id} onClick={() => { setSelectedId(r.id); setActiveTab('longTerm'); }} style={{
                padding:'5px 12px', borderBottom:'1px solid #f1f5f9',
                background: isSel ? '#eff6ff' : '#fff', cursor:'pointer',
                borderLeft:`3px solid ${isSel ? '#2563eb' : 'transparent'}`,
                transition:'background 0.1s', display:'flex', alignItems:'center',
              }}>
                <div style={{ flex:'0 0 126px', display:'flex', alignItems:'center', gap:5, minWidth:0 }}>
                  <span style={{ fontSize:13, fontWeight:isSel?700:500, color:isSel?'#1d4ed8':'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</span>
                  <span style={{ fontSize:9, padding:'1px 5px', borderRadius:8, background:gc.bg, color:gc.c, fontWeight:700, flexShrink:0 }}>{getGradeText(r)}</span>
                </div>

                {PROGRESS_DOCS.map(doc => {
                  const latestDate = docs[doc.key][0]?.date ?? null;
                  const p = calcProg(latestDate, doc.cycDays);
                  return (
                    <div key={doc.key} style={{ flex:1, paddingRight:6, minWidth:0 }}>
                      <div style={{ height:10, display:'flex', alignItems:'center', justifyContent:'flex-end', marginBottom:2 }}>
                        {p.badge
                          ? <span style={{ fontSize:8, color:p.txt, fontWeight:700, lineHeight:1 }}>{p.badge}</span>
                          : <span style={{ fontSize:8, color:'#d1d5db' }}>—</span>
                        }
                      </div>
                      <div style={{ height:5, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ width:`${p.pct}%`, height:'100%', background:p.bar, borderRadius:3 }}/>
                      </div>
                    </div>
                  );
                })}

                {/* Alert badge with tooltip */}
                <div style={{ flex:'0 0 36px', display:'flex', justifyContent:'flex-end', position:'relative' }}>
                  {urgentCount > 0 && (
                    <div style={{ position:'relative' }}
                      onMouseEnter={() => setTooltipId(r.id)}
                      onMouseLeave={() => setTooltipId(null)}
                    >
                      <span style={{ fontSize:9, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:8, padding:'2px 6px', fontWeight:700, whiteSpace:'nowrap', cursor:'default', userSelect:'none' }}>
                        {urgentCount}건
                      </span>
                      {tooltipId === r.id && (
                        <div style={{
                          position:'absolute', right:'calc(100% + 8px)', top:'50%', transform:'translateY(-50%)',
                          background:'#1e293b', color:'#fff', borderRadius:7, padding:'8px 10px',
                          fontSize:11, whiteSpace:'nowrap', zIndex:200,
                          boxShadow:'0 6px 18px rgba(0,0,0,0.22)', pointerEvents:'none', minWidth:140,
                        }}>
                          <div style={{ fontSize:10, fontWeight:700, color:'#fca5a5', marginBottom:6, borderBottom:'1px solid #334155', paddingBottom:4 }}>
                            작성 필요 문서
                          </div>
                          {urgentDocs.map(doc => {
                            const latestDate = docs[doc.key][0]?.date ?? null;
                            const p = calcProg(latestDate, doc.cycDays);
                            const reason = !latestDate ? '미실시' : `D+${Math.abs(p.daysLeft ?? 0)} 초과`;
                            return (
                              <div key={doc.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom:3 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                                  <div style={{ width:6, height:6, borderRadius:3, background:doc.col, flexShrink:0 }}/>
                                  <span style={{ fontSize:11, color:'#e2e8f0' }}>{doc.label}</span>
                                </div>
                                <span style={{ fontSize:9, color: !latestDate ? '#94a3b8' : '#fca5a5', fontWeight:700 }}>{reason}</span>
                              </div>
                            );
                          })}
                          <div style={{ position:'absolute', right:-5, top:'50%', transform:'translateY(-50%)', width:0, height:0, borderTop:'5px solid transparent', borderBottom:'5px solid transparent', borderLeft:'5px solid #1e293b' }}/>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ RIGHT PANEL ═════════════════════════════════════════ */}
      {!sel ? (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
          <div style={{ width:64, height:64, borderRadius:16, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ClipboardList size={32} color="#cbd5e1"/>
          </div>
          <div style={{ fontSize:15, fontWeight:600, color:'#64748b' }}>수급자를 선택하세요</div>
          <div style={{ fontSize:12, color:'#94a3b8' }}>목록에서 수급자를 클릭하면 문서 관리를 시작할 수 있습니다</div>
          <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:8, flexWrap:'wrap', justifyContent:'center' }}>
            {DOCS.map((doc, i) => (
              <React.Fragment key={doc.key}>
                <span style={{ fontSize:11, padding:'3px 10px', borderRadius:12, background:`${doc.col}18`, color:doc.col, fontWeight:600, border:`1px solid ${doc.col}30` }}>{doc.label}</span>
                {i < DOCS.length - 1 && <ChevronRight size={12} color="#cbd5e1"/>}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* 수급자 정보 바 */}
          <div style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'8px 16px', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <User size={18} color="#2563eb"/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>{sel.name}</span>
                <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:gradeColor(getGradeNum(sel)).bg, color:gradeColor(getGradeNum(sel)).c, fontWeight:700 }}>{getGradeText(sel)}</span>
                {getReduction(sel) && (
                  <span style={{ fontSize:10, padding:'1px 6px', borderRadius:8, background:'#fef3c7', color:'#92400e', fontWeight:600 }}>{getReduction(sel)}</span>
                )}
                {getServiceTypes(sel).map(st => (
                  <span key={st} style={{ fontSize:10, padding:'1px 6px', borderRadius:8, background:'#f1f5f9', color:'#475569' }}>{SERVICE_LABELS[st]}</span>
                ))}
              </div>
              <div style={{ fontSize:11, color:'#64748b', marginTop:1 }}>{getCertNo(sel)} · {getValidFrom(sel)}~{getValidTo(sel)}</div>
            </div>
            {/* 탭별 상태 점 */}
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              {DOCS.map(doc => {
                const entries = sDocs![doc.key];
                const latestDate = entries[0]?.date ?? null;
                const p = calcProg(latestDate, doc.cycDays);
                return (
                  <button key={doc.key} onClick={() => setActiveTab(doc.key)} title={`${doc.label}: ${entries.length === 0 ? '미작성' : p.badge || '정상'} (${entries.length}건)`}
                    style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, background:'none', border:'none', cursor:'pointer', padding:'2px 4px' }}>
                    <div style={{ width:8, height:8, borderRadius:4, background: entries.length === 0 ? '#94a3b8' : p.bar }}/>
                    <span style={{ fontSize:8, color:'#94a3b8' }}>{doc.short}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 탭 바 */}
          <div style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', display:'flex', flexShrink:0, paddingLeft:8 }}>
            {DOCS.map((doc, i) => {
              const isAct  = activeTab === doc.key;
              const entries = sDocs![doc.key];
              const latestDate = entries[0]?.date ?? null;
              const p    = calcProg(latestDate, doc.cycDays);
              const dot  = entries.length === 0 ? '#94a3b8' : p.bar;
              return (
                <button key={doc.key} onClick={() => setActiveTab(doc.key)} style={{
                  padding:'0 14px', height:38, fontSize:12,
                  fontWeight: isAct ? 700 : 400,
                  color: isAct ? doc.col : '#64748b',
                  background:'none', border:'none',
                  borderBottom: isAct ? `2px solid ${doc.col}` : '2px solid transparent',
                  cursor:'pointer', display:'flex', alignItems:'center', gap:5,
                  whiteSpace:'nowrap', transition:'color 0.12s',
                }}>
                  <span style={{ fontSize:9, width:16, height:16, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
                    background: isAct ? doc.col : '#e2e8f0', color: isAct ? '#fff' : '#94a3b8', fontWeight:700, flexShrink:0 }}>{i+1}</span>
                  {doc.label}
                  <div style={{ width:7, height:7, borderRadius:4, background:dot, flexShrink:0 }}/>
                  {/* 건수 뱃지 */}
                  {entries.length > 0 && (
                    <span style={{ fontSize:9, background: isAct ? `${doc.col}20` : '#f1f5f9', color: isAct ? doc.col : '#94a3b8', borderRadius:8, padding:'1px 5px', fontWeight:700 }}>
                      {entries.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 폼 영역 */}
          <div style={{ flex:1, overflow:'auto', padding:14, background:'#f0f4f8' }}>
            <div style={{ maxWidth:800, display:'flex', flexDirection:'column', gap:10 }}>

              {/* 문서 헤더 */}
              {renderDocHeader()}

              {/* 작성 기록 바 */}
              {renderEntryBar()}

              {/* 발급일/작성일 + 작성자 행 */}
              <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
                {isNewEntry && (
                  <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:6, background:'#eff6ff', border:'1px solid #bfdbfe' }}>
                    <Plus size={11} color="#2563eb"/>
                    <span style={{ fontSize:11, color:'#2563eb', fontWeight:700 }}>{activeTab === 'longTerm' ? '신규 발급 중' : '신규 작성 중'}</span>
                  </div>
                )}
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:11, color:'#64748b' }}>{activeTab === 'longTerm' ? '발급일' : activeTab === 'cognitive' ? '검사일' : '작성일'}</span>
                  <input type="date" value={String(f('writeDate', TODAY))} onChange={e => setF('writeDate', e.target.value)} style={{ ...SH.inp, width:130 }}/>
                </div>
                {activeTab !== 'longTerm' && (
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:11, color:'#64748b' }}>{activeTab === 'cognitive' ? '검사자' : '작성자'}</span>
                    <input
                      value={author}
                      onChange={e => { setAuthor(e.target.value); setIsDirty(true); }}
                      style={{ ...SH.inp, width:100 }}
                      placeholder="작성자명 입력"
                    />
                  </div>
                )}
                <div style={{ flex:1 }}/>
                {isDirty && (
                  <span style={{ fontSize:11, color:'#f97316', display:'flex', alignItems:'center', gap:4 }}>
                    <AlertTriangle size={11}/> 미저장 변경사항 있음
                  </span>
                )}
                {(activeTab === 'longTerm' || activeTab === 'carePlan') && (() => {
                  const inputId = `pdf-upload-${activeTab}`;
                  return (
                    <>
                      <input id={inputId} type="file" accept="application/pdf" style={{ display:'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          alert(`"${file.name}" 파일이 선택되었습니다.\n(PDF 파싱 기능은 실제 연동 시 구현됩니다.)`);
                          e.target.value = '';
                        }}/>
                      <label htmlFor={inputId} style={{
                        display:'flex', alignItems:'center', gap:5,
                        background:'#fff', color:'#2563eb',
                        border:'1.5px solid #93c5fd', borderRadius:6, padding:'6px 12px', fontSize:12, fontWeight:700,
                        cursor:'pointer', whiteSpace:'nowrap',
                      }}>
                        <FileText size={13}/> 공단PDF업로드
                      </label>
                    </>
                  );
                })()}
                <button onClick={saveForm} style={{
                  display:'flex', alignItems:'center', gap:6,
                  background: isDirty ? '#2563eb' : '#f1f5f9',
                  color: isDirty ? '#fff' : '#94a3b8',
                  border:'none', borderRadius:6, padding:'6px 16px', fontSize:12, fontWeight:700,
                  cursor: isDirty ? 'pointer' : 'default', transition:'background 0.15s, color 0.15s',
                }}>
                  <Save size={13}/> {isNewEntry ? '작성 완료' : '수정 저장'}
                </button>
                {!isNewEntry && selectedEntryId && (
                  <button onClick={() => deleteEntry(selectedEntryId)} style={{
                    display:'flex', alignItems:'center', gap:5,
                    background:'#fff', color:'#dc2626',
                    border:'1.5px solid #fca5a5', borderRadius:6, padding:'6px 12px', fontSize:12, fontWeight:700,
                    cursor:'pointer',
                  }}>
                    <Trash2 size={13}/> 삭제
                  </button>
                )}
              </div>

              {/* 폼 본문 */}
              {renderFormByTab()}

            </div>
          </div>
        </div>
      )}

      {/* ── 급여계획 종류선택 모달 ── */}
      {showCpTypeSelect && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
             onClick={() => setShowCpTypeSelect(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', border:'1px solid #d1d5db', borderRadius:4, width:480, maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 8px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', background:'#f3f4f6', borderBottom:'1px solid #d1d5db', flexShrink:0 }}>
              <span style={{ fontSize:14, fontWeight:700, color:'#1e293b' }}>급여계획 종류 및 구분 선택</span>
              <button onClick={() => setShowCpTypeSelect(false)} style={{ width:22, height:22, background:'#e74c3c', color:'#fff', border:'none', borderRadius:3, cursor:'pointer', fontSize:14, fontWeight:700, lineHeight:1 }}>✕</button>
            </div>
            <div style={{ padding:'8px 12px', overflow:'auto', flex:1 }}>
              <div style={{ fontSize:11, color:'#64748b', marginBottom:8 }}>급여종류를 선택하면 해당 구분 항목이 표시됩니다. 필요한 구분만 체크하세요.</div>
              {CP_PLAN_TYPES.map(pt => {
                const typeChecked = cpTypeChecks.includes(pt.key);
                const catSel = cpCatChecks[pt.key] || [];
                const allCatKeys = pt.categories.map(c => c.key);
                return (
                  <div key={pt.key} style={{ marginBottom:6, border:'1px solid #e2e8f0', borderRadius:6, overflow:'hidden' }}>
                    {/* 급여종류 헤더 */}
                    <label style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background: typeChecked ? '#eff6ff' : '#f8fafc', cursor:'pointer', borderBottom: typeChecked ? '1px solid #e2e8f0' : 'none' }}>
                      <input type="checkbox" checked={typeChecked}
                        onChange={e => {
                          if (e.target.checked) {
                            setCpTypeChecks(prev => [...prev, pt.key]);
                            setCpCatChecks(prev => ({ ...prev, [pt.key]: [...allCatKeys] }));
                          } else {
                            setCpTypeChecks(prev => prev.filter(k => k !== pt.key));
                            setCpCatChecks(prev => { const n = {...prev}; delete n[pt.key]; return n; });
                          }
                        }}
                        style={{ width:16, height:16, accentColor:'#2563eb' }}/>
                      <span style={{ fontSize:13, fontWeight:700, color: typeChecked ? '#1e40af' : '#475569' }}>{pt.label}</span>
                      <span style={{ fontSize:11, color:'#94a3b8', marginLeft:'auto' }}>{pt.categories.length}개 구분</span>
                    </label>
                    {/* 하위 구분 체크박스 */}
                    {typeChecked && (
                      <div style={{ padding:'6px 10px 8px 34px', display:'flex', flexWrap:'wrap', gap:4 }}>
                        {pt.categories.map(cat => {
                          const catOn = catSel.includes(cat.key);
                          return (
                            <label key={cat.key} style={{
                              display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:4,
                              background: catOn ? '#dbeafe' : '#f1f5f9', border: catOn ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                              cursor:'pointer', fontSize:12, color: catOn ? '#1e40af' : '#64748b', transition:'background 0.15s, color 0.15s, border-color 0.15s',
                            }}>
                              <input type="checkbox" checked={catOn}
                                onChange={e => {
                                  setCpCatChecks(prev => {
                                    const cur = prev[pt.key] || [];
                                    const next = e.target.checked ? [...cur, cat.key] : cur.filter(k => k !== cat.key);
                                    return { ...prev, [pt.key]: next };
                                  });
                                }}
                                style={{ width:13, height:13, accentColor:'#2563eb' }}/>
                              {cat.label}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, padding:'10px 16px', borderTop:'1px solid #d1d5db', flexShrink:0 }}>
              <button onClick={() => setShowCpTypeSelect(false)} style={{ fontSize:12, color:'#64748b', background:'#f1f5f9', border:'1px solid #d1d5db', borderRadius:4, padding:'6px 16px', cursor:'pointer' }}>취소</button>
              <button onClick={() => {
                const hasAnyCat = cpTypeChecks.some(tk => (cpCatChecks[tk] || []).length > 0);
                if (!hasAnyCat) return;
                startNewCarePlan();
              }} style={{ fontSize:12, fontWeight:700, color:'#fff', background: cpTypeChecks.length > 0 ? '#166534' : '#94a3b8', border:'none', borderRadius:4, padding:'6px 20px', cursor: cpTypeChecks.length > 0 ? 'pointer' : 'default' }}>
                선택확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 낙상 문서 유형 선택 모달 ── */}
      {showFallTypeSelect && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
             onClick={() => setShowFallTypeSelect(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:12, padding:'28px 32px', width:420, boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize:16, fontWeight:700, color:'#0f172a', marginBottom:4 }}>낙상위험측정 문서 유형 선택</div>
            <div style={{ fontSize:12, color:'#64748b', marginBottom:20 }}>신규 작성할 낙상위험측정 문서의 유형을 선택하세요.</div>
            <div style={{ display:'flex', gap:12 }}>
              {([
                { mode:'huhn' as const, title:'Huhn (Morse 척도)', desc:'낙상과거력, 부가진단, 이동보조기구, 정맥주사, 보행상태, 정신상태 6개 항목 평가 (0~125점)', color:'#ea580c', bg:'#fff7ed', border:'#fdba74' },
                { mode:'bobath' as const, title:'보바스 (Bobath 척도)', desc:'낙상경험, 나이, 감각장애, 활동상태, 보행상태, 정신상태, 배설양상, 약물복용 8개 항목 평가 (0~24점)', color:'#2563eb', bg:'#eff6ff', border:'#93c5fd' },
              ]).map(opt => (
                <button key={opt.mode} onClick={() => startNewFall(opt.mode)} style={{
                  flex:1, padding:'20px 16px', borderRadius:10, cursor:'pointer', textAlign:'left',
                  background:opt.bg, border:`2px solid ${opt.border}`, transition:'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = opt.color; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${opt.color}30`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = opt.border; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                >
                  <div style={{ fontSize:14, fontWeight:700, color:opt.color, marginBottom:8 }}>{opt.title}</div>
                  <div style={{ fontSize:11, color:'#475569', lineHeight:1.6 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
            <div style={{ textAlign:'center', marginTop:16 }}>
              <button onClick={() => setShowFallTypeSelect(false)} style={{ fontSize:12, color:'#94a3b8', background:'none', border:'none', cursor:'pointer' }}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
