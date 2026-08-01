package com.carenmct.schedule.domain.schedule;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "sch_import_batches")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ImportBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "facility_id", nullable = false, length = 20)
    private String facilityId;

    @Column(name = "import_type", nullable = false, length = 30)
    private String importType;

    @Column(name = "service_year")
    private Integer serviceYear;

    @Column(name = "service_month")
    private Integer serviceMonth;

    @Column(name = "cert_name", length = 100)
    private String certName;

    @Column(name = "cert_expiry")
    private java.time.LocalDate certExpiry;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "total_rows", nullable = false)
    private Integer totalRows;

    @Column(name = "success_rows", nullable = false)
    private Integer successRows;

    @Column(name = "error_rows", nullable = false)
    private Integer errorRows;

    @Lob
    @Column(name = "error_log", columnDefinition = "JSON")
    private String errorLog;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public static ImportBatch start(
            String facilityId, String importType, Long createdBy) {
        ImportBatch batch = new ImportBatch();
        batch.facilityId = facilityId;
        batch.importType = importType;
        batch.status = "running";
        batch.totalRows = 0;
        batch.successRows = 0;
        batch.errorRows = 0;
        batch.createdBy = createdBy;
        batch.startedAt = LocalDateTime.now();
        batch.createdAt = LocalDateTime.now();
        return batch;
    }

    public void applyServiceMonth(Integer year, Integer month) {
        this.serviceYear = year;
        this.serviceMonth = month;
    }

    public void finish(
            String status, int totalRows, int successRows, int errorRows, String errorLogJson) {
        this.status = status;
        this.totalRows = totalRows;
        this.successRows = successRows;
        this.errorRows = errorRows;
        this.errorLog = errorLogJson;
        this.finishedAt = LocalDateTime.now();
    }
}
