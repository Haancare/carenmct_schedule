-- sch_assessment_documents: facility_id / created_by / updated_by 보강
-- 신규 DB는 carenmct_schedule.sql 의 CREATE 를 사용하세요.
-- 이미 컬럼이 있으면 해당 문은 건너뛰세요.

ALTER TABLE sch_assessment_documents
    ADD COLUMN facility_id VARCHAR(20) NULL COMMENT '요양기관 FK' AFTER id;

ALTER TABLE sch_assessment_documents
    ADD COLUMN created_by BIGINT NULL COMMENT '등록자 FK' AFTER form_data;

ALTER TABLE sch_assessment_documents
    ADD COLUMN updated_by BIGINT NULL COMMENT '수정자 FK' AFTER created_by;

UPDATE sch_assessment_documents d
    INNER JOIN carenmct_com.recipients r ON r.id = d.recipient_id
SET d.facility_id = r.facility_id
WHERE d.facility_id IS NULL;

ALTER TABLE sch_assessment_documents
    MODIFY COLUMN facility_id VARCHAR(20) NOT NULL COMMENT '요양기관 FK';

ALTER TABLE sch_assessment_documents
    ADD KEY idx_sad_facility_recip (facility_id, recipient_id, doc_type, written_date);

ALTER TABLE sch_assessment_documents
    ADD CONSTRAINT fk_sad_facility FOREIGN KEY (facility_id) REFERENCES carenmct_com.facilities (id);

ALTER TABLE sch_assessment_documents
    ADD CONSTRAINT fk_sad_created_by FOREIGN KEY (created_by) REFERENCES carenmct_com.users (id) ON DELETE SET NULL;

ALTER TABLE sch_assessment_documents
    ADD CONSTRAINT fk_sad_updated_by FOREIGN KEY (updated_by) REFERENCES carenmct_com.users (id) ON DELETE SET NULL;
