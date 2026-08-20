package com.carenmct.schedule.dto.admin;

import java.math.BigDecimal;

public record AnnualFeeRatePartialRuleDto(int minMinutes, int maxMinutes, BigDecimal rate) {}
