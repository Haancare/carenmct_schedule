-- ============================================================
-- 로컬 개발용 com 연락처 시드 (재실행 가능)
-- 전제: carenmct_com 에 수급중 수급자·담당 직원(recipient_assigned_workers) 데이터가 있음
-- 마커: recipient_guardians.relation_direct = 'dev_seed'
-- ============================================================

SET NAMES utf8mb4;

-- 1) 수급중 수급자 본인 휴대폰 (id 순 상위 10명)
UPDATE recipients r
INNER JOIN (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
    FROM recipients
    WHERE contract_status = '수급중'
) ranked ON ranked.id = r.id AND ranked.rn <= 10
SET r.mobile = CONCAT('010-1234-', LPAD(5000 + ranked.rn, 4, '0'));

-- 2) 담당 요양보호사(배정 직원) 휴대폰
UPDATE employees e
INNER JOIN (
    SELECT employee_id, ROW_NUMBER() OVER (ORDER BY employee_id) AS rn
    FROM (
        SELECT DISTINCT raw.employee_id
        FROM recipient_assigned_workers raw
        INNER JOIN recipients r ON r.id = raw.recipient_id
        WHERE r.contract_status = '수급중'
    ) assigned
) ranked ON ranked.employee_id = e.id
SET e.mobile = CONCAT('010-5555-', LPAD(5000 + ranked.rn, 4, '0'))
WHERE e.deleted_at IS NULL;

-- 3) 보호자 — dev_seed 마커 건 삭제 후 재삽입
DELETE g
FROM recipient_guardians g
WHERE g.relation_direct = 'dev_seed';

INSERT INTO recipient_guardians (
    recipient_id, sort_order, name, relation, relation_direct, mobile, mobile_kakao
)
SELECT
    ranked.id,
    1,
    CASE ranked.rn % 4
        WHEN 1 THEN '김민수'
        WHEN 2 THEN '박지영'
        WHEN 3 THEN '최준호'
        ELSE '한서연'
    END,
    CASE ranked.rn % 4
        WHEN 2 THEN '딸'
        ELSE '아들'
    END,
    'dev_seed',
    CONCAT('010-9876-', LPAD(5000 + ranked.rn, 4, '0')),
    0
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
    FROM recipients
    WHERE contract_status = '수급중'
    ORDER BY id
    LIMIT 10
) ranked;
