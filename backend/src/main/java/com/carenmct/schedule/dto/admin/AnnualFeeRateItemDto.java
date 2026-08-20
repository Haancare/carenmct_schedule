package com.carenmct.schedule.dto.admin;

import java.util.Map;

public record AnnualFeeRateItemDto(
        String code,
        String label,
        Integer amount,
        Boolean applyFamily,
        Integer minMinutes,
        Integer maxMinutes,
        Boolean maxInclusive,
        /** 등급키: "1"~"5", "인지지원" — 주간보호 등 */
        Map<String, Integer> gradeAmounts) {}
