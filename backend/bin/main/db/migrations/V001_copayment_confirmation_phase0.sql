-- Phase 0: 본인부담금확정 스키마 보완
-- · sch_copay_confirmations — 등급·감경 세그먼트(period_key) + 유니크 키 변경
-- · sch_non_benefit_facility_categories — 요양기관 공용 기타 카테고리
-- · sch_non_benefit_other_items — (non_benefit_id, label) 유니크
--
-- idempotent — initLocalDb 및 기존 DB 업그레이드 모두에서 실행 가능

SET NAMES utf8mb4;

-- ── 1. 요양기관 기타 비급여 카테고리 (신규) ─────────────────────────────
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

-- ── 2. 본인부담금 확정 — 세그먼트 컬럼 ───────────────────────────────────
ALTER TABLE sch_copay_confirmations
    ADD COLUMN IF NOT EXISTS period_key VARCHAR(50) NULL COMMENT '등급·감경 세그먼트 (예: 3_감경9%)' AFTER service_type,
    ADD COLUMN IF NOT EXISTS grade_num TINYINT NULL COMMENT '등급 스냅샷 (1-5)' AFTER period_key,
    ADD COLUMN IF NOT EXISTS reduction_snapshot VARCHAR(30) NULL COMMENT '감경구분 스냅샷' AFTER grade_num,
    ADD COLUMN IF NOT EXISTS copay_rate_snapshot DECIMAL(5,2) NULL COMMENT '본인부담률(%)' AFTER reduction_snapshot;

-- 기존 단일-세그먼트 행 백필 (데이터가 있을 경우 placeholder)
UPDATE sch_copay_confirmations
SET
    period_key = CONCAT('0_', 'legacy'),
    grade_num = 0,
    reduction_snapshot = 'legacy'
WHERE period_key IS NULL;

ALTER TABLE sch_copay_confirmations
    MODIFY period_key VARCHAR(50) NOT NULL,
    MODIFY grade_num TINYINT NOT NULL,
    MODIFY reduction_snapshot VARCHAR(30) NOT NULL;

-- 구 유니크 키(uq_scc) → 세그먼트 유니크(uq_scc_segment)
-- fk_scc_recipient 가 uq_scc 인덱스를 사용할 수 있으므로 recipient_id 보조 인덱스를 먼저 추가
SET @has_recipient_idx = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'sch_copay_confirmations'
      AND index_name = 'idx_scc_recipient'
);
SET @add_recipient_idx = IF(
    @has_recipient_idx = 0,
    'ALTER TABLE sch_copay_confirmations ADD KEY idx_scc_recipient (recipient_id)',
    'SELECT 1'
);
PREPARE stmt_recipient_idx FROM @add_recipient_idx;
EXECUTE stmt_recipient_idx;
DEALLOCATE PREPARE stmt_recipient_idx;

SET @has_new_uq = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'sch_copay_confirmations'
      AND index_name = 'uq_scc_segment'
);
SET @add_new = IF(
    @has_new_uq = 0,
    'ALTER TABLE sch_copay_confirmations ADD UNIQUE KEY uq_scc_segment (recipient_id, service_year, service_month, service_type, period_key)',
    'SELECT 1'
);
PREPARE stmt_add_new FROM @add_new;
EXECUTE stmt_add_new;
DEALLOCATE PREPARE stmt_add_new;

SET @has_old_uq = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'sch_copay_confirmations'
      AND index_name = 'uq_scc'
);
SET @drop_old = IF(@has_old_uq > 0, 'ALTER TABLE sch_copay_confirmations DROP INDEX uq_scc', 'SELECT 1');
PREPARE stmt_drop_old FROM @drop_old;
EXECUTE stmt_drop_old;
DEALLOCATE PREPARE stmt_drop_old;

-- ── 3. 기타 비급여 항목 — 라벨 중복 방지 ────────────────────────────────
SET @has_snboi_uq = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'sch_non_benefit_other_items'
      AND index_name = 'uq_snboi_label'
);
SET @add_snboi_uq = IF(
    @has_snboi_uq = 0,
    'ALTER TABLE sch_non_benefit_other_items ADD UNIQUE KEY uq_snboi_label (non_benefit_id, label)',
    'SELECT 1'
);
PREPARE stmt_snboi FROM @add_snboi_uq;
EXECUTE stmt_snboi;
DEALLOCATE PREPARE stmt_snboi;
