package com.carenmct.schedule.dto.paymentassignment;

import java.util.List;

public record MonthlyScheduleResponse(List<MonthlyScheduleRowDto> rows, int totalCount, int lastDay) {}
