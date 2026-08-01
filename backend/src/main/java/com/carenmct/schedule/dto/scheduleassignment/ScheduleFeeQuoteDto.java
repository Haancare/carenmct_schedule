package com.carenmct.schedule.dto.scheduleassignment;

import java.math.BigDecimal;

public record ScheduleFeeQuoteDto(
        int unitCost,
        String feeCode,
        int surchargeAmount,
        BigDecimal surchargeRate,
        int surchargeMinutes,
        String surchargePeriodLabel) {}
