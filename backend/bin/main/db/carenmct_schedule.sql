-- ============================================================
-- 한케어 일정관리 (carenmct_schedule) DDL — 신규 테이블만
-- MariaDB 10.x / UTF8MB4
--
-- 전제
--   · 통합관리(업무포털) 스키마 carenmct_com.sql 이 동일 DB에 선행 적용되어 있음
--   · 기관·수급자·직원·공휴일·그룹 등은 com 테이블을 FK 로 참조 (중복 생성 금지)
--   · 본 파일은 일정관리 프로그램 전용 도메인 테이블만 정의
--
-- com 테이블 재사용 (참조만)
--   facilities, users, employees, recipients, recipient_guardians,
--   recipient_services, recipient_assigned_workers, recipient_memos,
--   groups, group_members, holidays, job_codes
--
-- 테이블 생성 순서 (FK 의존성)
--   1. 기준(관리자) : sch_annual_benefit_limits, sch_annual_fee_rate_*
--   2. 공단 연동    : sch_import_batches
--   3. 일정 핵심    : sch_service_schedules
--   4. 일정 부가    : sch_recipient_service_workers, sch_grade_reduction_changes
--   5. 본인부담금   : sch_copay_confirmations, sch_non_benefit_*, sch_non_benefit_facility_categories
--   6. 상담/일지    : sch_consultation_visits, sch_work_journals
--   7. 급여제공계획 : sch_assessment_documents
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;


-- ============================================================
-- 0. 코드값 참고 (애플리케이션 enum 과 동일하게 사용)
-- ============================================================
-- service_type     : visit_care | family_care | full_day_visit | visit_bath | visit_nursing | day_care
-- schedule_kind    : plan (서비스계획) | claim (RFID/청구 실적)
-- confirm_type     : plan | claim | manual
-- period_key       : {gradeNum}_{reduction_snapshot} — 월중 등급·감경 세그먼트 (CopaymentConfirmation)
-- consult_type     : new_consult | regular | benefit_change | complaint | termination | inspection
-- consult_status   : planned | completed
-- doc_type         : longTerm | needs | fall | pressure | cognitive | carePlan
-- import_type      : recipient | worker | plan_schedule | plan_contract | claim_excel | claim_list | rfid | changes
-- change_type      : grade | reduction


-- ============================================================
-- 1. 연도별 급여한도 (관리자 — Admin /annual-benefit-limit)
--     com.holidays 는 공휴일, 본 테이블은 등급별 월/연 한도 기준
-- ============================================================
CREATE TABLE IF NOT EXISTS sch_annual_benefit_limits (
    id                    BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    benefit_year          INT          NOT NULL                COMMENT '적용 연도',
    limit_grade_1         INT          NOT NULL                COMMENT '1등급 한도(원)',
    limit_grade_2         INT          NOT NULL                COMMENT '2등급 한도(원)',
    limit_grade_3         INT          NOT NULL                COMMENT '3등급 한도(원)',
    limit_grade_4         INT          NOT NULL                COMMENT '4등급 한도(원)',
    limit_grade_5         INT          NOT NULL                COMMENT '5등급 한도(원)',
    limit_grade_cognitive INT          NOT NULL                COMMENT '인지지원등급 한도(원)',
    note                  VARCHAR(500) NULL                    COMMENT '비고',
    created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id),
    UNIQUE KEY uq_sabl_year (benefit_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='연도별 급여한도(등급별)';


-- ============================================================
-- 2. 연도별 수가 (관리자 — Admin /annual-fee-rate)
-- ============================================================
CREATE TABLE IF NOT EXISTS sch_annual_fee_rate_services (
    id                  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    benefit_year        INT          NOT NULL                COMMENT '적용 연도',
    service_type        VARCHAR(30)  NOT NULL                COMMENT '급여유형 코드',
    note                VARCHAR(500) NULL                    COMMENT '유형별 특이사항',
    partial_min_minutes INT          NULL                    COMMENT '부분적용 최소분(이상)',
    partial_max_minutes INT          NULL                    COMMENT '부분적용 최대분(미만)',
    partial_rate        DECIMAL(5,4) NULL                    COMMENT '부분적용 비율 (예: 0.8000)',
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id),
    UNIQUE KEY uq_safrs_year_type (benefit_year, service_type),
    KEY idx_safrs_year (benefit_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='연도별 급여유형 수가 헤더';


CREATE TABLE IF NOT EXISTS sch_annual_fee_rate_items (
    id                     BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    fee_rate_service_id    BIGINT       NOT NULL                COMMENT '수가 헤더 FK',
    fee_code               VARCHAR(10)  NOT NULL                COMMENT '분류번호 (가-1, 나-1 등)',
    label                  VARCHAR(200) NOT NULL                COMMENT '분류명',
    amount                 INT          NULL                    COMMENT '고정 수가(원) — 등급무관',
    min_minutes            INT          NOT NULL                COMMENT '제공시간 하한(분, 이상)',
    max_minutes            INT          NULL                    COMMENT '제공시간 상한(분) NULL=무한',
    max_inclusive          TINYINT(1)   NOT NULL DEFAULT 0    COMMENT '1=이하(≤), 0=미만(<)',
    apply_family           TINYINT(1)   NOT NULL DEFAULT 0    COMMENT '가족요양 적용 여부',
    grade_1_amount         INT          NULL                    COMMENT '주간보호 등 — 1등급 수가',
    grade_2_amount         INT          NULL                    COMMENT '2등급 수가',
    grade_3_amount         INT          NULL                    COMMENT '3등급 수가',
    grade_4_amount         INT          NULL                    COMMENT '4등급 수가',
    grade_5_amount         INT          NULL                    COMMENT '5등급 수가',
    grade_cognitive_amount INT          NULL                    COMMENT '인지지원등급 수가',
    sort_order             INT          NOT NULL DEFAULT 0      COMMENT '표시 순서',
    PRIMARY KEY (id),
    UNIQUE KEY uq_safri_service_code (fee_rate_service_id, fee_code),
    CONSTRAINT fk_safri_service FOREIGN KEY (fee_rate_service_id) REFERENCES sch_annual_fee_rate_services (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='연도별 수가 상세 항목';


-- ============================================================
-- 3. 공단 데이터 가져오기 (Layout — 공단일정 가져오기)
-- ============================================================
CREATE TABLE IF NOT EXISTS sch_import_batches (
    id              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id     VARCHAR(20)  NOT NULL                COMMENT '요양기관 FK',
    import_type     VARCHAR(30)  NOT NULL                COMMENT '가져오기 유형',
    service_year    INT          NULL                    COMMENT '급여제공연도 (needsYm 항목)',
    service_month   TINYINT      NULL                    COMMENT '급여제공월 (1-12)',
    cert_name       VARCHAR(100) NULL                    COMMENT '공인인증서명(스냅샷)',
    cert_expiry     DATE         NULL                    COMMENT '인증서 만료일(스냅샷)',
    status          VARCHAR(20)  NOT NULL DEFAULT 'pending' COMMENT 'pending|running|success|failed|partial',
    total_rows      INT          NOT NULL DEFAULT 0      COMMENT '처리 대상 건수',
    success_rows    INT          NOT NULL DEFAULT 0      COMMENT '성공 건수',
    error_rows      INT          NOT NULL DEFAULT 0      COMMENT '오류 건수',
    error_log       JSON         NULL                    COMMENT '오류 상세(JSON 배열)',
    started_at      DATETIME     NULL                    COMMENT '실행 시작',
    finished_at     DATETIME     NULL                    COMMENT '실행 종료',
    created_by      BIGINT       NULL                    COMMENT '실행 사용자 FK',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    PRIMARY KEY (id),
    KEY idx_sib_facility (facility_id, created_at),
    KEY idx_sib_type_month (facility_id, import_type, service_year, service_month),
    CONSTRAINT fk_sib_facility FOREIGN KEY (facility_id) REFERENCES carenmct_com.facilities (id),
    CONSTRAINT fk_sib_created_by FOREIGN KEY (created_by) REFERENCES carenmct_com.users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='공단 데이터 가져오기 배치';


-- ============================================================
-- 4. 급여일정 Entry (핵심 — plan / claim 이중 구조)
--     PaymentAssignment, RecipientDetail, CopaymentConfirmation 공통 원천
-- ============================================================
CREATE TABLE IF NOT EXISTS sch_service_schedules (
    id                    BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id           VARCHAR(20)  NOT NULL                COMMENT '요양기관 FK (조회용 비정규)',
    recipient_id          BIGINT       NOT NULL                COMMENT '수급자 FK',
    employee_id           BIGINT       NOT NULL                COMMENT '담당 종사자 FK (1차)',
    secondary_employee_id BIGINT       NULL                    COMMENT '2차 종사자 FK (방문목욕 등)',
    service_date          DATE         NOT NULL                COMMENT '제공일',
    service_type          VARCHAR(30)  NOT NULL                COMMENT '급여유형 코드',
    schedule_kind         VARCHAR(10)  NOT NULL                COMMENT 'plan|claim',
    start_time            TIME         NOT NULL                COMMENT '시작시각',
    end_time              TIME         NOT NULL                COMMENT '종료시각',
    duration_minutes      INT          NOT NULL                COMMENT '제공시간(분)',
    fee_code              VARCHAR(10)  NULL                    COMMENT '적용 수가 분류번호',
    unit_cost             INT          NOT NULL DEFAULT 0      COMMENT '1회 급여단가(원)',
    benefit_total         INT          NULL                    COMMENT '급여총액(가산 포함)',
    surcharge_amount      INT          NOT NULL DEFAULT 0      COMMENT '가산금(십원올림)',
    surcharge_rate        DECIMAL(5,4) NULL                    COMMENT '가산율 (0.3000, 0.5000)',
    surcharge_minutes     INT          NULL                    COMMENT '가산 해당 분',
    fee_edited            TINYINT(1)   NOT NULL DEFAULT 0      COMMENT '급여액 수동수정 여부',
    grade_snapshot        VARCHAR(10)  NULL                    COMMENT '배정 시점 등급 스냅샷',
    reduction_snapshot    VARCHAR(10)  NULL                    COMMENT '배정 시점 감경구분 스냅샷',
    copay_rate_snapshot   DECIMAL(5,2) NULL                    COMMENT '배정 시점 본인부담률(%)',
    bath_type             VARCHAR(50)  NULL                    COMMENT '방문목욕: 차량이용(차량내) 등',
    visit_type            VARCHAR(30)  NULL                    COMMENT '방문유형(천족 등)',
    family_relation       VARCHAR(20)  NULL                    COMMENT '가족요양 시 가족관계',
    notes                 VARCHAR(500) NULL                    COMMENT '비고',
    plan_schedule_id      BIGINT       NULL                    COMMENT 'claim 시 대응 plan entry FK',
    source                VARCHAR(20)  NOT NULL DEFAULT 'manual' COMMENT 'manual|import_plan|import_claim|import_rfid',
    import_batch_id       BIGINT       NULL                    COMMENT '가져오기 배치 FK',
    external_ref          VARCHAR(100) NULL                    COMMENT '공단/외부 고유키(중복방지)',
    created_by            BIGINT       NULL                    COMMENT '등록자 FK',
    updated_by            BIGINT       NULL                    COMMENT '수정자 FK',
    created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    deleted_at            DATETIME     NULL                    COMMENT '삭제일시(소프트삭제)',
    PRIMARY KEY (id),
    KEY idx_sss_recip_date (recipient_id, service_date, schedule_kind),
    KEY idx_sss_facility_date (facility_id, service_date),
    KEY idx_sss_facility_kind_date (facility_id, schedule_kind, service_date),
    KEY idx_sss_facility_date_del (facility_id, service_date, deleted_at),
    KEY idx_sss_employee_date (employee_id, service_date),
    KEY idx_sss_month (recipient_id, schedule_kind, service_type, service_date),
    KEY idx_sss_import (import_batch_id),
    UNIQUE KEY uq_sss_external (facility_id, external_ref),
    CONSTRAINT fk_sss_facility   FOREIGN KEY (facility_id)           REFERENCES carenmct_com.facilities (id),
    CONSTRAINT fk_sss_recipient  FOREIGN KEY (recipient_id)          REFERENCES carenmct_com.recipients (id),
    CONSTRAINT fk_sss_employee   FOREIGN KEY (employee_id)           REFERENCES carenmct_com.employees (id),
    CONSTRAINT fk_sss_employee2  FOREIGN KEY (secondary_employee_id) REFERENCES carenmct_com.employees (id) ON DELETE SET NULL,
    CONSTRAINT fk_sss_plan       FOREIGN KEY (plan_schedule_id)      REFERENCES sch_service_schedules (id) ON DELETE SET NULL,
    CONSTRAINT fk_sss_import     FOREIGN KEY (import_batch_id)       REFERENCES sch_import_batches (id) ON DELETE SET NULL,
    CONSTRAINT fk_sss_created_by FOREIGN KEY (created_by)            REFERENCES carenmct_com.users (id) ON DELETE SET NULL,
    CONSTRAINT fk_sss_updated_by FOREIGN KEY (updated_by)            REFERENCES carenmct_com.users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='급여일정 Entry (계획/청구)';


-- ============================================================
-- 5. 급여유형별 담당 종사자 (RecipientDetail — serviceType 별 배정)
--     com.recipient_assigned_workers 는 포털 기본 배정;
--     본 테이블은 일정관리 UI 의 급여유형별 상세 배정(가족관계 포함)
-- ============================================================
CREATE TABLE IF NOT EXISTS sch_recipient_service_workers (
    id              BIGINT      NOT NULL AUTO_INCREMENT COMMENT '기본키',
    recipient_id    BIGINT      NOT NULL                COMMENT '수급자 FK',
    service_type    VARCHAR(30) NOT NULL                COMMENT '급여유형 코드',
    employee_id     BIGINT      NOT NULL                COMMENT '종사자 FK',
    family_relation VARCHAR(20) NULL                    COMMENT '가족요양 시 관계',
    sort_order      INT         NOT NULL DEFAULT 0      COMMENT '표시/우선순위',
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id),
    UNIQUE KEY uq_srsw (recipient_id, service_type, employee_id),
    KEY idx_srsw_recip_type (recipient_id, service_type),
    CONSTRAINT fk_srsw_recipient FOREIGN KEY (recipient_id) REFERENCES carenmct_com.recipients (id) ON DELETE CASCADE,
    CONSTRAINT fk_srsw_employee  FOREIGN KEY (employee_id)  REFERENCES carenmct_com.employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='수급자×급여유형별 담당 종사자';


-- ============================================================
-- 6. 등급/감경 변경 신청 (RecipientDetail — 기간 분할)
--     수급자 메모는 com.recipient_memos 사용 (service_month 로 연월 필터)
-- ============================================================
CREATE TABLE IF NOT EXISTS sch_grade_reduction_changes (
    id             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    recipient_id   BIGINT       NOT NULL                COMMENT '수급자 FK',
    change_type    VARCHAR(20)  NOT NULL                COMMENT 'grade|reduction',
    effective_date DATE         NOT NULL                COMMENT '변경 적용일',
    before_value   VARCHAR(20)  NOT NULL                COMMENT '변경 전 값',
    after_value    VARCHAR(20)  NOT NULL                COMMENT '변경 후 값',
    reason         VARCHAR(500) NULL                    COMMENT '변경 사유',
    status         VARCHAR(20)  NOT NULL DEFAULT 'pending' COMMENT 'pending|applied|cancelled',
    applied_at     DATETIME     NULL                    COMMENT '반영 일시',
    created_by     BIGINT       NULL                    COMMENT '신청자 FK',
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id),
    KEY idx_sgrc_recipient (recipient_id, effective_date),
    CONSTRAINT fk_sgrc_recipient FOREIGN KEY (recipient_id) REFERENCES carenmct_com.recipients (id) ON DELETE CASCADE,
    CONSTRAINT fk_sgrc_created_by FOREIGN KEY (created_by) REFERENCES carenmct_com.users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='등급/감경 변경 신청';


-- ============================================================
-- 8. 본인부담금 확정 (CopaymentConfirmation)
-- ============================================================
CREATE TABLE IF NOT EXISTS sch_copay_confirmations (
    id                  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id         VARCHAR(20)  NOT NULL                COMMENT '요양기관 FK',
    recipient_id        BIGINT       NOT NULL                COMMENT '수급자 FK',
    service_year        INT          NOT NULL                COMMENT '급여연도',
    service_month       TINYINT      NOT NULL                COMMENT '급여월 (1-12)',
    service_type        VARCHAR(30)  NOT NULL                COMMENT '급여유형 코드',
    period_key          VARCHAR(50)  NOT NULL                COMMENT '등급·감경 세그먼트 (예: 3_감경9%)',
    grade_num           TINYINT      NOT NULL                COMMENT '등급 스냅샷 (1-5)',
    reduction_snapshot  VARCHAR(30)  NOT NULL                COMMENT '감경구분 스냅샷',
    copay_rate_snapshot DECIMAL(5,2) NULL                    COMMENT '본인부담률(%) 스냅샷',
    confirm_type        VARCHAR(10)  NOT NULL                COMMENT 'plan|claim|manual',
    service_count       INT          NOT NULL DEFAULT 0      COMMENT '확정 건수',
    benefit_total       INT          NOT NULL DEFAULT 0      COMMENT '급여총액',
    insurance_amount    INT          NOT NULL DEFAULT 0      COMMENT '공단청구액',
    copay_amount        INT          NOT NULL DEFAULT 0      COMMENT '본인부담금',
    limit_excess_amount INT          NOT NULL DEFAULT 0      COMMENT '한도초과액 스냅샷',
    confirmed_at        DATETIME     NOT NULL                COMMENT '확정 일시',
    confirmed_by        BIGINT       NULL                    COMMENT '확정자 FK',
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id),
    UNIQUE KEY uq_scc_segment (recipient_id, service_year, service_month, service_type, period_key),
    KEY idx_scc_facility_month (facility_id, service_year, service_month),
    KEY idx_scc_recipient (recipient_id),
    CONSTRAINT fk_scc_facility    FOREIGN KEY (facility_id)  REFERENCES carenmct_com.facilities (id),
    CONSTRAINT fk_scc_recipient   FOREIGN KEY (recipient_id) REFERENCES carenmct_com.recipients (id),
    CONSTRAINT fk_scc_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES carenmct_com.users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='본인부담금 월별 확정(급여유형·등급세그먼트 단위)';


-- ============================================================
-- 9. 주간보호 비급여 (CopaymentConfirmation)
-- ============================================================
CREATE TABLE IF NOT EXISTS sch_non_benefit_facility_categories (
    id           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id  VARCHAR(20)  NOT NULL                COMMENT '요양기관 FK',
    label        VARCHAR(100) NOT NULL                COMMENT '기타 비급여 항목명',
    sort_order   INT          NOT NULL DEFAULT 0      COMMENT '정렬',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id),
    UNIQUE KEY uq_snbfc_facility_label (facility_id, label),
    KEY idx_snbfc_facility (facility_id),
    CONSTRAINT fk_snbfc_facility FOREIGN KEY (facility_id) REFERENCES carenmct_com.facilities (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='요양기관 공용 기타 비급여 카테고리';

CREATE TABLE IF NOT EXISTS sch_non_benefit_charges (
    id            BIGINT  NOT NULL AUTO_INCREMENT COMMENT '기본키',
    recipient_id  BIGINT  NOT NULL                COMMENT '수급자 FK',
    service_year  INT     NOT NULL                COMMENT '해당 연도',
    service_month TINYINT NOT NULL                COMMENT '해당 월',
    meal_amount   INT     NOT NULL DEFAULT 0      COMMENT '식사재료비',
    room_amount   INT     NOT NULL DEFAULT 0      COMMENT '상급침실비',
    beauty_amount INT     NOT NULL DEFAULT 0      COMMENT '이·미용비',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    PRIMARY KEY (id),
    UNIQUE KEY uq_snbc (recipient_id, service_year, service_month),
    CONSTRAINT fk_snbc_recipient FOREIGN KEY (recipient_id) REFERENCES carenmct_com.recipients (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='주간보호 비급여(고정 3종)';


CREATE TABLE IF NOT EXISTS sch_non_benefit_other_items (
    id                  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    non_benefit_id      BIGINT       NOT NULL                COMMENT '비급여 헤더 FK',
    label               VARCHAR(100) NOT NULL                COMMENT '항목명',
    amount              INT          NOT NULL DEFAULT 0      COMMENT '금액(원)',
    sort_order          INT          NOT NULL DEFAULT 0      COMMENT '정렬',
    PRIMARY KEY (id),
    UNIQUE KEY uq_snboi_label (non_benefit_id, label),
    KEY idx_snboi_header (non_benefit_id),
    CONSTRAINT fk_snboi_header FOREIGN KEY (non_benefit_id) REFERENCES sch_non_benefit_charges (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='주간보호 기타 비급여 항목';


-- ============================================================
-- 10. 방문상담 (ConsultationManagement)
-- ============================================================
CREATE TABLE IF NOT EXISTS sch_consultation_visits (
    id                 BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id        VARCHAR(20)  NOT NULL                COMMENT '요양기관 FK',
    employee_id        BIGINT       NOT NULL                COMMENT '담당 사회복지사/간호사 FK',
    recipient_id       BIGINT       NOT NULL                COMMENT '수급자 FK',
    visit_date         DATE         NOT NULL                COMMENT '상담일',
    consult_status     VARCHAR(20)  NOT NULL                COMMENT 'planned|completed|unable',
    consult_type       VARCHAR(30)  NOT NULL                COMMENT '상담구분 (new_consult|regular|benefit_change|complaint|termination|inspection)',
    planned_start_time TIME         NOT NULL                COMMENT '예정 시작',
    planned_end_time   TIME         NULL                    COMMENT '예정 종료',
    actual_start_time  TIME         NULL                    COMMENT '실제 시작',
    actual_end_time    TIME         NULL                    COMMENT '실제 종료',
    notes              VARCHAR(500) NULL                    COMMENT '비고',
    created_by         BIGINT       NULL                    COMMENT '등록자 FK',
    updated_by         BIGINT       NULL                    COMMENT '수정자 FK',
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    deleted_at         DATETIME     NULL                    COMMENT '삭제일시',
    PRIMARY KEY (id),
    KEY idx_scv_sw_date (employee_id, visit_date),
    KEY idx_scv_recipient (recipient_id, visit_date),
    KEY idx_scv_facility_month (facility_id, visit_date),
    CONSTRAINT fk_scv_facility  FOREIGN KEY (facility_id)  REFERENCES carenmct_com.facilities (id),
    CONSTRAINT fk_scv_employee  FOREIGN KEY (employee_id)  REFERENCES carenmct_com.employees (id),
    CONSTRAINT fk_scv_recipient FOREIGN KEY (recipient_id) REFERENCES carenmct_com.recipients (id),
    CONSTRAINT fk_scv_created_by FOREIGN KEY (created_by) REFERENCES carenmct_com.users (id) ON DELETE SET NULL,
    CONSTRAINT fk_scv_updated_by FOREIGN KEY (updated_by) REFERENCES carenmct_com.users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='방문상담 일정';


-- ============================================================
-- 11. 업무수행일지 (ConsultationManagement — Journal)
-- ============================================================
CREATE TABLE IF NOT EXISTS sch_work_journals (
    id                    BIGINT   NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id           VARCHAR(20) NOT NULL             COMMENT '요양기관 FK',
    consultation_visit_id BIGINT   NULL                     COMMENT '연결 상담 FK (없을 수 있음)',
    recipient_id          BIGINT   NOT NULL                 COMMENT '수급자 FK',
    employee_id           BIGINT   NOT NULL                 COMMENT '작성 종사자 FK',
    journal_status        VARCHAR(20) NOT NULL DEFAULT 'draft' COMMENT 'draft|completed',
    written_date          DATE     NOT NULL                 COMMENT '작성일',
    form_data             JSON     NOT NULL                 COMMENT '일지 폼 데이터(JSON)',
    created_by            BIGINT   NULL                     COMMENT '등록자 FK',
    updated_by            BIGINT   NULL                     COMMENT '수정자 FK',
    created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    deleted_at            DATETIME NULL                     COMMENT '삭제일시',
    PRIMARY KEY (id),
    UNIQUE KEY uq_swj_visit (consultation_visit_id),
    KEY idx_swj_recipient (recipient_id, written_date),
    KEY idx_swj_employee (employee_id, written_date),
    CONSTRAINT fk_swj_facility  FOREIGN KEY (facility_id)           REFERENCES carenmct_com.facilities (id),
    CONSTRAINT fk_swj_visit     FOREIGN KEY (consultation_visit_id) REFERENCES sch_consultation_visits (id) ON DELETE SET NULL,
    CONSTRAINT fk_swj_recipient FOREIGN KEY (recipient_id)          REFERENCES carenmct_com.recipients (id),
    CONSTRAINT fk_swj_employee  FOREIGN KEY (employee_id)           REFERENCES carenmct_com.employees (id),
    CONSTRAINT fk_swj_created_by FOREIGN KEY (created_by)            REFERENCES carenmct_com.users (id) ON DELETE SET NULL,
    CONSTRAINT fk_swj_updated_by FOREIGN KEY (updated_by)            REFERENCES carenmct_com.users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='업무수행일지';


-- ============================================================
-- 12. 급여제공계획·평가 문서 (CarePlanManagement — 6종)
-- doc_type: longTerm|needs|fall|pressure|cognitive|carePlan
-- ============================================================
CREATE TABLE IF NOT EXISTS sch_assessment_documents (
    id           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '기본키',
    facility_id  VARCHAR(20)  NOT NULL                COMMENT '요양기관 FK',
    recipient_id BIGINT       NOT NULL                COMMENT '수급자 FK',
    doc_type     VARCHAR(30)  NOT NULL                COMMENT '문서유형 (longTerm|needs|fall|pressure|cognitive|carePlan)',
    written_date DATE         NOT NULL                COMMENT '작성일',
    author_id    BIGINT       NULL                    COMMENT '작성자 FK (users)',
    employee_id  BIGINT       NULL                    COMMENT '작성 종사자 FK (employees)',
    form_data    JSON         NOT NULL                 COMMENT '평가/계획 상세(JSON)',
    created_by   BIGINT       NULL                    COMMENT '등록자 FK',
    updated_by   BIGINT       NULL                    COMMENT '수정자 FK',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    deleted_at   DATETIME     NULL                    COMMENT '삭제일시',
    PRIMARY KEY (id),
    KEY idx_sad_facility_recip (facility_id, recipient_id, doc_type, written_date),
    KEY idx_sad_recip_type (recipient_id, doc_type, written_date),
    CONSTRAINT fk_sad_facility  FOREIGN KEY (facility_id)  REFERENCES carenmct_com.facilities (id),
    CONSTRAINT fk_sad_recipient FOREIGN KEY (recipient_id) REFERENCES carenmct_com.recipients (id) ON DELETE CASCADE,
    CONSTRAINT fk_sad_author    FOREIGN KEY (author_id)    REFERENCES carenmct_com.users (id) ON DELETE SET NULL,
    CONSTRAINT fk_sad_employee  FOREIGN KEY (employee_id)  REFERENCES carenmct_com.employees (id) ON DELETE SET NULL,
    CONSTRAINT fk_sad_created_by FOREIGN KEY (created_by)  REFERENCES carenmct_com.users (id) ON DELETE SET NULL,
    CONSTRAINT fk_sad_updated_by FOREIGN KEY (updated_by)  REFERENCES carenmct_com.users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='급여제공계획·욕구/위험 평가 문서';


SET FOREIGN_KEY_CHECKS = 1;
