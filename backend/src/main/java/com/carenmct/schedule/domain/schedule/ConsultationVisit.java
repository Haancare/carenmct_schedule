package com.carenmct.schedule.domain.schedule;

import com.carenmct.schedule.domain.schedule.enums.ConsultStatus;
import com.carenmct.schedule.domain.schedule.enums.ConsultType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "sch_consultation_visits")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ConsultationVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "facility_id", nullable = false, length = 20)
    private String facilityId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "consult_status", nullable = false, length = 20)
    private ConsultStatus consultStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "consult_type", nullable = false, length = 30)
    private ConsultType consultType;

    @Column(name = "planned_start_time", nullable = false)
    private LocalTime plannedStartTime;

    @Column(name = "planned_end_time")
    private LocalTime plannedEndTime;

    @Column(name = "actual_start_time")
    private LocalTime actualStartTime;

    @Column(name = "actual_end_time")
    private LocalTime actualEndTime;

    @Column(length = 500)
    private String notes;

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

    public static ConsultationVisit create(
            String facilityId,
            Long employeeId,
            Long recipientId,
            LocalDate visitDate,
            ConsultStatus consultStatus,
            ConsultType consultType,
            LocalTime plannedStartTime,
            LocalTime plannedEndTime,
            LocalTime actualStartTime,
            LocalTime actualEndTime,
            String notes,
            Long createdBy) {
        ConsultationVisit v = new ConsultationVisit();
        v.facilityId = facilityId;
        v.employeeId = employeeId;
        v.recipientId = recipientId;
        v.visitDate = visitDate;
        v.consultStatus = consultStatus;
        v.consultType = consultType;
        v.plannedStartTime = plannedStartTime;
        v.plannedEndTime = plannedEndTime;
        v.actualStartTime = actualStartTime;
        v.actualEndTime = actualEndTime;
        v.notes = notes;
        v.createdBy = createdBy;
        v.updatedBy = createdBy;
        LocalDateTime now = LocalDateTime.now();
        v.createdAt = now;
        v.updatedAt = now;
        return v;
    }

    public void update(
            ConsultStatus consultStatus,
            ConsultType consultType,
            LocalTime plannedStartTime,
            LocalTime plannedEndTime,
            LocalTime actualStartTime,
            LocalTime actualEndTime,
            String notes,
            Long updatedBy) {
        this.consultStatus = consultStatus;
        this.consultType = consultType;
        this.plannedStartTime = plannedStartTime;
        this.plannedEndTime = plannedEndTime;
        this.actualStartTime = actualStartTime;
        this.actualEndTime = actualEndTime;
        this.notes = notes;
        this.updatedBy = updatedBy;
        this.updatedAt = LocalDateTime.now();
    }

    public void markCompletedIfPlanned(Long updatedBy) {
        if (this.consultStatus != ConsultStatus.planned) {
            return;
        }
        this.consultStatus = ConsultStatus.completed;
        if (this.actualStartTime == null) {
            this.actualStartTime = this.plannedStartTime;
        }
        if (this.actualEndTime == null) {
            this.actualEndTime = this.plannedEndTime;
        }
        this.updatedBy = updatedBy;
        this.updatedAt = LocalDateTime.now();
    }

    public void softDelete(Long updatedBy) {
        this.deletedAt = LocalDateTime.now();
        this.updatedBy = updatedBy;
        this.updatedAt = LocalDateTime.now();
    }
}
