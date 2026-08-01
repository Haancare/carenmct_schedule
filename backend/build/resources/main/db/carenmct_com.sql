-- ============================================================
-- 한케어 업무포털 (carenmct) DDL
-- MariaDB 10.x / UTF8MB4
-- 생성일: 2026-06-09
--
-- 테이블 생성 순서 (FK 의존성):
--   1. 독립 테이블  : admin_users, regions, job_codes, holidays, ai_system_categories
--                     notice_categories, board_categories
--   2. 기관         : facilities → facility_sub_categories, facility_representatives,
--                     facility_bank_accounts, facility_seals, facility_ins4,
--                     facility_contacts (요양기관 담당자 연락처)
--   3. 사용자       : users → user_permissions
--   4. 수급자       : recipients → 연관 테이블 → recipient_import_staging
--   5. 직원         : employees → 연관 테이블
--   6. 수급자↔직원  : recipient_assigned_workers  (양쪽 모두 생성 후)
--   7. 그룹         : groups → group_subgroups → group_members
--   8. 업무/메모    : schedule_memos, todo_memos
--   9. 카카오       : kakao_templates → kakao_send_logs → kakao_send_recipients
--  10. 게시판       : board_threads(board_categories FK) → board_posts → board_attachments
--  11. 기관 그룹    : facility_groups → facility_group_subgroups → facility_group_members
--                     → facility_group_messages → facility_group_message_recipients
--  12. 공지사항     : provider_notices → notice_attachments → notice_read_status
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;


-- ============================================================
-- 1. 한케어 직원 (admin_users) — 각종설정관리 > 한케어 직원 관리
--    StaffPanel 필드: uid, name, dept, title, loginId, loginPw, phone, active
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    user_id    VARCHAR(50)  NOT NULL            COMMENT '로그인 아이디',
    name       VARCHAR(50)  NOT NULL            COMMENT '이름',
    password   VARCHAR(255) NOT NULL            COMMENT '비밀번호(암호화)',
    dept       VARCHAR(30)  NULL                COMMENT '부서 (운영팀, 재무팀, 교육팀 등)',
    title      VARCHAR(30)  NULL                COMMENT '직위 (팀장, 과장, 대리, 사원 등)',
    phone      VARCHAR(20)  NULL                COMMENT '연락처',
    role       VARCHAR(30)  NOT NULL DEFAULT '관리자' COMMENT '역할 (관리자 등)',
    is_active  TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '활성 여부 (1=활성, 0=비활성)',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id),
    UNIQUE KEY uq_admin_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='한케어 직원(관리자)';


-- ============================================================
-- 2. 지역 (regions)
--    sido = 광역시도명 (항상 존재)
--    sigungu = 시군구명 (광역시도 행은 NULL, 시군구 행은 값 있음)
--    RegionsPanel: { id, sido, sigungu } 구조 기준
-- ============================================================
CREATE TABLE IF NOT EXISTS regions (
    id         VARCHAR(10)  NOT NULL            COMMENT '지역코드 (R01=시도, R001=시군구 형식)',
    parent_id  VARCHAR(10)  NULL                COMMENT '상위 광역시도 (시군구 행에만 설정)',
    sido       VARCHAR(30)  NOT NULL            COMMENT '광역시도명',
    sigungu    VARCHAR(30)  NULL                COMMENT '시군구명 (광역시도 행은 NULL)',
    sort_order INT          NOT NULL DEFAULT 0 COMMENT '정렬순서',
    is_active  TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '활성 여부',
    PRIMARY KEY (id),
    CONSTRAINT fk_regions_parent FOREIGN KEY (parent_id) REFERENCES regions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='지역(시도+시군구)';


-- ============================================================
-- 3-A. 공지사항 분류 (notice_categories) — 각종설정관리 > 공지/1:1게시판 분류관리
--       관리자가 CRUD + 순서 변경 가능
-- ============================================================
CREATE TABLE IF NOT EXISTS notice_categories (
    id         VARCHAR(30)  NOT NULL COMMENT '분류코드 (nc1, nc2 ...)',
    label      VARCHAR(50)  NOT NULL COMMENT '분류명 (필독, 업데이트, 공지 등)',
    sort_order INT          NOT NULL DEFAULT 0 COMMENT '정렬순서',
    is_active  TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '활성 여부',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공지사항 분류';


-- ============================================================
-- 3-B. 1:1 게시판 분류 (board_categories) — 각종설정관리 > 공지/1:1게시판 분류관리
-- ============================================================
CREATE TABLE IF NOT EXISTS board_categories (
    id         VARCHAR(30)  NOT NULL COMMENT '분류코드 (bc1, bc2 ...)',
    label      VARCHAR(50)  NOT NULL COMMENT '분류명 (세무신고, 노무/급여 등)',
    sort_order INT          NOT NULL DEFAULT 0 COMMENT '정렬순서',
    is_active  TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '활성 여부',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='1:1게시판 분류';


-- ============================================================
-- 4. 직종코드 (job_codes)
--    초기값: ST_01 시설장 ~ ST_14 위생원
-- ============================================================
CREATE TABLE IF NOT EXISTS job_codes (
    id         VARCHAR(10)  NOT NULL            COMMENT '직종코드 (ST_01 ~ ST_14)',
    label      VARCHAR(50)  NOT NULL            COMMENT '직종명',
    sort_order INT          NOT NULL DEFAULT 0  COMMENT '정렬순서',
    is_active  TINYINT(1)   NOT NULL DEFAULT 1  COMMENT '활성 여부',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='직종코드';


-- ============================================================
-- 4-B. 연도별 공휴일 (holidays) — 각종설정관리 > 연도별공휴일 관리
--      급여(휴일근로수당), 일정(수가가산) 등 전역 기준 데이터
-- ============================================================
CREATE TABLE IF NOT EXISTS holidays (
    id           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    holiday_date DATE         NOT NULL                COMMENT '공휴일 날짜',
    name         VARCHAR(100) NOT NULL                COMMENT '공휴일명',
    type         VARCHAR(20)  NOT NULL                COMMENT '유형: 법정공휴일|대체공휴일|임시공휴일',
    PRIMARY KEY (id),
    UNIQUE KEY uq_holiday_date_name_type (holiday_date, name, type),
    KEY idx_holidays_date (holiday_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='연도별 공휴일 (전국 공통 마스터)';


-- ============================================================
-- 4. AI 시스템 분류 (ai_system_categories)
--    초기값: schedule, payroll, finance, education, daycare, evaluation, care
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_system_categories (
    id         VARCHAR(30)  NOT NULL            COMMENT '시스템 ID (schedule, payroll 등)',
    name       VARCHAR(50)  NOT NULL            COMMENT '한국어명',
    color      VARCHAR(20)  NOT NULL DEFAULT '#6366f1' COMMENT '대표 색상 (HEX)',
    icon       VARCHAR(30)  NOT NULL DEFAULT 'Calendar' COMMENT '아이콘 이름',
    is_active  TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '활성 여부',
    sort_order INT          NOT NULL DEFAULT 0 COMMENT '정렬순서',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 시스템 분류';


-- ============================================================
-- 5. 요양기관 (facilities)
-- ============================================================
CREATE TABLE IF NOT EXISTS facilities (
    id                   VARCHAR(20)  NOT NULL            COMMENT '시설코드',
    account_code         VARCHAR(20)  NULL                COMMENT '회계코드',
    semulove_code        VARCHAR(4)   NULL                COMMENT '세무사랑코드',
    group_code           VARCHAR(4)   NULL                COMMENT '그룹코드',
    category             VARCHAR(20)  NOT NULL DEFAULT '요양기관' COMMENT '분류: 요양기관|교육원|임대|기타',
    name                 VARCHAR(100) NOT NULL            COMMENT '기관명',
    alias                VARCHAR(100) NULL                COMMENT '기관 별칭',
    code                 VARCHAR(20)  NULL                COMMENT '기관기호',
    unique_num           VARCHAR(20)  NULL                COMMENT '사업자번호',
    phone                VARCHAR(20)  NULL                COMMENT '전화번호',
    fax                  VARCHAR(20)  NULL                COMMENT '팩스번호',
    email                VARCHAR(100) NULL                COMMENT '이메일',
    region_id            VARCHAR(10)  NULL                COMMENT '지역 FK',
    zip_code             VARCHAR(10)  NULL                COMMENT '우편번호',
    address              VARCHAR(200) NULL                COMMENT '주소',
    address_detail       VARCHAR(100) NULL                COMMENT '상세주소',
    employees            INT          NOT NULL DEFAULT 0  COMMENT '직원수',
    active_mode          VARCHAR(20)  NOT NULL DEFAULT '활성' COMMENT '활성상태: 활성|비활성|사용기한부활성',
    active_until         DATE         NULL                COMMENT '사용기한 (사용기한부활성일 경우)',
    open_date            DATE         NULL                COMMENT '개업일',
    design_date          DATE         NULL                COMMENT '지정일',
    hims_id              VARCHAR(50)  NULL                COMMENT '희망이음ID',
    hims_name            VARCHAR(100) NULL                COMMENT '희망이음기관명',
    contract_start_date  DATE         NULL                COMMENT '수임일(계약시작)',
    contract_end_date    DATE         NULL                COMMENT '계약종료일',
    contract_end_reason  VARCHAR(30)  NULL                COMMENT '해임|폐업(변경)|폐업(종료)|휴업|기타',
    contract_memo        TEXT         NULL                COMMENT '계약메모',
    svc_program          TINYINT(1)   NOT NULL DEFAULT 0  COMMENT '프로그램 사용 여부',
    svc_tax              TINYINT(1)   NOT NULL DEFAULT 0  COMMENT '세무대행 여부',
    svc_insurance        TINYINT(1)   NOT NULL DEFAULT 0  COMMENT '4대대행 여부',
    svc_finance          TINYINT(1)   NOT NULL DEFAULT 0  COMMENT '재무대행 여부',
    tax_invoice_email    VARCHAR(100) NULL                COMMENT '전자세금계산서 수신 이메일',
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id),
    CONSTRAINT fk_facilities_region FOREIGN KEY (region_id) REFERENCES regions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='요양기관';


-- 기관 세부 서비스 분류 (CareSubCategory)
CREATE TABLE IF NOT EXISTS facility_sub_categories (
    id          BIGINT      NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id VARCHAR(20) NOT NULL COMMENT '요양기관 FK',
    category    VARCHAR(20) NOT NULL COMMENT '서비스분류: 요양|목욕|간호|주간|용구|통합|돌봄|기타',
    sort_order  INT         NOT NULL DEFAULT 0 COMMENT '정렬순서',
    PRIMARY KEY (id),
    CONSTRAINT fk_fsc_facility FOREIGN KEY (facility_id) REFERENCES facilities (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='기관 세부 서비스 분류';


-- 대표자 정보 (Representative)
CREATE TABLE IF NOT EXISTS facility_representatives (
    id          BIGINT      NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id VARCHAR(20) NOT NULL COMMENT '요양기관 FK',
    name        VARCHAR(50) NOT NULL            COMMENT '대표자명',
    resident_no VARCHAR(255) NULL               COMMENT '주민등록번호',
    sort_order  INT         NOT NULL DEFAULT 0 COMMENT '정렬순서',
    PRIMARY KEY (id),
    CONSTRAINT fk_frep_facility FOREIGN KEY (facility_id) REFERENCES facilities (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='기관 대표자';


-- 본인부담금 납부계좌
CREATE TABLE IF NOT EXISTS facility_bank_accounts (
    id             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id    VARCHAR(20)  NOT NULL COMMENT '요양기관 FK',
    bank           VARCHAR(30)  NOT NULL COMMENT '은행명',
    account_number VARCHAR(30)  NOT NULL COMMENT '계좌번호',
    holder         VARCHAR(50)  NOT NULL COMMENT '예금주명',
    sort_order     INT          NOT NULL DEFAULT 0 COMMENT '정렬순서',
    PRIMARY KEY (id),
    CONSTRAINT fk_fba_facility FOREIGN KEY (facility_id) REFERENCES facilities (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='기관 납부계좌';


-- 기관 직인
CREATE TABLE IF NOT EXISTS facility_seals (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id VARCHAR(20)  NOT NULL COMMENT '요양기관 FK',
    name        VARCHAR(50)  NOT NULL COMMENT '직인명',
    file_url    VARCHAR(500) NOT NULL COMMENT '이미지 파일 경로',
    sort_order  INT          NOT NULL DEFAULT 0 COMMENT '정렬순서',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    PRIMARY KEY (id),
    CONSTRAINT fk_fseals_facility FOREIGN KEY (facility_id) REFERENCES facilities (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='기관 직인';


-- 요양기관 담당자 연락처 (facility_contacts) — FacilityContactsPanel
--   Contact: { id, name, title, relation, mobile, phone, email, memo,
--              registeredAt, hiredAt, inactiveAt }
CREATE TABLE IF NOT EXISTS facility_contacts (
    id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT 'PK',
    facility_id   VARCHAR(20)  NOT NULL                COMMENT '요양기관 FK',
    name          VARCHAR(50)  NOT NULL                COMMENT '이름',
    title         VARCHAR(50)  NULL                    COMMENT '직책',
    relation      VARCHAR(50)  NULL                    COMMENT '가족관계등',
    mobile        VARCHAR(20)  NULL                    COMMENT '핸드폰',
    phone         VARCHAR(20)  NULL                    COMMENT '전화번호',
    email         VARCHAR(100) NULL                    COMMENT '이메일',
    memo          TEXT         NULL                    COMMENT '메모',
    hired_at      DATE         NULL                    COMMENT '입사일',
    inactive_at   DATE         NULL                    COMMENT '퇴사처리일',
    registered_at DATETIME     NOT NULL                COMMENT '등록일시',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id),
    KEY idx_fcon_facility (facility_id),
    CONSTRAINT fk_fcon_facility FOREIGN KEY (facility_id) REFERENCES facilities (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='요양기관 담당자 연락처';


-- 기관 4대보험 관리정보 (FacilityIns4)
CREATE TABLE IF NOT EXISTS facility_ins4 (
    id                    BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id           VARCHAR(20)  NOT NULL                COMMENT '요양기관 FK (1:1)',
    pension_mgmt_no       VARCHAR(30)  NULL                    COMMENT '연금관리번호',
    pension_branch        VARCHAR(100) NULL                    COMMENT '연금관할지사',
    pension_phone         VARCHAR(20)  NULL                    COMMENT '연금전화',
    pension_fax           VARCHAR(20)  NULL                    COMMENT '연금팩스',
    health_mgmt_no        VARCHAR(30)  NULL                    COMMENT '건강관리번호',
    health_branch         VARCHAR(100) NULL                    COMMENT '건강관할지사',
    health_phone          VARCHAR(20)  NULL                    COMMENT '건강전화',
    health_fax            VARCHAR(20)  NULL                    COMMENT '건강팩스',
    employ_mgmt_no        VARCHAR(30)  NULL                    COMMENT '고용산재관리번호',
    injury_branch         VARCHAR(100) NULL                    COMMENT '근복관할지사',
    injury_phone          VARCHAR(20)  NULL                    COMMENT '근복전화',
    injury_fax            VARCHAR(20)  NULL                    COMMENT '근복팩스',
    employ_branch         VARCHAR(100) NULL                    COMMENT '고용센터관할지사',
    employ_phone          VARCHAR(20)  NULL                    COMMENT '고용센터전화',
    employ_fax            VARCHAR(20)  NULL                    COMMENT '고용센터팩스',
    year_end_target       VARCHAR(10)  NULL DEFAULT '대상'     COMMENT '연말정산 대상 여부',
    health_representative VARCHAR(10)  NULL DEFAULT '포함'     COMMENT '건강보험 대표자 포함 여부',
    updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id),
    UNIQUE KEY uq_facility_ins4 (facility_id),
    CONSTRAINT fk_fins4_facility FOREIGN KEY (facility_id) REFERENCES facilities (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='기관 4대보험 관리정보';


-- ============================================================
-- 6. 사용자 계정 (users)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id VARCHAR(20)  NOT NULL COMMENT '소속 요양기관 FK',
    user_id     VARCHAR(50)  NOT NULL COMMENT '로그인 아이디',
    name        VARCHAR(50)  NOT NULL COMMENT '성명',
    password    VARCHAR(255) NOT NULL COMMENT '암호화된 비밀번호',
    position    VARCHAR(50)  NULL     COMMENT '직책',
    department  VARCHAR(30)  NULL     COMMENT '부서',
    phone       VARCHAR(20)  NULL COMMENT '연락처',
    email       VARCHAR(100) NULL COMMENT '이메일',
    hire_date   DATE         NULL     COMMENT '입사일',
    is_admin    TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '관리자 여부',
    is_active   TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '활성 여부',
    is_deleted  TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '삭제 여부 (소프트 삭제)',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_facility_user (facility_id, user_id),
    KEY idx_users_facility (facility_id),
    CONSTRAINT fk_users_facility FOREIGN KEY (facility_id) REFERENCES facilities (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 계정';


-- 시스템별 접근 권한 (UserAccount.perms)
CREATE TABLE IF NOT EXISTS user_permissions (
    id         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '기본키',
    user_id    BIGINT      NOT NULL COMMENT '사용자 FK',
    system_id  VARCHAR(30) NOT NULL COMMENT '시스템ID: portal_care|portal_admin|portal_tax|schedule|payroll|finance|education 등',
    has_access TINYINT(1)  NOT NULL DEFAULT 0 COMMENT '접근 권한 여부',
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_perm (user_id, system_id),
    CONSTRAINT fk_uperm_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 시스템 권한';


-- ============================================================
-- 7. 수급자 (recipients)
-- ============================================================
CREATE TABLE IF NOT EXISTS recipients (
    id                   BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id          VARCHAR(20)  NOT NULL COMMENT '소속 요양기관 FK',
    code                 VARCHAR(30)  NULL     COMMENT '수급자코드',
    contract_status      VARCHAR(20)  NOT NULL DEFAULT '준비중' COMMENT '계약상태: 수급중|준비중|타기관|계약종료|사망|보류|입원|상담중',
    photo_url            VARCHAR(500) NULL COMMENT '증명사진 URL',
    name                 VARCHAR(50)  NOT NULL COMMENT '수급자명',
    alias                VARCHAR(50)  NULL     COMMENT '별칭',
    legal_dob            DATE         NOT NULL COMMENT '법정생년월일',
    gender               CHAR(1)      NOT NULL COMMENT '성별: 남|여',
    real_dob             DATE         NULL     COMMENT '실제생일',
    real_dob_type        CHAR(1)      NULL DEFAULT '양' COMMENT '실제생일 유형: 양|음',
    cert_no              VARCHAR(30)  NULL     COMMENT '장기요양인정번호',
    valid_from           DATE         NULL     COMMENT '인정유효기간 시작',
    valid_to             DATE         NULL     COMMENT '인정유효기간 종료',
    grade                VARCHAR(10)  NOT NULL COMMENT '등급: 1등급|2등급|3등급|4등급|5등급|인지지원|등급외',
    reduction            VARCHAR(10)  NOT NULL DEFAULT '일반' COMMENT '본인부담 유형: 일반|감경9%|감경7.5%|감경6%|기초',
    approved_amt_care    INT          NULL DEFAULT 0 COMMENT '시군구 급여승인금액(요양)',
    approved_amt_bath    INT          NULL DEFAULT 0 COMMENT '시군구 급여승인금액(목욕)',
    approved_amt_nursing INT          NULL DEFAULT 0 COMMENT '시군구 급여승인금액(간호)',
    approved_amt_day     INT          NULL DEFAULT 0 COMMENT '시군구 급여승인금액(주간)',
    approved_amt_other   INT          NULL DEFAULT 0 COMMENT '시군구 급여승인금액(타기관)',
    home_phone           VARCHAR(20)  NULL     COMMENT '수급자 자택전화',
    mobile               VARCHAR(20)  NULL     COMMENT '수급자 휴대폰',
    mobile_kakao         TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '카카오 수신 여부',
    zip_code             VARCHAR(10)  NULL COMMENT '우편번호',
    address              VARCHAR(200) NULL COMMENT '주소',
    address_detail       VARCHAR(100) NULL COMMENT '상세주소',
    contract_date        DATE         NULL     COMMENT '계약일자',
    benefit_start_date   DATE         NULL     COMMENT '급여개시일자',
    contract_period_from DATE         NULL     COMMENT '계약기간 시작',
    contract_period_to   DATE         NULL     COMMENT '계약기간 종료',
    disease_memo         VARCHAR(500) NULL     COMMENT '질환메모',
    memo                 TEXT         NULL     COMMENT '참고사항',
    medical_benefit_type VARCHAR(10)  NOT NULL DEFAULT '해당없음' COMMENT '의료급여 유형: 해당없음|1종|2종',
    medical_benefit_no   VARCHAR(30)  NULL     COMMENT '의료급여 번호',
    medical_benefit_note VARCHAR(200) NULL     COMMENT '의료급여 비고',
    registration_type    VARCHAR(10)  NOT NULL DEFAULT 'individual' COMMENT '등록유형: individual|bulk',
    import_batch_id      BIGINT       NULL     COMMENT '일괄등록 배치 ID',
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id),
    KEY idx_recip_facility (facility_id),
    KEY idx_recip_name (name),
    KEY idx_recip_contract_status (contract_status),
    CONSTRAINT fk_recip_facility FOREIGN KEY (facility_id) REFERENCES facilities (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='수급자';


-- 대표질환 (recipient_diseases)
CREATE TABLE IF NOT EXISTS recipient_diseases (
    id           BIGINT      NOT NULL AUTO_INCREMENT COMMENT '기본키',
    recipient_id BIGINT      NOT NULL COMMENT '수급자 FK',
    disease_name VARCHAR(50) NOT NULL COMMENT '질환명 (치매|뇌혈관질환|파킨슨병 등)',
    PRIMARY KEY (id),
    CONSTRAINT fk_rdis_recipient FOREIGN KEY (recipient_id) REFERENCES recipients (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='수급자 대표질환';


-- 제공서비스 (recipient_services)
CREATE TABLE IF NOT EXISTS recipient_services (
    id           BIGINT      NOT NULL AUTO_INCREMENT COMMENT '기본키',
    recipient_id BIGINT      NOT NULL COMMENT '수급자 FK',
    service_type VARCHAR(30) NOT NULL COMMENT '서비스유형: 방문요양|방문목욕|방문간호|주간보호|복지용구|통합재가|돌봄|기타',
    PRIMARY KEY (id),
    CONSTRAINT fk_rsvc_recipient FOREIGN KEY (recipient_id) REFERENCES recipients (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='수급자 제공서비스';


-- 계약자 (recipient_contractors)
CREATE TABLE IF NOT EXISTS recipient_contractors (
    id                 BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    recipient_id       BIGINT       NOT NULL COMMENT '수급자 FK (1:1)',
    name               VARCHAR(50)  NULL     COMMENT '계약자 성명',
    relation           VARCHAR(50)  NULL     COMMENT '수급자와의 관계',
    relation_direct    VARCHAR(50)  NULL     COMMENT '관계 직접입력',
    dob                DATE         NULL     COMMENT '계약자 생년월일',
    home_phone         VARCHAR(20)  NULL     COMMENT '계약자 자택전화',
    mobile             VARCHAR(20)  NULL     COMMENT '계약자 휴대폰',
    memo               VARCHAR(200) NULL COMMENT '메모',
    cash_receipt_phone VARCHAR(20)  NULL     COMMENT '현금영수증 전화번호',
    zip_code           VARCHAR(10)  NULL COMMENT '우편번호',
    address            VARCHAR(200) NULL COMMENT '주소',
    address_detail     VARCHAR(100) NULL COMMENT '상세주소',
    PRIMARY KEY (id),
    UNIQUE KEY uq_contractor_recipient (recipient_id),
    CONSTRAINT fk_rcon_recipient FOREIGN KEY (recipient_id) REFERENCES recipients (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='수급자 계약자';


-- 보호자 (recipient_guardians) - 복수
CREATE TABLE IF NOT EXISTS recipient_guardians (
    id             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    recipient_id   BIGINT       NOT NULL COMMENT '수급자 FK',
    sort_order     INT          NOT NULL DEFAULT 0 COMMENT '보호자 순번',
    name           VARCHAR(50)  NULL COMMENT '보호자명',
    relation       VARCHAR(50)  NULL     COMMENT '수급자와의 관계',
    relation_direct VARCHAR(50) NULL     COMMENT '관계 직접입력',
    home_phone     VARCHAR(20)  NULL COMMENT '자택전화',
    mobile         VARCHAR(20)  NULL COMMENT '휴대폰',
    mobile_kakao   TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '카카오 수신 여부',
    zip_code       VARCHAR(10)  NULL COMMENT '우편번호',
    address        VARCHAR(200) NULL COMMENT '주소',
    address_detail VARCHAR(100) NULL COMMENT '상세주소',
    PRIMARY KEY (id),
    KEY idx_rguard_recipient (recipient_id),
    CONSTRAINT fk_rguard_recipient FOREIGN KEY (recipient_id) REFERENCES recipients (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='수급자 보호자';


-- 급여계약기간 이력 (recipient_contract_histories)
CREATE TABLE IF NOT EXISTS recipient_contract_histories (
    id           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    recipient_id BIGINT       NOT NULL COMMENT '수급자 FK',
    contract_date DATE        NULL     COMMENT '계약일자',
    from_date    DATE         NOT NULL COMMENT '계약기간 시작',
    to_date      DATE         NOT NULL COMMENT '계약기간 종료',
    memo         VARCHAR(200) NULL COMMENT '메모',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    PRIMARY KEY (id),
    CONSTRAINT fk_rchist_recipient FOREIGN KEY (recipient_id) REFERENCES recipients (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='급여계약기간 이력';


-- 수급자 메모 (recipient_memos) - 자유형식
CREATE TABLE IF NOT EXISTS recipient_memos (
    id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    recipient_id  BIGINT       NOT NULL COMMENT '수급자 FK',
    author_id     BIGINT       NOT NULL COMMENT '작성자 FK',
    content       TEXT         NOT NULL COMMENT '메모 내용',
    pinned        TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '고정 여부',
    service_month VARCHAR(7)   NULL     COMMENT '제공 서비스 연월 (예: 2026-06)',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    deleted_at    DATETIME     NULL COMMENT '삭제일시 (소프트 삭제)',
    PRIMARY KEY (id),
    KEY idx_rmemo_recipient (recipient_id),
    CONSTRAINT fk_rmemo_recipient FOREIGN KEY (recipient_id) REFERENCES recipients (id) ON DELETE CASCADE,
    CONSTRAINT fk_rmemo_author    FOREIGN KEY (author_id)    REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='수급자 메모';


-- 일괄 등록 Staging (recipient_import_staging)
CREATE TABLE IF NOT EXISTS recipient_import_staging (
    id              BIGINT      NOT NULL AUTO_INCREMENT COMMENT '기본키',
    import_batch_id BIGINT      NOT NULL COMMENT '업로드 묶음 ID',
    facility_id     VARCHAR(20) NOT NULL COMMENT '요양기관 FK',
    row_no          INT         NOT NULL COMMENT '엑셀 행 번호',
    raw_data        JSON        NOT NULL COMMENT '원본 행 데이터 (JSON)',
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '처리상태: pending|valid|error|completed',
    error_messages  JSON        NULL     COMMENT '검증 오류 목록 (JSON)',
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    PRIMARY KEY (id),
    KEY idx_ris_batch (import_batch_id),
    CONSTRAINT fk_ris_facility FOREIGN KEY (facility_id) REFERENCES facilities (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='수급자 일괄등록 Staging';


-- ============================================================
-- 8. 직원 (employees)
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
    id                  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id         VARCHAR(20)  NOT NULL COMMENT '소속 요양기관 FK',
    user_id             BIGINT       NULL     COMMENT '사용자 계정 FK (계정 없는 직원도 존재)',
    name                VARCHAR(50)  NOT NULL COMMENT '성명',
    nickname            VARCHAR(50)  NULL     COMMENT '별칭',
    rrn                 VARCHAR(255) NULL     COMMENT '주민등록번호(암호화)',
    dob                 DATE         NULL     COMMENT '생년월일',
    photo_url           VARCHAR(500) NULL COMMENT '증명사진 URL',
    department          VARCHAR(20)  NULL     COMMENT '소속사업: 방문요양|방문목욕|방문간호|주간보호|행정',
    role                VARCHAR(10)  NULL     COMMENT '직책: 팀장|직원',
    position            VARCHAR(10)  NULL     COMMENT '직종코드 (ST_01 등)',
    status              VARCHAR(10)  NOT NULL DEFAULT '재직' COMMENT '재직상태: 재직|퇴직|휴직',
    hire_date           DATE         NULL COMMENT '입사일',
    retire_date         DATE         NULL COMMENT '퇴사일',
    home_phone          VARCHAR(20)  NULL     COMMENT '자택전화',
    mobile              VARCHAR(20)  NULL COMMENT '휴대폰',
    mobile_country_code VARCHAR(10)  NULL DEFAULT '+82' COMMENT '국제전화 국가코드',
    email               VARCHAR(100) NULL COMMENT '이메일',
    zip_code            VARCHAR(10)  NULL COMMENT '우편번호',
    address             VARCHAR(200) NULL COMMENT '주소',
    address_detail      VARCHAR(100) NULL COMMENT '상세주소',
    bank_name           VARCHAR(30)  NULL COMMENT '급여 은행명',
    account_number      VARCHAR(30)  NULL COMMENT '급여 계좌번호',
    account_holder      VARCHAR(50)  NULL COMMENT '급여 예금주명',
    salary_type         VARCHAR(10)  NULL     COMMENT '급여유형: 월급제|시간제',
    has_inji_education  TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '인지지원교육 이수 여부',
    is_foreigner        TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '외국인 여부',
    nationality         VARCHAR(50)  NULL     COMMENT '국적(나라명칭)',
    nationality_code    VARCHAR(10)  NULL     COMMENT '국적코드',
    english_name        VARCHAR(100) NULL     COMMENT '영문이름',
    visa_type           VARCHAR(30)  NULL     COMMENT '비자종류',
    memo                TEXT         NULL COMMENT '메모',
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    deleted_at          DATETIME     NULL COMMENT '삭제일시 (소프트 삭제)',
    PRIMARY KEY (id),
    KEY idx_emp_facility (facility_id),
    KEY idx_emp_name (name),
    CONSTRAINT fk_emp_facility FOREIGN KEY (facility_id) REFERENCES facilities (id),
    CONSTRAINT fk_emp_user     FOREIGN KEY (user_id)     REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='직원';


-- 근무사업 (employee_work_businesses)
CREATE TABLE IF NOT EXISTS employee_work_businesses (
    id            BIGINT      NOT NULL AUTO_INCREMENT COMMENT '기본키',
    employee_id   BIGINT      NOT NULL COMMENT '직원 FK',
    business_type VARCHAR(10) NOT NULL COMMENT '근무사업 유형: 요양|목욕|간호|주간|용구|통합|돌봄|기타',
    PRIMARY KEY (id),
    CONSTRAINT fk_ewb_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='직원 근무사업';


-- 자격증 (employee_qualifications)
CREATE TABLE IF NOT EXISTS employee_qualifications (
    id                 BIGINT      NOT NULL AUTO_INCREMENT COMMENT '기본키',
    employee_id        BIGINT      NOT NULL COMMENT '직원 FK',
    qualification_type VARCHAR(50) NOT NULL COMMENT '자격증 종류 (요양보호사1급|간호사|사회복지사1급 등)',
    qualification_no   VARCHAR(50) NULL     COMMENT '자격증 번호',
    acquired_date      DATE        NULL     COMMENT '취득일',
    PRIMARY KEY (id),
    CONSTRAINT fk_equal_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='직원 자격증';


-- 입퇴사 이력 (employee_employment_periods)
CREATE TABLE IF NOT EXISTS employee_employment_periods (
    id          BIGINT     NOT NULL AUTO_INCREMENT COMMENT '기본키',
    employee_id BIGINT     NOT NULL COMMENT '직원 FK',
    join_date   DATE       NOT NULL COMMENT '입사일(근무시작일)',
    retire_date DATE       NULL     COMMENT '퇴사일(근무종료일) NULL=재직중',
    is_current  TINYINT(1) NOT NULL DEFAULT 0 COMMENT '현재 재직 여부',
    PRIMARY KEY (id),
    CONSTRAINT fk_eep_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='직원 입퇴사 이력';


-- 4대보험 (employee_insurance) - 직원당 1행
CREATE TABLE IF NOT EXISTS employee_insurance (
    id                           BIGINT     NOT NULL AUTO_INCREMENT COMMENT '기본키',
    employee_id                  BIGINT     NOT NULL COMMENT '직원 FK (1:1)',
    national_pension_enrolled    TINYINT(1) NOT NULL DEFAULT 0 COMMENT '국민연금 가입여부',
    national_pension_acquisition DATE       NULL COMMENT '국민연금 취득일',
    national_pension_loss        DATE       NULL COMMENT '국민연금 상실일',
    national_pension_base_income INT        NULL    COMMENT '국민연금 기준소득월액',
    health_insurance_enrolled    TINYINT(1) NOT NULL DEFAULT 0 COMMENT '건강보험 가입여부',
    health_insurance_acquisition DATE       NULL COMMENT '건강보험 취득일',
    health_insurance_loss        DATE       NULL COMMENT '건강보험 상실일',
    employment_ins_enrolled      TINYINT(1) NOT NULL DEFAULT 0 COMMENT '고용보험 가입여부',
    employment_ins_acquisition   DATE       NULL COMMENT '고용보험 취득일',
    employment_ins_loss          DATE       NULL COMMENT '고용보험 상실일',
    industrial_acc_enrolled      TINYINT(1) NOT NULL DEFAULT 0 COMMENT '산재보험 가입여부',
    industrial_acc_acquisition   DATE       NULL COMMENT '산재보험 취득일',
    industrial_acc_loss          DATE       NULL COMMENT '산재보험 상실일',
    updated_at                   DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id),
    UNIQUE KEY uq_eins_employee (employee_id),
    CONSTRAINT fk_eins_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='직원 4대보험';


-- 배상책임보험 (employee_liability_insurances)
CREATE TABLE IF NOT EXISTS employee_liability_insurances (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    employee_id BIGINT       NOT NULL COMMENT '직원 FK',
    insurer     VARCHAR(50)  NOT NULL COMMENT '보험사명',
    policy_name VARCHAR(100) NOT NULL COMMENT '보험명',
    start_date  DATE         NOT NULL COMMENT '보험 시작일',
    end_date    DATE         NOT NULL COMMENT '보험 종료일',
    PRIMARY KEY (id),
    CONSTRAINT fk_eli_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='직원 배상책임보험';


-- 연도별 급여정보 (employee_salary_by_year)
CREATE TABLE IF NOT EXISTS employee_salary_by_year (
    id                  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    employee_id         BIGINT       NOT NULL COMMENT '직원 FK',
    year                VARCHAR(4)   NOT NULL COMMENT '연도 (2025, 2026 ...)',
    salary_type         VARCHAR(10)  NOT NULL COMMENT '급여유형: 월급제|시간제',
    monthly_salary      INT          NULL DEFAULT 0 COMMENT '월급액',
    base_salary         INT          NULL DEFAULT 0 COMMENT '기본급',
    weekly_days         DECIMAL(3,1) NULL COMMENT '주당 근무 일수',
    weekly_hours        DECIMAL(4,1) NULL COMMENT '주당 근무 시간',
    hourly_total_rate   INT          NULL DEFAULT 0 COMMENT '시간당지급액',
    base_hourly         INT          NULL DEFAULT 0 COMMENT '기본시급',
    weekly_holiday_pay  INT          NULL DEFAULT 0 COMMENT '주휴수당',
    annual_leave_pay    INT          NULL DEFAULT 0 COMMENT '연차수당',
    meal_allowance      INT          NULL DEFAULT 0 COMMENT '식대',
    transport_allowance INT          NULL DEFAULT 0 COMMENT '차량보조비',
    other_allowance     INT          NULL DEFAULT 0 COMMENT '기타수당',
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id),
    UNIQUE KEY uq_esby_emp_year (employee_id, year),
    CONSTRAINT fk_esby_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='직원 연도별 급여정보';


-- 직원 메모 (employee_memos)
CREATE TABLE IF NOT EXISTS employee_memos (
    id          BIGINT     NOT NULL AUTO_INCREMENT COMMENT '기본키',
    employee_id BIGINT     NOT NULL COMMENT '직원 FK',
    author_id   BIGINT     NOT NULL COMMENT '작성자 FK',
    content     TEXT       NOT NULL COMMENT '메모 내용',
    pinned      TINYINT(1) NOT NULL DEFAULT 0 COMMENT '고정 여부',
    created_at  DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at  DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    deleted_at  DATETIME   NULL COMMENT '삭제일시 (소프트 삭제)',
    PRIMARY KEY (id),
    KEY idx_ememo_employee (employee_id),
    CONSTRAINT fk_ememo_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    CONSTRAINT fk_ememo_author   FOREIGN KEY (author_id)   REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='직원 메모';


-- ============================================================
-- 9. 담당요양보호사 연결 (recipient_assigned_workers)
--    recipients + employees 모두 생성 후 정의
-- ============================================================
CREATE TABLE IF NOT EXISTS recipient_assigned_workers (
    id              BIGINT     NOT NULL AUTO_INCREMENT COMMENT '기본키',
    recipient_id    BIGINT     NOT NULL COMMENT '수급자 FK',
    employee_id     BIGINT     NOT NULL COMMENT '직원 FK',
    is_family       TINYINT(1) NOT NULL DEFAULT 0 COMMENT '가족/친족 여부',
    family_relation VARCHAR(20) NULL              COMMENT '가족관계 (처|남편|자|자부|사위|형제자매 등)',
    created_at      DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    PRIMARY KEY (id),
    UNIQUE KEY uq_raw (recipient_id, employee_id),
    CONSTRAINT fk_raw_recipient FOREIGN KEY (recipient_id) REFERENCES recipients (id) ON DELETE CASCADE,
    CONSTRAINT fk_raw_employee  FOREIGN KEY (employee_id)  REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='수급자-담당요양보호사 연결';


-- ============================================================
-- 10. 그룹 (groups)
-- ============================================================
CREATE TABLE IF NOT EXISTS groups (
    id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id   VARCHAR(20)  NOT NULL COMMENT '소속 요양기관 FK',
    type          VARCHAR(10)  NOT NULL COMMENT '그룹 대상 유형: recipient|employee',
    name          VARCHAR(50)  NOT NULL COMMENT '그룹명',
    color         VARCHAR(10)  NOT NULL DEFAULT 'blue' COMMENT '그룹 색상: blue|green|amber|red|purple|slate',
    description   VARCHAR(200) NULL COMMENT '그룹 설명',
    has_subgroups TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '소그룹 사용 여부',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id),
    KEY idx_groups_facility (facility_id),
    CONSTRAINT fk_grp_facility FOREIGN KEY (facility_id) REFERENCES facilities (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='그룹 (수급자 그룹 또는 직원 그룹)';


-- 소그룹 (group_subgroups)
CREATE TABLE IF NOT EXISTS group_subgroups (
    id         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '기본키',
    group_id   BIGINT      NOT NULL COMMENT '상위 그룹 FK',
    name       VARCHAR(50) NOT NULL COMMENT '소그룹명',
    sort_order INT         NOT NULL DEFAULT 0 COMMENT '정렬순서',
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    PRIMARY KEY (id),
    CONSTRAINT fk_gsub_group FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='소그룹';


-- 그룹 멤버 (group_members)
CREATE TABLE IF NOT EXISTS group_members (
    id          BIGINT      NOT NULL AUTO_INCREMENT COMMENT '기본키',
    group_id    BIGINT      NOT NULL COMMENT '그룹 FK',
    subgroup_id BIGINT      NULL     COMMENT '소그룹 FK (NULL=미배정)',
    member_id   BIGINT      NOT NULL COMMENT '수급자 또는 직원 ID',
    member_type VARCHAR(10) NOT NULL COMMENT '멤버 유형: recipient|employee',
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    PRIMARY KEY (id),
    UNIQUE KEY uq_gm (group_id, member_id, member_type),
    CONSTRAINT fk_gm_group    FOREIGN KEY (group_id)    REFERENCES groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_gm_subgroup FOREIGN KEY (subgroup_id) REFERENCES group_subgroups (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='그룹 멤버';


-- ============================================================
-- 11. 업무일정 메모 (schedule_memos)
-- ============================================================
CREATE TABLE IF NOT EXISTS schedule_memos (
    id          BIGINT      NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id VARCHAR(20) NOT NULL COMMENT '소속 요양기관 FK',
    author_id   BIGINT      NOT NULL COMMENT '작성자 FK',
    memo_date   DATE        NOT NULL COMMENT '일정 날짜',
    content     TEXT        NOT NULL COMMENT '내용',
    is_shared   TINYINT(1)  NOT NULL DEFAULT 0 COMMENT '공유 여부: 0=나만보기, 1=다같이공유',
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    deleted_at  DATETIME    NULL COMMENT '삭제일시 (소프트 삭제)',
    PRIMARY KEY (id),
    KEY idx_smemo_date (facility_id, memo_date),
    CONSTRAINT fk_smemo_facility FOREIGN KEY (facility_id) REFERENCES facilities (id),
    CONSTRAINT fk_smemo_author   FOREIGN KEY (author_id)   REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='업무일정 메모';


-- ============================================================
-- 12. 할일메모 (todo_memos)
-- ============================================================
CREATE TABLE IF NOT EXISTS todo_memos (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id VARCHAR(20)  NOT NULL COMMENT '소속 요양기관 FK',
    author_id   BIGINT       NOT NULL COMMENT '작성자 FK',
    content     TEXT         NOT NULL COMMENT '메모 내용',
    color       VARCHAR(20)  NOT NULL DEFAULT '#FEF3C7' COMMENT '포스트잇 배경색 (HEX)',
    is_done     TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '완료 여부',
    result      VARCHAR(500) NULL     COMMENT '처리결과',
    done_at     DATETIME     NULL COMMENT '완료처리 일시',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    deleted_at  DATETIME     NULL COMMENT '삭제일시 (소프트 삭제)',
    PRIMARY KEY (id),
    KEY idx_tmemo_author (author_id),
    CONSTRAINT fk_tmemo_facility FOREIGN KEY (facility_id) REFERENCES facilities (id),
    CONSTRAINT fk_tmemo_author   FOREIGN KEY (author_id)   REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='할일메모';


-- ============================================================
-- 13. 카카오 알림 (kakao)
-- ============================================================
CREATE TABLE IF NOT EXISTS kakao_templates (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id VARCHAR(20)  NOT NULL COMMENT '소속 요양기관 FK',
    target_type VARCHAR(10)  NOT NULL COMMENT '발송 대상 유형: recipient|employee',
    name        VARCHAR(50)  NOT NULL COMMENT '템플릿명',
    content     TEXT         NOT NULL COMMENT '템플릿 내용',
    is_default  TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '기본 템플릿 여부',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id),
    CONSTRAINT fk_ktpl_facility FOREIGN KEY (facility_id) REFERENCES facilities (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='카카오 발송 템플릿';


CREATE TABLE IF NOT EXISTS kakao_send_logs (
    id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id   VARCHAR(20)  NOT NULL COMMENT '소속 요양기관 FK',
    sender_id     BIGINT       NOT NULL COMMENT '발송자 FK',
    target_type   VARCHAR(10)  NOT NULL COMMENT '발송 대상 유형: recipient|employee',
    template_id   BIGINT       NULL COMMENT '사용 템플릿 FK (NULL=직접작성)',
    content       TEXT         NOT NULL COMMENT '실제 발송 내용',
    success_count INT          NOT NULL DEFAULT 0 COMMENT '발송 성공 수',
    fail_count    INT          NOT NULL DEFAULT 0 COMMENT '발송 실패 수',
    sent_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발송일시',
    PRIMARY KEY (id),
    KEY idx_klog_facility (facility_id),
    CONSTRAINT fk_klog_facility  FOREIGN KEY (facility_id) REFERENCES facilities (id),
    CONSTRAINT fk_klog_sender    FOREIGN KEY (sender_id)   REFERENCES users (id),
    CONSTRAINT fk_klog_template  FOREIGN KEY (template_id) REFERENCES kakao_templates (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='카카오 발송 이력';


CREATE TABLE IF NOT EXISTS kakao_send_recipients (
    id             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    send_log_id    BIGINT       NOT NULL COMMENT '카카오 발송 이력 FK',
    recipient_type VARCHAR(10)  NOT NULL COMMENT '수신자 유형: recipient|employee',
    recipient_id   BIGINT       NOT NULL COMMENT '수신자 ID (수급자 또는 직원)',
    recipient_name VARCHAR(50)  NOT NULL COMMENT '수신자명',
    phone          VARCHAR(20)  NOT NULL COMMENT '발송 전화번호',
    success        TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '발송 성공 여부',
    error_msg      VARCHAR(200) NULL COMMENT '실패 오류 메시지',
    sent_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발송일시',
    PRIMARY KEY (id),
    CONSTRAINT fk_krecip_log FOREIGN KEY (send_log_id) REFERENCES kakao_send_logs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='카카오 수신자별 발송 결과';


-- ============================================================
-- 15. 1:1 게시판 (board)
-- ============================================================
CREATE TABLE IF NOT EXISTS board_threads (
    id               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id      VARCHAR(20)  NOT NULL COMMENT '요양기관 FK',
    title            VARCHAR(200) NOT NULL COMMENT '스레드 제목',
    category_id      VARCHAR(30)  NULL     COMMENT '게시판 분류 FK',
    created_by       VARCHAR(10)  NOT NULL COMMENT '최초 작성 주체: hancare|facility',
    facility_read_at DATETIME     NULL COMMENT '기관 측 최근 읽음 일시',
    hancare_read_at  DATETIME     NULL COMMENT '한케어 측 최근 읽음 일시',
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    PRIMARY KEY (id),
    KEY idx_bt_facility (facility_id),
    KEY idx_bt_category (category_id),
    CONSTRAINT fk_bt_facility FOREIGN KEY (facility_id)  REFERENCES facilities (id),
    CONSTRAINT fk_bt_category FOREIGN KEY (category_id) REFERENCES board_categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='1:1 게시판 스레드';


CREATE TABLE IF NOT EXISTS board_posts (
    id               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    thread_id        BIGINT       NOT NULL COMMENT '스레드 FK',
    seq              INT          NOT NULL DEFAULT 1 COMMENT '스레드 내 순번',
    author           VARCHAR(10)  NOT NULL COMMENT '작성 주체: facility|hancare',
    author_label     VARCHAR(50)  NOT NULL COMMENT '작성자 표시 레이블',
    title            VARCHAR(200) NULL COMMENT '게시글 제목',
    content          TEXT         NOT NULL COMMENT '게시글 내용',
    hancare_read_at  DATETIME     NULL COMMENT '한케어 읽음 일시',
    facility_read_at DATETIME     NULL COMMENT '기관 측 읽음 일시',
    processed_at     DATETIME     NULL COMMENT '처리 완료 일시',
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    deleted_at       DATETIME     NULL COMMENT '삭제일시 (소프트 삭제)',
    PRIMARY KEY (id),
    KEY idx_bp_thread (thread_id),
    CONSTRAINT fk_bp_thread FOREIGN KEY (thread_id) REFERENCES board_threads (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='1:1 게시판 게시글';


-- 첨부파일 (board_attachments)
CREATE TABLE IF NOT EXISTS board_attachments (
    id             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    post_id        BIGINT       NOT NULL COMMENT '게시글 FK',
    original_name  VARCHAR(255) NOT NULL  COMMENT '원본 파일명',
    stored_name    VARCHAR(255) NOT NULL  COMMENT '저장 파일명 (UUID 기반)',
    content_type   VARCHAR(100) NOT NULL  COMMENT '파일 MIME 타입',
    file_size      BIGINT       NOT NULL DEFAULT 0 COMMENT '파일 크기 (bytes)',
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    PRIMARY KEY (id),
    KEY idx_ba_post (post_id),
    CONSTRAINT fk_ba_post FOREIGN KEY (post_id) REFERENCES board_posts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='게시판 첨부파일';


-- ============================================================
-- 16. 한케어 관리자용 기관 그룹 (facility_groups)
--     한케어 관리자가 여러 요양기관을 묶어 관리하는 그룹
--     (기관 내 수급자/직원 그룹과 완전히 별개)
--
--     기능:
--       - 그룹 CRUD (이름, 설명, 색상, 소그룹 여부)
--       - 소그룹 정의 및 기관 배정
--       - 단체 메시지 발송 (SMS / 카카오알림톡)
--       - 그룹 공지 작성 → provider_notices.facility_group_id 연결
-- ============================================================
CREATE TABLE IF NOT EXISTS facility_groups (
    id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    name          VARCHAR(100) NOT NULL COMMENT '그룹명 (예: 부산 북부, 세무신고 대상)',
    description   VARCHAR(300) NULL     COMMENT '그룹 설명',
    color         VARCHAR(10)  NOT NULL DEFAULT 'blue' COMMENT '그룹 색상: blue|green|amber|red|purple|slate',
    has_subgroups TINYINT(1)   NOT NULL DEFAULT 0     COMMENT '소그룹 사용 여부',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='한케어 관리자 기관 그룹';


-- 기관 그룹 소그룹 (facility_group_subgroups)
CREATE TABLE IF NOT EXISTS facility_group_subgroups (
    id         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '기본키',
    group_id   BIGINT      NOT NULL COMMENT '기관 그룹 FK',
    name       VARCHAR(50) NOT NULL COMMENT '소그룹명 (예: 북구, 강서구, 사상구)',
    sort_order INT         NOT NULL DEFAULT 0 COMMENT '정렬순서',
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    PRIMARY KEY (id),
    CONSTRAINT fk_fgsub_group FOREIGN KEY (group_id) REFERENCES facility_groups (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='기관 그룹 소그룹';


-- 기관 그룹 소속 기관 (facility_group_members)
CREATE TABLE IF NOT EXISTS facility_group_members (
    id          BIGINT      NOT NULL AUTO_INCREMENT COMMENT '기본키',
    group_id    BIGINT      NOT NULL COMMENT '기관 그룹 FK',
    subgroup_id BIGINT      NULL     COMMENT '소그룹 FK (NULL=소그룹 미배정)',
    facility_id VARCHAR(20) NOT NULL COMMENT '요양기관 FK',
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    PRIMARY KEY (id),
    UNIQUE KEY uq_fgm (group_id, facility_id),
    CONSTRAINT fk_fgm_group    FOREIGN KEY (group_id)    REFERENCES facility_groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_fgm_subgroup FOREIGN KEY (subgroup_id) REFERENCES facility_group_subgroups (id) ON DELETE SET NULL,
    CONSTRAINT fk_fgm_facility FOREIGN KEY (facility_id) REFERENCES facilities (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='기관 그룹 소속 기관';


-- 단체 메시지 발송 이력 (facility_group_messages)
CREATE TABLE IF NOT EXISTS facility_group_messages (
    id            BIGINT      NOT NULL AUTO_INCREMENT COMMENT '기본키',
    group_id      BIGINT      NOT NULL COMMENT '기관 그룹 FK',
    sender_id     BIGINT      NOT NULL COMMENT '발송자 FK (admin_users)',
    msg_type      VARCHAR(10) NOT NULL COMMENT '발송유형: sms|kakao',
    content       TEXT        NOT NULL COMMENT '발송 내용',
    total_count   INT         NOT NULL DEFAULT 0 COMMENT '총 발송 수',
    success_count INT         NOT NULL DEFAULT 0 COMMENT '성공 수',
    fail_count    INT         NOT NULL DEFAULT 0 COMMENT '실패 수',
    sent_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발송일시',
    PRIMARY KEY (id),
    KEY idx_fgmsg_group (group_id),
    CONSTRAINT fk_fgmsg_group  FOREIGN KEY (group_id)  REFERENCES facility_groups (id),
    CONSTRAINT fk_fgmsg_sender FOREIGN KEY (sender_id) REFERENCES admin_users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='기관 그룹 단체 메시지 발송 이력';


-- 단체 메시지 수신 기관별 결과 (facility_group_message_recipients)
CREATE TABLE IF NOT EXISTS facility_group_message_recipients (
    id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    message_id    BIGINT       NOT NULL COMMENT '발송 이력 FK',
    facility_id   VARCHAR(20)  NOT NULL COMMENT '요양기관 FK',
    facility_name VARCHAR(100) NOT NULL COMMENT '발송 시점 기관명 스냅샷',
    phone         VARCHAR(20)  NOT NULL COMMENT '발송 대상 전화번호',
    success       TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '발송 성공 여부',
    error_msg     VARCHAR(200) NULL COMMENT '실패 오류 메시지',
    PRIMARY KEY (id),
    KEY idx_fgmr_message (message_id),
    CONSTRAINT fk_fgmr_message  FOREIGN KEY (message_id)  REFERENCES facility_group_messages (id) ON DELETE CASCADE,
    CONSTRAINT fk_fgmr_facility FOREIGN KEY (facility_id) REFERENCES facilities (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='기관 그룹 메시지 수신자별 결과';


-- ============================================================
-- 14. 공지사항 (provider_notices)
--     한케어 관리자가 작성 → 기관에서 읽기
-- ============================================================
CREATE TABLE IF NOT EXISTS provider_notices (
    id                BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_group_id BIGINT       NULL                    COMMENT '대상 기관 그룹 FK (NULL=전체 공지)',
    category_id       VARCHAR(30)  NOT NULL                COMMENT '공지 분류 FK',
    title             VARCHAR(200) NOT NULL                COMMENT '제목',
    content           TEXT         NOT NULL                COMMENT '본문 내용',
    status            VARCHAR(10)  NOT NULL DEFAULT '발행' COMMENT '발행 상태: 발행|임시저장',
    is_new            TINYINT(1)   NOT NULL DEFAULT 0      COMMENT 'NEW 뱃지 표시 여부',
    published_at      DATETIME     NULL                    COMMENT '발행일시',
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id),
    KEY idx_pn_category (category_id),
    KEY idx_pn_group (facility_group_id),
    CONSTRAINT fk_pn_category FOREIGN KEY (category_id) REFERENCES notice_categories (id),
    CONSTRAINT fk_pn_facility_group FOREIGN KEY (facility_group_id) REFERENCES facility_groups (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공지사항 (한케어 관리자 작성 → 기관 열람)';


-- 공지사항 첨부파일 (notice_attachments)
CREATE TABLE IF NOT EXISTS notice_attachments (
    id             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    notice_id      BIGINT       NOT NULL                COMMENT '공지사항 FK',
    original_name  VARCHAR(255) NOT NULL                COMMENT '원본 파일명',
    stored_name    VARCHAR(255) NOT NULL                COMMENT '저장 파일명 (UUID)',
    content_type   VARCHAR(100) NOT NULL                COMMENT '파일 MIME 타입',
    file_size      BIGINT       NOT NULL                COMMENT '파일 크기 (bytes)',
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    PRIMARY KEY (id),
    KEY idx_na_notice (notice_id),
    CONSTRAINT fk_na_notice FOREIGN KEY (notice_id) REFERENCES provider_notices (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공지사항 첨부파일';


-- 읽음 상태 (notice_read_status)
CREATE TABLE IF NOT EXISTS notice_read_status (
    id          BIGINT      NOT NULL AUTO_INCREMENT COMMENT '기본키',
    notice_id   BIGINT      NOT NULL                COMMENT '공지사항 FK',
    facility_id VARCHAR(20) NOT NULL                COMMENT '요양기관 FK',
    user_id     BIGINT      NOT NULL                COMMENT '읽은 사용자 FK',
    read_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '읽음 처리 일시',
    PRIMARY KEY (id),
    UNIQUE KEY uq_nrs (notice_id, user_id),
    CONSTRAINT fk_nrs_notice   FOREIGN KEY (notice_id)   REFERENCES provider_notices (id) ON DELETE CASCADE,
    CONSTRAINT fk_nrs_facility FOREIGN KEY (facility_id) REFERENCES facilities (id),
    CONSTRAINT fk_nrs_user     FOREIGN KEY (user_id)     REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공지사항 읽음 상태';


SET FOREIGN_KEY_CHECKS = 1;
