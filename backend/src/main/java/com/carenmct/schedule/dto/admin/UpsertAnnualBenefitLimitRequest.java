package com.carenmct.schedule.dto.admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpsertAnnualBenefitLimitRequest(
        @NotNull @Min(0) Integer limitGrade1,
        @NotNull @Min(0) Integer limitGrade2,
        @NotNull @Min(0) Integer limitGrade3,
        @NotNull @Min(0) Integer limitGrade4,
        @NotNull @Min(0) Integer limitGrade5,
        @NotNull @Min(0) Integer limitGradeCognitive,
        @Size(max = 500) String note) {}
