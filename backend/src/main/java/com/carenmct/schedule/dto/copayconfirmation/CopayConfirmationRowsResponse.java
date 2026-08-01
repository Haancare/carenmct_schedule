package com.carenmct.schedule.dto.copayconfirmation;

import java.util.List;

public record CopayConfirmationRowsResponse(
        int year, int month, List<CopayConfirmationRowDto> rows, CopayConfirmationStatsDto stats) {}
