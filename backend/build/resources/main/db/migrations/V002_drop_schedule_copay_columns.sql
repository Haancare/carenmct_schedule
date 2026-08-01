-- 일정 건별 본인부담금·공단청구액 제거 (월 합산 후 십원 절사로만 계산)
ALTER TABLE sch_service_schedules
    DROP COLUMN IF EXISTS copay_amount,
    DROP COLUMN IF EXISTS insurance_amount;
