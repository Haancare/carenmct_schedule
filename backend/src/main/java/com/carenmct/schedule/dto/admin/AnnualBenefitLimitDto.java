package com.carenmct.schedule.dto.admin;

public record AnnualBenefitLimitDto(
        Long id,
        int benefitYear,
        int limitGrade1,
        int limitGrade2,
        int limitGrade3,
        int limitGrade4,
        int limitGrade5,
        int limitGradeCognitive,
        String note) {}
