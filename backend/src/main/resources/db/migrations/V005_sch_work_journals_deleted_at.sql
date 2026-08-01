-- V005: 업무수행일지 soft delete
-- 이미 컬럼이 있으면 해당 문은 건너뛰세요.

ALTER TABLE sch_work_journals
    ADD COLUMN deleted_at DATETIME NULL COMMENT '삭제일시' AFTER updated_at;
