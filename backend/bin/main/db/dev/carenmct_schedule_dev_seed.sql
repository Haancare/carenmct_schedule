-- ============================================================
-- 로컬 개발용 sch 시드 (재실행 가능)
-- 전제: carenmct_com 에 기관·수급자·담당요양보호사 데이터가 이미 있음 (통합관리에서 관리)
-- 마커: source = 'dev_seed' — 재실행 시 해당 건만 삭제 후 재삽입
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM sch_service_schedules WHERE source = 'dev_seed';

-- com 수급자(수급중) + 담당요양보호사 1명씩 — 최대 5명
-- 2026년 3월 샘플 일정 (plan / claim)
INSERT INTO sch_service_schedules (
    facility_id, recipient_id, employee_id, service_date, service_type, schedule_kind,
    start_time, end_time, duration_minutes, unit_cost,
    grade_snapshot, reduction_snapshot, source, created_at, updated_at
)
SELECT
    base.facility_id,
    base.recipient_id,
    base.employee_id,
    seed.service_date,
    seed.service_type,
    seed.schedule_kind,
    seed.start_time,
    seed.end_time,
    seed.duration_minutes,
    57020,
    base.grade,
    base.reduction,
    'dev_seed',
    NOW(),
    NOW()
FROM (
    SELECT
        r.facility_id,
        r.id AS recipient_id,
        MIN(raw.employee_id) AS employee_id,
        r.grade,
        r.reduction
    FROM carenmct_com.recipients r
    INNER JOIN carenmct_com.recipient_assigned_workers raw ON raw.recipient_id = r.id
    WHERE r.contract_status = '수급중'
    GROUP BY r.facility_id, r.id, r.grade, r.reduction
    ORDER BY r.id
    LIMIT 5
) base
CROSS JOIN (
    SELECT '2026-03-03' AS service_date, 'visit_care' AS service_type, 'plan'  AS schedule_kind, '09:00:00' AS start_time, '12:00:00' AS end_time, 180 AS duration_minutes
    UNION ALL SELECT '2026-03-05', 'visit_care', 'plan',  '09:00:00', '12:00:00', 180
    UNION ALL SELECT '2026-03-03', 'visit_care', 'claim', '09:00:00', '12:00:00', 180
    UNION ALL SELECT '2026-03-05', 'visit_care', 'claim', '09:00:00', '12:00:00', 180
) seed;

-- 연간 탭 확인용 — 1월 샘플 (위 5명 중 앞 2명)
INSERT INTO sch_service_schedules (
    facility_id, recipient_id, employee_id, service_date, service_type, schedule_kind,
    start_time, end_time, duration_minutes, unit_cost,
    grade_snapshot, reduction_snapshot, source, created_at, updated_at
)
SELECT
    base.facility_id,
    base.recipient_id,
    base.employee_id,
    seed.service_date,
    'visit_care',
    seed.schedule_kind,
    '09:00:00',
    '12:00:00',
    180,
    57020,
    base.grade,
    base.reduction,
    'dev_seed',
    NOW(),
    NOW()
FROM (
    SELECT
        r.facility_id,
        r.id AS recipient_id,
        MIN(raw.employee_id) AS employee_id,
        r.grade,
        r.reduction
    FROM carenmct_com.recipients r
    INNER JOIN carenmct_com.recipient_assigned_workers raw ON raw.recipient_id = r.id
    WHERE r.contract_status = '수급중'
    GROUP BY r.facility_id, r.id, r.grade, r.reduction
    ORDER BY r.id
    LIMIT 2
) base
CROSS JOIN (
    SELECT '2026-01-06' AS service_date, 'plan'  AS schedule_kind
    UNION ALL SELECT '2026-01-07', 'plan'
    UNION ALL SELECT '2026-01-08', 'claim'
) seed;

SET FOREIGN_KEY_CHECKS = 1;
