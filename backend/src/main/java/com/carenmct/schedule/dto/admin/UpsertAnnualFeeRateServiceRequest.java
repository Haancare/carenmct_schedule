package com.carenmct.schedule.dto.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record UpsertAnnualFeeRateServiceRequest(
        @Size(max = 500) String note,
        AnnualFeeRatePartialRuleRequest partialRule,
        @NotNull @Valid List<UpsertAnnualFeeRateItemRequest> items) {

    public record AnnualFeeRatePartialRuleRequest(
            @NotNull Integer minMinutes,
            @NotNull Integer maxMinutes,
            @NotNull BigDecimal rate) {}

    public record UpsertAnnualFeeRateItemRequest(
            @NotBlank @Size(max = 10) String code,
            @NotBlank @Size(max = 200) String label,
            Integer amount,
            Boolean applyFamily,
            @NotNull Integer minMinutes,
            Integer maxMinutes,
            Boolean maxInclusive,
            Map<String, Integer> gradeAmounts) {}
}
