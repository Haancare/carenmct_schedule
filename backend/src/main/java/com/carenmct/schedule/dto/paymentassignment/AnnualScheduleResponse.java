package com.carenmct.schedule.dto.paymentassignment;

import java.util.List;

public record AnnualScheduleResponse(List<AnnualScheduleRowDto> rows, int totalCount) {}
