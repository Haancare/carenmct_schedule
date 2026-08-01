package com.carenmct.schedule.domain.schedule.reference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "sch_annual_fee_rate_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AnnualFeeRateItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fee_rate_service_id", nullable = false)
    private AnnualFeeRateServiceHeader header;

    @Column(name = "fee_code", nullable = false, length = 10)
    private String feeCode;

    @Column(nullable = false, length = 200)
    private String label;

    @Column
    private Integer amount;

    @Column(name = "min_minutes", nullable = false)
    private Integer minMinutes;

    @Column(name = "max_minutes")
    private Integer maxMinutes;

    @Column(name = "max_inclusive", nullable = false)
    private Boolean maxInclusive;

    @Column(name = "apply_family", nullable = false)
    private Boolean applyFamily;

    @Column(name = "grade_1_amount")
    private Integer grade1Amount;

    @Column(name = "grade_2_amount")
    private Integer grade2Amount;

    @Column(name = "grade_3_amount")
    private Integer grade3Amount;

    @Column(name = "grade_4_amount")
    private Integer grade4Amount;

    @Column(name = "grade_5_amount")
    private Integer grade5Amount;

    @Column(name = "grade_cognitive_amount")
    private Integer gradeCognitiveAmount;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    public boolean matchesDuration(int durationMinutes) {
        if (durationMinutes < minMinutes) {
            return false;
        }
        if (maxMinutes == null) {
            return true;
        }
        return Boolean.TRUE.equals(maxInclusive)
                ? durationMinutes <= maxMinutes
                : durationMinutes < maxMinutes;
    }

    public int resolveAmount(int gradeNum) {
        Integer gradeAmount = gradeAmountFor(gradeNum);
        if (gradeAmount != null) {
            return gradeAmount;
        }
        return amount != null ? amount : 0;
    }

    private Integer gradeAmountFor(int gradeNum) {
        return switch (gradeNum) {
            case 1 -> grade1Amount;
            case 2 -> grade2Amount;
            case 3 -> grade3Amount;
            case 4 -> grade4Amount;
            case 5 -> grade5Amount;
            default -> gradeCognitiveAmount;
        };
    }
}
