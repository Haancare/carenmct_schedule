package com.carenmct.schedule.dto.admin;

import java.util.List;

public record AnnualFeeRateServiceDto(
        String serviceType,
        String serviceLabel,
        String note,
        AnnualFeeRatePartialRuleDto partialRule,
        List<AnnualFeeRateItemDto> items) {}
