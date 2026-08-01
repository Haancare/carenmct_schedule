package com.carenmct.schedule.domain.schedule.copay;

import com.carenmct.schedule.domain.schedule.enums.CopayConfirmType;
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
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "sch_copay_confirmations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CopayConfirmation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "facility_id", nullable = false, length = 20)
    private String facilityId;

    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    @Column(name = "service_year", nullable = false)
    private Integer serviceYear;

    @Column(name = "service_month", nullable = false)
    private Integer serviceMonth;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 30)
    private ServiceType serviceType;

    @Column(name = "period_key", nullable = false, length = 50)
    private String periodKey;

    @Column(name = "grade_num", nullable = false)
    private Integer gradeNum;

    @Column(name = "reduction_snapshot", nullable = false, length = 30)
    private String reductionSnapshot;

    @Column(name = "copay_rate_snapshot", precision = 5, scale = 2)
    private BigDecimal copayRateSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(name = "confirm_type", nullable = false, length = 10)
    private CopayConfirmType confirmType;

    @Column(name = "service_count", nullable = false)
    private Integer serviceCount;

    @Column(name = "benefit_total", nullable = false)
    private Integer benefitTotal;

    @Column(name = "insurance_amount", nullable = false)
    private Integer insuranceAmount;

    @Column(name = "copay_amount", nullable = false)
    private Integer copayAmount;

    @Column(name = "limit_excess_amount", nullable = false)
    private Integer limitExcessAmount;

    @Column(name = "confirmed_at", nullable = false)
    private LocalDateTime confirmedAt;

    @Column(name = "confirmed_by")
    private Long confirmedBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static CopayConfirmation create(
            String facilityId,
            Long recipientId,
            int serviceYear,
            int serviceMonth,
            ServiceType serviceType,
            String periodKey,
            int gradeNum,
            String reductionSnapshot,
            BigDecimal copayRateSnapshot,
            CopayConfirmType confirmType,
            int serviceCount,
            int benefitTotal,
            int insuranceAmount,
            int copayAmount,
            int limitExcessAmount,
            Long confirmedBy) {
        CopayConfirmation entity = new CopayConfirmation();
        LocalDateTime now = LocalDateTime.now();
        entity.facilityId = facilityId;
        entity.recipientId = recipientId;
        entity.serviceYear = serviceYear;
        entity.serviceMonth = serviceMonth;
        entity.serviceType = serviceType;
        entity.periodKey = periodKey;
        entity.gradeNum = gradeNum;
        entity.reductionSnapshot = reductionSnapshot;
        entity.copayRateSnapshot = copayRateSnapshot;
        entity.confirmType = confirmType;
        entity.serviceCount = serviceCount;
        entity.benefitTotal = benefitTotal;
        entity.insuranceAmount = insuranceAmount;
        entity.copayAmount = copayAmount;
        entity.limitExcessAmount = limitExcessAmount;
        entity.confirmedAt = now;
        entity.confirmedBy = confirmedBy;
        entity.createdAt = now;
        entity.updatedAt = now;
        return entity;
    }

    public void apply(
            CopayConfirmType confirmType,
            int serviceCount,
            int benefitTotal,
            int insuranceAmount,
            int copayAmount,
            int limitExcessAmount,
            Long confirmedBy) {
        this.confirmType = confirmType;
        this.serviceCount = serviceCount;
        this.benefitTotal = benefitTotal;
        this.insuranceAmount = insuranceAmount;
        this.copayAmount = copayAmount;
        this.limitExcessAmount = limitExcessAmount;
        this.confirmedBy = confirmedBy;
        this.confirmedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
