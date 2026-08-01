package com.carenmct.schedule.domain.schedule;

import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;
import com.carenmct.schedule.domain.schedule.enums.ScheduleSource;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "sch_service_schedules")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ServiceSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "facility_id", nullable = false, length = 20)
    private String facilityId;

    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "secondary_employee_id")
    private Long secondaryEmployeeId;

    @Column(name = "service_date", nullable = false)
    private LocalDate serviceDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 30)
    private ServiceType serviceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "schedule_kind", nullable = false, length = 10)
    private ScheduleKind scheduleKind;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "fee_code", length = 10)
    private String feeCode;

    @Column(name = "unit_cost", nullable = false)
    private Integer unitCost;

    @Column(name = "benefit_total")
    private Integer benefitTotal;

    @Column(name = "surcharge_amount", nullable = false)
    private Integer surchargeAmount;

    @Column(name = "surcharge_rate", precision = 5, scale = 4)
    private BigDecimal surchargeRate;

    @Column(name = "surcharge_minutes")
    private Integer surchargeMinutes;

    @Column(name = "fee_edited", nullable = false)
    private Boolean feeEdited;

    @Column(name = "grade_snapshot", length = 10)
    private String gradeSnapshot;

    @Column(name = "reduction_snapshot", length = 10)
    private String reductionSnapshot;

    @Column(name = "copay_rate_snapshot", precision = 5, scale = 2)
    private BigDecimal copayRateSnapshot;

    @Column(name = "bath_type", length = 50)
    private String bathType;

    @Column(name = "visit_type", length = 30)
    private String visitType;

    @Column(name = "family_relation", length = 20)
    private String familyRelation;

    @Column(length = 500)
    private String notes;

    @Column(name = "plan_schedule_id")
    private Long planScheduleId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ScheduleSource source;

    @Column(name = "import_batch_id")
    private Long importBatchId;

    @Column(name = "external_ref", length = 100)
    private String externalRef;

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

    public boolean isActive() {
        return deletedAt == null;
    }

    public static ServiceSchedule createManual(
            String facilityId,
            Long recipientId,
            Long employeeId,
            LocalDate serviceDate,
            ServiceType serviceType,
            ScheduleKind scheduleKind,
            LocalTime startTime,
            LocalTime endTime,
        int durationMinutes,
        int unitCost,
        String feeCode,
        int surchargeAmount,
        BigDecimal surchargeRate,
        Integer surchargeMinutes,
        String gradeSnapshot,
        String reductionSnapshot,
        BigDecimal copayRateSnapshot,
        String bathType,
        String familyRelation) {
        ServiceSchedule schedule = new ServiceSchedule();
        schedule.facilityId = facilityId;
        schedule.recipientId = recipientId;
        schedule.employeeId = employeeId;
        schedule.serviceDate = serviceDate;
        schedule.serviceType = serviceType;
        schedule.scheduleKind = scheduleKind;
        schedule.startTime = startTime;
        schedule.endTime = endTime;
        schedule.durationMinutes = durationMinutes;
        schedule.feeCode = feeCode;
        schedule.unitCost = unitCost;
        schedule.surchargeAmount = surchargeAmount;
        schedule.surchargeRate = surchargeRate;
        schedule.surchargeMinutes = surchargeMinutes;
        int total = unitCost + surchargeAmount;
        schedule.benefitTotal = total;
        schedule.gradeSnapshot = gradeSnapshot;
        schedule.reductionSnapshot = reductionSnapshot;
        schedule.copayRateSnapshot = copayRateSnapshot;
        schedule.bathType = bathType;
        schedule.familyRelation = familyRelation;
        schedule.feeEdited = false;
        schedule.source = ScheduleSource.manual;
        schedule.createdAt = LocalDateTime.now();
        schedule.updatedAt = LocalDateTime.now();
        return schedule;
    }

    public static ServiceSchedule createImport(
            String facilityId,
            Long recipientId,
            Long employeeId,
            Long secondaryEmployeeId,
            LocalDate serviceDate,
            ServiceType serviceType,
            LocalTime startTime,
            LocalTime endTime,
            int durationMinutes,
            int unitCost,
            String feeCode,
            int surchargeAmount,
            BigDecimal surchargeRate,
            Integer surchargeMinutes,
            String gradeSnapshot,
            String reductionSnapshot,
            BigDecimal copayRateSnapshot,
            String bathType,
            String familyRelation,
            Long importBatchId,
            String externalRef,
            Long createdBy) {
        ServiceSchedule schedule = createManual(
                facilityId,
                recipientId,
                employeeId,
                serviceDate,
                serviceType,
                ScheduleKind.plan,
                startTime,
                endTime,
                durationMinutes,
                unitCost,
                feeCode,
                surchargeAmount,
                surchargeRate,
                surchargeMinutes,
                gradeSnapshot,
                reductionSnapshot,
                copayRateSnapshot,
                bathType,
                familyRelation);
        schedule.secondaryEmployeeId = secondaryEmployeeId;
        schedule.source = ScheduleSource.import_plan;
        schedule.importBatchId = importBatchId;
        schedule.externalRef = externalRef;
        schedule.createdBy = createdBy;
        return schedule;
    }

    public static ServiceSchedule createImportClaim(
            String facilityId,
            Long recipientId,
            Long employeeId,
            Long secondaryEmployeeId,
            LocalDate serviceDate,
            ServiceType serviceType,
            LocalTime startTime,
            LocalTime endTime,
            int durationMinutes,
            int unitCost,
            String feeCode,
            String gradeSnapshot,
            String reductionSnapshot,
            BigDecimal copayRateSnapshot,
            String bathType,
            String familyRelation,
            Long importBatchId,
            String externalRef,
            Long createdBy) {
        ServiceSchedule schedule = createManual(
                facilityId,
                recipientId,
                employeeId,
                serviceDate,
                serviceType,
                ScheduleKind.claim,
                startTime,
                endTime,
                durationMinutes,
                unitCost,
                feeCode,
                0,
                null,
                null,
                gradeSnapshot,
                reductionSnapshot,
                copayRateSnapshot,
                bathType,
                familyRelation);
        schedule.secondaryEmployeeId = secondaryEmployeeId;
        schedule.source = ScheduleSource.import_claim;
        schedule.importBatchId = importBatchId;
        schedule.externalRef = externalRef;
        schedule.createdBy = createdBy;
        return schedule;
    }

    public void updateFee(int unitCost, int surchargeAmount, BigDecimal copayRateSnapshot) {
        this.unitCost = unitCost;
        this.surchargeAmount = surchargeAmount;
        int total = unitCost + surchargeAmount;
        this.benefitTotal = total;
        if (copayRateSnapshot != null) {
            this.copayRateSnapshot = copayRateSnapshot;
        }
        this.feeEdited = true;
        this.updatedAt = LocalDateTime.now();
    }

    public void applySnapshot(String gradeSnapshot, String reductionSnapshot, BigDecimal copayRateSnapshot) {
        this.gradeSnapshot = gradeSnapshot;
        this.reductionSnapshot = reductionSnapshot;
        this.copayRateSnapshot = copayRateSnapshot;
        this.updatedAt = LocalDateTime.now();
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
