package com.carenmct.schedule.domain.schedule;

import com.carenmct.schedule.domain.schedule.enums.AssessmentDocType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "sch_assessment_documents")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AssessmentDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "facility_id", nullable = false, length = 20)
    private String facilityId;

    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    @Enumerated(EnumType.STRING)
    @Column(name = "doc_type", nullable = false, length = 30)
    private AssessmentDocType docType;

    @Column(name = "written_date", nullable = false)
    private LocalDate writtenDate;

    @Column(name = "author_id")
    private Long authorId;

    @Column(name = "employee_id")
    private Long employeeId;

    @Lob
    @Column(name = "form_data", nullable = false, columnDefinition = "JSON")
    private String formData;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public static AssessmentDocument create(
            String facilityId,
            Long recipientId,
            AssessmentDocType docType,
            LocalDate writtenDate,
            Long authorId,
            Long employeeId,
            String formDataJson,
            Long createdBy) {
        AssessmentDocument doc = new AssessmentDocument();
        doc.facilityId = facilityId;
        doc.recipientId = recipientId;
        doc.docType = docType;
        doc.writtenDate = writtenDate;
        doc.authorId = authorId;
        doc.employeeId = employeeId;
        doc.formData = formDataJson;
        doc.createdBy = createdBy;
        doc.updatedBy = createdBy;
        LocalDateTime now = LocalDateTime.now();
        doc.createdAt = now;
        doc.updatedAt = now;
        return doc;
    }

    public void update(
            LocalDate writtenDate, Long employeeId, String formDataJson, Long updatedBy) {
        this.writtenDate = writtenDate;
        this.employeeId = employeeId;
        this.formData = formDataJson;
        this.updatedBy = updatedBy;
        this.updatedAt = LocalDateTime.now();
    }

    public void softDelete(Long updatedBy) {
        this.deletedAt = LocalDateTime.now();
        this.updatedBy = updatedBy;
        this.updatedAt = LocalDateTime.now();
    }
}
