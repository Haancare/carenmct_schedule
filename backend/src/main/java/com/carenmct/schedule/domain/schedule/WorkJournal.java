package com.carenmct.schedule.domain.schedule;

import com.carenmct.schedule.domain.schedule.enums.JournalStatus;
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
@Table(name = "sch_work_journals")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WorkJournal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "facility_id", nullable = false, length = 20)
    private String facilityId;

    @Column(name = "consultation_visit_id")
    private Long consultationVisitId;

    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "journal_status", nullable = false, length = 20)
    private JournalStatus journalStatus;

    @Column(name = "written_date", nullable = false)
    private LocalDate writtenDate;

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

    public static WorkJournal create(
            String facilityId,
            Long consultationVisitId,
            Long recipientId,
            Long employeeId,
            JournalStatus journalStatus,
            LocalDate writtenDate,
            String formDataJson,
            Long createdBy) {
        WorkJournal j = new WorkJournal();
        j.facilityId = facilityId;
        j.consultationVisitId = consultationVisitId;
        j.recipientId = recipientId;
        j.employeeId = employeeId;
        j.journalStatus = journalStatus;
        j.writtenDate = writtenDate;
        j.formData = formDataJson;
        j.createdBy = createdBy;
        j.updatedBy = createdBy;
        LocalDateTime now = LocalDateTime.now();
        j.createdAt = now;
        j.updatedAt = now;
        return j;
    }

    public void update(
            JournalStatus journalStatus,
            LocalDate writtenDate,
            String formDataJson,
            Long updatedBy) {
        this.journalStatus = journalStatus;
        this.writtenDate = writtenDate;
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
