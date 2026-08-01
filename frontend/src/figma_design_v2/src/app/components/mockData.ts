import { useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// 기초정보(요양기관/수급자/직원/공통상수)는 별도의 「한케어 업무포털」(시작화면)이
// 소유하며, 같은 서버에 같은 DB를 공유하는 여러 형제 프로그램이 함께 사용한다.
// 본 프로그램(한케어 급여제공-일정관리)은 그 중 한 소비자(consumer)이다.
// 각 프로그램은 SSO로 연결되지 않으며, 로그인 세션도 공유하지 않는다.
// 따라서 본 프로그램은 이 데이터의 등록/수정/삭제 UI를 노출하지 않고
// 조회/참조만 한다. 아래 타입과 상수는 PDF 스펙에 따른 공유 계약이다.
// ─────────────────────────────────────────────────────────────────────────────

// Types
export type ServiceType = 'visit_care' | 'family_care' | 'full_day_visit' | 'visit_bath' | 'visit_nursing' | 'day_care';
export type RecipientGrade = 1 | 2 | 3 | 4 | 5;
export type WorkerStatus = 'active' | 'inactive';

// ─── 공유 union 타입 (한케어 업무포털 소유) ─────────────────────────────
export type ActiveMode        = '활성' | '비활성' | '사용기한부활성';
export type FacilityCategory  = '요양기관' | '교육원' | '임대' | '기타';
export type CareSubCategory   = '요양' | '목욕' | '간호' | '주간' | '용구' | '통합' | '돌봄' | '기타';
export type WorkBusiness      = CareSubCategory;
export type ContractEndReason = '해임' | '폐업(변경)' | '폐업(종료)' | '휴업' | '기타';
export type EmployeeStatus    = '재직' | '퇴직' | '휴직';
export type EmployeeRole      = '팀장' | '직원';
export type Gender            = '남' | '여';
export type RealDobType       = '양' | '음';
// 계약구분 — 외부 공통 수급자정보 기준 8종
export type ContractStatus    = '준비중' | '수급중' | '타기관' | '계약종료' | '사망' | '보류' | '입원' | '상담중';
export type ReductionType     = '일반' | '감경9%' | '감경7.5%' | '감경6%' | '기초';
export type SalaryType        = '월급제' | '시간제';

export interface FacilityServices {
  program: boolean;
  tax: boolean;
  insurance: boolean;
  finance: boolean;
}

export interface FacilityIns4 {
  pensionRate: string;
  healthRate: string;
  longCareRate: string;
  employmentRate: string;
  industrialRate: string;
}

export const EMPTY_INS4: FacilityIns4 = {
  pensionRate: '', healthRate: '', longCareRate: '', employmentRate: '', industrialRate: '',
};

export interface Representative {
  id: number;
  name: string;
  rrn: string;
  phone: string;
}

export interface Region { id: string; name: string; }

export const DEFAULT_REGIONS: Region[] = [
  { id: 'R001', name: '서울특별시' },
  { id: 'R002', name: '부산광역시' },
  { id: 'R003', name: '대구광역시' },
  { id: 'R004', name: '인천광역시' },
  { id: 'R005', name: '광주광역시' },
  { id: 'R006', name: '대전광역시' },
  { id: 'R007', name: '울산광역시' },
  { id: 'R008', name: '세종특별자치시' },
  { id: 'R009', name: '경기도' },
  { id: 'R010', name: '강원특별자치도' },
];

// ─── Facility (요양기관 — 한케어 업무포털 소유) ──────────────────────────────
export interface Facility {
  accountCode: string;
  semuloveCode: string;
  groupCode: string;
  category: FacilityCategory;
  subCategories: CareSubCategory[];
  id: string;
  name: string;
  alias: string;
  code: string;
  uniqueNum: string;
  representatives: Representative[];
  phone: string;
  fax: string;
  email: string;
  regionId: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  managerName: string;
  managerTitle: string;
  managerPhone: string;
  employees: number;
  activeMode: ActiveMode;
  activeUntil: string;
  adminId: string;
  adminPw: string;
  openDate: string;
  designDate: string;
  himsId: string;
  himsName: string;
  services: FacilityServices;
  contractStartDate: string;
  contractEndDate: string;
  contractEndReason: ContractEndReason | '';
  contractMemo: string;
  ins4: FacilityIns4;
}

export const currentFacility: Facility = {
  accountCode: 'ACC-2025-0042',
  semuloveCode: '0042',
  groupCode: '0007',
  category: '요양기관',
  subCategories: ['요양', '목욕', '간호'],
  id: 'F-1100023',
  name: '즐거운재가센터',
  alias: '즐거운재가',
  code: '11-1100023',
  uniqueNum: '123-45-67890',
  representatives: [{ id: 1, name: '오영희', rrn: '650412-2******', phone: '010-1000-1000' }],
  phone: '02-900-1234',
  fax: '02-900-1235',
  email: 'admin@joyful-care.kr',
  regionId: 'R001',
  zipCode: '01680',
  address: '서울특별시 노원구 상계로 123',
  addressDetail: '4층 401호',
  managerName: '오영희',
  managerTitle: '시설장',
  managerPhone: '010-1000-1000',
  employees: 18,
  activeMode: '활성',
  activeUntil: '',
  adminId: 'jcfacility',
  adminPw: '********',
  openDate: '2018-04-01',
  designDate: '2018-05-15',
  himsId: 'HIMS-1100023',
  himsName: '즐거운재가센터',
  services: { program: true, tax: true, insurance: true, finance: false },
  contractStartDate: '2024-01-01',
  contractEndDate: '',
  contractEndReason: '',
  contractMemo: '',
  ins4: { pensionRate: '4.5', healthRate: '3.545', longCareRate: '0.4591', employmentRate: '0.9', industrialRate: '0.7' },
};

// ─── 직종 코드 (외부 기초정보 시스템 공유) ─────────────────────────────────────
export const POSITION_CODES: Record<string, string> = {
  ST_01: '시설장(관리책임자)',
  ST_02: '사무국장',
  ST_03: '사회복지사',
  ST_04: '간호사',
  ST_05: '물리치료사',
  ST_06: '작업치료사',
  ST_07: '언어치료사',
  ST_08: '요양보호사',
  ST_09: '간호조무사',
  ST_10: '영양사',
  ST_11: '조리원',
  ST_12: '사무원',
  ST_13: '운전원',
  ST_14: '위생원',
};

// 급여일정 배정 대상 직종 코드
export const CARE_WORKER_POSITIONS   = ['ST_08'];
// 방문상담 담당 직종 코드
export const CONSULT_WORKER_POSITIONS = ['ST_01', 'ST_03', 'ST_04', 'ST_09'];

/**
 * Recipient — 한케어 업무포털 BasicInfo 정본 단일화.
 * Phase 3-A: 단순 문자열 레거시 필드 제거 완료
 *   (registrationId, insuranceId, validityStart/End, phone, guardian, guardianPhone, birthDate).
 * Phase 3-B 대상(잔존, 계산용): grade(number), copaymentType, copaymentRate, serviceTypes, address(통합).
 */
export interface Recipient {
  id: string;
  name: string;

  // ── 정본(BasicInfo) 필드 — buildRecipient가 항상 채움 ──
  /** 자격증명번호 (PDF: certNo) */
  certNo: string;
  /** 등급 문자열 (PDF: grade '1등급'~'5등급'·'인지지원등급') */
  gradeText: string;
  /** 본인부담 감경구분 (PDF: reduction) */
  reduction: ReductionType;
  /** 인정기간 시작 (PDF: validFrom) */
  validFrom: string;
  /** 인정기간 종료 (PDF: validTo) */
  validTo: string;
  /** 휴대폰 (PDF: mobile) */
  mobile: string;
  /** 우편번호 */
  zipCode: string;
  /** 상세주소 (address와 합쳐 BasicInfo의 address+addressDetail에 대응) */
  addressDetail: string;
  /** 법적 생년월일 (PDF: legalDob, YYYY-MM-DD) */
  legalDob: string;
  /** 실제 생년월일 (양력 기준, 기초정보 realDob, YYYY-MM-DD) */
  realDob: string;
  /** 계약상태 (PDF: contractStatus) */
  contractStatus: ContractStatus;
  /** 서비스(계약 어휘, PDF: services) */
  services: CareSubCategory[];
  /** 서비스별 인정금액(PDF: approvedAmt*) */
  approvedAmts: { care?: number; bath?: number; nursing?: number; day?: number; other?: number };
  /** 보호자 목록 (PDF: guardians) */
  guardians: Guardian[];

  // ── 본 프로그램(일정/급여) 로컬 상태 ──
  assignedCareWorkerIds: string[];
  monthlyLimit: number;
  usedAmount: number;
  selfPay: number;
  status: 'active' | 'inactive';
  notes?: string;

  /**
   * 도로명주소(정본 — addressDetail과 합쳐 BasicInfo의 address+addressDetail에 대응).
   * TODO(data): 현재 mock row는 도로명+상세를 하나의 문자열에 합쳐두었고 addressDetail은 ''.
   * PDF 정본은 두 필드 분리이며, 자동 파싱이 어려워 실 데이터 입수 시 수작업 분리 필요.
   */
  address: string;
  /** 일정 도메인 운영 어휘(ServiceType[]) — services(계약 어휘)와 별개로 유지 */
  serviceTypes: ServiceType[];
}

/**
 * RecipientRow — mockData 내부 소스 row 타입(레거시 BasicInfo 필드 보유).
 * buildRecipient()가 이 row를 정본 Recipient로 변환한다.
 */
interface RecipientRow {
  id: string;
  name: string;
  registrationId: string;
  grade: RecipientGrade;
  copaymentType: string;
  copaymentRate: number;
  insuranceId: string;
  validityStart: string;
  validityEnd: string;
  assignedCareWorkerIds: string[];
  serviceTypes: ServiceType[];
  address: string;
  phone: string;
  guardian: string;
  guardianPhone: string;
  monthlyLimit: number;
  usedAmount: number;
  selfPay: number;
  status: 'active' | 'inactive';
  notes?: string;
}

// 통합 직원 엔티티 (외부 기초정보 시스템의 Employee)
export interface Employee {
  id: string;
  name: string;
  /** 별칭 — 동명이인 구분용(외부 공유 기초정보). 없을 수 있음. */
  nickname?: string;
  registrationId: string;
  phone: string;
  positionCode: string;  // POSITION_CODES 키
  qualification?: string;
  joinDate: string;
  assignedRecipientIds: string[];
  status: WorkerStatus;
}

// 하위 호환 타입 별칭
export type CareWorker = Employee;

export interface ScheduleEntry {
  id: string;
  recipientId: string;
  careWorkerId: string;
  date: string;
  serviceType: ServiceType;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  unitCost: number;
  // 모든 일정 entry 는 '계획' 캘린더 또는 '청구' 캘린더 둘 중 하나에 속한다.
  // 두 데이터셋은 분리되어 있으며, 같은 서비스라도 계획 entry(서비스계획서)
  // 와 청구 entry(RFID 실제 시간) 는 서로 다른 entry 로 존재한다.
  kind: 'plan' | 'claim';
  notes?: string;
  // 배정 시점 스냅샷(의도적 — 월중 등급·감경 변경에도 과거 일정은 당시 값 유지)
  grade?: RecipientGrade;        // 시점 스냅샷(의도적)
  copaymentType?: string;        // 시점 스냅샷(의도적)
  copaymentRate?: number;        // 시점 스냅샷(의도적)
  // 금액 스냅샷 (단가·부담률로부터 산출하여 명시 저장)
  benefitTotal?: number;         // 급여총액(1회)
  copayAmount?: number;          // 본인부담금(1회)
  insuranceAmount?: number;      // 공단청구액(1회)
  // 가산 스냅샷 (심야/일요일/공휴일 가산) — copay/insurance는 합산 기준으로 위 필드에 저장
  surchargeAmount?: number;      // 가산금 (십원 단위 올림)
  surchargeRate?: number;        // 적용 가산비율 (0.3/0.5)
  surchargeMinutes?: number;     // 가산 해당시간(분)
  // 급여액 수동 수정
  feeEdited?: boolean;           // 급여액을 수동으로 수정했음을 표시
}

// Constants
export const SERVICE_LABELS: Record<ServiceType, string> = {
  visit_care:     '방문요양',
  family_care:    '가족요양',
  full_day_visit: '종일방문',
  visit_bath:     '방문목욕',
  visit_nursing:  '방문간호',
  day_care:       '주간보호',
};

export const SERVICE_SHORT: Record<ServiceType, string> = {
  visit_care:     '요양',
  family_care:    '가족',
  full_day_visit: '종일',
  visit_bath:     '목욕',
  visit_nursing:  '간호',
  day_care:       '주간',
};

export const SERVICE_COLORS: Record<ServiceType, { bg: string; text: string; border: string }> = {
  visit_care:    { bg: 'bg-blue-50',    text: 'text-blue-800',    border: 'border-blue-200' },
  visit_bath:    { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  visit_nursing: { bg: 'bg-orange-50',  text: 'text-orange-800',  border: 'border-orange-200' },
  day_care:      { bg: 'bg-violet-50',  text: 'text-violet-800',  border: 'border-violet-200' },
  family_care:   { bg: 'bg-sky-50',     text: 'text-sky-800',     border: 'border-sky-200' },
  full_day_visit:{ bg: 'bg-indigo-50',  text: 'text-indigo-800',  border: 'border-indigo-200' },
};

export const GRADE_LIMITS: Record<RecipientGrade, number> = {
  1: 2306760,
  2: 2045680,
  3: 1697540,
  4: 1383950,
  5: 1166390,
};

// --- Helper ---
function genId(prefix: string, date: string, extra?: string) {
  return `${prefix}-${date}${extra ? '-' + extra : ''}`;
}

function generateSchedules(
  recipientId: string,
  careWorkerId: string,
  year: number,
  month: number,
  weekdays: number[],
  serviceType: ServiceType,
  startTime: string,
  endTime: string,
  durationMinutes: number,
  unitCost: number,
  excludeDates: string[] = []
): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr = '2026-03-21';

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dow = date.getDay();
    const mm = String(month).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${year}-${mm}-${dd}`;

    if (weekdays.includes(dow) && !excludeDates.includes(dateStr)) {
      entries.push({
        id: genId('SCH', dateStr, `${recipientId}-${careWorkerId}`),
        recipientId,
        careWorkerId,
        date: dateStr,
        serviceType,
        startTime,
        endTime,
        durationMinutes,
        unitCost,
        kind: dateStr < todayStr ? 'claim' : 'plan',
        notes: undefined,
      });
    }
  }
  return entries;
}

// --- Employees (통합 직원 — 외부 기초정보 시스템 공유) ---
export const employees: Employee[] = [
  // 요양보호사 ST_08 (15명)
  { id: 'W001', name: '윤소영', registrationId: '760220-2******', phone: '010-2345-6789', positionCode: 'ST_08', qualification: '요양보호사 1급', joinDate: '2022-03-01', assignedRecipientIds: ['R001', 'R006', 'R007'], status: 'active' },
  { id: 'W002', name: '김미경', registrationId: '681105-2******', phone: '010-3456-7890', positionCode: 'ST_08', qualification: '요양보호사 1급', joinDate: '2021-06-15', assignedRecipientIds: ['R002', 'R008', 'R009'], status: 'active' },
  { id: 'W003', name: '이정숙', registrationId: '720830-2******', phone: '010-4567-8901', positionCode: 'ST_08', qualification: '요양보호사 1급', joinDate: '2023-01-10', assignedRecipientIds: ['R002', 'R003', 'R010', 'R011'], status: 'active' },
  { id: 'W004', name: '박선영', registrationId: '780415-2******', phone: '010-5678-9012', positionCode: 'ST_08', qualification: '요양보호사 1급', joinDate: '2022-09-01', assignedRecipientIds: ['R004', 'R012', 'R013'], status: 'active' },
  { id: 'W005', name: '최민준', registrationId: '850722-1******', phone: '010-6789-0123', positionCode: 'ST_08', qualification: '요양보호사 1급', joinDate: '2023-04-01', assignedRecipientIds: ['R003', 'R005', 'R014', 'R015'], status: 'active' },
  { id: 'W006', name: '강혜진', registrationId: '790305-2******', phone: '010-7890-1234', positionCode: 'ST_08', qualification: '요양보호사 1급', joinDate: '2021-11-01', assignedRecipientIds: ['R016', 'R017', 'R018', 'R019'], status: 'active' },
  { id: 'W007', name: '정은주', registrationId: '810628-2******', phone: '010-8901-2345', positionCode: 'ST_08', qualification: '요양보호사 1급', joinDate: '2022-05-16', assignedRecipientIds: ['R020', 'R021', 'R022'], status: 'active' },
  { id: 'W008', name: '한수진', registrationId: '740912-2******', phone: '010-9012-3456', positionCode: 'ST_08', qualification: '요양보호사 1급', joinDate: '2020-08-01', assignedRecipientIds: ['R023', 'R024', 'R025', 'R026'], status: 'active' },
  { id: 'W009', name: '임지영', registrationId: '830417-2******', phone: '010-0123-4567', positionCode: 'ST_08', qualification: '요양보호사 1급', joinDate: '2023-07-01', assignedRecipientIds: ['R027', 'R028', 'R029'], status: 'active' },
  { id: 'W010', name: '조민서', registrationId: '770924-2******', phone: '010-1234-0987', positionCode: 'ST_08', qualification: '요양보호사 1급', joinDate: '2021-03-15', assignedRecipientIds: ['R030', 'R031', 'R032', 'R033'], status: 'active' },
  { id: 'W011', name: '오영숙', registrationId: '691130-2******', phone: '010-2345-1098', positionCode: 'ST_08', qualification: '요양보호사 1급', joinDate: '2020-01-06', assignedRecipientIds: ['R034', 'R035', 'R036'], status: 'active' },
  { id: 'W012', name: '장미란', registrationId: '800506-2******', phone: '010-3456-2109', positionCode: 'ST_08', qualification: '요양보호사 1급', joinDate: '2022-12-01', assignedRecipientIds: ['R037', 'R038', 'R039', 'R040'], status: 'active' },
  { id: 'W013', name: '신정아', registrationId: '751214-2******', phone: '010-4567-3210', positionCode: 'ST_08', qualification: '요양보호사 1급', joinDate: '2023-02-20', assignedRecipientIds: ['R041', 'R042', 'R043', 'R044'], status: 'active' },
  { id: 'W014', name: '류민경', registrationId: '820803-2******', phone: '010-5678-4321', positionCode: 'ST_08', qualification: '요양보호사 1급', joinDate: '2021-09-01', assignedRecipientIds: ['R045', 'R046', 'R047'], status: 'active' },
  { id: 'W015', name: '허지연', registrationId: '880219-2******', phone: '010-6789-5432', positionCode: 'ST_08', qualification: '요양보호사 1급', joinDate: '2024-01-15', assignedRecipientIds: ['R048', 'R049', 'R050'], status: 'active' },
  // 시설장 ST_01 / 사회복지사 ST_03 / 간호사 ST_04
  { id: 'SW000', name: '최원장',  registrationId: '720115-1******', phone: '010-9999-0000', positionCode: 'ST_01', qualification: '사회복지사 1급', joinDate: '2015-01-02', assignedRecipientIds: [], status: 'active' },
  { id: 'SW001', name: '김지원',  registrationId: '850312-2******', phone: '010-1111-2222', positionCode: 'ST_03', qualification: '사회복지사 1급', joinDate: '2020-03-02', assignedRecipientIds: ['R001','R002','R003','R004','R005','R006','R007','R008','R009','R010','R011','R012','R013','R014','R015','R016','R017'], status: 'active' },
  { id: 'SW002', name: '박수현',  registrationId: '880605-2******', phone: '010-3333-4444', positionCode: 'ST_04', qualification: '간호사',          joinDate: '2021-01-04', assignedRecipientIds: ['R018','R019','R020','R021','R022','R023','R024','R025','R026','R027','R028','R029','R030','R031','R032','R033','R034'], status: 'active' },
  { id: 'SW003', name: '이나연',  registrationId: '920917-2******', phone: '010-5555-6666', positionCode: 'ST_03', qualification: '사회복지사 2급', joinDate: '2022-07-11', assignedRecipientIds: ['R035','R036','R037','R038','R039','R040','R041','R042','R043','R044','R045','R046','R047','R048','R049','R050'], status: 'active' },
];

// 직종 코드 기반 파생 배열 — 각 화면에서 필터링 없이 바로 사용
export const careWorkers   = employees.filter(e => CARE_WORKER_POSITIONS.includes(e.positionCode));
export const socialWorkers = employees.filter(e => CONSULT_WORKER_POSITIONS.includes(e.positionCode));

// --- Recipients (50명) ---
const _recipientRows: RecipientRow[] = [
  // ─── 1등급 (5명) ─────────────────────────────────────────────────────
  { id: 'R001', name: '김영모', registrationId: 'L2512021717-100', grade: 3, copaymentType: '감경9%', copaymentRate: 9, insuranceId: '441223-1******', validityStart: '2024-12-23', validityEnd: '2027-12-23', assignedCareWorkerIds: ['W001', 'W005'], serviceTypes: ['visit_care', 'visit_bath', 'visit_nursing'], address: '서울시 노원구 상계동 123-45', phone: '010-1234-5678', guardian: '김철수', guardianPhone: '010-9876-5432', monthlyLimit: 1697540, usedAmount: 684240, selfPay: 82110, status: 'active', notes: '방문요양 주5일(월~금), 격주 월요일 방문목욕·방문간호 병행' },
  { id: 'R002', name: '이철수', registrationId: 'M3403031820-201', grade: 2, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '530508-1******', validityStart: '2025-02-01', validityEnd: '2027-01-31', assignedCareWorkerIds: ['W002', 'W003'], serviceTypes: ['visit_care', 'visit_bath'], address: '서울시 도봉구 방학동 45-12', phone: '010-2233-4455', guardian: '이민수', guardianPhone: '010-1122-3344', monthlyLimit: 2045680, usedAmount: 920500, selfPay: 138075, status: 'active', notes: '방문요양+방문목욕 병행' },
  { id: 'R003', name: '박미영', registrationId: 'K5601021234-302', grade: 4, copaymentType: '기초수급자', copaymentRate: 0, insuranceId: '470315-2******', validityStart: '2025-05-01', validityEnd: '2026-04-30', assignedCareWorkerIds: ['W003', 'W005'], serviceTypes: ['visit_care', 'family_care'], address: '서울시 강북구 수유동 78-9', phone: '010-3344-5566', guardian: '박준호', guardianPhone: '010-2233-4466', monthlyLimit: 1383950, usedAmount: 462000, selfPay: 0, status: 'active', notes: '방문요양+가족요양 병행 (딸 W005 담당)' },
  { id: 'R004', name: '최순자', registrationId: 'N4802121567-101', grade: 3, copaymentType: '감경6%', copaymentRate: 6, insuranceId: '380625-2******', validityStart: '2024-08-01', validityEnd: '2026-07-31', assignedCareWorkerIds: ['W004'], serviceTypes: ['visit_care'], address: '서울시 중랑구 면목동 102-33', phone: '010-4455-6677', guardian: '최병구', guardianPhone: '010-3344-5577', monthlyLimit: 1697540, usedAmount: 570200, selfPay: 68424, status: 'active' },
  { id: 'R005', name: '정대호', registrationId: 'P6710150988-402', grade: 1, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '310918-1******', validityStart: '2025-10-01', validityEnd: '2027-09-30', assignedCareWorkerIds: ['W001', 'W005'], serviceTypes: ['visit_care', 'visit_nursing'], address: '서울시 노원구 월계동 55-22', phone: '010-5566-7788', guardian: '정은지', guardianPhone: '010-4455-6688', monthlyLimit: 2306760, usedAmount: 1140400, selfPay: 171060, status: 'active', notes: '방문요양+방문간호 병행' },

  // ─── 2등급 (계속) ────────────────────────────────────────────────────
  { id: 'R006', name: '한복순', registrationId: 'A4203140123-601', grade: 1, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '420314-2******', validityStart: '2025-03-01', validityEnd: '2027-02-28', assignedCareWorkerIds: ['W001'], serviceTypes: ['visit_care'], address: '서울시 노원구 중계동 88-14', phone: '010-6677-8899', guardian: '한재원', guardianPhone: '010-5566-7799', monthlyLimit: 2306760, usedAmount: 1520000, selfPay: 228000, status: 'active' },
  { id: 'R007', name: '윤창식', registrationId: 'B4808070234-701', grade: 1, copaymentType: '감경9%', copaymentRate: 9, insuranceId: '480807-1******', validityStart: '2024-06-01', validityEnd: '2026-05-31', assignedCareWorkerIds: ['W001'], serviceTypes: ['visit_care', 'visit_bath'], address: '서울시 도봉구 쌍문동 37-5', phone: '010-7788-9900', guardian: '윤미선', guardianPhone: '010-6677-8800', monthlyLimit: 2306760, usedAmount: 1680000, selfPay: 201600, status: 'active' },
  { id: 'R008', name: '임말순', registrationId: 'C3505220345-302', grade: 3, copaymentType: '감경6%', copaymentRate: 6, insuranceId: '350522-2******', validityStart: '2025-01-01', validityEnd: '2027-12-31', assignedCareWorkerIds: ['W002'], serviceTypes: ['visit_care'], address: '서울시 성북구 길음동 201-8', phone: '010-8899-0011', guardian: '임성호', guardianPhone: '010-7788-0011', monthlyLimit: 1697540, usedAmount: 710000, selfPay: 85200, status: 'active' },
  { id: 'R009', name: '오병호', registrationId: 'D5210300456-201', grade: 2, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '521030-1******', validityStart: '2025-07-01', validityEnd: '2027-06-30', assignedCareWorkerIds: ['W002'], serviceTypes: ['visit_care'], address: '서울시 동대문구 휘경동 55-23', phone: '010-9900-1122', guardian: '오정민', guardianPhone: '010-8899-1122', monthlyLimit: 2045680, usedAmount: 890000, selfPay: 133500, status: 'active' },
  { id: 'R010', name: '장정희', registrationId: 'E4006180567-402', grade: 4, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '400618-2******', validityStart: '2024-11-01', validityEnd: '2026-10-31', assignedCareWorkerIds: ['W003'], serviceTypes: ['visit_care', 'visit_bath', 'day_care'], address: '서울시 광진구 중곡동 134-7', phone: '010-0011-2233', guardian: '장병수', guardianPhone: '010-9900-2233', monthlyLimit: 1383950, usedAmount: 542000, selfPay: 81300, status: 'active', notes: '방문요양+주간보호 병행 (화·목 주간보호센터)' },
  { id: 'R011', name: '조덕배', registrationId: 'F3712050678-101', grade: 1, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '371205-1******', validityStart: '2025-04-01', validityEnd: '2027-03-31', assignedCareWorkerIds: ['W003', 'W004'], serviceTypes: ['visit_care', 'visit_bath', 'visit_nursing'], address: '서울시 성동구 행당동 66-12', phone: '010-1122-3344', guardian: '조민재', guardianPhone: '010-0011-3344', monthlyLimit: 2306760, usedAmount: 1890000, selfPay: 283500, status: 'active', notes: '뇌졸중 후유증, 방문간호 필요' },
  { id: 'R012', name: '강순례', registrationId: 'G4509250789-302', grade: 3, copaymentType: '감경9%', copaymentRate: 9, insuranceId: '450925-2******', validityStart: '2024-09-01', validityEnd: '2026-08-31', assignedCareWorkerIds: ['W004'], serviceTypes: ['visit_care'], address: '서울시 은평구 불광동 91-3', phone: '010-2233-4455', guardian: '강동현', guardianPhone: '010-1122-4455', monthlyLimit: 1697540, usedAmount: 634000, selfPay: 76080, status: 'active' },
  { id: 'R013', name: '신기태', registrationId: 'H5503140890-201', grade: 2, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '550314-1******', validityStart: '2025-08-01', validityEnd: '2027-07-31', assignedCareWorkerIds: ['W004'], serviceTypes: ['visit_care', 'visit_nursing'], address: '서울시 서대문구 남가좌동 47-9', phone: '010-3344-5566', guardian: '신혜원', guardianPhone: '010-2233-5566', monthlyLimit: 2045680, usedAmount: 980000, selfPay: 147000, status: 'active' },
  { id: 'R014', name: '류옥순', registrationId: 'I3911270901-402', grade: 4, copaymentType: '기초수급자', copaymentRate: 0, insuranceId: '391127-2******', validityStart: '2025-06-01', validityEnd: '2027-05-31', assignedCareWorkerIds: ['W005'], serviceTypes: ['visit_care'], address: '서울시 노원구 상계동 302-1', phone: '010-4455-6677', guardian: '류성민', guardianPhone: '010-3344-6677', monthlyLimit: 1383950, usedAmount: 480000, selfPay: 0, status: 'active' },
  { id: 'R015', name: '허명자', registrationId: 'J4307060912-302', grade: 3, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '430706-2******', validityStart: '2024-10-01', validityEnd: '2026-09-30', assignedCareWorkerIds: ['W005'], serviceTypes: ['visit_care', 'visit_bath'], address: '서울시 도봉구 방학동 128-6', phone: '010-5566-7788', guardian: '허준형', guardianPhone: '010-4455-7788', monthlyLimit: 1697540, usedAmount: 756000, selfPay: 113400, status: 'active' },
  { id: 'R016', name: '남상철', registrationId: 'K4610150023-302', grade: 3, copaymentType: '감경6%', copaymentRate: 6, insuranceId: '461015-1******', validityStart: '2025-02-01', validityEnd: '2027-01-31', assignedCareWorkerIds: ['W006'], serviceTypes: ['visit_care'], address: '서울시 강북구 미아동 56-18', phone: '010-6677-8899', guardian: '남지현', guardianPhone: '010-5566-8899', monthlyLimit: 1697540, usedAmount: 622000, selfPay: 74640, status: 'active' },
  { id: 'R017', name: '고영자', registrationId: 'L3804200034-402', grade: 4, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '380420-2******', validityStart: '2024-07-01', validityEnd: '2026-06-30', assignedCareWorkerIds: ['W006'], serviceTypes: ['visit_care'], address: '서울시 중랑구 묵동 73-22', phone: '010-7788-9900', guardian: '고병철', guardianPhone: '010-6677-9900', monthlyLimit: 1383950, usedAmount: 495000, selfPay: 74250, status: 'active' },
  { id: 'R018', name: '문귀순', registrationId: 'M5208180045-402', grade: 4, copaymentType: '감경9%', copaymentRate: 9, insuranceId: '520818-2******', validityStart: '2025-01-01', validityEnd: '2026-12-31', assignedCareWorkerIds: ['W006'], serviceTypes: ['visit_care'], address: '서울시 성북구 돈암동 29-11', phone: '010-8899-0011', guardian: '문준서', guardianPhone: '010-7788-0011', monthlyLimit: 1383950, usedAmount: 465000, selfPay: 55800, status: 'active' },
  { id: 'R019', name: '손정숙', registrationId: 'N4403020056-402', grade: 4, copaymentType: '감경6%', copaymentRate: 6, insuranceId: '440302-2******', validityStart: '2025-09-01', validityEnd: '2027-08-31', assignedCareWorkerIds: ['W006'], serviceTypes: ['visit_care'], address: '서울시 동대문구 이문동 81-4', phone: '010-9900-1122', guardian: '손동욱', guardianPhone: '010-8899-1122', monthlyLimit: 1383950, usedAmount: 510000, selfPay: 61200, status: 'active' },
  { id: 'R020', name: '양창호', registrationId: 'O4911100067-201', grade: 2, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '491110-1******', validityStart: '2024-05-01', validityEnd: '2026-04-30', assignedCareWorkerIds: ['W007'], serviceTypes: ['visit_care', 'visit_bath'], address: '서울시 광진구 구의동 115-33', phone: '010-0011-2233', guardian: '양서연', guardianPhone: '010-9900-2233', monthlyLimit: 2045680, usedAmount: 1050000, selfPay: 157500, status: 'active' },
  { id: 'R021', name: '황혜숙', registrationId: 'P3607250078-302', grade: 3, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '360725-2******', validityStart: '2025-03-01', validityEnd: '2027-02-28', assignedCareWorkerIds: ['W007'], serviceTypes: ['visit_care'], address: '서울시 성동구 마장동 44-7', phone: '010-1122-3344', guardian: '황태민', guardianPhone: '010-0011-3344', monthlyLimit: 1697540, usedAmount: 660000, selfPay: 99000, status: 'active' },
  { id: 'R022', name: '서경숙', registrationId: 'Q4312080089-402', grade: 4, copaymentType: '감경9%', copaymentRate: 9, insuranceId: '431208-2******', validityStart: '2024-12-01', validityEnd: '2026-11-30', assignedCareWorkerIds: ['W007'], serviceTypes: ['visit_care'], address: '서울시 은평구 응암동 67-15', phone: '010-2233-4455', guardian: '서민준', guardianPhone: '010-1122-4455', monthlyLimit: 1383950, usedAmount: 445000, selfPay: 53400, status: 'active' },
  { id: 'R023', name: '전금순', registrationId: 'R3905170090-501', grade: 5, copaymentType: '기초수급자', copaymentRate: 0, insuranceId: '390517-2******', validityStart: '2025-11-01', validityEnd: '2027-10-31', assignedCareWorkerIds: ['W008'], serviceTypes: ['visit_care'], address: '서울시 서대문구 홍제동 52-9', phone: '010-3344-5566', guardian: '전병호', guardianPhone: '010-2233-5566', monthlyLimit: 1166390, usedAmount: 320000, selfPay: 0, status: 'active' },
  { id: 'R024', name: '권봉순', registrationId: 'S4802230001-302', grade: 3, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '480223-2******', validityStart: '2025-04-01', validityEnd: '2027-03-31', assignedCareWorkerIds: ['W008'], serviceTypes: ['visit_care'], address: '서울시 노원구 중계동 19-28', phone: '010-4455-6677', guardian: '권수진', guardianPhone: '010-3344-6677', monthlyLimit: 1697540, usedAmount: 700000, selfPay: 105000, status: 'active' },
  { id: 'R025', name: '백용호', registrationId: 'T5406090012-101', grade: 1, copaymentType: '감경6%', copaymentRate: 6, insuranceId: '540609-1******', validityStart: '2024-08-01', validityEnd: '2026-07-31', assignedCareWorkerIds: ['W008'], serviceTypes: ['visit_care', 'visit_nursing'], address: '서울시 도봉구 쌍문동 83-16', phone: '010-5566-7788', guardian: '백지은', guardianPhone: '010-4455-7788', monthlyLimit: 2306760, usedAmount: 1760000, selfPay: 211200, status: 'active', notes: '당뇨합병증, 방문간호 병행' },
  { id: 'R026', name: '심분이', registrationId: 'U4108310023-501', grade: 5, copaymentType: '기초수급자', copaymentRate: 0, insuranceId: '410831-2******', validityStart: '2025-06-01', validityEnd: '2027-05-31', assignedCareWorkerIds: ['W008'], serviceTypes: ['visit_care'], address: '서울시 강북구 수유동 104-2', phone: '010-6677-8899', guardian: '심태호', guardianPhone: '010-5566-8899', monthlyLimit: 1166390, usedAmount: 298000, selfPay: 0, status: 'active' },
  { id: 'R027', name: '노창수', registrationId: 'V5312150034-302', grade: 3, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '531215-1******', validityStart: '2025-01-01', validityEnd: '2026-12-31', assignedCareWorkerIds: ['W009'], serviceTypes: ['visit_care', 'visit_bath'], address: '서울시 중랑구 면목동 67-31', phone: '010-7788-9900', guardian: '노수현', guardianPhone: '010-6677-9900', monthlyLimit: 1697540, usedAmount: 820000, selfPay: 123000, status: 'active' },
  { id: 'R028', name: '나덕순', registrationId: 'W3704140045-201', grade: 2, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '370414-2******', validityStart: '2024-10-01', validityEnd: '2026-09-30', assignedCareWorkerIds: ['W009'], serviceTypes: ['visit_care'], address: '서울시 성북구 길음동 38-19', phone: '010-8899-0011', guardian: '나정민', guardianPhone: '010-7788-0011', monthlyLimit: 2045680, usedAmount: 960000, selfPay: 144000, status: 'active' },
  { id: 'R029', name: '하순이', registrationId: 'X4507120056-402', grade: 4, copaymentType: '감경9%', copaymentRate: 9, insuranceId: '450712-2******', validityStart: '2025-07-01', validityEnd: '2027-06-30', assignedCareWorkerIds: ['W009'], serviceTypes: ['visit_care'], address: '서울시 동대문구 이문동 92-7', phone: '010-9900-1122', guardian: '하민석', guardianPhone: '010-8899-1122', monthlyLimit: 1383950, usedAmount: 530000, selfPay: 63600, status: 'active' },
  { id: 'R030', name: '유길동', registrationId: 'Y4610030067-501', grade: 5, copaymentType: '기초수급자', copaymentRate: 0, insuranceId: '461003-1******', validityStart: '2025-02-01', validityEnd: '2027-01-31', assignedCareWorkerIds: ['W010'], serviceTypes: ['visit_care'], address: '서울시 광진구 중곡동 201-5', phone: '010-0011-2233', guardian: '유선아', guardianPhone: '010-9900-2233', monthlyLimit: 1166390, usedAmount: 340000, selfPay: 0, status: 'active' },
  { id: 'R031', name: '김정자', registrationId: 'Z4008270078-501', grade: 5, copaymentType: '기초수급자', copaymentRate: 0, insuranceId: '400827-2******', validityStart: '2025-05-01', validityEnd: '2027-04-30', assignedCareWorkerIds: ['W010'], serviceTypes: ['visit_care'], address: '서울시 성동구 행당동 77-3', phone: '010-1122-3344', guardian: '김태영', guardianPhone: '010-0011-3344', monthlyLimit: 1166390, usedAmount: 312000, selfPay: 0, status: 'active' },
  { id: 'R032', name: '이병식', registrationId: 'A5501280089-201', grade: 2, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '550128-1******', validityStart: '2024-03-01', validityEnd: '2026-02-28', assignedCareWorkerIds: ['W010'], serviceTypes: ['visit_care'], address: '서울시 은평구 불광동 43-11', phone: '010-2233-4455', guardian: '이수현', guardianPhone: '010-1122-4455', monthlyLimit: 2045680, usedAmount: 1100000, selfPay: 165000, status: 'active' },
  { id: 'R033', name: '박갑순', registrationId: 'B4206150090-302', grade: 3, copaymentType: '감경6%', copaymentRate: 6, insuranceId: '420615-2******', validityStart: '2025-08-01', validityEnd: '2027-07-31', assignedCareWorkerIds: ['W010'], serviceTypes: ['visit_care'], address: '서울시 서대문구 남가좌동 58-4', phone: '010-3344-5566', guardian: '박재훈', guardianPhone: '010-2233-5566', monthlyLimit: 1697540, usedAmount: 640000, selfPay: 76800, status: 'active' },
  { id: 'R034', name: '최만복', registrationId: 'C3811090001-101', grade: 1, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '381109-1******', validityStart: '2025-01-01', validityEnd: '2026-12-31', assignedCareWorkerIds: ['W011'], serviceTypes: ['visit_care', 'visit_nursing'], address: '서울시 노원구 상계동 445-6', phone: '010-4455-6677', guardian: '최수정', guardianPhone: '010-3344-6677', monthlyLimit: 2306760, usedAmount: 2050000, selfPay: 307500, status: 'active', notes: '중증 치매, 24시간 보호 필요' },
  { id: 'R035', name: '정점순', registrationId: 'D4703240012-402', grade: 4, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '470324-2******', validityStart: '2025-03-01', validityEnd: '2027-02-28', assignedCareWorkerIds: ['W011'], serviceTypes: ['visit_care'], address: '서울시 도봉구 방학동 29-17', phone: '010-5566-7788', guardian: '정현우', guardianPhone: '010-4455-7788', monthlyLimit: 1383950, usedAmount: 520000, selfPay: 78000, status: 'active' },
  { id: 'R036', name: '한춘자', registrationId: 'E3608160023-302', grade: 3, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '360816-2******', validityStart: '2024-06-01', validityEnd: '2026-05-31', assignedCareWorkerIds: ['W011'], serviceTypes: ['visit_care', 'visit_bath'], address: '서울시 강북구 미아동 33-28', phone: '010-6677-8899', guardian: '한지호', guardianPhone: '010-5566-8899', monthlyLimit: 1697540, usedAmount: 740000, selfPay: 111000, status: 'active' },
  { id: 'R037', name: '윤을순', registrationId: 'F4505030034-402', grade: 4, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '450503-2******', validityStart: '2025-04-01', validityEnd: '2027-03-31', assignedCareWorkerIds: ['W012'], serviceTypes: ['visit_care'], address: '서울시 중랑구 묵동 58-9', phone: '010-7788-9900', guardian: '윤성재', guardianPhone: '010-6677-9900', monthlyLimit: 1383950, usedAmount: 490000, selfPay: 73500, status: 'active' },
  { id: 'R038', name: '임정임', registrationId: 'G5207300045-501', grade: 5, copaymentType: '기초수급자', copaymentRate: 0, insuranceId: '520730-2******', validityStart: '2025-09-01', validityEnd: '2027-08-31', assignedCareWorkerIds: ['W012'], serviceTypes: ['visit_care'], address: '서울시 성북구 돈암동 74-13', phone: '010-8899-0011', guardian: '임재민', guardianPhone: '010-7788-0011', monthlyLimit: 1166390, usedAmount: 285000, selfPay: 0, status: 'active' },
  { id: 'R039', name: '오복남', registrationId: 'H4312200056-302', grade: 3, copaymentType: '감경9%', copaymentRate: 9, insuranceId: '431220-1******', validityStart: '2024-11-01', validityEnd: '2026-10-31', assignedCareWorkerIds: ['W012'], serviceTypes: ['visit_care'], address: '서울시 동대문구 휘경동 91-6', phone: '010-9900-1122', guardian: '오민지', guardianPhone: '010-8899-1122', monthlyLimit: 1697540, usedAmount: 680000, selfPay: 81600, status: 'active' },
  { id: 'R040', name: '장봉순', registrationId: 'I3909060067-201', grade: 2, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '390906-2******', validityStart: '2025-05-01', validityEnd: '2027-04-30', assignedCareWorkerIds: ['W012'], serviceTypes: ['visit_care', 'visit_bath'], address: '서울시 광진구 구의동 22-44', phone: '010-0011-2233', guardian: '장혁준', guardianPhone: '010-9900-2233', monthlyLimit: 2045680, usedAmount: 1020000, selfPay: 153000, status: 'active' },
  { id: 'R041', name: '조태순', registrationId: 'J5104180078-302', grade: 3, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '510418-2******', validityStart: '2024-09-01', validityEnd: '2026-08-31', assignedCareWorkerIds: ['W013'], serviceTypes: ['visit_care'], address: '서울시 성동구 마장동 53-27', phone: '010-1122-3344', guardian: '조수빈', guardianPhone: '010-0011-3344', monthlyLimit: 1697540, usedAmount: 730000, selfPay: 109500, status: 'active' },
  { id: 'R042', name: '강영임', registrationId: 'K4407230089-501', grade: 5, copaymentType: '기초수급자', copaymentRate: 0, insuranceId: '440723-2******', validityStart: '2025-02-01', validityEnd: '2027-01-31', assignedCareWorkerIds: ['W013'], serviceTypes: ['visit_care'], address: '서울시 은평구 응암동 16-8', phone: '010-2233-4455', guardian: '강민호', guardianPhone: '010-1122-4455', monthlyLimit: 1166390, usedAmount: 310000, selfPay: 0, status: 'active' },
  { id: 'R043', name: '신병순', registrationId: 'L5510300090-302', grade: 3, copaymentType: '감경6%', copaymentRate: 6, insuranceId: '551030-2******', validityStart: '2025-07-01', validityEnd: '2027-06-30', assignedCareWorkerIds: ['W013'], serviceTypes: ['visit_care'], address: '서울시 서대문구 홍제동 84-5', phone: '010-3344-5566', guardian: '신준하', guardianPhone: '010-2233-5566', monthlyLimit: 1697540, usedAmount: 615000, selfPay: 73800, status: 'active' },
  { id: 'R044', name: '류분임', registrationId: 'M3802150001-402', grade: 4, copaymentType: '기초수급자', copaymentRate: 0, insuranceId: '380215-2******', validityStart: '2023-03-01', validityEnd: '2025-02-28', assignedCareWorkerIds: ['W013'], serviceTypes: ['visit_care'], address: '서울시 노원구 월계동 119-3', phone: '010-4455-6677', guardian: '류정수', guardianPhone: '010-3344-6677', monthlyLimit: 1383950, usedAmount: 0, selfPay: 0, status: 'inactive', notes: '유효기간 만료, 갱신 필요' },
  { id: 'R045', name: '허영순', registrationId: 'N4705110012-501', grade: 5, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '470511-2******', validityStart: '2025-10-01', validityEnd: '2027-09-30', assignedCareWorkerIds: ['W014'], serviceTypes: ['visit_care'], address: '서울시 도봉구 쌍문동 64-21', phone: '010-5566-7788', guardian: '허승현', guardianPhone: '010-4455-7788', monthlyLimit: 1166390, usedAmount: 370000, selfPay: 55500, status: 'active' },
  { id: 'R046', name: '남숙자', registrationId: 'O4209140023-302', grade: 3, copaymentType: '감경9%', copaymentRate: 9, insuranceId: '420914-2******', validityStart: '2025-01-01', validityEnd: '2026-12-31', assignedCareWorkerIds: ['W014'], serviceTypes: ['visit_care'], address: '서울시 강북구 수유동 203-14', phone: '010-6677-8899', guardian: '남기현', guardianPhone: '010-5566-8899', monthlyLimit: 1697540, usedAmount: 654000, selfPay: 78480, status: 'active' },
  { id: 'R047', name: '고창호', registrationId: 'P4903250034-201', grade: 2, copaymentType: '일반대상자', copaymentRate: 15, insuranceId: '490325-1******', validityStart: '2024-04-01', validityEnd: '2026-03-31', assignedCareWorkerIds: ['W014'], serviceTypes: ['visit_care', 'visit_bath'], address: '서울시 중랑구 면목동 38-26', phone: '010-7788-9900', guardian: '고수빈', guardianPhone: '010-6677-9900', monthlyLimit: 2045680, usedAmount: 1080000, selfPay: 162000, status: 'active' },
  { id: 'R048', name: '문병호', registrationId: 'Q5307070045-302', grade: 3, copaymentType: '감경6%', copaymentRate: 6, insuranceId: '530707-1******', validityStart: '2025-06-01', validityEnd: '2027-05-31', assignedCareWorkerIds: ['W015'], serviceTypes: ['visit_care'], address: '서울시 성북구 길음동 115-19', phone: '010-8899-0011', guardian: '문지영', guardianPhone: '010-7788-0011', monthlyLimit: 1697540, usedAmount: 590000, selfPay: 70800, status: 'active' },
  { id: 'R049', name: '손미자', registrationId: 'R4101280056-501', grade: 5, copaymentType: '기초수급자', copaymentRate: 0, insuranceId: '410128-2******', validityStart: '2022-07-01', validityEnd: '2024-06-30', assignedCareWorkerIds: ['W015'], serviceTypes: ['visit_care'], address: '서울시 동대문구 휘경동 27-8', phone: '010-9900-1122', guardian: '손병태', guardianPhone: '010-8899-1122', monthlyLimit: 1166390, usedAmount: 0, selfPay: 0, status: 'inactive', notes: '유효기간 만료, 타 기관 이용 중' },
  { id: 'R050', name: '양덕수', registrationId: 'S3610040067-201', grade: 2, copaymentType: '감경9%', copaymentRate: 9, insuranceId: '361004-1******', validityStart: '2025-08-01', validityEnd: '2027-07-31', assignedCareWorkerIds: ['W015'], serviceTypes: ['visit_care'], address: '서울시 광진구 중곡동 89-33', phone: '010-0011-2233', guardian: '양지수', guardianPhone: '010-9900-2233', monthlyLimit: 2045680, usedAmount: 870000, selfPay: 104400, status: 'active' },
];

// ── ServiceType(일정 어휘) ↔ CareSubCategory(계약 어휘) 매핑 ─────────────────
export const SERVICE_TO_SUB: Record<ServiceType, CareSubCategory> = {
  visit_care: '요양',
  visit_bath: '목욕',
  visit_nursing: '간호',
  day_care: '주간',
  family_care: '요양', // 가족요양은 방문요양의 한 형태
  full_day_visit: '요양', // 종일방문은 방문요양의 한 형태
};

// ── RecipientRow → 정본 Recipient 변환 ───────────────────────────────────────
function deriveLegalDob(insuranceId: string): string {
  const raw = insuranceId.replace(/\D/g, '').substring(0, 7);
  if (raw.length < 7) return '';
  const yy = raw.slice(0, 2);
  const mm = raw.slice(2, 4);
  const dd = raw.slice(4, 6);
  const g  = parseInt(raw[6] ?? '1', 10);
  const century = g <= 2 ? '19' : '20';
  return `${century}${yy}-${mm}-${dd}`;
}

function deriveApprovedAmts(serviceTypes: ServiceType[], monthlyLimit: number) {
  const map: Record<ServiceType, 'care' | 'bath' | 'nursing' | 'day' | 'other'> = {
    visit_care: 'care',
    visit_bath: 'bath',
    visit_nursing: 'nursing',
    day_care: 'day',
    family_care: 'other',
    full_day_visit: 'care',
  };
  const active = serviceTypes.length || 1;
  const each = Math.round(monthlyLimit / active);
  const out = { care: 0, bath: 0, nursing: 0, day: 0, other: 0 };
  serviceTypes.forEach(st => { out[map[st]] = each; });
  return out;
}

function buildRecipient(row: RecipientRow): Recipient {
  return {
    id: row.id,
    name: row.name,

    // 정본
    certNo:       row.registrationId,
    gradeText:    `${row.grade}등급`,
    reduction:    parseReductionFromLegacy(row.copaymentType),
    validFrom:    row.validityStart,
    validTo:      row.validityEnd,
    mobile:       row.phone,
    zipCode:      '',
    addressDetail: '',
    legalDob:     deriveLegalDob(row.insuranceId),
    realDob:      deriveLegalDob(row.insuranceId), // 실제 생년월일: 현재 mock은 법적 생년월일과 동일, 실 데이터 입수 시 분리
    contractStatus: row.status === 'active' ? '수급중' : '계약종료',
    services:     Array.from(new Set(row.serviceTypes.map(st => SERVICE_TO_SUB[st]))),
    approvedAmts: deriveApprovedAmts(row.serviceTypes, row.monthlyLimit),
    guardians:    row.guardian ? [{
      id: 1,
      name: row.guardian,
      relation: '배우자',
      relationDirect: '',
      homePhone: '',
      mobile: row.guardianPhone,
      mobileKakao: false,
      zipCode: '',
      address: row.address,
      addressDetail: '',
    }] : [],

    // 로컬 상태
    assignedCareWorkerIds: row.assignedCareWorkerIds,
    monthlyLimit: row.monthlyLimit,
    usedAmount:   row.usedAmount,
    selfPay:      row.selfPay,
    status:       row.status,
    notes:        row.notes,

    // 운영 도메인(서비스 운영 어휘·도로명주소)
    serviceTypes: row.serviceTypes,
    address:      row.address,
  };
}

export const recipients: Recipient[] = _recipientRows.map(buildRecipient);

// --- Schedules for 2026-03 ---
const EXCL = ['2026-03-01']; // 3/1 삼일절

const schedules2026_03: ScheduleEntry[] = [
  // R001 김영모 - W001: 방문요양 월~금
  ...generateSchedules('R001','W001',2026,3,[1,2,3,4,5],'visit_care','10:00','13:00',180,57020,EXCL),
  // R001 김영모 - 격주 월요일: 방문간호(W005) + 방문목욕(W001) → 3건/일
  { id:'SCH-2026-03-09-R001-W005-nursing', recipientId:'R001', careWorkerId:'W005', date:'2026-03-09', serviceType:'visit_nursing', startTime:'09:00', endTime:'09:30', durationMinutes:30, unitCost:53770, kind:'claim' },
  { id:'SCH-2026-03-09-R001-W001-bath',    recipientId:'R001', careWorkerId:'W001', date:'2026-03-09', serviceType:'visit_bath',    startTime:'14:00', endTime:'15:00', durationMinutes:60, unitCost:88990, kind:'claim' },
  { id:'SCH-2026-03-16-R001-W005-nursing', recipientId:'R001', careWorkerId:'W005', date:'2026-03-16', serviceType:'visit_nursing', startTime:'09:00', endTime:'09:30', durationMinutes:30, unitCost:53770, kind:'claim' },
  { id:'SCH-2026-03-16-R001-W001-bath',    recipientId:'R001', careWorkerId:'W001', date:'2026-03-16', serviceType:'visit_bath',    startTime:'14:00', endTime:'15:00', durationMinutes:60, unitCost:88990, kind:'claim' },
  { id:'SCH-2026-03-23-R001-W005-nursing', recipientId:'R001', careWorkerId:'W005', date:'2026-03-23', serviceType:'visit_nursing', startTime:'09:00', endTime:'09:30', durationMinutes:30, unitCost:53770, kind:'plan' },
  { id:'SCH-2026-03-23-R001-W001-bath',    recipientId:'R001', careWorkerId:'W001', date:'2026-03-23', serviceType:'visit_bath',    startTime:'14:00', endTime:'15:00', durationMinutes:60, unitCost:88990, kind:'plan' },
  // R002 이철수 - W002: 방문요양 월~목
  ...generateSchedules('R002','W002',2026,3,[1,2,3,4],'visit_care','09:00','12:00',180,57020),
  // R002 이철수 - W003: 방문목욕 격주 수요일
  { id:'SCH-2026-03-11-R002-W003', recipientId:'R002', careWorkerId:'W003', date:'2026-03-11', serviceType:'visit_bath', startTime:'11:00', endTime:'12:00', durationMinutes:60, unitCost:88990, kind:'claim' },
  { id:'SCH-2026-03-25-R002-W003', recipientId:'R002', careWorkerId:'W003', date:'2026-03-25', serviceType:'visit_bath', startTime:'11:00', endTime:'12:00', durationMinutes:60, unitCost:88990, kind:'plan' },
  // R003 박미영 - W003: 방문요양 월·수·금
  ...generateSchedules('R003','W003',2026,3,[1,3,5],'visit_care','10:00','12:00',120,43430),
  // R003 박미영 - W005: 가족요양 월~금
  ...generateSchedules('R003','W005',2026,3,[1,2,3,4,5],'family_care','09:00','10:00',60,25320),
  // R004 최순자 - W004: 방문요양 화·목
  ...generateSchedules('R004','W004',2026,3,[2,4],'visit_care','14:00','16:30',150,50640),
  // R005 정대호 - W001: 방문요양 월·수·금
  ...generateSchedules('R005','W001',2026,3,[1,3,5],'visit_care','08:00','11:00',180,57020,EXCL),
  // R005 정대호 - W005: 방문간호 화·목
  ...generateSchedules('R005','W005',2026,3,[2,4],'visit_nursing','09:00','09:30',30,61100),
  // R006 한복순 - W001: 방문요양 월~금
  ...generateSchedules('R006','W001',2026,3,[1,2,3,4,5],'visit_care','14:00','17:00',180,57020,EXCL),
  // R007 윤창식 - W001: 방문요양 월·수·금 + 목욕 격주
  ...generateSchedules('R007','W001',2026,3,[1,3,5],'visit_care','09:00','12:00',180,57020,EXCL),
  { id:'SCH-2026-03-07-R007-W001', recipientId:'R007', careWorkerId:'W001', date:'2026-03-07', serviceType:'visit_bath', startTime:'10:00', endTime:'11:00', durationMinutes:60, unitCost:88990, kind:'claim' },
  // R008 임말순 - W002: 방문요양 월~금
  ...generateSchedules('R008','W002',2026,3,[1,2,3,4,5],'visit_care','09:30','11:30',120,43430,EXCL),
  // R009 오병호 - W002: 방문요양 화·수·목·금
  ...generateSchedules('R009','W002',2026,3,[2,3,4,5],'visit_care','13:00','16:00',180,57020),
  // R010 장정희 - W003: 방문요양 월·수·금 + 목욕 격주
  ...generateSchedules('R010','W003',2026,3,[1,3,5],'visit_care','10:00','12:00',120,43430,EXCL),
  { id:'SCH-2026-03-14-R010-W003', recipientId:'R010', careWorkerId:'W003', date:'2026-03-14', serviceType:'visit_bath', startTime:'13:00', endTime:'14:00', durationMinutes:60, unitCost:88990, kind:'claim' },
  // R010 장정희 - W003: 주간보호 화·목
  ...generateSchedules('R010','W003',2026,3,[2,4],'day_care','09:00','15:00',360,46300,EXCL),
  // R011 조덕배 - W003: 방문요양 월~목 + 방문간호 + 방문목욕 → 화요일 3건/일
  ...generateSchedules('R011','W003',2026,3,[1,2,3,4],'visit_care','09:00','12:00',180,57020),
  { id:'SCH-2026-03-10-R011-W004',         recipientId:'R011', careWorkerId:'W004', date:'2026-03-10', serviceType:'visit_nursing', startTime:'10:00', endTime:'10:30', durationMinutes:30, unitCost:53770, kind:'claim' },
  { id:'SCH-2026-03-10-R011-W003-bath',    recipientId:'R011', careWorkerId:'W003', date:'2026-03-10', serviceType:'visit_bath',    startTime:'13:00', endTime:'14:00', durationMinutes:60, unitCost:88990, kind:'claim' },
  { id:'SCH-2026-03-17-R011-W004',         recipientId:'R011', careWorkerId:'W004', date:'2026-03-17', serviceType:'visit_nursing', startTime:'10:00', endTime:'10:30', durationMinutes:30, unitCost:53770, kind:'claim' },
  { id:'SCH-2026-03-17-R011-W003-bath',    recipientId:'R011', careWorkerId:'W003', date:'2026-03-17', serviceType:'visit_bath',    startTime:'13:00', endTime:'14:00', durationMinutes:60, unitCost:88990, kind:'claim' },
  { id:'SCH-2026-03-24-R011-W004',         recipientId:'R011', careWorkerId:'W004', date:'2026-03-24', serviceType:'visit_nursing', startTime:'10:00', endTime:'10:30', durationMinutes:30, unitCost:53770, kind:'plan' },
  { id:'SCH-2026-03-24-R011-W003-bath',    recipientId:'R011', careWorkerId:'W003', date:'2026-03-24', serviceType:'visit_bath',    startTime:'13:00', endTime:'14:00', durationMinutes:60, unitCost:88990, kind:'plan' },
  // R012 강순례 - W004: 방문요양 화·목
  ...generateSchedules('R012','W004',2026,3,[2,4],'visit_care','10:00','13:00',180,57020),
  // R013 신기태 - W004: 방문요양 월·수·금
  ...generateSchedules('R013','W004',2026,3,[1,3,5],'visit_care','14:00','16:00',120,43430,EXCL),
  // R014 류옥순 - W005: 방문요양 월·화·수
  ...generateSchedules('R014','W005',2026,3,[1,2,3],'visit_care','09:00','11:00',120,43430,EXCL),
  // R015 허명자 - W005: 방문요양 화·목 + 목욕 격주
  ...generateSchedules('R015','W005',2026,3,[2,4],'visit_care','13:00','16:00',180,57020),
  { id:'SCH-2026-03-13-R015-W005', recipientId:'R015', careWorkerId:'W005', date:'2026-03-13', serviceType:'visit_bath', startTime:'11:00', endTime:'12:00', durationMinutes:60, unitCost:88990, kind:'claim' },
  // R016 남상철 - W006: 방문요양 월~금
  ...generateSchedules('R016','W006',2026,3,[1,2,3,4,5],'visit_care','09:00','11:00',120,43430,EXCL),
  // R017 고영자 - W006: 방문요양 월·수·금
  ...generateSchedules('R017','W006',2026,3,[1,3,5],'visit_care','13:30','15:30',120,43430,EXCL),
  // R018 문귀순 - W006: 방문요양 화·목
  ...generateSchedules('R018','W006',2026,3,[2,4],'visit_care','10:00','12:30',150,50640),
  // R019 손정숙 - W006: 방문요양 월·화·수·목
  ...generateSchedules('R019','W006',2026,3,[1,2,3,4],'visit_care','14:00','16:00',120,43430,EXCL),
  // R020 양창호 - W007: 방문요양 월~금 + 목욕
  ...generateSchedules('R020','W007',2026,3,[1,2,3,4,5],'visit_care','09:00','12:00',180,57020,EXCL),
  { id:'SCH-2026-03-21-R020-W007', recipientId:'R020', careWorkerId:'W007', date:'2026-03-21', serviceType:'visit_bath', startTime:'13:00', endTime:'14:00', durationMinutes:60, unitCost:88990, kind:'plan' },
  // R021 황혜숙 - W007: 방문요양 월·수·금
  ...generateSchedules('R021','W007',2026,3,[1,3,5],'visit_care','10:30','12:30',120,43430,EXCL),
  // R022 서경숙 - W007: 방문요양 화·목·금
  ...generateSchedules('R022','W007',2026,3,[2,4,5],'visit_care','14:00','16:00',120,43430),
  // R023 전금순 - W008: 방문요양 월·수
  ...generateSchedules('R023','W008',2026,3,[1,3],'visit_care','09:00','11:00',120,43430,EXCL),
  // R024 권봉순 - W008: 방문요양 화·목
  ...generateSchedules('R024','W008',2026,3,[2,4],'visit_care','13:00','16:00',180,57020),
  // R025 백용호 - W008: 방문요양 월~금 + 방문간호
  ...generateSchedules('R025','W008',2026,3,[1,2,3,4,5],'visit_care','09:00','12:00',180,57020,EXCL),
  { id:'SCH-2026-03-06-R025-W009', recipientId:'R025', careWorkerId:'W009', date:'2026-03-06', serviceType:'visit_nursing', startTime:'14:00', endTime:'14:30', durationMinutes:30, unitCost:53770, kind:'claim' },
  { id:'SCH-2026-03-20-R025-W009', recipientId:'R025', careWorkerId:'W009', date:'2026-03-20', serviceType:'visit_nursing', startTime:'14:00', endTime:'14:30', durationMinutes:30, unitCost:53770, kind:'claim' },
  // R026 심분이 - W008: 방문요양 월·수·금
  ...generateSchedules('R026','W008',2026,3,[1,3,5],'visit_care','10:00','12:00',120,43430,EXCL),
  // R027 노창수 - W009: 방문요양 월~목 + 목욕 격주
  ...generateSchedules('R027','W009',2026,3,[1,2,3,4],'visit_care','09:30','12:30',180,57020,EXCL),
  { id:'SCH-2026-03-12-R027-W009-bath', recipientId:'R027', careWorkerId:'W009', date:'2026-03-12', serviceType:'visit_bath', startTime:'13:00', endTime:'14:00', durationMinutes:60, unitCost:88990, kind:'claim' },
  // R028 나덕순 - W009: 방문요양 월~금
  ...generateSchedules('R028','W009',2026,3,[1,2,3,4,5],'visit_care','13:00','16:00',180,57020,EXCL),
  // R029 하순이 - W009: 방문요양 화·수·목
  ...generateSchedules('R029','W009',2026,3,[2,3,4],'visit_care','10:00','12:00',120,43430),
  // R030 유길동 - W010: 방문요양 월·화
  ...generateSchedules('R030','W010',2026,3,[1,2],'visit_care','09:00','11:00',120,43430,EXCL),
  // R031 김정자 - W010: 방문요양 수·목
  ...generateSchedules('R031','W010',2026,3,[3,4],'visit_care','13:00','15:00',120,43430),
  // R032 이병식 - W010: 방문요양 월·수·금
  ...generateSchedules('R032','W010',2026,3,[1,3,5],'visit_care','09:00','12:00',180,57020,EXCL),
  // R033 박갑순 - W010: 방문요양 화·목·금
  ...generateSchedules('R033','W010',2026,3,[2,4,5],'visit_care','14:00','16:30',150,50640),
  // R034 최만복 - W011: 방문요양 월~금 + 방문간호
  ...generateSchedules('R034','W011',2026,3,[1,2,3,4,5],'visit_care','08:30','11:30',180,57020,EXCL),
  { id:'SCH-2026-03-09-R034-W011-nursing', recipientId:'R034', careWorkerId:'W011', date:'2026-03-09', serviceType:'visit_nursing', startTime:'12:00', endTime:'12:30', durationMinutes:30, unitCost:53770, kind:'claim' },
  { id:'SCH-2026-03-16-R034-W011-nursing', recipientId:'R034', careWorkerId:'W011', date:'2026-03-16', serviceType:'visit_nursing', startTime:'12:00', endTime:'12:30', durationMinutes:30, unitCost:53770, kind:'claim' },
  // R035 정점순 - W011: 방문요양 화·수·목
  ...generateSchedules('R035','W011',2026,3,[2,3,4],'visit_care','10:00','12:30',150,50640),
  // R036 한춘자 - W011: 방문요양 월·수·금 + 목욕 격주
  ...generateSchedules('R036','W011',2026,3,[1,3,5],'visit_care','13:00','16:00',180,57020,EXCL),
  { id:'SCH-2026-03-19-R036-W011', recipientId:'R036', careWorkerId:'W011', date:'2026-03-19', serviceType:'visit_bath', startTime:'10:00', endTime:'11:00', durationMinutes:60, unitCost:88990, kind:'claim' },
  // R037 윤을순 - W012: 방문요양 화·목
  ...generateSchedules('R037','W012',2026,3,[2,4],'visit_care','09:00','11:00',120,43430),
  // R038 임정임 - W012: 방문요양 월·수
  ...generateSchedules('R038','W012',2026,3,[1,3],'visit_care','10:00','12:00',120,43430,EXCL),
  // R039 오복남 - W012: 방문요양 월~목
  ...generateSchedules('R039','W012',2026,3,[1,2,3,4],'visit_care','14:00','16:00',120,43430,EXCL),
  // R040 장봉순 - W012: 방문요양 월~금 + 목욕 격주
  ...generateSchedules('R040','W012',2026,3,[1,2,3,4,5],'visit_care','09:00','12:00',180,57020,EXCL),
  { id:'SCH-2026-03-11-R040-W012-bath', recipientId:'R040', careWorkerId:'W012', date:'2026-03-11', serviceType:'visit_bath', startTime:'13:00', endTime:'14:00', durationMinutes:60, unitCost:88990, kind:'claim' },
  // R041 조태순 - W013: 방문요양 화·수·목·금
  ...generateSchedules('R041','W013',2026,3,[2,3,4,5],'visit_care','10:00','13:00',180,57020),
  // R042 강영임 - W013: 방문요양 월·화
  ...generateSchedules('R042','W013',2026,3,[1,2],'visit_care','09:00','11:00',120,43430,EXCL),
  // R043 신병순 - W013: 방문요양 수·목·금
  ...generateSchedules('R043','W013',2026,3,[3,4,5],'visit_care','13:30','15:30',120,43430),
  // R044 류분임 - inactive, 스케줄 없음
  // R045 허영순 - W014: 방문요양 월·목
  ...generateSchedules('R045','W014',2026,3,[1,4],'visit_care','09:00','11:00',120,43430,EXCL),
  // R046 남숙자 - W014: 방문요양 화·수·금
  ...generateSchedules('R046','W014',2026,3,[2,3,5],'visit_care','10:00','13:00',180,57020),
  // R047 고창호 - W014: 방문요양 월~금 + 목욕 격주
  ...generateSchedules('R047','W014',2026,3,[1,2,3,4,5],'visit_care','13:00','16:00',180,57020,EXCL),
  { id:'SCH-2026-03-18-R047-W014-bath', recipientId:'R047', careWorkerId:'W014', date:'2026-03-18', serviceType:'visit_bath', startTime:'10:00', endTime:'11:00', durationMinutes:60, unitCost:88990, kind:'claim' },
  // R048 문병호 - W015: 방문요양 월·수·금
  ...generateSchedules('R048','W015',2026,3,[1,3,5],'visit_care','09:30','12:30',180,57020,EXCL),
  // R049 손미자 - inactive, 스케줄 없음
  // R050 양덕수 - W015: 방문요양 화·목
  ...generateSchedules('R050','W015',2026,3,[2,4],'visit_care','14:00','17:00',180,57020),
];

// All schedules by year-month key
export const allSchedules: Record<string, ScheduleEntry[]> = {
  '2026-03': schedules2026_03,
};

export function getSchedules(year: number, month: number): ScheduleEntry[] {
  const key = `${year}-${String(month).padStart(2, '0')}`;
  // 해당 월 키가 없으면 빈 배열을 등록해 두어, commitAddedSchedules로 추가한
  // 일정이 정상적으로 보존되게 한다(예: 2026-03 외의 새 월에 일정 추가).
  if (!allSchedules[key]) allSchedules[key] = [];
  return allSchedules[key];
}

export function getRecipient(id: string): Recipient | undefined {
  return recipients.find(r => r.id === id);
}

export function getEmployee(id: string): Employee | undefined {
  return employees.find(e => e.id === id);
}

export function getCareWorker(id: string): Employee | undefined {
  return getEmployee(id);
}

export function getSchedulesForRecipient(
  recipientId: string,
  year: number,
  month: number
): ScheduleEntry[] {
  return getSchedules(year, month).filter(s => s.recipientId === recipientId);
}

// 계획 캘린더와 청구 캘린더는 별개 entry 셋이다.
// 계획 = kind:'plan' 인 entry 합산 (서비스계획서 기준)
// 청구 = kind:'claim' 인 entry 합산 (RFID 실제 시간 기준 공단 제출)
export interface BenefitAmounts { count: number; benefit: number; insurance: number; copay: number; }
export function getScheduleAmounts(
  recipientId: string,
  year: number,
  month: number,
  serviceType: ServiceType
): { plan: BenefitAmounts; claim: BenefitAmounts } {
  const rows = getSchedulesForRecipient(recipientId, year, month)
    .filter(s => s.serviceType === serviceType);
  const r = getRecipient(recipientId);
  const rate = (r ? getCopayRate(r) : 0) / 100;
  // 등급·감경별 그룹화 후 급여총액 합산 → 본인부담금율 한 번 적용 → 십원 절사
  const calc = (es: ScheduleEntry[]): BenefitAmounts => {
    if (es.length === 0) return { count: 0, benefit: 0, insurance: 0, copay: 0 };
    const grpMap = new Map<string, { rate: number; total: number }>();
    es.forEach(e => {
      const eRate = e.copaymentRate ?? (r ? getCopayRate(r) : 0);
      const key   = `${e.grade ?? 5}_${eRate}`;
      const cur   = grpMap.get(key) ?? { rate: eRate, total: 0 };
      cur.total   += e.unitCost + (e.surchargeAmount ?? 0);
      grpMap.set(key, cur);
    });
    let benefit = 0, copay = 0;
    grpMap.forEach(({ rate: gr, total }) => {
      benefit += total;
      copay   += Math.floor(total * gr / 1000) * 10;
    });
    return { count: es.length, benefit, insurance: benefit - copay, copay };
  };
  return {
    plan:  calc(rows.filter(s => s.kind === 'plan')),
    claim: calc(rows.filter(s => s.kind === 'claim')),
  };
}

// ─── 등급·감경 변경에 따른 기간 분할 ─────────────────────────────────
// 같은 (수급자, 급여유형) 안에서 일정의 등급/감경 스냅샷이 다르면
// 각 (등급, 감경) 조합을 하나의 기간 세그먼트로 분리한다.
// entry 의 스냅샷이 비어있는 경우 수급자의 현재 값으로 폴백한다.
export interface PeriodSegment {
  gradeNum: number;
  reduction: string;          // '일반' | '감경9%' | '감경6%' | '감경7.5%' | '기초'
  copaymentRate: number;      // % (0/6/7.5/9/15 등)
  dateFrom: string;           // 'YYYY-MM-DD'
  dateTo: string;             // 'YYYY-MM-DD'
  plan: BenefitAmounts;
  claim: BenefitAmounts;
}
export function getSchedulePeriods(
  recipientId: string,
  year: number,
  month: number,
  serviceType: ServiceType,
): PeriodSegment[] {
  const rows = getSchedulesForRecipient(recipientId, year, month)
    .filter(s => s.serviceType === serviceType)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  if (rows.length === 0) return [];
  const r = getRecipient(recipientId);
  if (!r) return [];
  const fbGrade = getGradeNum(r);
  const fbRed   = getReduction(r);
  const fbRate  = getCopayRate(r);

  const groups = new Map<string, ScheduleEntry[]>();
  rows.forEach(e => {
    const g = (e.grade ?? fbGrade) as number;
    const t = (e.copaymentType ?? fbRed) as string;
    const key = `${g}|${t}`;
    const arr = groups.get(key) ?? [];
    arr.push(e);
    groups.set(key, arr);
  });

  const segments: PeriodSegment[] = [];
  groups.forEach((es, key) => {
    const [gStr, t] = key.split('|');
    const gradeNum = parseInt(gStr, 10);
    const copaymentRate = es[0].copaymentRate ?? fbRate;
    const dates = es.map(e => e.date);
    const dateFrom = dates.reduce((a, b) => a < b ? a : b);
    const dateTo   = dates.reduce((a, b) => a > b ? a : b);
    // 같은 세그먼트(등급+감경) 내에서도 일정별로 본인부담률이 같으므로
    // 급여총액 합산 후 본인부담금율 한 번 적용 → 십원 절사
    const calc = (xs: ScheduleEntry[]): BenefitAmounts => {
      const total = xs.reduce((s, e) => s + e.unitCost + (e.surchargeAmount ?? 0), 0);
      const copay = Math.floor(total * copaymentRate / 1000) * 10;
      return { count: xs.length, benefit: total, insurance: total - copay, copay };
    };
    segments.push({
      gradeNum,
      reduction: t,
      copaymentRate,
      dateFrom, dateTo,
      plan:  calc(es.filter(e => e.kind === 'plan')),
      claim: calc(es.filter(e => e.kind === 'claim')),
    });
  });

  segments.sort((a, b) => a.dateFrom.localeCompare(b.dateFrom));
  return segments;
}

// ─── 일정 스냅샷 — 단일 진실 소스(Single Source of Truth) ─────────────
const _scheduleListeners = new Set<() => void>();
export function subscribeSchedules(cb: () => void): () => void {
  _scheduleListeners.add(cb);
  return () => { _scheduleListeners.delete(cb); };
}
function notifySchedules(): void {
  _scheduleListeners.forEach(l => { try { l(); } catch {} });
}
export function useSchedulesVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => subscribeSchedules(() => setV(x => x + 1)), []);
  return v;
}

// ── 일자별 메모 — 수급자 단위 글로벌 store ─────────────────────────
// outer key = recipientId, inner key = 'YYYY-MM-DD'
const _dayMemos: Record<string, Record<string, string>> = {};
const _dayMemoListeners = new Set<() => void>();
export function getRecipientDayMemos(recipientId: string): Record<string, string> {
  return _dayMemos[recipientId] ?? {};
}
export function setDayMemo(recipientId: string, dateStr: string, text: string): void {
  const t = (text ?? '').trim();
  const m = _dayMemos[recipientId] ?? (_dayMemos[recipientId] = {});
  if (t) m[dateStr] = t; else delete m[dateStr];
  _dayMemoListeners.forEach(l => l());
}
export function subscribeDayMemos(cb: () => void): () => void {
  _dayMemoListeners.add(cb);
  return () => { _dayMemoListeners.delete(cb); };
}
export function useDayMemosVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => subscribeDayMemos(() => setV(x => x + 1)), []);
  return v;
}

function _rateOfReduction(red: string): number {
  if (red === '기초') return 0;
  if (red === '감경6%') return 6;
  if (red === '감경7.5%') return 7.5;
  if (red === '감경9%') return 9;
  return 15;
}

export function setEntrySnapshots(e: ScheduleEntry, gradeNum: number, reduction: string): void {
  const rate = _rateOfReduction(reduction);
  const benefit = e.unitCost;
  const copay = Math.floor(benefit * rate / 1000) * 10; // 본인부담금 십원 단위 절사
  e.grade = gradeNum as RecipientGrade;
  e.copaymentType = reduction;
  e.copaymentRate = rate;
  e.benefitTotal = benefit;
  e.copayAmount = copay;
  e.insuranceAmount = benefit - copay;
}

export function applySchedulePeriodChange(args: {
  recipientId: string;
  year: number;
  month: number;
  splitDate: string;
  kind: 'grade' | 'reduction';
  before: string;
  after: string;
}): void {
  const r = getRecipient(args.recipientId);
  if (!r) return;
  const fbGrade = getGradeNum(r);
  const fbRed   = getReduction(r);
  const all = getSchedules(args.year, args.month);
  all.forEach(e => {
    if (e.recipientId !== args.recipientId) return;
    const inAfter = e.date >= args.splitDate;
    let grade = (e.grade ?? fbGrade) as number;
    let red   = (e.copaymentType ?? fbRed) as string;
    if (args.kind === 'grade')      grade = parseInt(inAfter ? args.after : args.before, 10);
    else                            red   = inAfter ? args.after : args.before;
    setEntrySnapshots(e, grade, red);
  });
  notifySchedules();
}

// 해당 연도(1~12월)에 특정 수급자의 일정(계획 또는 청구)이 하나라도 있는지.
// 급여일정관리 등에서 연 단위 명단 필터에 사용한다.
// 공휴일(2026, 대체공휴일 포함) — 주간/월별 표에서 일요일과 동일하게 빨간색 처리
export const PUBLIC_HOLIDAYS = new Set<string>([
  '2026-01-01',                                   // 신정
  '2026-02-16', '2026-02-17', '2026-02-18',       // 설날 연휴
  '2026-03-01', '2026-03-02',                     // 삼일절(+대체)
  '2026-05-05',                                   // 어린이날
  '2026-05-24', '2026-05-25',                     // 부처님오신날(+대체)
  '2026-06-06',                                   // 현충일
  '2026-08-15', '2026-08-17',                     // 광복절(+대체)
  '2026-09-24', '2026-09-25', '2026-09-26',       // 추석 연휴
  '2026-10-03', '2026-10-05',                     // 개천절(+대체)
  '2026-10-09',                                   // 한글날
  '2026-12-25',                                   // 성탄절
]);
export function isHoliday(dateStr: string): boolean { return PUBLIC_HOLIDAYS.has(dateStr); }

// ── 수급자별 급여종류별 담당 요양보호사 영구 저장소 ─────────────────────
// outer key = recipientId, inner key = serviceType, value = workerId[]
const _assignedWorkersStore: Record<string, Record<string, string[]>> = {};

export function getAssignedWorkers(recipientId: string): Record<string, string[]> {
  return _assignedWorkersStore[recipientId] ?? {};
}
export function setAssignedWorkersBySvc(
  recipientId: string,
  svcType: string,
  workerIds: string[]
): void {
  if (!_assignedWorkersStore[recipientId]) _assignedWorkersStore[recipientId] = {};
  _assignedWorkersStore[recipientId][svcType] = workerIds;
}

// 가족요양 담당 요양보호사별 가족관계 저장소 — recipientId → workerId → familyRelation
const _familyRelationStore: Record<string, Record<string, string>> = {};
export function getFamilyRelations(recipientId: string): Record<string, string> {
  return _familyRelationStore[recipientId] ?? {};
}
export function setFamilyRelation(recipientId: string, workerId: string, relation: string): void {
  if (!_familyRelationStore[recipientId]) _familyRelationStore[recipientId] = {};
  _familyRelationStore[recipientId][workerId] = relation;
}
export const FAMILY_RELATIONS = ['처','남편','자','자부','사위','형제자매','손','배우자의형제자매','외손','부모','기타','친족'] as const;

// ── 연도별 수가 저장소 참조 — AnnualFeeRate.tsx의 feeStore와 연동 ────────
// 수가 항목 타입 (AnnualFeeRate.tsx의 FeeItem과 동일 구조)
export interface FeeRateItem {
  code: string; label: string; amount: number;
  applyFamily?: boolean;
  gradeAmounts?: Record<string, number>;
  minMinutes: number;
  maxMinutes: number | null;
  maxInclusive?: boolean;
}
export interface ServiceFeeRateTable {
  serviceType: string; serviceLabel: string; note?: string;
  partialRule?: { minMinutes: number; maxMinutes: number; rate: number };
  items: FeeRateItem[];
}
// 외부에서 등록 — AnnualFeeRate.tsx가 저장 시 호출
const _feeRateStore: Record<number, Record<string, ServiceFeeRateTable>> = {};
export function registerFeeRates(year: number, tables: Record<string, ServiceFeeRateTable>): void {
  _feeRateStore[year] = tables;
}
// 2026 기본 수가 초기화 — 관리자 화면 미방문 시에도 calcFeeAmount 정상 동작
_feeRateStore[2026] = {
  visit_care: { serviceType:'visit_care', serviceLabel:'방문요양', note:'가족요양은 가-1~가-3만 적용', items:[
    {code:'가-1',  label:'30분 이상',  amount:17450,  applyFamily:true,  minMinutes:30,  maxMinutes:60},
    {code:'가-2',  label:'60분 이상',  amount:25320,  applyFamily:true,  minMinutes:60,  maxMinutes:90},
    {code:'가-3',  label:'90분 이상',  amount:34120,  applyFamily:true,  minMinutes:90,  maxMinutes:120},
    {code:'가-4',  label:'120분 이상', amount:43430,  minMinutes:120, maxMinutes:150},
    {code:'가-5',  label:'150분 이상', amount:50640,  minMinutes:150, maxMinutes:180},
    {code:'가-6',  label:'180분 이상', amount:57020,  minMinutes:180, maxMinutes:210},
    {code:'가-7',  label:'210분 이상', amount:63530,  minMinutes:210, maxMinutes:240},
    {code:'가-8',  label:'240분 이상', amount:70080,  minMinutes:240, maxMinutes:270},
    {code:'가-9',  label:'270분 이상', amount:70080,  minMinutes:270, maxMinutes:300},
    {code:'가-10', label:'300분 이상', amount:87530,  minMinutes:300, maxMinutes:330},
    {code:'가-11', label:'330분 이상', amount:95400,  minMinutes:330, maxMinutes:360},
    {code:'가-12', label:'360분 이상', amount:104200, minMinutes:360, maxMinutes:390},
    {code:'가-13', label:'390분 이상', amount:113510, minMinutes:390, maxMinutes:420},
    {code:'가-14', label:'420분 이상', amount:120720, minMinutes:420, maxMinutes:450},
    {code:'가-15', label:'450분 이상', amount:127100, minMinutes:450, maxMinutes:480},
    {code:'가-16', label:'480분 이상', amount:140160, minMinutes:480, maxMinutes:null},
  ]},
  family_care: { serviceType:'family_care', serviceLabel:'가족요양', items:[
    {code:'가-1', label:'30분 이상', amount:17450, minMinutes:30, maxMinutes:60},
    {code:'가-2', label:'60분 이상', amount:25320, minMinutes:60, maxMinutes:90},
    {code:'가-3', label:'90분 이상', amount:34120, minMinutes:90, maxMinutes:null},
  ]},
  full_day_visit: { serviceType:'full_day_visit', serviceLabel:'종일방문', items:[
    {code:'가-1', label:'30분 이상',  amount:17450, minMinutes:30,  maxMinutes:60},
    {code:'가-2', label:'60분 이상',  amount:25320, minMinutes:60,  maxMinutes:90},
    {code:'가-3', label:'90분 이상',  amount:34120, minMinutes:90,  maxMinutes:120},
    {code:'가-4', label:'120분 이상', amount:43430, minMinutes:120, maxMinutes:150},
    {code:'가-5', label:'150분 이상', amount:50640, minMinutes:150, maxMinutes:180},
    {code:'가-6', label:'180분 이상', amount:57020, minMinutes:180, maxMinutes:210},
    {code:'가-7', label:'210분 이상', amount:63530, minMinutes:210, maxMinutes:240},
    {code:'가-8', label:'240분 이상', amount:70080, minMinutes:240, maxMinutes:null},
  ]},
  visit_bath: { serviceType:'visit_bath', serviceLabel:'방문목욕', note:'나-1:차량이용(차량내)/나-2:차량이용(가정내)/나-3:차량미이용',
    partialRule:{minMinutes:40, maxMinutes:60, rate:0.8}, items:[
    {code:'나-1', label:'방문목욕 차량을 이용한 경우 (차량 내 목욕)',  amount:88990, minMinutes:60, maxMinutes:null},
    {code:'나-2', label:'방문목욕 차량을 이용한 경우 (가정 내 목욕)', amount:80230, minMinutes:60, maxMinutes:null},
    {code:'나-3', label:'방문목욕 차량을 이용하지 아니한 경우',       amount:50100, minMinutes:60, maxMinutes:null},
  ]},
  visit_nursing: { serviceType:'visit_nursing', serviceLabel:'방문간호', note:'급여제공시간에 따라 수가 구분 적용', items:[
    {code:'다-1', label:'15분 이상 ~ 30분 미만', amount:42880, minMinutes:15, maxMinutes:30},
    {code:'다-2', label:'30분 이상 ~ 60분 미만', amount:53770, minMinutes:30, maxMinutes:60},
    {code:'다-3', label:'60분 이상',              amount:64690, minMinutes:60, maxMinutes:null},
  ]},
  day_care: { serviceType:'day_care', serviceLabel:'주간보호', note:'등급 및 급여제공시간에 따라 수가 구분 적용', items:[
    {code:'라-1', label:'3시간~6시간 미만',   amount:0, minMinutes:180, maxMinutes:360,  gradeAmounts:{'1':41820,'2':38720,'3':35740,'4':34120,'5':32490,'인지지원':32490}},
    {code:'라-2', label:'6시간~8시간 미만',   amount:0, minMinutes:360, maxMinutes:480,  gradeAmounts:{'1':56060,'2':51930,'3':47940,'4':46300,'5':44650,'인지지원':44650}},
    {code:'라-3', label:'8시간~10시간 미만',  amount:0, minMinutes:480, maxMinutes:600,  gradeAmounts:{'1':69730,'2':64590,'3':59640,'4':58010,'5':56360,'인지지원':56360}},
    {code:'라-4', label:'10시간~13시간 이하', amount:0, minMinutes:600, maxMinutes:780, maxInclusive:true, gradeAmounts:{'1':76820,'2':71160,'3':65750,'4':64090,'5':62460,'인지지원':56360}},
    {code:'라-5', label:'13시간 초과',        amount:0, minMinutes:780, minExclusive:true, maxMinutes:null, gradeAmounts:{'1':82370,'2':76310,'3':70500,'4':68860,'5':67240,'인지지원':56360}},
  ]},
};
/**
 * 특정 일정의 수가(단가) 계산.
 * serviceType, durationMinutes, gradeNum, year를 받아 해당 항목의 금액 반환.
 * 방문목욕은 배정 시 bathType으로 나-1/나-2/나-3을 구분해야 하므로 itemCode 파라미터 사용.
 */
export function calcFeeAmount(args: {
  year: number; serviceType: string; durationMinutes: number;
  gradeNum?: number; itemCode?: string; // 방문목욕 등 코드 지정
}): number {
  const { year, serviceType, durationMinutes, gradeNum, itemCode } = args;
  const table = _feeRateStore[year]?.[serviceType];
  if (!table) return 0;
  // 항목 찾기 — itemCode 지정 시 우선, 아니면 시간 범위로 매칭
  const item = itemCode
    ? table.items.find(i => i.code === itemCode)
    : table.items.find(i => {
        if (durationMinutes < i.minMinutes) return false;
        if (i.maxMinutes === null) return true;
        return i.maxInclusive ? durationMinutes <= i.maxMinutes : durationMinutes < i.maxMinutes;
      });
  if (!item) return 0;
  // 등급별 금액
  let base = item.amount;
  if (item.gradeAmounts && gradeNum !== undefined) {
    const key = gradeNum >= 1 && gradeNum <= 5 ? String(gradeNum) : '인지지원';
    base = item.gradeAmounts[key] ?? item.amount;
  }
  // 부분 적용 규칙 (방문목욕 40~60분 미만 80%)
  if (table.partialRule) {
    const { minMinutes: pMin, maxMinutes: pMax, rate } = table.partialRule;
    if (durationMinutes >= pMin && durationMinutes < pMax) {
      base = Math.ceil(base * rate / 10) * 10; // 수가 비율 적용 시 십원 단위 올림
    }
  }
  return base;
}

// 수가 구간의 최저시작분(minMinutes) 반환 — 매칭 구간이 없으면 실제 durationMinutes 반환.
// 청구 집계에서 실제 제공시간(예: 181분)이 아니라 해당 수가 구간의 시작분(예: 180분)으로
// 묶어 표시하기 위한 헬퍼.
export function getFeeMinMinutes(year: number, serviceType: string, durationMinutes: number): number {
  const table = _feeRateStore[year]?.[serviceType];
  if (!table) return durationMinutes;
  const item = table.items.find(i => {
    if (durationMinutes < i.minMinutes) return false;
    if (i.maxMinutes === null) return true;
    return i.maxInclusive ? durationMinutes <= i.maxMinutes : durationMinutes < i.maxMinutes;
  });
  return item ? item.minMinutes : durationMinutes;
}

// ── 가산 계산 ────────────────────────────────────────────────────────────
// 가산 적용 대상: 방문요양(5등급 제외)·방문간호·주간보호. 가족요양 제외.
// 심야(22:00~06:00)/일요일 = 30%, 공휴일 = 50% (일+공휴일이면 50% 우선)
// 270분 초과 시: 시작~270분 / 270분이후~종료 두 건으로 분할하여 각각 계산 후 합산

// 시간 문자열에 분(mins)을 더해 새 시간 문자열 반환 (자정 넘김 처리)
function addMinsToTime(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
}
// 가산금 = 수가 × 가산비율 × min(해당시간, minMinutes) / minMinutes → 반올림

function toMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// 심야(22:00~06:00)와 스케줄 시간의 겹치는 분 계산
function calcNightOverlap(startTime: string, endTime: string): number {
  let s = toMins(startTime);
  let e = toMins(endTime);
  if (e <= s) e += 24 * 60; // 자정 넘어가는 경우
  // 심야 구간 1: [0, 360) = 00:00~06:00
  const o1 = Math.max(0, Math.min(e, 360) - Math.max(s, 0));
  // 심야 구간 2: [1320, 1800) = 22:00~30:00(=06:00 다음날)
  const o2 = Math.max(0, Math.min(e, 1800) - Math.max(s, 1320));
  return o1 + o2;
}

// 해당 수가 항목의 minMinutes 조회 (가산 분모로 사용)
function getFeeItemMinMinutes(year: number, serviceType: string, durationMinutes: number, itemCode?: string): number {
  const table = _feeRateStore[year]?.[serviceType];
  if (!table) return durationMinutes;
  const item = itemCode
    ? table.items.find(i => i.code === itemCode)
    : table.items.find(i => {
        if (durationMinutes < i.minMinutes) return false;
        if (i.maxMinutes === null) return true;
        return i.maxInclusive ? durationMinutes <= i.maxMinutes : durationMinutes < i.maxMinutes;
      });
  return item?.minMinutes ?? durationMinutes;
}

export interface SurchargeResult {
  amount: number;      // 가산금 (십원 단위 올림)
  rate: number;        // 적용 가산비율 (0.3 | 0.5 | 0)
  minutes: number;     // 가산 해당시간(분)
  periodStart: string; // 가산 시간대 시작 (심야=실제 겹치는 시작, 일요일/공휴일=일정 시작)
  periodEnd: string;   // 가산 시간대 종료
  periodLabel: string; // 표시용 라벨 ('심야' | '일요일' | '공휴일')
}

export function calcSurcharge(args: {
  year: number;
  serviceType: string;
  date: string;          // 'YYYY-MM-DD'
  startTime: string;
  endTime: string;
  durationMinutes: number;
  gradeNum: number;
  feeAmount: number;     // 기본 수가
  copaymentRate: number; // 본인부담률(%)
  itemCode?: string;
}): SurchargeResult {
  const zero: SurchargeResult = { amount: 0, rate: 0, minutes: 0, periodStart: '', periodEnd: '', periodLabel: '' };
  const { serviceType, date, startTime, endTime, durationMinutes, gradeNum, feeAmount, copaymentRate, year, itemCode } = args;

  // 가산 적용 제외 조건
  if (serviceType === 'family_care') return zero;                        // 가족요양 제외
  if (serviceType === 'visit_care' && gradeNum === 5) return zero;       // 5등급 방문요양 제외

  // 270분 초과 시 두 건으로 분할: [시작~270분] + [270분~종료] 각각 계산 후 합산
  if (durationMinutes > 270) {
    const SPLIT = 270;
    const midTime = addMinsToTime(startTime, SPLIT);
    const dur2    = durationMinutes - SPLIT;
    // Part1: 시작~270분 — 수가는 270분 기준 재조회
    const fee1 = calcFeeAmount({ year, serviceType, durationMinutes: SPLIT, gradeNum, itemCode });
    const sur1 = calcSurcharge({ ...args, endTime: midTime, durationMinutes: SPLIT, feeAmount: fee1 });
    // Part2: 270분~종료 — 수가는 나머지 시간 기준 재조회
    const fee2 = calcFeeAmount({ year, serviceType, durationMinutes: dur2, gradeNum, itemCode });
    const sur2 = calcSurcharge({ ...args, startTime: midTime, durationMinutes: dur2, feeAmount: fee2 });
    const totalAmount = sur1.amount + sur2.amount;
    if (totalAmount === 0) return zero;
    // 표시용: 두 구간 중 가산이 있는 쪽 대표 정보 사용
    const rep = sur1.amount > 0 ? sur1 : sur2;
    return { amount: totalAmount, rate: rep.rate, minutes: sur1.minutes + sur2.minutes,
             periodStart: rep.periodStart, periodEnd: rep.periodEnd, periodLabel: rep.periodLabel };
  }
  if (!['visit_care','visit_nursing','day_care'].includes(serviceType)) return zero;

  const dow = new Date(date).getDay(); // 0=일요일
  const isSunday   = dow === 0;
  const isHol      = isHoliday(date);
  const minMins    = getFeeItemMinMinutes(year, serviceType, durationMinutes, itemCode);

  let rate = 0;
  let appliedMins = 0;
  let periodLabel = '';
  let periodStart = startTime;
  let periodEnd   = endTime;

  if (isHol) {
    rate = 0.5;
    appliedMins = Math.min(durationMinutes, minMins);
    periodLabel = '공휴일';
    // 공휴일은 일정 전체 시간대
  } else if (isSunday) {
    rate = 0.3;
    appliedMins = Math.min(durationMinutes, minMins);
    periodLabel = '일요일';
  } else {
    // 심야 30% — 실제 겹치는 시간대 계산
    const fromMins = (m: number) => {
      const h = Math.floor((m % (24*60)) / 60), mn = m % 60;
      return `${String(h).padStart(2,'0')}:${String(mn).padStart(2,'0')}`;
    };
    let s = toMins(startTime), e = toMins(endTime);
    if (e <= s) e += 24 * 60;
    // 심야 구간1: [0, 360), 구간2: [1320, 1800)
    const n1s = Math.max(s, 0),    n1e = Math.min(e, 360);
    const n2s = Math.max(s, 1320), n2e = Math.min(e, 1800);
    const nightMins = Math.max(0, n1e-n1s) + Math.max(0, n2e-n2s);
    if (nightMins > 0) {
      rate = 0.3;
      appliedMins = Math.min(nightMins, minMins);
      periodLabel = '심야';
      // 실제 심야 겹치는 시작/종료
      if (n2e > n2s) {
        periodStart = fromMins(n2s);
        periodEnd   = fromMins(n2e % (24*60));
      } else {
        periodStart = fromMins(n1s);
        periodEnd   = fromMins(n1e);
      }
    }
  }

  if (rate === 0 || appliedMins === 0 || minMins === 0) return zero;

  const amount = Math.round(feeAmount * rate * appliedMins / minMins); // 가산금 1원 단위 반올림
  return { amount, rate, minutes: appliedMins, periodStart, periodEnd, periodLabel };
}

// ── 연도별 급여한도 저장소 ─────────────────────────────────────────────
// key: grade(1~5) | '인지지원' — value: 월 한도액(원)
export type BenefitLimitRow = Record<string, number>; // grade key → 한도액
export type AnnualBenefitLimitsStore = Record<number, BenefitLimitRow>; // year → row

// 기본값 (2026)
const DEFAULT_BENEFIT_LIMITS_2026: BenefitLimitRow = {
  '1': 2512900, '2': 2331200, '3': 1528200,
  '4': 1409700, '5': 1208900, '인지지원': 676320,
};

export const annualBenefitLimitsStore: AnnualBenefitLimitsStore = {
  2026: { ...DEFAULT_BENEFIT_LIMITS_2026 },
};

export function getBenefitLimitRow(year: number): BenefitLimitRow {
  return annualBenefitLimitsStore[year] ?? DEFAULT_BENEFIT_LIMITS_2026;
}

export function setBenefitLimitRow(year: number, row: BenefitLimitRow): void {
  annualBenefitLimitsStore[year] = { ...row };
}

// grade 숫자(1~5) 또는 0(인지지원) → 한도액 조회
function gradeNumToLimitKey(gradeNum: number): string {
  return gradeNum >= 1 && gradeNum <= 5 ? String(gradeNum) : '인지지원';
}

/**
 * 해당 월 수급자의 월 급여한도.
 * 일정 엔트리가 있으면 그 중 가장 높은 등급(가장 낮은 숫자)의 한도를 적용.
 * 일정이 없으면 수급자 기초정보 등급의 한도를 사용.
 * 규칙: 월중 등급 변경이 있을 경우 더 높은 등급(낮은 숫자)의 한도 적용.
 */
// ── 스케줄 금액 계산 헬퍼 ────────────────────────────────────────────
// 본인부담금율: 일반=15%, 감경9%=9%, 감경6%=6%, 기초=0%
// 계산: 본인부담금 = floor(수가 × 본인부담률/100), 공단청구액 = 수가 - 본인부담금
export function calcCopayAmount(feeAmount: number, copaymentRate: number): number {
  return Math.floor(feeAmount * copaymentRate / 1000) * 10; // 본인부담금 십원 단위 절사
}
export function calcInsuranceAmount(feeAmount: number, copaymentRate: number): number {
  return feeAmount - calcCopayAmount(feeAmount, copaymentRate);
}
// 일정 한 건의 총 급여액 = 기본수가 + 가산금 (항상 정확)
// unitCost = 기본수가, surchargeAmount = 가산금 (없으면 0)
export function getEntryBenefitTotal(s: ScheduleEntry): number {
  return s.unitCost + (s.surchargeAmount ?? 0);
}
// 기존 entry의 본인부담금 — 없으면 copaymentRate 스냅샷으로 계산
export function getEntryCopayAmount(s: ScheduleEntry, fallbackRate?: number): number {
  if (s.copayAmount !== undefined) return s.copayAmount;
  const rate = s.copaymentRate ?? fallbackRate ?? 15;
  return calcCopayAmount(getEntryBenefitTotal(s), rate);
}
// 기존 entry의 공단청구액
export function getEntryInsuranceAmount(s: ScheduleEntry, fallbackRate?: number): number {
  if (s.insuranceAmount !== undefined) return s.insuranceAmount;
  return getEntryBenefitTotal(s) - getEntryCopayAmount(s, fallbackRate);
}

// 급여한도 적용 대상 급여유형 — 방문간호는 한도 적용 제외
const BENEFIT_LIMIT_SVC_TYPES = new Set(['visit_care','family_care','full_day_visit','visit_bath','day_care']);

export function getMonthlyLimit(recipientId: string, year: number, month: number): number {
  const row = getBenefitLimitRow(year);
  // 한도 적용 대상 급여유형 일정만 사용 (방문간호 제외)
  const scheds = getSchedules(year, month).filter(s =>
    s.recipientId === recipientId && BENEFIT_LIMIT_SVC_TYPES.has(s.serviceType)
  );
  if (scheds.length === 0) {
    // 한도 대상 일정 없으면 수급자 기초정보 등급
    const r = getRecipient(recipientId);
    if (!r) return 0;
    const gNum = getGradeNum(r);
    return row[gradeNumToLimitKey(gNum)] ?? 0;
  }
  // 일정 중 최소 grade 숫자(= 가장 높은 등급)
  const minGrade = scheds.reduce((min, s) => {
    const g = (s.grade ?? 5) as number;
    return g < min ? g : min;
  }, 99);
  return row[gradeNumToLimitKey(minGrade)] ?? 0;
}

/**
 * 급여한도 초과 반영 본인부담금 계산
 * - 일정을 날짜순으로 누적하다가 급여한도에 도달하면 짜름
 * - 한도 이내: 등급·감경별 급여총액 합산 후 본인부담률 × 십원 절사
 * - 한도 초과: 수급자가 100% 부담 (비급여)
 */
export function calcLimitAwareSelfPay(
  scheds: ScheduleEntry[],
  monthlyLimit: number,
  year: number,
  fallbackRate: number = 15,
): { selfPay: number; overLimitAmount: number; withinLimitBenefit: number } {
  // 날짜순 → 같은 날은 일정 순서 유지
  const sorted = [...scheds].sort((a, b) => a.date.localeCompare(b.date));
  const grpMap = new Map<string, { rate: number; total: number }>();
  let accumulated = 0;
  let overLimitAmount = 0;

  for (const s of sorted) {
    const fee = s.unitCost + (s.surchargeAmount ?? 0);
    const eRate = s.copaymentRate ?? fallbackRate;
    const grpKey = `${s.grade ?? 5}_${eRate}`;

    if (accumulated >= monthlyLimit) {
      // 이미 한도 초과 — 전액 비급여
      overLimitAmount += fee;
    } else if (accumulated + fee > monthlyLimit) {
      // 이 일정에서 한도 도달 — 비율로 분할
      const withinPart = monthlyLimit - accumulated;
      const overPart   = fee - withinPart;
      const cur = grpMap.get(grpKey) ?? { rate: eRate, total: 0 };
      cur.total += withinPart;
      grpMap.set(grpKey, cur);
      overLimitAmount += overPart;
      accumulated = monthlyLimit;
    } else {
      // 한도 이내
      const cur = grpMap.get(grpKey) ?? { rate: eRate, total: 0 };
      cur.total += fee;
      grpMap.set(grpKey, cur);
      accumulated += fee;
    }
  }

  // 한도 이내 본인부담금 (등급·감경별 합산 후 십원 절사)
  let withinCopay = 0;
  let withinLimitBenefit = 0;
  grpMap.forEach(({ rate, total }) => {
    withinCopay      += Math.floor(total * rate / 1000) * 10;
    withinLimitBenefit += total;
  });

  return {
    selfPay: withinCopay + overLimitAmount,
    overLimitAmount,
    withinLimitBenefit,
  };
}

export function recipientHasSchedulesInYear(recipientId: string, year: number): boolean {
  for (let m = 1; m <= 12; m++) {
    const arr = allSchedules[`${year}-${String(m).padStart(2, '0')}`];
    if (arr && arr.some(s => s.recipientId === recipientId)) return true;
  }
  return false;
}

export function commitAddedSchedules(year: number, month: number, entries: ScheduleEntry[]): void {
  if (entries.length === 0) return;
  const arr = getSchedules(year, month);
  arr.push(...entries);
  notifySchedules();
}

// 급여액 수동 수정 — unitCost, benefitTotal, copayAmount, insuranceAmount 재계산 후 저장
export function mutateScheduleFee(
  year: number, month: number, id: string, newFee: number, copaymentRate: number
): void {
  const arr = getSchedules(year, month);
  const idx = arr.findIndex(s => s.id === id);
  if (idx < 0) return;
  const s = arr[idx];
  const surcharge = s.surchargeAmount ?? 0;
  const totalFee  = newFee + surcharge;
  const copay     = Math.floor(totalFee * copaymentRate / 1000) * 10;
  arr[idx] = {
    ...s,
    unitCost: newFee,
    benefitTotal: totalFee,
    copayAmount: copay,
    insuranceAmount: totalFee - copay,
    feeEdited: true,
  };
  notifySchedules();
}

export function removeSchedules(year: number, month: number, ids: Iterable<string>): void {
  const set = new Set(ids);
  if (set.size === 0) return;
  const arr = getSchedules(year, month);
  for (let i = arr.length - 1; i >= 0; i--) {
    if (set.has(arr[i].id)) arr.splice(i, 1);
  }
  notifySchedules();
}

// 뷰 모드 필터 — 두 데이터셋(계획/청구) 중 하나만 선택해서 본다.
// 'plan'  = kind:'plan' entry 만 (서비스계획서 캘린더)
// 'claim' = kind:'claim' entry 만 (공단 청구 캘린더, RFID 실제 시간)
// 'all'   = 둘 다
type ChipViewMode = 'plan' | 'claim' | 'all';
function _matchesView(e: ScheduleEntry, vm: ChipViewMode): boolean {
  if (vm === 'plan')  return e.kind === 'plan';
  if (vm === 'claim') return e.kind === 'claim';
  return true;
}
export function deriveGradeSegments(
  recipientId: string, year: number, month: number,
  viewMode: ChipViewMode = 'plan',
): { from: string; to: string; value: string }[] {
  return _deriveByField(recipientId, year, month, 'grade', viewMode);
}
export function deriveReductionSegments(
  recipientId: string, year: number, month: number,
  viewMode: ChipViewMode = 'plan',
): { from: string; to: string; value: string }[] {
  return _deriveByField(recipientId, year, month, 'reduction', viewMode);
}
function _deriveByField(
  recipientId: string, year: number, month: number,
  field: 'grade' | 'reduction',
  viewMode: ChipViewMode = 'plan',
): { from: string; to: string; value: string }[] {
  const all = getSchedules(year, month)
    .filter(s => s.recipientId === recipientId)
    .filter(s => _matchesView(s, viewMode));
  if (all.length === 0) return [];
  const r = getRecipient(recipientId);
  const fbG = r ? getGradeNum(r) : 5;
  const fbR = r ? getReduction(r) : '일반';
  const valOf = (e: ScheduleEntry) =>
    field === 'grade' ? String(e.grade ?? fbG) : (e.copaymentType ?? fbR);

  // 같은 날짜에 여러 entry 가 다른 값을 가질 수 있으므로 날짜별로 dedupe.
  // 한 날짜 내 값이 섞여 있으면 마지막 entry 값을 채택해 최근 편집을 우선시한다.
  const byDate = new Map<string, string>();
  all.forEach(e => { byDate.set(e.date, valOf(e)); });

  const dates = Array.from(byDate.keys()).sort();
  const segs: { from: string; to: string; value: string }[] = [];
  let cur: { from: string; to: string; value: string } | null = null;
  // 같은 값이라도 날짜 간격이 7일을 초과하면(=중간에 한 주 넘게 일정 공백)
  // 별도 칩으로 분리 — 간헐적/유령 entry 가 칩 범위를 부풀리는 것을 방지.
  const GAP_DAYS = 7;
  const dayDiff = (a: string, b: string): number => {
    const da = new Date(a).getTime();
    const db = new Date(b).getTime();
    return Math.round((db - da) / 86400000);
  };
  for (const d of dates) {
    const v = byDate.get(d)!;
    if (!cur || cur.value !== v || dayDiff(cur.to, d) > GAP_DAYS) {
      if (cur) segs.push(cur);
      cur = { from: d, to: d, value: v };
    } else {
      cur.to = d;
    }
  }
  if (cur) segs.push(cur);
  // 값이 둘 이상일 때만 분리 표시 (단일 값이면 칩 불필요)
  const distinct = new Set(segs.map(s => s.value));
  return distinct.size > 1 ? segs : [];
}

export function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

export function getCalendarWeeks(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDow = firstDay.getDay();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(year, month - 1, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// SocialWorker: Employee 타입 별칭 (하위 호환)
export type SocialWorker = Employee;

// ─── 방문상담 ─────────────────────────────────────────────────────────────────

export type ConsultType = 'new_consult' | 'regular' | 'benefit_change' | 'complaint' | 'termination' | 'inspection';
export type ConsultStatus = 'planned' | 'completed' | 'unable';

export interface ConsultationVisit {
  id: string;
  socialWorkerId: string;
  recipientId: string;
  date: string;
  consultStatus: ConsultStatus;
  plannedStartTime: string;
  plannedEndTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  consultType: ConsultType;
  notes?: string;
}

const TODAY_CV = '2026-04-13';

// 상담구분별 표준 소요시간(분)
const CONSULT_DURATION: Record<ConsultType, number> = {
  new_consult:    90,
  regular:        60,
  benefit_change: 60,
  complaint:      60,
  termination:    90,
  inspection:     90,
};

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm2 = String(total % 60).padStart(2, '0');
  return `${hh}:${mm2}`;
}

function cv(
  id: string, swId: string, recipId: string,
  date: string, plannedTime: string, consultType: ConsultType,
  notes?: string,
): ConsultationVisit {
  const consultStatus: ConsultStatus = date <= TODAY_CV ? 'completed' : 'planned';
  const plannedEndTime  = addMinutes(plannedTime, CONSULT_DURATION[consultType]);
  const actualStartTime = consultStatus === 'completed' ? plannedTime : undefined;
  const actualEndTime   = consultStatus === 'completed' ? plannedEndTime : undefined;
  return {
    id, socialWorkerId: swId, recipientId: recipId, date,
    consultStatus, plannedStartTime: plannedTime, plannedEndTime,
    actualStartTime, actualEndTime,
    consultType, notes,
  };
}

export const consultationVisits: ConsultationVisit[] = [
  // ── SW001 김지원 / R001-R017
  // 2026-02
  cv('CV-SW1-R001-0204','SW001','R001','2026-02-04','10:00','regular'),
  cv('CV-SW1-R002-0204','SW001','R002','2026-02-04','14:00','benefit_change','급여변경 요청 접수'),
  cv('CV-SW1-R003-0206','SW001','R003','2026-02-06','10:00','inspection'),
  cv('CV-SW1-R004-0206','SW001','R004','2026-02-06','14:00','regular'),
  cv('CV-SW1-R005-0209','SW001','R005','2026-02-09','09:30','regular'),
  cv('CV-SW1-R006-0209','SW001','R006','2026-02-09','11:30','regular'),
  cv('CV-SW1-R007-0210','SW001','R007','2026-02-10','10:00','complaint', '청구 오류 민원'),
  cv('CV-SW1-R008-0210','SW001','R008','2026-02-10','14:00','regular'),
  cv('CV-SW1-R009-0211','SW001','R009','2026-02-11','10:00','regular'),
  cv('CV-SW1-R010-0211','SW001','R010','2026-02-11','14:00','benefit_change','주간보호 추가 요청'),
  cv('CV-SW1-R011-0213','SW001','R011','2026-02-13','10:00','regular'),
  cv('CV-SW1-R012-0213','SW001','R012','2026-02-13','14:00','regular'),
  cv('CV-SW1-R013-0217','SW001','R013','2026-02-17','09:30','regular'),
  cv('CV-SW1-R014-0217','SW001','R014','2026-02-17','14:00','regular'),
  cv('CV-SW1-R015-0218','SW001','R015','2026-02-18','10:00','inspection'),
  cv('CV-SW1-R016-0224','SW001','R016','2026-02-24','09:30','regular'),
  cv('CV-SW1-R017-0224','SW001','R017','2026-02-24','14:00','regular'),
  // 2026-03
  cv('CV-SW1-R001-0303','SW001','R001','2026-03-03','10:00','regular'),
  cv('CV-SW1-R002-0303','SW001','R002','2026-03-03','14:00','regular'),
  cv('CV-SW1-R003-0305','SW001','R003','2026-03-05','10:00','regular'),
  cv('CV-SW1-R004-0305','SW001','R004','2026-03-05','14:00','regular'),
  cv('CV-SW1-R005-0306','SW001','R005','2026-03-06','09:30','benefit_change','방문간호 횟수 조정'),
  cv('CV-SW1-R006-0306','SW001','R006','2026-03-06','11:30','regular'),
  cv('CV-SW1-R007-0309','SW001','R007','2026-03-09','10:00','regular'),
  cv('CV-SW1-R008-0309','SW001','R008','2026-03-09','14:00','regular'),
  cv('CV-SW1-R009-0310','SW001','R009','2026-03-10','09:30','regular'),
  cv('CV-SW1-R010-0310','SW001','R010','2026-03-10','14:00','regular'),
  cv('CV-SW1-R011-0312','SW001','R011','2026-03-12','10:00','regular'),
  cv('CV-SW1-R012-0312','SW001','R012','2026-03-12','14:00','regular'),
  cv('CV-SW1-R013-0316','SW001','R013','2026-03-16','09:30','regular'),
  cv('CV-SW1-R014-0317','SW001','R014','2026-03-17','14:00','regular'),
  cv('CV-SW1-R015-0318','SW001','R015','2026-03-18','10:00','regular'),
  cv('CV-SW1-R016-0319','SW001','R016','2026-03-19','09:30','regular'),
  cv('CV-SW1-R017-0320','SW001','R017','2026-03-20','14:00','regular'),
  // 2026-04
  cv('CV-SW1-R001-0402','SW001','R001','2026-04-02','10:00','regular'),
  cv('CV-SW1-R002-0402','SW001','R002','2026-04-02','14:00','regular'),
  cv('CV-SW1-R003-0403','SW001','R003','2026-04-03','10:00','inspection'),
  cv('CV-SW1-R004-0407','SW001','R004','2026-04-07','14:00','regular'),
  cv('CV-SW1-R005-0408','SW001','R005','2026-04-08','09:30','regular'),
  cv('CV-SW1-R006-0408','SW001','R006','2026-04-08','11:30','regular'),
  cv('CV-SW1-R007-0409','SW001','R007','2026-04-09','10:00','regular'),
  cv('CV-SW1-R008-0409','SW001','R008','2026-04-09','14:00','regular'),
  cv('CV-SW1-R009-0410','SW001','R009','2026-04-10','09:30','regular'),
  cv('CV-SW1-R010-0410','SW001','R010','2026-04-10','14:00','regular'),
  cv('CV-SW1-R011-0413','SW001','R011','2026-04-13','10:00','benefit_change','급여 재계약'),
  cv('CV-SW1-R012-0414','SW001','R012','2026-04-14','09:30','regular'),
  cv('CV-SW1-R013-0415','SW001','R013','2026-04-15','14:00','regular'),
  cv('CV-SW1-R014-0416','SW001','R014','2026-04-16','09:30','regular'),
  cv('CV-SW1-R015-0417','SW001','R015','2026-04-17','10:00','regular'),
  cv('CV-SW1-R016-0421','SW001','R016','2026-04-21','09:30','complaint', '청구 관련 문의 민원'),
  cv('CV-SW1-R017-0422','SW001','R017','2026-04-22','14:00','regular'),
  // ── SW002 박수현 / R018-R034
  // 2026-02
  cv('CV-SW2-R018-0204','SW002','R018','2026-02-04','10:00','regular'),
  cv('CV-SW2-R019-0204','SW002','R019','2026-02-04','14:00','regular'),
  cv('CV-SW2-R020-0206','SW002','R020','2026-02-06','10:00','regular'),
  cv('CV-SW2-R021-0206','SW002','R021','2026-02-06','14:30','regular'),
  cv('CV-SW2-R022-0209','SW002','R022','2026-02-09','10:00','benefit_change','급여유형 변경 요청'),
  cv('CV-SW2-R023-0209','SW002','R023','2026-02-09','14:00','regular'),
  cv('CV-SW2-R024-0210','SW002','R024','2026-02-10','09:30','regular'),
  cv('CV-SW2-R025-0210','SW002','R025','2026-02-10','14:00','inspection'),
  cv('CV-SW2-R026-0211','SW002','R026','2026-02-11','10:00','regular'),
  cv('CV-SW2-R027-0211','SW002','R027','2026-02-11','14:00','regular'),
  cv('CV-SW2-R028-0212','SW002','R028','2026-02-12','10:00','regular'),
  cv('CV-SW2-R029-0212','SW002','R029','2026-02-12','14:00','regular'),
  cv('CV-SW2-R030-0217','SW002','R030','2026-02-17','10:00','regular'),
  cv('CV-SW2-R031-0217','SW002','R031','2026-02-17','14:30','regular'),
  cv('CV-SW2-R032-0218','SW002','R032','2026-02-18','09:30','complaint', '담당 변경 요청 민원'),
  cv('CV-SW2-R033-0218','SW002','R033','2026-02-18','14:00','regular'),
  cv('CV-SW2-R034-0224','SW002','R034','2026-02-24','10:00','regular'),
  // 2026-03
  cv('CV-SW2-R018-0304','SW002','R018','2026-03-04','10:00','regular'),
  cv('CV-SW2-R019-0304','SW002','R019','2026-03-04','14:00','regular'),
  cv('CV-SW2-R020-0305','SW002','R020','2026-03-05','10:00','regular'),
  cv('CV-SW2-R021-0306','SW002','R021','2026-03-06','14:30','regular'),
  cv('CV-SW2-R022-0309','SW002','R022','2026-03-09','10:00','regular'),
  cv('CV-SW2-R023-0309','SW002','R023','2026-03-09','14:00','regular'),
  cv('CV-SW2-R024-0311','SW002','R024','2026-03-11','09:30','benefit_change','방문요양 시간 변경'),
  cv('CV-SW2-R025-0311','SW002','R025','2026-03-11','14:00','regular'),
  cv('CV-SW2-R026-0312','SW002','R026','2026-03-12','10:00','regular'),
  cv('CV-SW2-R027-0312','SW002','R027','2026-03-12','14:00','regular'),
  cv('CV-SW2-R028-0313','SW002','R028','2026-03-13','10:00','regular'),
  cv('CV-SW2-R029-0316','SW002','R029','2026-03-16','14:00','regular'),
  cv('CV-SW2-R030-0317','SW002','R030','2026-03-17','10:00','regular'),
  cv('CV-SW2-R031-0317','SW002','R031','2026-03-17','14:30','regular'),
  cv('CV-SW2-R032-0318','SW002','R032','2026-03-18','09:30','regular'),
  cv('CV-SW2-R033-0319','SW002','R033','2026-03-19','14:00','regular'),
  cv('CV-SW2-R034-0320','SW002','R034','2026-03-20','10:00','regular'),
  // 2026-04
  cv('CV-SW2-R018-0402','SW002','R018','2026-04-02','10:00','regular'),
  cv('CV-SW2-R019-0402','SW002','R019','2026-04-02','14:00','regular'),
  cv('CV-SW2-R020-0403','SW002','R020','2026-04-03','10:00','regular'),
  cv('CV-SW2-R021-0407','SW002','R021','2026-04-07','14:30','regular'),
  cv('CV-SW2-R022-0408','SW002','R022','2026-04-08','10:00','regular'),
  cv('CV-SW2-R023-0408','SW002','R023','2026-04-08','14:00','regular'),
  cv('CV-SW2-R024-0409','SW002','R024','2026-04-09','09:30','regular'),
  cv('CV-SW2-R025-0410','SW002','R025','2026-04-10','14:00','regular'),
  cv('CV-SW2-R026-0411','SW002','R026','2026-04-11','10:00','regular'),
  cv('CV-SW2-R027-0413','SW002','R027','2026-04-13','14:00','regular'),
  cv('CV-SW2-R028-0414','SW002','R028','2026-04-14','10:00','regular'),
  cv('CV-SW2-R029-0414','SW002','R029','2026-04-14','14:00','regular'),
  cv('CV-SW2-R030-0415','SW002','R030','2026-04-15','10:00','regular'),
  cv('CV-SW2-R031-0416','SW002','R031','2026-04-16','14:30','regular'),
  cv('CV-SW2-R032-0417','SW002','R032','2026-04-17','09:30','inspection'),
  cv('CV-SW2-R033-0421','SW002','R033','2026-04-21','14:00','regular'),
  cv('CV-SW2-R034-0422','SW002','R034','2026-04-22','10:00','regular'),
  // ── SW003 이나연 / R035-R050
  // 2026-02
  cv('CV-SW3-R035-0204','SW003','R035','2026-02-04','10:00','regular'),
  cv('CV-SW3-R036-0204','SW003','R036','2026-02-04','14:00','regular'),
  cv('CV-SW3-R037-0206','SW003','R037','2026-02-06','10:00','regular'),
  cv('CV-SW3-R038-0206','SW003','R038','2026-02-06','14:00','regular'),
  cv('CV-SW3-R039-0209','SW003','R039','2026-02-09','10:00','regular'),
  cv('CV-SW3-R040-0209','SW003','R040','2026-02-09','14:00','benefit_change','급여시간 조정'),
  cv('CV-SW3-R041-0210','SW003','R041','2026-02-10','09:30','regular'),
  cv('CV-SW3-R042-0210','SW003','R042','2026-02-10','14:00','regular'),
  cv('CV-SW3-R043-0211','SW003','R043','2026-02-11','10:00','regular'),
  cv('CV-SW3-R044-0211','SW003','R044','2026-02-11','14:00','termination','유효기간 만료 종결 상담'),
  cv('CV-SW3-R045-0213','SW003','R045','2026-02-13','09:30','regular'),
  cv('CV-SW3-R046-0213','SW003','R046','2026-02-13','14:00','regular'),
  cv('CV-SW3-R047-0217','SW003','R047','2026-02-17','10:00','regular'),
  cv('CV-SW3-R048-0217','SW003','R048','2026-02-17','14:00','regular'),
  cv('CV-SW3-R049-0218','SW003','R049','2026-02-18','10:00','termination','유효기간 만료·타기관 이용'),
  cv('CV-SW3-R050-0218','SW003','R050','2026-02-18','14:00','regular'),
  // 2026-03
  cv('CV-SW3-R035-0304','SW003','R035','2026-03-04','10:00','regular'),
  cv('CV-SW3-R036-0304','SW003','R036','2026-03-04','14:00','regular'),
  cv('CV-SW3-R037-0305','SW003','R037','2026-03-05','10:00','regular'),
  cv('CV-SW3-R038-0305','SW003','R038','2026-03-05','14:00','regular'),
  cv('CV-SW3-R039-0306','SW003','R039','2026-03-06','10:00','regular'),
  cv('CV-SW3-R040-0309','SW003','R040','2026-03-09','14:00','regular'),
  cv('CV-SW3-R041-0310','SW003','R041','2026-03-10','09:30','regular'),
  cv('CV-SW3-R042-0310','SW003','R042','2026-03-10','14:00','regular'),
  cv('CV-SW3-R043-0311','SW003','R043','2026-03-11','10:00','complaint', '방문 시간 불만 민원'),
  cv('CV-SW3-R044-0311','SW003','R044','2026-03-11','14:00','termination','종결 후속 확인'),
  cv('CV-SW3-R045-0312','SW003','R045','2026-03-12','09:30','regular'),
  cv('CV-SW3-R046-0312','SW003','R046','2026-03-12','14:00','regular'),
  cv('CV-SW3-R047-0317','SW003','R047','2026-03-17','10:00','regular'),
  cv('CV-SW3-R048-0317','SW003','R048','2026-03-17','14:00','regular'),
  cv('CV-SW3-R049-0318','SW003','R049','2026-03-18','10:00','termination','종결 후속 확인'),
  cv('CV-SW3-R050-0319','SW003','R050','2026-03-19','14:00','regular'),
  // 2026-04
  cv('CV-SW3-R035-0402','SW003','R035','2026-04-02','10:00','regular'),
  cv('CV-SW3-R036-0403','SW003','R036','2026-04-03','14:00','regular'),
  cv('CV-SW3-R037-0407','SW003','R037','2026-04-07','10:00','regular'),
  cv('CV-SW3-R038-0408','SW003','R038','2026-04-08','14:00','regular'),
  cv('CV-SW3-R039-0409','SW003','R039','2026-04-09','10:00','regular'),
  cv('CV-SW3-R040-0410','SW003','R040','2026-04-10','14:00','regular'),
  cv('CV-SW3-R041-0411','SW003','R041','2026-04-11','09:30','regular'),
  cv('CV-SW3-R042-0411','SW003','R042','2026-04-11','14:00','regular'),
  cv('CV-SW3-R043-0413','SW003','R043','2026-04-13','10:00','benefit_change','급여변경 논의'),
  cv('CV-SW3-R044-0413','SW003','R044','2026-04-13','14:00','termination','종결 재확인'),
  cv('CV-SW3-R045-0414','SW003','R045','2026-04-14','09:30','regular'),
  cv('CV-SW3-R046-0414','SW003','R046','2026-04-14','14:00','regular'),
  cv('CV-SW3-R047-0415','SW003','R047','2026-04-15','10:00','regular'),
  cv('CV-SW3-R048-0416','SW003','R048','2026-04-16','14:00','regular'),
  cv('CV-SW3-R049-0421','SW003','R049','2026-04-21','10:00','termination'),
  cv('CV-SW3-R050-0422','SW003','R050','2026-04-22','14:00','regular'),
];

// ─────────────────────────────────────────────────────────────────────────────
// 한케어 업무포털 공유 — Recipient 상세(BasicInfo), Guardian, Employee 상세
// (EmpDetail), 하위타입, 공통 상수.
// 본 프로그램은 위 데이터를 조회/참조용으로만 사용한다.
// ─────────────────────────────────────────────────────────────────────────────

export interface Guardian {
  id: number;
  name: string;
  relation: string;
  relationDirect: string;
  homePhone: string;
  mobile: string;
  mobileKakao: boolean;
  zipCode: string;
  address: string;
  addressDetail: string;
}

export interface ContractPeriodEntry {
  id: number;
  from: string;
  to: string;
  reason?: string;
}

export interface FamilyWorkerEntry { id: number; name: string; relation: string; }

export interface BasicInfo {
  photo: string;
  contractStatus: ContractStatus;
  name: string;
  alias: string;
  legalDob: string;
  gender: Gender;
  realDob: string;
  realDobType: RealDobType;
  certNo: string;
  validFrom: string;
  validTo: string;
  grade: string;
  reduction: ReductionType;
  services: CareSubCategory[];
  approvedAmtCare: string;
  approvedAmtBath: string;
  approvedAmtNursing: string;
  approvedAmtDay: string;
  approvedAmtOther: string;
  contractDate: string;
  benefitStartDate: string;
  contractPeriodFrom: string;
  contractPeriodTo: string;
  contractPeriodHistory: ContractPeriodEntry[];
  diseases: string[];
  diseaseMemo: string;
  memo: string;
  homePhone: string;
  mobile: string;
  mobileKakao: boolean;
  zipCode: string;
  address: string;
  addressDetail: string;
  contractorName: string;
  contractorRelation: string;
  contractorRelationDirect: string;
  contractorDob: string;
  contractorHomePhone: string;
  contractorMobile: string;
  contractorMemo: string;
  cashReceiptPhone: string;
  contractorZipCode: string;
  contractorAddress: string;
  contractorAddressDetail: string;
  guardians: Guardian[];
  workers: string[];
  familyWorkers: FamilyWorkerEntry[];
  medicalBenefitType: string;
  medicalBenefitNo: string;
  medicalBenefitNote: string;
}

export interface EmploymentPeriod { id: number; joinDate: string; retireDate: string; }

export interface InsuranceEntry {
  enrolled: boolean;
  acquisitionDate: string;
  lossDate: string;
  baseIncome: string;
}

export interface EmployeeInsurance {
  nationalPension: InsuranceEntry;
  healthInsurance: InsuranceEntry;
  employmentInsurance: InsuranceEntry;
  industrialAccident: InsuranceEntry;
}

export interface LiabilityInsuranceEntry {
  id: number;
  insurer: string;
  policyName: string;
  startDate: string;
  endDate: string;
}

export interface SalaryYearData {
  salaryType: SalaryType;
  monthlySalary: string;
  baseSalary: string;
  weeklyDays: string;
  weeklyHours: string;
  hourlyTotalRate: string;
  baseHourly: string;
  weeklyHolidayPay: string;
  annualLeavePay: string;
  mealAllowance: string;
  transportAllowance: string;
  otherAllowance: string;
}

export interface QualificationEntry { id: number; name: string; number: string; issuedAt: string; }

export interface EmpDetail {
  photo: string;
  nickname: string;
  rrn: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  bankName: string;
  accountNumber: string;
  workBusiness: WorkBusiness[];
  position: string;
  salaryType: SalaryType;
  employmentPeriods: EmploymentPeriod[];
  insurance: EmployeeInsurance;
  qualifications: QualificationEntry[];
  hasInjiEducation: boolean;
  liabilityInsuranceList: LiabilityInsuranceEntry[];
  homePhone: string;
  memo: string;
  isForeigner: boolean;
  nationality: string;
  nationalityCode: string;
  englishName: string;
  visaType: string;
  salaryByYear: Record<string, SalaryYearData>;
}

// ─── 공통 상수 (한케어 업무포털 소유) ───────────────────────────────────
export const FACILITY_CATEGORIES: FacilityCategory[] = ['요양기관', '교육원', '임대', '기타'];
export const CARE_SUB_CATEGORIES: CareSubCategory[]  = ['요양', '목욕', '간호', '주간', '용구', '통합', '돌봄', '기타'];
export const WORK_BUSINESSES: WorkBusiness[]         = [...CARE_SUB_CATEGORIES];
export const CONTRACT_STATUSES: ContractStatus[]     = ['준비중', '수급중', '타기관', '계약종료', '사망', '보류', '입원', '상담중'];
// 외부 공통 수급자 기초정보의 GRADE_OPTIONS와 동일
export const GRADE_OPTIONS: string[]                 = ['1등급', '2등급', '3등급', '4등급', '5등급', '인지지원', '등급외'];
export const REDUCTION_OPTIONS: ReductionType[]      = ['일반', '감경9%', '감경7.5%', '감경6%', '기초'];
export const SERVICE_TYPES: string[]                 = ['방문요양', '방문목욕', '방문간호', '주간보호', '복지용구', '통합재가', '돌봄', '기타'];
export const RELATION_OPTIONS: string[]              = ['배우자', '자녀', '부모', '형제자매', '며느리', '사위', '손자녀', '친척', '기타'];
export const SALARY_TYPES: SalaryType[]              = ['월급제', '시간제'];
export const SVC_FILTERS: string[]                   = ['프로그램만', '세무대행', '4대대행', '재무대행'];
export const COLOR_OPTIONS: string[]                 = ['blue', 'green', 'amber', 'red', 'purple', 'slate'];

export const DISEASE_LIST: string[] = [
  '뇌졸중', '치매', '파킨슨병', '당뇨병', '고혈압', '관절염', '골다공증',
  '심부전', '만성폐쇄성폐질환(COPD)', '신부전', '뇌경색', '뇌출혈', '척추질환',
  '시각장애', '청각장애', '암', '우울증', '기타',
];

export const BANKS: string[] = [
  '국민은행', '신한은행', '우리은행', '하나은행', 'NH농협은행', 'IBK기업은행',
  'SC제일은행', '한국씨티은행', '카카오뱅크', '케이뱅크', '토스뱅크',
  '새마을금고', '신협', '우체국', '수협은행', '대구은행', '부산은행',
  '광주은행', '전북은행', '경남은행',
];

export interface CurrentUser { id: string; name: string; positionCode: string; }
export const CURRENT_USER: CurrentUser = { id: 'SW001', name: '김지원', positionCode: 'ST_03' };

// 그룹 목업 (기초정보관리 > 그룹관리 연동 전 UI 전용)
export const RECIP_GROUPS = [
  { id: 'all',    label: '전체',          subs: [] as string[] },
  { id: 'sw',     label: '담당사회복지사', subs: ['김지원', '박수현', '이나연'] },
  { id: 'region', label: '지역구분',       subs: ['동부지역', '서부지역'] },
];

export interface Group { id: string; name: string; color: string; tab: 'recipients' | 'employees'; }
export const initGroups: Group[] = [
  { id: 'G1', name: '1팀',   color: 'blue',   tab: 'recipients' },
  { id: 'G2', name: '2팀',   color: 'green',  tab: 'recipients' },
  { id: 'G3', name: '3팀',   color: 'amber',  tab: 'recipients' },
  { id: 'GE1', name: '요양보호사', color: 'purple', tab: 'employees'  },
  { id: 'GE2', name: '사회복지사', color: 'slate',  tab: 'employees'  },
];

// 등급 → BasicInfo grade 문자열 매핑(기존 number Recipient.grade를 PDF 문자열과 잇기 위함)
export function gradeToText(g: RecipientGrade | number): string {
  return `${g}등급`;
}

// RecipientRow.copaymentType(레거시 문자열) → 정본 ReductionType 파서. buildRecipient 전용.
function parseReductionFromLegacy(copaymentType: string): ReductionType {
  if (copaymentType.includes('9'))    return '감경9%';
  if (copaymentType.includes('7.5'))  return '감경7.5%';
  if (copaymentType.includes('6'))    return '감경6%';
  if (copaymentType.includes('기초')) return '기초';
  return '일반';
}

// 정본 우선 헬퍼 — 신규 화면은 이 함수들을 사용한다.
export function getReduction(r: Recipient): ReductionType { return r.reduction; }
export function getReductionPill(r: Recipient): string {
  const red = r.reduction;
  if (red === '일반') return `일반 ${getCopayRate(r)}%`;
  if (red === '기초') return '기초';
  return red; // 감경9% / 감경7.5% / 감경6%
}
export function getCertNo(r: Recipient): string    { return r.certNo;    }
export function getValidFrom(r: Recipient): string { return r.validFrom; }
export function getValidTo(r: Recipient): string   { return r.validTo;   }
export function getMobile(r: Recipient): string    { return r.mobile;    }
export function getLegalDob(r: Recipient): string  { return r.legalDob;  }
export function getRealDob(r: Recipient): string   { return r.realDob ?? r.legalDob; }
// 직원 주민번호(YYMMDD-G******)에서 생년월일 'YYYY-MM-DD' 추출. G(7번째 숫자)로 세기 판별.
export function getEmployeeBirth(e: Employee): string {
  const raw = (e.registrationId || '').replace(/[^0-9]/g, '');
  if (raw.length < 7) return '';
  const yy = raw.slice(0, 2), mm = raw.slice(2, 4), dd = raw.slice(4, 6);
  const g = raw[6];
  const century = (g === '1' || g === '2' || g === '5' || g === '6') ? '19'
                : (g === '3' || g === '4' || g === '7' || g === '8') ? '20'
                : '19';
  return `${century}${yy}-${mm}-${dd}`;
}
export function getGradeText(r: Recipient): string { return r.gradeText; }
export function getServices(r: Recipient): CareSubCategory[] { return r.services; }

// reduction → 본인부담률(%) 매핑
export function getCopayRate(r: Recipient): number {
  switch (r.reduction) {
    case '기초':    return 0;
    case '감경6%':  return 6;
    case '감경7.5%': return 7.5;
    case '감경9%':  return 9;
    case '일반':
    default:        return 15;
  }
}

// gradeText('1등급'~'5등급'·'인지지원'·'등급외') → 숫자 등급(1~5; 인지지원·등급외는 5로 매핑)
export function getGradeNum(r: Recipient): RecipientGrade {
  const m = r.gradeText.match(/(\d)/);
  const n = m ? parseInt(m[1], 10) : 5;
  return (n >= 1 && n <= 5 ? n : 5) as RecipientGrade;
}

// 서비스 운영 어휘(ServiceType[]) — 일정/배정 도메인이 사용
export function getServiceTypes(r: Recipient): ServiceType[] { return r.serviceTypes; }

// 서비스별 인정금액(approvedAmt*) — Recipient.approvedAmts가 있으면 사용,
// 없으면 monthlyLimit을 활성 serviceTypes에 균등 분배해 파생.
export function getApprovedAmounts(r: Recipient): { care: number; bath: number; nursing: number; day: number; other: number } {
  const a = r.approvedAmts ?? {};
  const fromOverride = {
    care:    a.care    ?? 0,
    bath:    a.bath    ?? 0,
    nursing: a.nursing ?? 0,
    day:     a.day     ?? 0,
    other:   a.other   ?? 0,
  };
  const overrideTotal = fromOverride.care + fromOverride.bath + fromOverride.nursing + fromOverride.day + fromOverride.other;
  if (overrideTotal > 0) return fromOverride;

  const map: Record<ServiceType, keyof typeof fromOverride> = {
    visit_care: 'care',
    visit_bath: 'bath',
    visit_nursing: 'nursing',
    day_care: 'day',
    family_care: 'other',
    full_day_visit: 'care',
  };
  const active = r.serviceTypes.length || 1;
  const each = Math.round(r.monthlyLimit / active);
  const out = { care: 0, bath: 0, nursing: 0, day: 0, other: 0 };
  r.serviceTypes.forEach(st => { out[map[st]] = each; });
  return out;
}

export function getGuardians(r: Recipient): Guardian[] {
  return r.guardians;
}
