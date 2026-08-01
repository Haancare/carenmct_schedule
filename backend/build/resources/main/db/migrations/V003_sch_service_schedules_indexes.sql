-- 일정 조회·import 월삭제 핫패스용 인덱스
-- 기존 DB에 수동/마이그레이션으로 적용

ALTER TABLE sch_service_schedules
    ADD INDEX idx_sss_facility_kind_date (facility_id, schedule_kind, service_date),
    ADD INDEX idx_sss_facility_date_del (facility_id, service_date, deleted_at);
