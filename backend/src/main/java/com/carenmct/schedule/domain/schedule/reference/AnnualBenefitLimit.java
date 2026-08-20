package com.carenmct.schedule.domain.schedule.reference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "sch_annual_benefit_limits")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AnnualBenefitLimit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "benefit_year", nullable = false)
    private Integer benefitYear;

    @Column(name = "limit_grade_1", nullable = false)
    private Integer limitGrade1;

    @Column(name = "limit_grade_2", nullable = false)
    private Integer limitGrade2;

    @Column(name = "limit_grade_3", nullable = false)
    private Integer limitGrade3;

    @Column(name = "limit_grade_4", nullable = false)
    private Integer limitGrade4;

    @Column(name = "limit_grade_5", nullable = false)
    private Integer limitGrade5;

    @Column(name = "limit_grade_cognitive", nullable = false)
    private Integer limitGradeCognitive;

    @Column(length = 500)
    private String note;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static AnnualBenefitLimit create(
            int benefitYear,
            int limitGrade1,
            int limitGrade2,
            int limitGrade3,
            int limitGrade4,
            int limitGrade5,
            int limitGradeCognitive,
            String note) {
        LocalDateTime now = LocalDateTime.now();
        AnnualBenefitLimit row = new AnnualBenefitLimit();
        row.benefitYear = benefitYear;
        row.limitGrade1 = limitGrade1;
        row.limitGrade2 = limitGrade2;
        row.limitGrade3 = limitGrade3;
        row.limitGrade4 = limitGrade4;
        row.limitGrade5 = limitGrade5;
        row.limitGradeCognitive = limitGradeCognitive;
        row.note = note;
        row.createdAt = now;
        row.updatedAt = now;
        return row;
    }

    public void updateLimits(
            int limitGrade1,
            int limitGrade2,
            int limitGrade3,
            int limitGrade4,
            int limitGrade5,
            int limitGradeCognitive,
            String note) {
        this.limitGrade1 = limitGrade1;
        this.limitGrade2 = limitGrade2;
        this.limitGrade3 = limitGrade3;
        this.limitGrade4 = limitGrade4;
        this.limitGrade5 = limitGrade5;
        this.limitGradeCognitive = limitGradeCognitive;
        this.note = note;
        this.updatedAt = LocalDateTime.now();
    }

    public int limitForGrade(int gradeNum) {
        return switch (gradeNum) {
            case 1 -> limitGrade1;
            case 2 -> limitGrade2;
            case 4 -> limitGrade4;
            case 5 -> limitGrade5;
            case 3 -> limitGrade3;
            default -> limitGradeCognitive;
        };
    }
}
