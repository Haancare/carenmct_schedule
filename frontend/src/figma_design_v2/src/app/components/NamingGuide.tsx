import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

// ─── 데이터 타입 ──────────────────────────────────────────────────────────────

type DataRow = string[];
type SectionRow = { section: string };
type Row = DataRow | SectionRow;

interface SheetDef {
  id: string;
  label: string;
  headers: string[];
  rows: Row[];
}

function isSection(r: Row): r is SectionRow {
  return typeof r === 'object' && 'section' in r;
}

// ─── 시트 데이터 ──────────────────────────────────────────────────────────────

const SHEETS: SheetDef[] = [
  // ── 1. 라우트 & 컴포넌트 ──────────────────────────────────────────────────
  {
    id: 'routes',
    label: '라우트 & 컴포넌트',
    headers: ['경로', '컴포넌트명', '한국어 기능명'],
    rows: [
      { section: '요양기관 시스템 (급여제공관리)' },
      ['/', 'Layout', '공통 레이아웃 (헤더+서브바+Outlet)'],
      ['/dashboard', 'Dashboard', '대시보드'],
      ['/payment-assignment', 'PaymentAssignment', '급여일정관리'],
      ['/copayment-confirmation', 'CopaymentConfirmation', '본인부담금확정'],
      ['/care-plan', 'CarePlanManagement', '급여제공계획관리'],
      ['/consultation', 'ConsultationManagement', '방문상담관리'],
      ['/recipients', 'RecipientList', '수급자 목록'],
      ['/recipients/:id', 'RecipientDetail', '수급자 상세'],
      ['/care-workers', 'CareWorkerList', '요양보호사 목록'],
      { section: '관리자시스템 (한케어 내부)' },
      ['/admin', 'AdminLayout', '관리자 공통 레이아웃'],
      ['/admin', 'AdminDashboard', '관리자 홈'],
      ['/admin/naming-guide', 'NamingGuide', '네이밍 가이드 (개발관리)'],
      { section: '보조 컴포넌트' },
      ['—', 'JournalModal', '일지 입력 모달'],
      ['—', 'RecipientJournalTab', '수급자 상세 > 일지 탭'],
      ['—', 'RecipientMemoPanel', '수급자 메모 패널'],
    ],
  },

  // ── 2. 주요 타입 정의 ─────────────────────────────────────────────────────
  {
    id: 'types',
    label: '주요 타입 정의',
    headers: ['타입명 (영문)', '한국어 의미', '종류', '파일명'],
    rows: [
      { section: '인터페이스 (interface)' },
      ['Recipient', '수급자', 'interface', 'mockData.ts'],
      ['Employee', '직원 (통합 엔티티 — 외부 기초정보 공유)', 'interface', 'mockData.ts'],
      ['ScheduleEntry', '급여일정 항목', 'interface', 'mockData.ts'],
      ['ConsultationVisit', '방문상담', 'interface', 'mockData.ts'],
      { section: '타입 별칭 (type alias — 하위 호환)' },
      ['CareWorker', 'Employee 별칭 (positionCode=ST_08)', 'type alias', 'mockData.ts'],
      ['SocialWorker', 'Employee 별칭 (positionCode=ST_03/ST_04)', 'type alias', 'mockData.ts'],
      ['WorkerStatus', "직원 상태 ('active' | 'inactive')", 'union type', 'mockData.ts'],
      { section: '유니온 타입 (type)' },
      ['ServiceType', '급여유형', 'union type', 'mockData.ts'],
      ['RecipientGrade', '장기요양등급', 'union type (1~5)', 'mockData.ts'],
      ['ConsultType', '상담구분', 'union type', 'mockData.ts'],
      ['ConsultStatus', '상담상태', 'union type', 'mockData.ts'],
    ],
  },

  // ── 3. 열거형/유니온 타입 ─────────────────────────────────────────────────
  {
    id: 'enums',
    label: '열거형/유니온 타입',
    headers: ['타입명', '값', '한국어 레이블', '파일명'],
    rows: [
      { section: 'ServiceType — 급여유형' },
      ['ServiceType', 'visit_care', '방문요양', 'mockData.ts'],
      ['ServiceType', 'visit_bath', '방문목욕', 'mockData.ts'],
      ['ServiceType', 'visit_nursing', '방문간호', 'mockData.ts'],
      ['ServiceType', 'day_care', '주간보호', 'mockData.ts'],
      ['ServiceType', 'family_care', '가족요양', 'mockData.ts'],
      { section: 'RecipientGrade — 장기요양등급' },
      ['RecipientGrade', '1', '1등급', 'mockData.ts'],
      ['RecipientGrade', '2', '2등급', 'mockData.ts'],
      ['RecipientGrade', '3', '3등급', 'mockData.ts'],
      ['RecipientGrade', '4', '4등급', 'mockData.ts'],
      ['RecipientGrade', '5', '5등급', 'mockData.ts'],
      { section: 'POSITION_CODES — 직종 코드' },
      ['POSITION_CODES', 'ST_01', '시설장(관리책임자)', 'mockData.ts'],
      ['POSITION_CODES', 'ST_02', '사무국장', 'mockData.ts'],
      ['POSITION_CODES', 'ST_03', '사회복지사 ★방문상담', 'mockData.ts'],
      ['POSITION_CODES', 'ST_04', '간호사 ★방문상담', 'mockData.ts'],
      ['POSITION_CODES', 'ST_05', '물리치료사', 'mockData.ts'],
      ['POSITION_CODES', 'ST_06', '작업치료사', 'mockData.ts'],
      ['POSITION_CODES', 'ST_07', '언어치료사', 'mockData.ts'],
      ['POSITION_CODES', 'ST_08', '요양보호사 ★급여일정배정', 'mockData.ts'],
      ['POSITION_CODES', 'ST_09', '간호조무사', 'mockData.ts'],
      ['POSITION_CODES', 'ST_10', '영양사', 'mockData.ts'],
      ['POSITION_CODES', 'ST_11', '조리원', 'mockData.ts'],
      ['POSITION_CODES', 'ST_12', '사무원', 'mockData.ts'],
      ['POSITION_CODES', 'ST_13', '운전원', 'mockData.ts'],
      ['POSITION_CODES', 'ST_14', '위생원', 'mockData.ts'],
      { section: 'WorkerStatus — 직원 상태' },
      ['WorkerStatus', 'active', '재직 중', 'mockData.ts'],
      ['WorkerStatus', 'inactive', '퇴직/휴직', 'mockData.ts'],
      { section: 'ConsultType — 상담구분' },
      ['ConsultType', 'new_consult', '신규상담', 'mockData.ts'],
      ['ConsultType', 'regular', '정기상담', 'mockData.ts'],
      ['ConsultType', 'benefit_change', '급여변경', 'mockData.ts'],
      ['ConsultType', 'complaint', '민원', 'mockData.ts'],
      ['ConsultType', 'termination', '종결', 'mockData.ts'],
      ['ConsultType', 'inspection', '점검', 'mockData.ts'],
      { section: 'ConsultStatus — 상담상태' },
      ['ConsultStatus', 'planned', '상담 예정', 'mockData.ts'],
      ['ConsultStatus', 'completed', '상담 완료', 'mockData.ts'],
      { section: 'status — 이용/재직 상태 (공통)' },
      ['status', 'active', '이용 중 / 재직 중', 'mockData.ts'],
      ['status', 'inactive', '종료 / 퇴직', 'mockData.ts'],
    ],
  },

  // ── 4. 주요 상수 ──────────────────────────────────────────────────────────
  {
    id: 'constants',
    label: '주요 상수',
    headers: ['상수명', '타입', '내용', '파일명'],
    rows: [
      { section: '급여유형 레이블/색상' },
      ['SERVICE_LABELS', 'Record<ServiceType, string>', 'visit_care→방문요양 / visit_bath→방문목욕 / visit_nursing→방문간호 / day_care→주간보호 / family_care→가족요양', 'mockData.ts'],
      ['SERVICE_SHORT', 'Record<ServiceType, string>', 'visit_care→요양 / visit_bath→목욕 / visit_nursing→간호 / day_care→주간 / family_care→가족', 'mockData.ts'],
      ['SERVICE_COLORS', 'Record<ServiceType, {bg,text,border}>', 'Tailwind 클래스: visit_care→blue / visit_bath→emerald / visit_nursing→orange / day_care→violet / family_care→sky', 'mockData.ts'],
      { section: '직종 코드 (외부 기초정보 시스템 공유)' },
      ['POSITION_CODES', 'Record<string, string>', 'ST_01~ST_14 → 직종명 (시설장/사무국장/사회복지사/간호사/물리치료사/작업치료사/언어치료사/요양보호사/간호조무사/영양사/조리원/사무원/운전원/위생원)', 'mockData.ts'],
      ['CARE_WORKER_POSITIONS', "string[]", "['ST_08'] — 급여일정 배정 대상 직종", 'mockData.ts'],
      ['CONSULT_WORKER_POSITIONS', "string[]", "['ST_03','ST_04'] — 방문상담 담당 직종", 'mockData.ts'],
      { section: '등급별 월한도액' },
      ['GRADE_LIMITS', 'Record<RecipientGrade, number>', '1등급→2,306,760 / 2등급→2,045,680 / 3등급→1,697,540 / 4등급→1,383,950 / 5등급→1,166,390 (단위: 원)', 'mockData.ts'],
      { section: 'ID 패턴' },
      ['—', 'Recipient.id', 'R{3자리} — R001~R050', 'mockData.ts'],
      ['—', 'CareWorker.id', 'W{3자리} — W001~W015', 'mockData.ts'],
      ['—', 'SocialWorker.id', 'SW{3자리} — SW001~SW003', 'mockData.ts'],
      ['—', 'ScheduleEntry.id', 'SCH-{YYYY-MM-DD}-{recipientId}-{careWorkerId}[-{serviceType}]', 'mockData.ts'],
      ['—', 'ConsultationVisit.id', 'CV-{swId}-{recipientId}-{mmdd}', 'mockData.ts'],
    ],
  },

  // ── 5. Recipient 필드 ─────────────────────────────────────────────────────
  {
    id: 'recipient',
    label: 'Recipient 필드',
    headers: ['필드명 (영문)', '한국어 레이블', '타입', '비고'],
    rows: [
      { section: 'Recipient — 수급자' },
      ['id', '수급자 ID', 'string', 'R001~R050'],
      ['name', '이름', 'string', ''],
      ['registrationId', '장기요양인정번호', 'string', ''],
      ['grade', '장기요양등급', 'RecipientGrade', '1~5'],
      ['copaymentType', '감경구분', 'string', '기초수급자 / 감경6% / 감경9% / 일반대상자'],
      ['copaymentRate', '본인부담률(%)', 'number', '0, 6, 9, 15'],
      ['insuranceId', '주민등록번호', 'string', '마스킹 처리'],
      ['validityStart', '인정유효기간 시작일', 'string', 'YYYY-MM-DD'],
      ['validityEnd', '인정유효기간 종료일', 'string', 'YYYY-MM-DD'],
      ['assignedCareWorkerIds', '담당 요양보호사 ID 목록', 'string[]', ''],
      ['serviceTypes', '이용 급여유형 목록', 'ServiceType[]', ''],
      ['address', '주소', 'string', ''],
      ['phone', '전화번호', 'string', ''],
      ['guardian', '보호자 이름', 'string', ''],
      ['guardianPhone', '보호자 전화번호', 'string', ''],
      ['monthlyLimit', '월 한도액', 'number', '원 (GRADE_LIMITS 참고)'],
      ['usedAmount', '월 사용금액', 'number', '원'],
      ['selfPay', '본인부담금', 'number', '원'],
      ['status', '이용 상태', "'active' | 'inactive'", ''],
      ['notes', '특이사항', 'string?', 'optional'],
    ],
  },

  // ── 6. Employee 필드 ─────────────────────────────────────────────────────
  {
    id: 'employee',
    label: 'Employee 필드',
    headers: ['필드명 (영문)', '한국어 레이블', '타입', '비고'],
    rows: [
      { section: 'Employee — 통합 직원 (외부 기초정보 시스템 공유)' },
      ['id', '직원 ID', 'string', '요양보호사: W001~W015 / 상담직원: SW001~SW003'],
      ['name', '이름', 'string', ''],
      ['registrationId', '주민등록번호', 'string', '마스킹 처리'],
      ['phone', '전화번호', 'string', ''],
      ['positionCode', '직종 코드', 'string', 'POSITION_CODES 키 (ST_01~ST_14)'],
      ['qualification', '자격증명', 'string?', 'optional'],
      ['joinDate', '입사일', 'string', 'YYYY-MM-DD'],
      ['assignedRecipientIds', '담당 수급자 ID 목록', 'string[]', ''],
      ['status', '재직 상태', 'WorkerStatus', "'active' | 'inactive'"],
      { section: '화면별 필터링 규칙' },
      ['급여일정관리', '요양보호사 목록', 'positionCode = ST_08', 'CARE_WORKER_POSITIONS'],
      ['방문상담관리', '상담직원 목록', 'positionCode = ST_03 또는 ST_04', 'CONSULT_WORKER_POSITIONS'],
    ],
  },

  // ── 7. ScheduleEntry 필드 ────────────────────────────────────────────────
  {
    id: 'schedule',
    label: 'ScheduleEntry 필드',
    headers: ['필드명 (영문)', '한국어 레이블', '타입', '비고'],
    rows: [
      { section: 'ScheduleEntry — 급여일정 항목' },
      ['id', '일정 ID', 'string', 'SCH-{date}-{recipientId}-{careWorkerId}'],
      ['recipientId', '수급자 ID', 'string', 'Recipient.id 참조'],
      ['careWorkerId', '요양보호사 ID', 'string', 'CareWorker.id 참조'],
      ['date', '서비스 일자', 'string', 'YYYY-MM-DD'],
      ['serviceType', '급여유형', 'ServiceType', ''],
      ['startTime', '시작시각', 'string', 'HH:mm'],
      ['endTime', '종료시각', 'string', 'HH:mm'],
      ['durationMinutes', '서비스 시간(분)', 'number', ''],
      ['unitCost', '단가', 'number', '원'],
      ['completed', '완료 여부', 'boolean', ''],
      ['notes', '메모', 'string?', 'optional'],
      { section: '배정 시점 스냅샷 필드 (월중 변경 대응)' },
      ['grade', '등급 (배정 시점)', 'RecipientGrade?', 'optional'],
      ['copaymentType', '감경구분 (배정 시점)', 'string?', 'optional'],
      ['copaymentRate', '본인부담률 (배정 시점)', 'number?', 'optional'],
    ],
  },

  // ── 8. ConsultationVisit 필드 ────────────────────────────────────────────
  {
    id: 'consult',
    label: 'ConsultationVisit 필드',
    headers: ['필드명 (영문)', '한국어 레이블', '타입', '비고'],
    rows: [
      { section: 'ConsultationVisit — 방문상담' },
      ['id', '상담 ID', 'string', 'CV-{swId}-{recipientId}-{mmdd}'],
      ['socialWorkerId', '사회복지사 ID', 'string', 'SocialWorker.id 참조'],
      ['recipientId', '수급자 ID', 'string', 'Recipient.id 참조'],
      ['date', '상담 일자', 'string', 'YYYY-MM-DD'],
      ['consultStatus', '상담 상태', 'ConsultStatus', "'planned' | 'completed'"],
      ['plannedStartTime', '예정 시작시각', 'string', 'HH:mm'],
      ['plannedEndTime', '예정 종료시각', 'string?', 'HH:mm, optional'],
      ['actualStartTime', '실제 시작시각', 'string?', 'HH:mm, 완료 시 입력'],
      ['actualEndTime', '실제 종료시각', 'string?', 'HH:mm, 완료 시 입력'],
      ['consultType', '상담구분', 'ConsultType', ''],
      ['notes', '메모', 'string?', 'optional'],
    ],
  },

  // ── 7. 한케어 업무포털 (외부 공유 — 공유 DB) ────────────────────────────────
  {
    id: 'shared-basic-info',
    label: '★ 한케어 업무포털(외부공유)',
    headers: ['항목', '필드/값', '타입', '비고'],
    rows: [
      { section: '아키텍처 — 「한케어 업무포털」(시작화면)' },
      ['소유 프로그램', '한케어 업무포털 (별도 프로그램, 시작화면)', '—', '본 프로그램은 조회/참조만 함'],
      ['데이터 공유', '같은 서버, 같은 DB', '—', '포털 + 형제 프로그램들이 같은 DB 공유'],
      ['SSO', '미연결', '—', '로그인 세션 공유 없음 (각 프로그램별 진입)'],
      ['로그인 진입점', '한케어 업무포털 시작화면', '—', '본 프로그램은 별도 로그인 UI 없음'],
      ['CRUD 노출', '본 프로그램에서 노출 안 함', '—', '수급자/직원/기관 등록·수정·삭제는 포털 소관'],
      ['UI 표식', 'SharedDataBadge 컴포넌트', '—', '호버 안내만 (외부 링크 없음)'],

      { section: 'Facility — 요양기관 (40+ 필드)' },
      ['accountCode', '회계코드', 'string', ''],
      ['semuloveCode', '세무사랑코드', 'string(4)', ''],
      ['groupCode', '그룹코드', 'string(4)', ''],
      ['category', '분류', 'FacilityCategory', '요양기관|교육원|임대|기타'],
      ['subCategories', '서비스 분류', 'CareSubCategory[]', '요양|목욕|간호|주간|용구|통합|돌봄|기타'],
      ['id', '시설코드', 'string', ''],
      ['name / alias', '기관명 / 별칭', 'string', ''],
      ['code', '기관기호', 'string', ''],
      ['uniqueNum', '사업자번호', 'string', ''],
      ['representatives', '대표자 목록', 'Representative[]', '{ id, name, rrn, phone }'],
      ['phone / fax / email', '전화/팩스/이메일', 'string', ''],
      ['regionId', '지역 (Region 참조)', 'string', 'DEFAULT_REGIONS'],
      ['zipCode / address / addressDetail', '우편/주소/상세', 'string', ''],
      ['managerName/Title/Phone', '관리자 정보', 'string', ''],
      ['employees', '직원수', 'number', ''],
      ['activeMode', '활성여부', 'ActiveMode', '활성|비활성|사용기한부활성'],
      ['activeUntil', '사용기한', 'YYYY-MM-DD', ''],
      ['adminId / adminPw', '아이디 / 비밀번호', 'string', ''],
      ['openDate / designDate', '개업일 / 지정일', 'YYYY-MM-DD', ''],
      ['himsId / himsName', '희망이음 ID / 기관명', 'string', ''],
      ['services', '계약서비스', 'FacilityServices', '{ program, tax, insurance, finance } : boolean'],
      ['contractStartDate / EndDate', '수임일 / 종료일', 'YYYY-MM-DD', ''],
      ['contractEndReason', '종료사유', 'union', '해임|폐업(변경)|폐업(종료)|휴업|기타'],
      ['contractMemo', '계약메모', 'string', ''],
      ['ins4', '4대보험 관리정보', 'FacilityIns4', '국민/건강/장기/고용/산재 비율'],

      { section: 'Recipient (목록) — 수급자' },
      ['id', '내부 키', 'number', ''],
      ['name / code', '수급자명 / 수급자코드', 'string', ''],
      ['grade', '등급', 'string', 'GRADE_OPTIONS'],
      ['dob / age', '생년월일 / 나이', 'string / number', ''],
      ['phone / address', '자택전화/휴대 / 거주지', 'string', ''],
      ['emergencyContact', '비상연락처', 'string', ''],
      ['worker', '담당요양보호사', 'string', ''],
      ['status / type / note', '상태 / 서비스유형 / 참고', 'string', ''],
      ['contractStatus / reduction', '계약구분 / 감경구분', 'string', 'CONTRACT_STATUSES / REDUCTION_OPTIONS'],

      { section: 'BasicInfo — 수급자 상세 (50+ 필드)' },
      ['photo', '수급자사진', 'string', ''],
      ['legalDob / realDob / realDobType', '법정/실제 생일, 양음력', 'string / 양|음', ''],
      ['gender', '성별', '남|여', ''],
      ['certNo', '인정번호', 'string', ''],
      ['validFrom / validTo', '인정유효기간', 'YYYY-MM-DD', ''],
      ['services', '제공서비스', 'string[]', ''],
      ['approvedAmtCare/Bath/Nursing/Day/Other', '급여승인금액(요양/목욕/간호/주간/타기관)', 'string', ''],
      ['contractDate / benefitStartDate', '계약일자 / 급여개시일', 'YYYY-MM-DD', ''],
      ['contractPeriodFrom / To / History', '계약기간/이력', 'string / array', ''],
      ['diseases / diseaseMemo / memo', '대표질환 / 질환메모 / 참고', 'string[] / string', 'DISEASE_LIST'],
      ['homePhone / mobile / mobileKakao', '자택/휴대/카톡', 'string / boolean', ''],
      ['zipCode / address / addressDetail', '거주지', 'string', ''],
      ['contractor*', '계약자 정보 (성명/관계/생년월일/연락처/주소/메모)', 'string', ''],
      ['cashReceiptPhone', '현금영수증 전화번호', 'string', ''],
      ['guardians', '보호자 목록', 'Guardian[]', ''],
      ['workers / familyWorkers', '담당요양보호사 / 가족요양보호사', 'string[] / array', ''],
      ['medicalBenefitType / No / Note', '의료급여 종류/번호/비고', 'string', ''],

      { section: 'Guardian — 보호자' },
      ['id / name / relation / relationDirect', '키/성명/수급자관계/상세', 'number/string', 'RELATION_OPTIONS'],
      ['homePhone / mobile / mobileKakao', '자택/휴대/카톡', 'string / boolean', ''],
      ['zipCode / address / addressDetail', '주소', 'string', ''],

      { section: 'Employee (목록) — 직원' },
      ['id / userId / name', '내부키 / 아이디 / 성명', 'number/string', ''],
      ['position / department', '직종 / 부서', 'string', 'POSITION_CODES'],
      ['phone / email', '휴대폰 / 이메일', 'string', ''],
      ['hireDate / dob', '입사일 / 생년월일', 'string', ''],
      ['status', '재직여부', '재직|퇴직|휴직', 'EmployeeStatus'],
      ['role', '직급', '팀장|직원', 'EmployeeRole'],

      { section: 'EmpDetail — 직원 상세' },
      ['photo / nickname / rrn', '사진 / 별칭 / 주민번호', 'string', ''],
      ['zipCode / address / addressDetail', '주소', 'string', ''],
      ['bankName / accountNumber', '은행명 / 계좌번호', 'string', 'BANKS'],
      ['workBusiness', '근무사업', 'WorkBusiness[]', '요양|목욕|간호|주간|용구|통합|돌봄|기타'],
      ['salaryType', '급여유형', '월급제|시간제', 'SALARY_TYPES'],
      ['employmentPeriods', '재직이력', 'EmploymentPeriod[]', '{ id, joinDate, retireDate }'],
      ['insurance', '4대보험 가입내역', 'EmployeeInsurance', '국민연금/건강/고용/산재 × InsuranceEntry'],
      ['qualifications / hasInjiEducation', '자격증 / 인지지원교육', 'array / boolean', ''],
      ['liabilityInsuranceList', '배상책임보험 이력', 'LiabilityInsuranceEntry[]', ''],
      ['homePhone / memo', '자택전화 / 참고', 'string', ''],
      ['isForeigner / nationality / nationalityCode / englishName / visaType', '외국인 정보', 'boolean / string', ''],
      ['salaryByYear', '연도별 급여정보', 'Record<string, SalaryYearData>', ''],

      { section: '공통 union 타입' },
      ['ActiveMode', '활성|비활성|사용기한부활성', 'union', 'mockData.ts'],
      ['FacilityCategory', '요양기관|교육원|임대|기타', 'union', 'mockData.ts'],
      ['CareSubCategory / WorkBusiness', '요양|목욕|간호|주간|용구|통합|돌봄|기타', 'union', 'mockData.ts'],
      ['ContractEndReason', '해임|폐업(변경)|폐업(종료)|휴업|기타', 'union', 'mockData.ts'],
      ['EmployeeStatus', '재직|퇴직|휴직', 'union', 'mockData.ts'],
      ['EmployeeRole', '팀장|직원', 'union', 'mockData.ts'],
      ['ContractStatus', '준비중|수급중|타기관|계약종료|사망|보류|입원|상담중', 'union', 'mockData.ts'],
      ['ReductionType', '일반|감경9%|감경7.5%|감경6%|기초', 'union', 'mockData.ts'],
      ['SalaryType', '월급제|시간제', 'union', 'mockData.ts'],
      ['Gender / RealDobType', '남|여 / 양|음', 'union', 'mockData.ts'],

      { section: '공통 상수' },
      ['FACILITY_CATEGORIES', '요양기관|교육원|임대|기타', 'FacilityCategory[]', ''],
      ['CARE_SUB_CATEGORIES / WORK_BUSINESSES', '요양|목욕|간호|주간|용구|통합|돌봄|기타', 'CareSubCategory[] / WorkBusiness[]', ''],
      ['EMPTY_INS4', 'FacilityIns4 기본값', 'FacilityIns4', ''],
      ['DEFAULT_REGIONS', '기본 지역 목록', 'Region[]', 'R001~R010'],
      ['CONTRACT_STATUSES', '준비중|수급중|타기관|계약종료|사망|보류|입원|상담중', 'ContractStatus[]', ''],
      ['GRADE_OPTIONS', '1~5등급, 인지지원등급', 'string[]', ''],
      ['REDUCTION_OPTIONS', '일반|감경9%|감경7.5%|감경6%|기초', 'ReductionType[]', ''],
      ['SERVICE_TYPES', '방문요양|방문목욕|방문간호 등', 'string[]', ''],
      ['RELATION_OPTIONS', '보호자 관계 선택지', 'string[]', '배우자/자녀/부모/...'],
      ['DISEASE_LIST', '상병명 목록', 'string[]', ''],
      ['SALARY_TYPES', '월급제|시간제', 'SalaryType[]', ''],
      ['SVC_FILTERS', '프로그램만|세무대행|4대대행|재무대행', 'string[]', ''],
      ['COLOR_OPTIONS', '그룹 색상', 'string[]', 'blue/green/amber/red/purple/slate'],
      ['initGroups', '기본 그룹 목록', 'Group[]', '{ id, name, color, tab }'],
      ['CURRENT_USER', '현재 로그인 사용자', '{ id, name, positionCode }', '한케어 업무포털에서 로그인'],
      ['BANKS', '은행명 목록', 'string[]', '20개'],

      { section: 'currentFacility — 즐거운재가센터 (인스턴스)' },
      ['name / alias', '즐거운재가센터 / 즐거운재가', 'string', ''],
      ['code', '11-1100023', 'string', ''],
      ['category', '요양기관', 'FacilityCategory', ''],
      ['subCategories', '요양·목욕·간호', 'CareSubCategory[]', ''],
    ],
  },
];

// ─── 유틸: Excel 다운로드 ────────────────────────────────────────────────────

function downloadExcel() {
  const wb = XLSX.utils.book_new();

  SHEETS.forEach(sheet => {
    const wsData: string[][] = [sheet.headers];

    sheet.rows.forEach(row => {
      if (isSection(row)) {
        wsData.push([`--- ${row.section}`, '', '', ''].slice(0, sheet.headers.length));
      } else {
        const padded = [...row];
        while (padded.length < sheet.headers.length) padded.push('');
        wsData.push(padded);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // 열 너비 자동 설정
    const colWidths = sheet.headers.map((_, ci) =>
      Math.max(
        sheet.headers[ci]?.length ?? 10,
        ...wsData.map(r => (r[ci] ?? '').length),
      ) + 4
    );
    ws['!cols'] = colWidths.map(w => ({ wch: Math.min(w, 60) }));

    XLSX.utils.book_append_sheet(wb, ws, sheet.label);
  });

  XLSX.writeFile(wb, '한케어_네이밍가이드.xlsx');
}

// ─── 디자인 토큰 ─────────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
  background: '#152e50', color: '#93c5fd', fontSize: 13, fontWeight: 600,
  padding: '5px 10px', textAlign: 'left', whiteSpace: 'nowrap',
  position: 'sticky', top: 0, zIndex: 1,
  boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.06)',
};

// ─── 컴포넌트 ────────────────────────────────────────────────────────────────

export function NamingGuide() {
  const [activeId, setActiveId] = useState(SHEETS[0].id);
  const sheet = SHEETS.find(s => s.id === activeId)!;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
      fontFamily: "'Noto Sans KR', sans-serif",
    }}>

      {/* ── 툴바 ── */}
      <div style={{
        flexShrink: 0, height: 40,
        background: '#ffffff', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center',
        paddingLeft: 16, paddingRight: 12, gap: 8,
      }}>
        {/* 시트 탭 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflowX: 'auto' }}>
          {SHEETS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              style={{
                height: 26, paddingLeft: 10, paddingRight: 10,
                borderRadius: 5, fontSize: 13, border: 'none', cursor: 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
                fontFamily: "'Noto Sans KR', sans-serif",
                background: activeId === s.id
                  ? 'linear-gradient(135deg, #1e3a5f, #152e50)'
                  : '#f1f5f9',
                color: activeId === s.id ? '#ffffff' : '#475569',
                fontWeight: activeId === s.id ? 600 : 400,
                boxShadow: activeId === s.id ? '0 1px 3px rgba(15,39,68,0.25)' : 'none',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* 엑셀 다운로드 버튼 */}
        <button
          onClick={downloadExcel}
          style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 5,
            height: 28, paddingLeft: 12, paddingRight: 12,
            borderRadius: 5, fontSize: 13, fontWeight: 700,
            border: '1px solid #16a34a', cursor: 'pointer',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            color: '#ffffff', fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          <Download size={12} />
          <span>엑셀 다운로드</span>
        </button>
      </div>

      {/* ── 테이블 미리보기 ── */}
      <div style={{ flex: 1, overflow: 'auto', background: '#f8fafc' }}>
        {/* 시트 제목 */}
        <div style={{
          padding: '8px 16px 6px',
          background: '#ffffff', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'baseline', gap: 8,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f2744' }}>{sheet.label}</span>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>
            {sheet.rows.filter(r => !isSection(r)).length}개 항목
          </span>
        </div>

        <div style={{ padding: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', borderRadius: 6, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <thead>
              <tr>
                {sheet.headers.map((h, i) => (
                  <th key={i} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map((row, ri) => {
                if (isSection(row)) {
                  return (
                    <tr key={ri}>
                      <td
                        colSpan={sheet.headers.length}
                        style={{
                          background: '#1e3a5f',
                          color: '#93c5fd',
                          fontSize: 13, fontWeight: 700,
                          padding: '4px 10px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        — {row.section}
                      </td>
                    </tr>
                  );
                }
                const isEven = (() => {
                  let dataIdx = 0;
                  for (let i = 0; i <= ri; i++) {
                    if (!isSection(sheet.rows[i])) dataIdx++;
                  }
                  return dataIdx % 2 === 0;
                })();
                return (
                  <tr
                    key={ri}
                    style={{ background: isEven ? '#f8fafc' : '#ffffff' }}
                  >
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        style={{
                          fontSize: 13,
                          color: ci === 0 ? '#1d4ed8' : '#1e293b',
                          padding: '4px 10px',
                          boxShadow: 'inset -1px 0 0 #f1f5f9',
                          fontFamily: ci === 0 ? 'monospace' : "'Noto Sans KR', sans-serif",
                          maxWidth: 400,
                          wordBreak: 'break-word' as const,
                        }}
                      >
                        {cell || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
