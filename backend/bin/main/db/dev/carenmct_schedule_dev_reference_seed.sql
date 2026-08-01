-- ============================================================
-- 로컬 개발용 기준 데이터 시드 (재실행 가능)
--   · sch_annual_benefit_limits  — 연도별 급여한도
--   · sch_annual_fee_rate_*      — 연도별 수가
-- 마커: note = 'dev_seed' — 재실행 시 해당 건만 삭제 후 재삽입
-- 값 출처: frontend figma_design mockData / AnnualFeeRate (2026 기준)
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DELETE i FROM sch_annual_fee_rate_items i
INNER JOIN sch_annual_fee_rate_services s ON s.id = i.fee_rate_service_id
WHERE s.note LIKE 'dev_seed%';

DELETE FROM sch_annual_fee_rate_services WHERE note LIKE 'dev_seed%';
DELETE FROM sch_annual_benefit_limits WHERE note LIKE 'dev_seed%';

-- ── 1. 연도별 급여한도 (월 한도액, 원) ─────────────────────────────
INSERT INTO sch_annual_benefit_limits (
    benefit_year,
    limit_grade_1, limit_grade_2, limit_grade_3,
    limit_grade_4, limit_grade_5, limit_grade_cognitive,
    note
) VALUES
    (2025, 2462600, 2284600, 1497600, 1381500, 1184700, 662790, 'dev_seed — 2025 테스트'),
    (2026, 2512900, 2331200, 1528200, 1409700, 1208900, 676320, 'dev_seed — 2026 figma 기준');

-- ── 2. 연도별 수가 헤더 ────────────────────────────────────────────
INSERT INTO sch_annual_fee_rate_services (
    benefit_year, service_type, note,
    partial_min_minutes, partial_max_minutes, partial_rate
) VALUES
    (2026, 'visit_care',     'dev_seed', NULL, NULL, NULL),
    (2026, 'family_care',    'dev_seed', NULL, NULL, NULL),
    (2026, 'full_day_visit', 'dev_seed', NULL, NULL, NULL),
    (2026, 'visit_bath',     'dev_seed', 40, 60, 0.8000),
    (2026, 'visit_nursing',  'dev_seed', NULL, NULL, NULL),
    (2026, 'day_care',       'dev_seed', NULL, NULL, NULL),
    (2025, 'visit_care',     'dev_seed', NULL, NULL, NULL),
    (2025, 'family_care',    'dev_seed', NULL, NULL, NULL),
    (2025, 'full_day_visit', 'dev_seed', NULL, NULL, NULL),
    (2025, 'visit_bath',     'dev_seed', 40, 60, 0.8000),
    (2025, 'visit_nursing',  'dev_seed', NULL, NULL, NULL),
    (2025, 'day_care',       'dev_seed', NULL, NULL, NULL);

-- ── 3. 방문요양 (visit_care) ───────────────────────────────────────
INSERT INTO sch_annual_fee_rate_items (
    fee_rate_service_id, fee_code, label, amount,
    min_minutes, max_minutes, max_inclusive, apply_family, sort_order
)
SELECT s.id, v.fee_code, v.label, v.amount, v.min_minutes, v.max_minutes, v.max_inclusive, v.apply_family, v.sort_order
FROM sch_annual_fee_rate_services s
CROSS JOIN (
    SELECT '가-1'  AS fee_code, '30분 이상'  AS label,  17450 AS amount,  30 AS min_minutes,  60 AS max_minutes, 0 AS max_inclusive, 1 AS apply_family,  1 AS sort_order
    UNION ALL SELECT '가-2',  '60분 이상',  25320,  60,  90, 0, 1,  2
    UNION ALL SELECT '가-3',  '90분 이상',  34120,  90, 120, 0, 1,  3
    UNION ALL SELECT '가-4',  '120분 이상', 43430, 120, 150, 0, 0,  4
    UNION ALL SELECT '가-5',  '150분 이상', 50640, 150, 180, 0, 0,  5
    UNION ALL SELECT '가-6',  '180분 이상', 57020, 180, 210, 0, 0,  6
    UNION ALL SELECT '가-7',  '210분 이상', 63530, 210, 240, 0, 0,  7
    UNION ALL SELECT '가-8',  '240분 이상', 70080, 240, 270, 0, 0,  8
    UNION ALL SELECT '가-9',  '270분 이상', 70080, 270, 300, 0, 0,  9
    UNION ALL SELECT '가-10', '300분 이상', 87530, 300, 330, 0, 0, 10
    UNION ALL SELECT '가-11', '330분 이상', 95400, 330, 360, 0, 0, 11
    UNION ALL SELECT '가-12', '360분 이상', 104200, 360, 390, 0, 0, 12
    UNION ALL SELECT '가-13', '390분 이상', 113510, 390, 420, 0, 0, 13
    UNION ALL SELECT '가-14', '420분 이상', 120720, 420, 450, 0, 0, 14
    UNION ALL SELECT '가-15', '450분 이상', 127100, 450, 480, 0, 0, 15
    UNION ALL SELECT '가-16', '480분 이상', 140160, 480, NULL, 0, 0, 16
) v
WHERE s.service_type = 'visit_care' AND s.note = 'dev_seed';

-- ── 4. 가족요양 (family_care) — 방문요양 가-1~가-3 ────────────────
INSERT INTO sch_annual_fee_rate_items (
    fee_rate_service_id, fee_code, label, amount,
    min_minutes, max_minutes, max_inclusive, apply_family, sort_order
)
SELECT s.id, v.fee_code, v.label, v.amount, v.min_minutes, v.max_minutes, 0, 1, v.sort_order
FROM sch_annual_fee_rate_services s
CROSS JOIN (
    SELECT '가-1' AS fee_code, '30분 이상' AS label, 17450 AS amount, 30 AS min_minutes, 60 AS max_minutes, 1 AS sort_order
    UNION ALL SELECT '가-2', '60분 이상', 25320, 60, 90, 2
    UNION ALL SELECT '가-3', '90분 이상', 34120, 90, 120, 3
) v
WHERE s.service_type = 'family_care' AND s.note = 'dev_seed';

-- ── 5. 종일방문 (full_day_visit) ───────────────────────────────────
INSERT INTO sch_annual_fee_rate_items (
    fee_rate_service_id, fee_code, label, amount,
    min_minutes, max_minutes, max_inclusive, apply_family, sort_order
)
SELECT s.id, '마-1', '종일방문 (1건당)', 98860, 0, NULL, 0, 0, 1
FROM sch_annual_fee_rate_services s
WHERE s.service_type = 'full_day_visit' AND s.note = 'dev_seed';

-- ── 6. 방문목욕 (visit_bath) ───────────────────────────────────────
INSERT INTO sch_annual_fee_rate_items (
    fee_rate_service_id, fee_code, label, amount,
    min_minutes, max_minutes, max_inclusive, apply_family, sort_order
)
SELECT s.id, v.fee_code, v.label, v.amount, v.min_minutes, v.max_minutes, 0, 0, v.sort_order
FROM sch_annual_fee_rate_services s
CROSS JOIN (
    SELECT '나-1' AS fee_code, '방문목욕 차량을 이용한 경우 (차량 내 목욕)' AS label, 88990 AS amount, 60 AS min_minutes, NULL AS max_minutes, 1 AS sort_order
    UNION ALL SELECT '나-2', '방문목욕 차량을 이용한 경우 (가정 내 목욕)', 80230, 60, NULL, 2
    UNION ALL SELECT '나-3', '방문목욕 차량을 이용하지 아니한 경우', 50100, 60, NULL, 3
) v
WHERE s.service_type = 'visit_bath' AND s.note = 'dev_seed';

-- ── 7. 방문간호 (visit_nursing) ────────────────────────────────────
INSERT INTO sch_annual_fee_rate_items (
    fee_rate_service_id, fee_code, label, amount,
    min_minutes, max_minutes, max_inclusive, apply_family, sort_order
)
SELECT s.id, v.fee_code, v.label, v.amount, v.min_minutes, v.max_minutes, 0, 0, v.sort_order
FROM sch_annual_fee_rate_services s
CROSS JOIN (
    SELECT '다-1' AS fee_code, '15분 이상 ~ 30분 미만' AS label, 42880 AS amount, 15 AS min_minutes, 30 AS max_minutes, 1 AS sort_order
    UNION ALL SELECT '다-2', '30분 이상 ~ 60분 미만', 53770, 30, 60, 2
    UNION ALL SELECT '다-3', '60분 이상', 64690, 60, NULL, 3
) v
WHERE s.service_type = 'visit_nursing' AND s.note = 'dev_seed';

-- ── 8. 주간보호 (day_care) — 등급별 수가 ───────────────────────────
INSERT INTO sch_annual_fee_rate_items (
    fee_rate_service_id, fee_code, label, amount,
    min_minutes, max_minutes, max_inclusive, apply_family,
    grade_1_amount, grade_2_amount, grade_3_amount,
    grade_4_amount, grade_5_amount, grade_cognitive_amount,
    sort_order
)
SELECT s.id, v.fee_code, v.label, 0, v.min_minutes, v.max_minutes, v.max_inclusive, 0,
       v.g1, v.g2, v.g3, v.g4, v.g5, v.gc, v.sort_order
FROM sch_annual_fee_rate_services s
CROSS JOIN (
    SELECT '라-1' AS fee_code, '3시간 이상 ~ 6시간 미만' AS label,
           180 AS min_minutes, 360 AS max_minutes, 0 AS max_inclusive,
           41820 AS g1, 38720 AS g2, 35740 AS g3, 34120 AS g4, 32490 AS g5, 32490 AS gc, 1 AS sort_order
    UNION ALL SELECT '라-2', '6시간 이상 ~ 8시간 미만', 360, 480, 0, 56060, 51930, 47940, 46300, 44650, 44650, 2
    UNION ALL SELECT '라-3', '8시간 이상 ~ 10시간 미만', 480, 600, 0, 69730, 64590, 59640, 58010, 56360, 56360, 3
    UNION ALL SELECT '라-4', '10시간 이상 ~ 13시간 이하', 600, 780, 1, 76820, 71160, 65750, 64090, 62460, 56360, 4
    UNION ALL SELECT '라-5', '13시간 초과', 781, NULL, 0, 82370, 76310, 70500, 68860, 67240, 56360, 5
) v
WHERE s.service_type = 'day_care' AND s.note = 'dev_seed';

SET FOREIGN_KEY_CHECKS = 1;
