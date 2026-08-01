package com.carenmct.schedule.dto.copayconfirmation;

import java.util.List;

public record CopayMonthSummaryResponse(int year, List<CopayMonthSummaryItemDto> months) {}
