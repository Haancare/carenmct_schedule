package com.carenmct.schedule.dto.admin;

import java.util.List;

public record AnnualFeeRateYearDto(int benefitYear, List<AnnualFeeRateServiceDto> services) {}
